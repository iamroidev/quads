import User, { IUserDocument } from '../models/User';
import Store from '../models/Store';
import { generateToken } from '../utils/jwt';
import ApiError from '../utils/ApiError';
import { verifySupabaseToken } from '../utils/supabaseJwt';
import { emailService } from './email.service';
import env from '../config/env';

const INSTITUTIONAL_DOMAINS = env.INSTITUTIONAL_DOMAINS.split(',').map(d => d.trim().toLowerCase());

interface RegisterData {
  supabaseAccessToken: string;
  name: string;
  phone: string;
  roles: ('buyer' | 'seller')[];
  studentId?: string;
  department?: string;
  residenceHall?: string;
  currentLevel?: string;
  location?: string;
}

interface LoginData {
  supabaseAccessToken: string;
}

interface AuthResult {
  user: IUserDocument;
  token: string;
  isNewUser?: boolean;
  needsProfileCompletion?: boolean;
}

class AuthService {
  private async findOrLinkSupabaseUser(supabaseId: string, email: string): Promise<IUserDocument | null> {
    let user = await User.findOne({ supabaseId });
    if (user) return user;

    user = await User.findOne({ email: email.toLowerCase() });
    if (user && !user.supabaseId) {
      user.supabaseId = supabaseId;
      await user.save();
      return user;
    }

    return user;
  }

  private buildToken(user: IUserDocument): string {
    return generateToken({
      userId: user._id.toString(),
      roles: user.roles,
      viewMode: user.viewMode,
    });
  }

  private slugify(text: string): string {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  private randomPassword(): string {
    return `${Math.random().toString(36).slice(-10)}${Math.random().toString(36).slice(-10)}`;
  }

  private isInstitutionalEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return INSTITUTIONAL_DOMAINS.includes(domain);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    const payload = await verifySupabaseToken(data.supabaseAccessToken);
    const supabaseId = payload.sub;
    const email = (payload.email || '').toLowerCase();
    if (!supabaseId || !email) {
      throw ApiError.badRequest('Invalid Supabase user token.');
    }

    const existingUser = await this.findOrLinkSupabaseUser(supabaseId, email);
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists. Please login instead.');
    }

    const metadataName = String(payload.user_metadata?.name || payload.user_metadata?.full_name || '').trim();
    const metadataAvatar = String(payload.user_metadata?.avatar_url || payload.user_metadata?.picture || '').trim();

    const user = await User.create({
      supabaseId,
      name: (data.name || metadataName || 'User').trim(),
      email,
      phone: data.phone || '',
      roles: data.roles || ['buyer'],
      studentId: data.studentId || '',
      department: data.department || '',
      residenceHall: data.residenceHall || '',
      currentLevel: data.currentLevel || '',
      location: data.location || '',
      isVerified: false,
      emailVerified: false,
      phoneVerified: false,
      isInstitutional: this.isInstitutionalEmail(email),
      avatar: metadataAvatar,
      password: this.randomPassword(),
    });

    const token = this.buildToken(user);

    return { user, token };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResult> {
    const payload = await verifySupabaseToken(data.supabaseAccessToken);
    const supabaseId = payload.sub;
    const email = (payload.email || '').toLowerCase();
    if (!supabaseId || !email) {
      throw ApiError.badRequest('Invalid Supabase user token.');
    }

    const user = await this.findOrLinkSupabaseUser(supabaseId, email);

    if (!user) {
      throw ApiError.unauthorized('No account found. Please sign up first.');
    }

    if (user.isBanned) {
      throw ApiError.forbidden(
        'Your account has been suspended. Contact admin for assistance.'
      );
    }

    const token = this.buildToken(user);

    return { user, token };
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId).populate('activeStore');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async switchRole(userId: string, targetMode: 'buyer' | 'seller'): Promise<AuthResult> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    // 1. Ensure permissions (Cumulative Role)
    if (targetMode === 'seller' && !user.roles.includes('seller')) {
      user.roles.push('seller');
    }

    // 2. Ensure Store exists if switching to seller mode
    if (targetMode === 'seller' && !user.activeStore) {
      const storeName = user.storeName || `${user.name}'s Shop`;
      const baseSlug = this.slugify(storeName);
      let slug = baseSlug;
      let counter = 1;
      
      // Handle slug collisions
      while (await Store.findOne({ slug })) {
        slug = `${baseSlug}-${counter++}`;
      }

      const store = await Store.create({
        ownerId: user._id,
        name: storeName,
        slug,
        avatar: user.avatar,
        location: user.location,
        payoutSetupComplete: user.sellerOnboarding?.payoutSetupComplete || false,
        payoutMethod: user.sellerOnboarding?.payoutMethod,
        payoutProvider: user.sellerOnboarding?.payoutProvider,
        payoutAccountName: user.sellerOnboarding?.payoutAccountName,
        payoutAccountNumber: user.sellerOnboarding?.payoutAccountNumber,
      });

      user.activeStore = store._id;
    }

