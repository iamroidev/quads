import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  ShieldOff,
  MapPin,
  Phone,
  Calendar,
  ArrowRight,
  Camera,
  Repeat,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import authService from '../services/auth.service';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const PROGRAMS = [
  'Computer Science & Engineering',
  'Geological Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Electrical & Electronic Engineering',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Mathematics',
  'Physics',
  'Environmental Science',
  'Business Administration',
  'Accounting & Finance',
  'Humanities & Social Sciences',
  'Other',
];

const RESIDENCE_HALLS = [
  'D. A. Opoku Mensah (D.A.O.) Hall',
  'J. C. S. Hagan Hall',
  'A. A. Adumua-Bossman Hall',
  'Mensah Sarbah Hall',
  'Jubilee Hall',
  'Tarkwaian Hostel',
  'Off-campus',
  'Other',
];

const ACADEMIC_LEVELS = [
  '100',
  '200',
  '300',
  '400',
  'Graduate',
  'Staff',
];

/* ── Schemas ── */
const profileSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(50, 'Max 50 characters'),
  storeName: z.string().max(80, 'Max 80 characters').optional(),
  brandName: z.string().max(80, 'Max 80 characters').optional(),
  phone: z.string().min(10, 'Enter a valid phone number'),
  studentId: z.string().optional(),
  department: z.string().optional(),
  residenceHall: z.string().optional(),
  currentLevel: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, 'Max 500 characters').optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(6, 'At least 6 characters'),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type Tab = 'profile' | 'password';

/* ── Shared field styles for bulletin ── */
const fieldBase =
  'w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';
const fieldDisabled =
  'w-full border border-black/30 bg-[#f8f7f4] p-2 text-[12px] font-bold text-black/50 cursor-not-allowed';
const selectBase =
  'w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat';
const labelBase = 'block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1';
const errorBase = 'mt-1 text-[11px] text-red-600 font-bold';

