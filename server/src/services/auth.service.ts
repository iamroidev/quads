import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User, { IUserDocument } from '../models/User';
import Store from '../models/Store';
import { generateToken } from '../utils/jwt';
import ApiError from '../utils/ApiError';

const googleClient = new OAuth2Client();

// All allowed Google Client IDs (web + Android + iOS)
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
  .split(',').map(s => s.trim()).filter(Boolean);

interface AuthResult {
  user: IUserDocument;
  token: string;
  isNewUser?: boolean;
  needsProfileCompletion?: boolean;
}

class AuthService {
  private buildToken(user: IUserDocument): string {
    return generateToken({
      userId:   user._id.toString(),
      roles:    user.roles,
      viewMode: user.viewMode,
    });
  }

  private slugify(text: string): string {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
  }

  private randomPassword(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  // ── Password login (admin/support only) ──────────────────────────────────

  async loginWithPassword(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) throw ApiError.unauthorized('No account found with that email address.');
    if (user.isBanned) throw ApiError.forbidden('Your account has been suspended.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Incorrect password.');

    return { user, token: this.buildToken(user) };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  async googleLogin(
    idToken: string,
    role?: 'buyer' | 'seller',
    profileData?: any
  ): Promise<AuthResult> {
    // Verify the Google ID token against all allowed client IDs
    let payload: any;
    let lastErr: any;
    for (const clientId of GOOGLE_CLIENT_IDS) {
      try {
        const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
        payload = ticket.getPayload();
        if (payload) break;
      } catch (err) { lastErr = err; }
    }
    if (!payload) {
      console.error('[GoogleLogin] Token verification failed:', lastErr?.message);
      throw ApiError.unauthorized('Invalid Google token.');
    }

    const email       = (payload.email || '').toLowerCase();
    const googleId    = payload.sub;
    const name        = payload.name || payload.given_name || 'Student';
    const avatar      = payload.picture || '';
    const emailVerified = !!payload.email_verified;

    if (!email || !googleId) throw ApiError.badRequest('Google token missing email or ID.');

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNewUser = false;

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f2937&color=ffffff&bold=true`;
    const normalizedRole = role && ['buyer', 'seller'].includes(role) ? role as 'buyer' | 'seller' : undefined;

    if (!user) {
      if (!normalizedRole) {
        throw ApiError.badRequest('New Google accounts must choose a role during sign-up.');
      }
      user = await User.create({
        googleId,
        name,
        email,
        phone:         profileData?.phone         || '',
        roles:         [normalizedRole],
        isVerified:    false,
        emailVerified,
        phoneVerified: false,
        avatar:        avatar || fallbackAvatar,
        studentId:     profileData?.studentId     || '',
        department:    profileData?.department    || '',
        residenceHall: profileData?.residenceHall || '',
        currentLevel:  profileData?.currentLevel  || '',
        location:      profileData?.location      || '',
        password:      this.randomPassword(),
      });
      isNewUser = true;
    } else {
      if (user.isBanned) throw ApiError.forbidden('Your account has been suspended.');
      let dirty = false;
      if (!user.googleId)        { user.googleId = googleId; dirty = true; }
      if (!user.avatar)          { user.avatar   = avatar || fallbackAvatar; dirty = true; }
      if (!user.emailVerified && emailVerified) { user.emailVerified = true; dirty = true; }
      if (normalizedRole && !user.roles.includes(normalizedRole)) {
        user.roles.push(normalizedRole); dirty = true;
      }
      if (profileData) {
        const fields = ['phone','studentId','department','residenceHall','currentLevel','location'] as const;
        for (const f of fields) {
          if (profileData[f] && !(user as any)[f]) { (user as any)[f] = profileData[f]; dirty = true; }
        }
      }
      if (dirty) await user.save();
    }

    const needsProfileCompletion = !user.phone || user.phone.trim().length < 9 || !user.department;
    return { user, token: this.buildToken(user), isNewUser, needsProfileCompletion };
  }

  // ── Profile helpers (unchanged) ──────────────────────────────────────────

  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId).populate('activeStore');
    if (!user) throw ApiError.notFound('User not found.');
    return user;
  }

  async switchRole(userId: string, targetMode: 'buyer' | 'seller'): Promise<AuthResult> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found.');

    if (targetMode === 'seller' && !user.roles.includes('seller')) {
      user.roles.push('seller');
    }

    if (targetMode === 'seller' && !user.activeStore) {
      const storeName = user.storeName || `${user.name}'s Shop`;
      const baseSlug  = this.slugify(storeName);
      let slug = baseSlug; let n = 1;
      while (await Store.findOne({ slug })) slug = `${baseSlug}-${n++}`;
      const store = await Store.create({
        ownerId:              user._id,
        name:                 storeName,
        slug,
        avatar:               user.avatar,
        location:             user.location,
        payoutSetupComplete:  user.sellerOnboarding?.payoutSetupComplete || false,
        payoutMethod:         user.sellerOnboarding?.payoutMethod,
        payoutProvider:       user.sellerOnboarding?.payoutProvider,
        payoutAccountName:    user.sellerOnboarding?.payoutAccountName,
        payoutAccountNumber:  user.sellerOnboarding?.payoutAccountNumber,
      });
      user.activeStore = store._id as any;
    }

    user.viewMode = targetMode;
    await user.save();

    const populated = await User.findById(user._id).populate('activeStore');
    if (!populated) throw ApiError.notFound('User not found.');
    return { user: populated, token: this.buildToken(populated) };
  }

  async updateProfile(userId: string, data: Record<string, any>): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found.');
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User not found.');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect.');
    user.password = newPassword;
    await user.save();
  }
}

export default new AuthService();