    // 3. Toggle ViewMode
    user.viewMode = targetMode;
    await user.save();

    const populatedUser = await User.findById(user._id).populate('activeStore');
    if (!populatedUser) throw ApiError.notFound('User not found');

    const token = this.buildToken(populatedUser);
    return { user: populatedUser, token };
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      name: string;
      phone: string;
      avatar: string;
      studentId: string;
      department: string;
      residenceHall: string;
      currentLevel: string;
      location: string;
      bio: string;
      storeName: string;
      brandName: string;
      sellerOnboarding: {
        completed?: boolean;
        payoutSetupComplete?: boolean;
        payoutMethod?: 'momo' | 'bank';
        payoutProvider?: string;
        payoutAccountName?: string;
        payoutAccountNumber?: string;
        identityStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
        identityDocumentUrl?: string;
        identitySubmittedAt?: Date;
        completedAt?: Date;
      };
    }>
  ): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }
  /**
   * Google Login
   */
  async googleLogin(credential: string, role?: 'buyer' | 'seller', profileData?: any): Promise<AuthResult> {
    const payload = await verifySupabaseToken(credential);
    const supabaseId = payload.sub;
    const email = (payload.email || '').toLowerCase();
    if (!supabaseId || !email) {
      throw ApiError.badRequest('Invalid Supabase user token.');
    }

    let user = await this.findOrLinkSupabaseUser(supabaseId, email);
    let isNewUser = false;

    const profileName = String(payload.user_metadata?.name || payload.user_metadata?.full_name || '').trim();
    const profileAvatar = String(payload.user_metadata?.avatar_url || payload.user_metadata?.picture || '').trim();
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName || 'Campus User')}&background=1f2937&color=ffffff&bold=true`;

    const normalizedRole = role && ['buyer', 'seller'].includes(role) ? role : undefined;

    if (!user) {
      if (!normalizedRole) {
        throw ApiError.badRequest('New Google accounts must sign up first and choose a role.');
      }

    user = await User.create({
      supabaseId,
      name: profileName || 'User',
      email,
      phone: profileData?.phone || '',
      roles: normalizedRole ? [normalizedRole as any] : ['buyer'],
      isVerified: true,
      emailVerified: true, // Google OAuth verifies the email
      phoneVerified: false,
      avatar: profileAvatar || fallbackAvatar,
      studentId: profileData?.studentId || '',
      department: profileData?.department || '',
      currentLevel: profileData?.currentLevel || '',
      location: profileData?.location || '',
      isInstitutional: this.isInstitutionalEmail(email),
      password: this.randomPassword(),
    });
    isNewUser = true;
    } else {
      if (user.isBanned) {
        throw ApiError.forbidden('Your account has been suspended.');
      }

      let shouldSave = false;
      if (!user.avatar) {
        user.avatar = profileAvatar || fallbackAvatar;
        shouldSave = true;
      }
      if (!user.supabaseId) {
        user.supabaseId = supabaseId;
        shouldSave = true;
      }
      // Google OAuth verifies the email
      if (!user.emailVerified) {
        user.emailVerified = true;
        user.isVerified = true;
        shouldSave = true;
      }
      if (normalizedRole && !user.roles.includes(normalizedRole as any)) {
        user.roles.push(normalizedRole as any);
        shouldSave = true;
      }
      // If logging in as seller but no active store, switchRole handles it usually, 
      // but let's ensure consistency here if role was forced
      if (user.roles.includes('seller') && !user.activeStore) {
        // This will be handled on next switchRole call for cleaner logic
      }
      
      if (profileData) {
        if (profileData.studentId) user.studentId = profileData.studentId;
        if (profileData.department) user.department = profileData.department;
        if (profileData.residenceHall) user.residenceHall = profileData.residenceHall;
        if (profileData.currentLevel) user.currentLevel = profileData.currentLevel;
        if (profileData.location) user.location = profileData.location;
        if (profileData.phone) user.phone = profileData.phone;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    const token = this.buildToken(user);
    const needsProfileCompletion = !user.phone || user.phone.trim().length < 10 || !user.department || !user.residenceHall;

    return { user, token, isNewUser, needsProfileCompletion };
  }
}

export default new AuthService();