/* ── Initials avatar ── */
function Initials({ name, size = 'lg' }: { name?: string; size?: 'sm' | 'lg' }) {
  const letters = (name || '?')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const dim = size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-10 w-10 text-sm';
  return (
    <div className={`${dim} flex items-center justify-center border border-black bg-black font-black text-white flex-shrink-0`}>
      {letters}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, refreshUser, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const otherRole = isSeller ? 'buyer' : 'seller';

  const {
    register: rp,
    handleSubmit: hsp,
    formState: { errors: pe },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      storeName: user?.storeName || '',
      brandName: user?.brandName || '',
      phone: user?.phone || '',
      studentId: user?.studentId || '',
      department: user?.department || '',
      residenceHall: user?.residenceHall || '',
      currentLevel: user?.currentLevel || '',
      location: user?.location || '',
      bio: user?.bio || '',
    },
  });

  const {
    register: rpw,
    handleSubmit: hspw,
    reset: resetPw,
    formState: { errors: pwe },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      await updateProfile(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      resetPw();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Select a valid image file');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      event.target.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      await authService.uploadAvatar(file);
      await refreshUser();
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleRoleSwitch = async () => {
    const label = otherRole === 'seller' ? 'start selling' : 'switch to buying';
    const confirmed = window.confirm(
      `Are you sure you want to ${label}? You can switch back anytime.`
    );
    if (!confirmed) return;

    setSwitchingRole(true);
    try {
      await switchRole(otherRole);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to switch role');
    } finally {
      setSwitchingRole(false);
    }
  };

  const joinYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const avatarSrc = useMemo(() => {
    if (!user?.avatar) return '';
    return `${user.avatar}${user.avatar.includes('?') ? '&' : '?'}cb=${user.updatedAt || Date.now()}`;
  }, [user?.avatar, user?.updatedAt]);

  return (
    <BulletinLayout title="Profile" subtitle="Account" section="09">
      {/* Avatar + Identity Banner */}
      <div className="border-b border-black bg-black">
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-6">
              <div className="relative">
                {user?.avatar ? (
                  <div className="h-24 w-24 border border-white overflow-hidden">
                    <img
                      src={avatarSrc}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <Initials name={user?.name} size="lg" />
                )}
                <label className="absolute -right-2 -bottom-2 cursor-pointer border border-black bg-white p-2 hover:bg-[#f8f7f4]">
                  <Camera className="h-3.5 w-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>

              <div className="pb-0.5">
                <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
                <p className="mt-1 text-[12px] text-white/50">{user?.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {(user?.storeName || user?.brandName) && (
                    <span className="border border-white/30 px-2 py-0.5 text-[9px] font-bold uppercase text-white/70">
                      {user?.storeName || user?.brandName}
                    </span>
                  )}
                  <span className="border border-white/20 px-2 py-0.5 text-[9px] font-bold uppercase text-white/40">
                    {user?.role}
                  </span>
                  {user?.isVerified ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-white/30">
                      <ShieldOff className="h-3 w-3" />
                      Unverified
                    </span>
                  )}
                  {user?.location && (
                    <span className="flex items-center gap-1 text-[10px] text-white/30">
                      <MapPin className="h-3 w-3" />
                      {user.location}
                    </span>
                  )}
                  {joinYear && (
                    <span className="flex items-center gap-1 text-[10px] text-white/25">
                      <Calendar className="h-3 w-3" />
                      Since {joinYear}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {user?.bio && (
              <p className="hidden lg:block max-w-xs text-sm text-white/30 italic text-right">
                "{user.bio}"
              </p>
            )}
          </div>

          {/* Tab strip */}
          <div className="flex border-t border-white/[0.15] mt-8 items-center justify-between">
            <div className="flex">
              {(['profile', 'password'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider border-t-2 -mt-px transition-colors ${
                    activeTab === t
                      ? 'border-white text-white'
                      : 'border-transparent text-white/30 hover:text-white/60'
                  }`}
                >
                  {t === 'profile' ? 'Edit Profile' : 'Password'}
                </button>
              ))}
            </div>

            {/* Role switch button in header */}
            <button
              onClick={handleRoleSwitch}
              disabled={switchingRole}
              className="flex items-center gap-1.5 px-4 py-2 text-[9px] font-bold uppercase tracking-wider border border-white/30 text-white/60 hover:text-white hover:border-white/60 transition-all disabled:opacity-40"
            >
              <Repeat className={`h-3 w-3 ${switchingRole ? 'animate-spin' : ''}`} />
              {switchingRole
                ? 'Switching...'
                : isSeller
                  ? 'Switch to Buying'
                  : 'Start Selling'}
            </button>
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr] lg:gap-16">
          {/* Left sidebar - compact info card */}
          <aside className="space-y-4">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <div className="h-10 w-10 border border-black overflow-hidden">
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </div>
              ) : (
                <Initials name={user?.name} size="sm" />
              )}
              <div>
                <p className="text-[11px] font-bold">{user?.name}</p>
                <p className="text-[10px] opacity-50 capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="border-t border-black/20" />

            <ul className="space-y-3">
              {[
                { label: 'Email', value: user?.email },
                { label: 'Phone', value: user?.phone, icon: <Phone className="h-3 w-3" /> },
                { label: 'Student ID', value: user?.studentId },
                { label: 'Program', value: user?.department },
                { label: 'Residence Hall', value: user?.residenceHall },
                { label: 'Level', value: user?.currentLevel },
                { label: 'Location', value: user?.location, icon: <MapPin className="h-3 w-3" /> },
                ...(joinYear ? [{ label: 'Member since', value: String(joinYear), icon: <Calendar className="h-3 w-3" /> }] : []),
              ].filter((item) => item.value).map((item) => (
                <li key={item.label}>
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5">{item.label}</div>
                  <div className="text-[11px] flex items-center gap-1 opacity-70">
                    {item.icon && <span className="opacity-50">{item.icon}</span>}
                    {item.value}
                  </div>
                </li>
              ))}
            </ul>

            <label className="mt-2 inline-flex cursor-pointer items-center gap-1 border border-black bg-white px-2 py-0.5 text-[8px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
              <Camera className="h-3 w-3" />
              {uploadingAvatar ? 'Uploading' : 'Update photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>

            {user?.bio && (
              <>
                <div className="border-t border-black/20" />
                <p className="text-[11px] opacity-60 italic">"{user.bio}"</p>
              </>
            )}

            {/* Verification CTA */}
            {!user?.emailVerified && !user?.phoneVerified && (
              <div className="border-t border-black/20 pt-4">
                <Link
                  to="/verification"
                  className="w-full flex items-center gap-2 border border-black bg-yellow-100 px-3 py-2 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <ShieldOff className="h-3 w-3" />
                  Verify now — get trusted
                </Link>
              </div>
            )}
            {user?.isVerified && (
              <div className="border-t border-black/20 pt-4">
                <Link
                  to="/verification"
                  className="w-full flex items-center gap-2 border border-emerald-400 bg-emerald-50 px-3 py-2 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Verified · Add more
                </Link>
              </div>
            )}

            {/* Role switch in sidebar */}
            <div className="border-t border-black/20 pt-4">
              <button
                onClick={handleRoleSwitch}
                disabled={switchingRole}
                className="w-full border border-black bg-white px-3 py-2 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Repeat className={`h-3 w-3 ${switchingRole ? 'animate-spin' : ''}`} />
                {switchingRole
                  ? 'Switching...'
                  : isSeller
                    ? 'Switch to Buying'
                    : 'Start Selling'}
              </button>
            </div>
          </aside>

          {/* Right: form panel */}
          <div className="min-w-0">
            {activeTab === 'profile' && (
              <form onSubmit={hsp(onUpdateProfile)}>
                <div className="mb-8">
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Edit profile</div>
                  <h2 className="mt-1 text-lg font-bold">Your information</h2>
                  <div className="mt-3 border-t border-black" />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                  <div>
                    <label className={labelBase}>Full name</label>
                    <input type="text" className={fieldBase} {...rp('name')} />
                    {pe.name && <p className={errorBase}>{pe.name.message}</p>}
                  </div>
                  {/* Only sellers see store/brand fields */}
                  {isSeller && (
                    <div>
                      <label className={labelBase}>Store name</label>
                      <input type="text" className={fieldBase} placeholder="e.g. Campus Gadget Hub" {...rp('storeName')} />
                      {pe.storeName && <p className={errorBase}>{pe.storeName.message}</p>}
                    </div>
                  )}
                </div>

                {isSeller && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                    <div>
                      <label className={labelBase}>Brand name</label>
                      <input type="text" className={fieldBase} placeholder="e.g. Kofi Tech" {...rp('brandName')} />
                      {pe.brandName && <p className={errorBase}>{pe.brandName.message}</p>}
                    </div>
                    <div>
                      <label className={labelBase}>Phone</label>
                      <input type="tel" className={fieldBase} {...rp('phone')} />
                      {pe.phone && <p className={errorBase}>{pe.phone.message}</p>}
                    </div>
                  </div>
                )}

                {!isSeller && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                    <div>
                      <label className={labelBase}>Phone</label>
                      <input type="tel" className={fieldBase} {...rp('phone')} />
                      {pe.phone && <p className={errorBase}>{pe.phone.message}</p>}
                    </div>
                    <div />
                  </div>
                )}

                <div className="mb-6">
                  <label className={`${labelBase} opacity-40`}>Email <span className="normal-case font-normal">— cannot be changed</span></label>
                  <input type="email" value={user?.email || ''} disabled className={fieldDisabled} />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                  <div>
                    <label className={labelBase}>Student ID</label>
                    <input type="text" placeholder="STU-XXXX" className={fieldBase} {...rp('studentId')} />
                  </div>
                  <div>
                    <label className={labelBase}>Location</label>
                    <input type="text" placeholder="e.g. Jubilee Hostel" className={fieldBase} {...rp('location')} />
                  </div>
                </div>

                {/* Campus fields */}
                <div className="border-t border-black/20 pt-6 mb-6">
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4">Campus Information</div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Program of Study</label>
                      <input type="text" placeholder="e.g. Geological Engineering" className={fieldBase} {...rp('department')} />
                    </div>
                    <div>
                      <label className={labelBase}>Residence Hall</label>
                      <input type="text" placeholder="e.g. Jubilee Hall" className={fieldBase} {...rp('residenceHall')} />
                    </div>
                    <div>
                      <label className={labelBase}>Academic Level</label>
                      <select className={selectBase} {...rp('currentLevel')}>
                        <option value="">Not specified</option>
                        {ACADEMIC_LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className={labelBase}>Bio <span className="normal-case font-normal opacity-60">— optional, max 500 chars</span></label>
                  <textarea
                    rows={3}
                    placeholder="Tell others a bit about yourself..."
                    className={`${fieldBase} resize-none`}
                    maxLength={500}
                    {...rp('bio')}
                  />
                  {pe.bio && <p className={errorBase}>{pe.bio.message}</p>}
                </div>

                <div className="flex items-center justify-between border-t border-black pt-6">
                  <div className="text-[10px] uppercase tracking-wider opacity-40">Changes saved immediately</div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="border border-black bg-black px-6 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors disabled:opacity-40"
                  >
                    {isUpdating ? (
                      <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-1" /> Saving</>
                    ) : (
                      <><Check className="inline-block h-3.5 w-3.5 mr-1" /> Save changes</>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={hspw(onChangePassword)}>
                <div className="mb-8">
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Security</div>
                  <h2 className="mt-1 text-lg font-bold">Change password</h2>
                  <div className="mt-3 border-t border-black" />
                </div>

                <p className="mb-6 text-[12px] opacity-70 max-w-md">
                  Choose a strong password of at least 6 characters.
                </p>

                <div className="space-y-6 max-w-md">
                  <div>
                    <label className={labelBase}>Current password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className={`flex-1 pr-10 ${fieldBase}`}
                        {...rpw('currentPassword')}
                      />
                      <button type="button" onClick={() => setShowCurrent((p) => !p)} className="absolute right-2 text-black/40 hover:text-black">
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwe.currentPassword && <p className={errorBase}>{pwe.currentPassword.message}</p>}
                  </div>

                  <div className="border-t border-black/20" />

                  <div>
                    <label className={labelBase}>New password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showNew ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        className={`flex-1 pr-10 ${fieldBase}`}
                        {...rpw('newPassword')}
                      />
                      <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-2 text-black/40 hover:text-black">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwe.newPassword && <p className={errorBase}>{pwe.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>Confirm new password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        className={`flex-1 pr-10 ${fieldBase}`}
                        {...rpw('confirmNewPassword')}
                      />
                      <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-2 text-black/40 hover:text-black">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwe.confirmNewPassword && <p className={errorBase}>{pwe.confirmNewPassword.message}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-black pt-6 mt-8 max-w-md">
                  <div className="text-[10px] uppercase tracking-wider opacity-40">Irreversible action</div>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="border border-black bg-black px-6 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors disabled:opacity-40"
                  >
                    {isChangingPassword ? (
                      <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-1" /> Updating</>
                    ) : (
                      <><ArrowRight className="inline-block h-3.5 w-3.5 mr-1" /> Update password</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default ProfilePage;