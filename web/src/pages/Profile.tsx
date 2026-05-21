import React, { useMemo, useState, useEffect } from 'react';
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
  X,
  User,
  Settings,
  Package,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import authService, { UserStats } from '../services/auth.service';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import referenceService from '../services/reference.service';
import type { Program, Hall } from '../services/reference.service';

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
  'w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] placeholder:text-[var(--bulletin-muted)] transition-all text-[var(--bulletin-text)]';
const fieldDisabled =
  'w-full border-2 border-[var(--bulletin-border)]/10 bg-[var(--bulletin-bg)] p-3 text-[12px] font-bold text-[var(--bulletin-muted)] cursor-not-allowed';
const selectBase =
  'w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] appearance-none text-[var(--bulletin-text)] bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat';
const labelBase = 'block text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-text)] opacity-60 mb-2';
const errorBase = 'mt-1 text-[11px] text-[#ff6b6b] font-black uppercase tracking-tighter';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, refreshUser, switchRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refPrograms, setRefPrograms] = useState<Program[]>([]);
  const [refHalls, setRefHalls] = useState<Hall[]>([]);
  const [refLevels, setRefLevels] = useState<string[]>([]);

  useEffect(() => {
    referenceService.getAll().then(d => {
      setRefPrograms(d.programs);
      setRefHalls(d.halls);
      setRefLevels(d.levels);
    }).catch(() => {});
  }, []);

  const isAdmin = user?.roles?.includes('admin');
  const isSeller = user?.viewMode === 'seller';
  const otherRole = isSeller ? 'buyer' : 'seller';

  const {
    register: rp,
    handleSubmit: hsp,
    reset: rpReset,
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

  React.useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const s = await authService.getUserStats();
        setStats(s);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    if (user) fetchStats();
  }, [user]);

  React.useEffect(() => {
    if (user) {
      rpReset({
        name: user.name || '',
        storeName: user.storeName || '',
        brandName: user.brandName || '',
        phone: user.phone || '',
        studentId: user.studentId || '',
        department: user.department || '',
        residenceHall: user.residenceHall || '',
        currentLevel: user.currentLevel || '',
        location: user.location || '',
        bio: user.bio || '',
      });
    }
  }, [user, rpReset]);

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
      toast.success('Profile Photo Updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleRoleSwitchClick = () => {
    setShowRoleModal(true);
  };

  const handleConfirmRoleSwitch = async () => {
    setSwitchingRole(true);
    try {
      await switchRole(otherRole);
      setShowRoleModal(false);
      navigate('/dashboard');
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
    <BulletinLayout section="09" hideBreadcrumbs={true}>
      {/* Profile Header */}
      <div className="relative border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(circle, var(--bulletin-text) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-12 md:py-20 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-[var(--bulletin-text)] opacity-10 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform" />
                <div className="relative h-40 w-40 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] overflow-hidden">
                  {user?.avatar ? (
                    <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] text-5xl font-black uppercase">
                      {user?.name?.[0]}
                    </div>
                  )}
                </div>
                <label className="absolute -right-4 -bottom-4 cursor-pointer border-4 border-[var(--bulletin-border)] bg-[#ff6b6b] p-3 text-white hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] transition-colors shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
                  <Camera className="h-5 w-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>

              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 border-2 border-[var(--bulletin-border)] text-[10px] font-black uppercase tracking-widest ${isSeller ? 'bg-[#ff6b6b] text-white' : 'bg-sky-500 text-white'}`}>
                    {user?.viewMode?.toUpperCase()} View
                  </span>
                  {user?.isVerified && (
                    <span className="flex items-center gap-1 border-2 border-[var(--bulletin-border)] bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Member
                    </span>
                  )}
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                  {user?.name}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-[11px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {user?.location || 'Campus Resident'}</div>
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Member Since {joinYear}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {user?.phone}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4 w-full lg:w-72">
              {(isSeller 
                ? [
                    { label: 'Available Items', value: loadingStats ? '...' : (stats?.activeListings || '0'), color: 'bg-[var(--bulletin-card)]' },
                    { label: 'Rating', value: loadingStats ? '...' : (stats?.rating ? `${stats.rating}/5` : 'N/A'), color: 'bg-[#fffacd] dark:bg-yellow-900/20' },
                    { label: 'Sales', value: loadingStats ? '...' : (stats?.totalSales || '0'), color: 'bg-[var(--bulletin-card)]' },
                    { label: 'Response', value: loadingStats ? '...' : `${stats?.responseRate || 100}%`, color: 'bg-[var(--bulletin-card)]' },
                  ]
                : [
                    { label: 'Total Orders', value: loadingStats ? '...' : (stats?.totalOrders || '0'), color: 'bg-[var(--bulletin-card)]' },
                    { label: 'Wishlist Items', value: user?.savedItems?.length || '0', color: 'bg-[#e0f2f7] dark:bg-sky-900/20' },
                    { label: 'Alerts', value: loadingStats ? '...' : (stats?.unreadNotifications || '0'), color: 'bg-[var(--bulletin-card)]' },
                    { label: 'Verified', value: user?.isVerified ? 'YES' : 'NO', color: 'bg-[var(--bulletin-card)]' },
                  ]
              ).map((stat, i) => (
                <div key={i} className={`border-2 border-[var(--bulletin-border)] p-4 shadow-[4px_4px_0_0_var(--bulletin-shadow)] ${stat.color}`}>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-[var(--bulletin-text)]">{stat.label}</div>
                  <div className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t-2 border-[var(--bulletin-border)] pt-8">
            <div className="flex gap-4">
              {(['profile', 'password'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-8 py-3 text-xs font-black uppercase tracking-widest border-2 border-[var(--bulletin-border)] transition-all ${
                    activeTab === t
                      ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] -translate-y-1 shadow-[4px_4px_0_0_rgba(255,107,107,1)]'
                      : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)] hover:bg-[var(--bulletin-bg)] hover:-translate-y-0.5'
                  }`}
                >
                  {t === 'profile' ? 'My Profile' : 'Security'}
                </button>
              ))}
            </div>

            {!isAdmin && (
              <button
                onClick={handleRoleSwitchClick}
                disabled={switchingRole}
                className="flex items-center gap-2 px-8 py-3 text-xs font-black uppercase tracking-widest border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/20 text-[var(--bulletin-text)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-40 group"
              >
                <Repeat className={`h-4 w-4 group-hover:rotate-180 transition-transform duration-500 ${switchingRole ? 'animate-spin' : ''}`} />
                {switchingRole ? 'Switching...' : `Switch to ${isSeller ? 'Buying' : 'Selling'}`}
              </button>
            )}
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr] lg:gap-20">
          <aside className="space-y-8">
            <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-5 shadow-[8px_8px_0_0_var(--bulletin-shadow),-4px_4px_0_0_#ff6b6b] transition-all hover:-translate-y-2 hover:shadow-[12px_12px_0_0_var(--bulletin-shadow),-8px_8px_0_0_#ff6b6b] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#ff6b6b]" />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {user?.avatar ? (
                    <div className="h-14 w-14 border-2 border-[var(--bulletin-border)]">
                      <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] flex items-center justify-center font-black">
                      {user?.name?.[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-30 text-[var(--bulletin-text)]">Student ID</div>
                    <div className="text-sm font-black uppercase tracking-tight truncate text-[var(--bulletin-text)]">{user?.studentId || 'UNK-001'}</div>
                  </div>
                </div>

                <div className="space-y-4 border-t-2 border-[var(--bulletin-border)]/5 pt-6">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Program</div>
                    <div className="text-[11px] font-bold text-[var(--bulletin-text)]">{user?.department || 'Not Specified'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Level</div>
                      <div className="text-[11px] font-bold text-[var(--bulletin-text)]">{user?.currentLevel || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">ID Num</div>
                      <div className="text-[11px] font-bold text-[var(--bulletin-text)]">{user?.studentId || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link to="/verification" className="w-full flex items-center justify-center gap-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff6b6b] hover:text-white transition-colors shadow-[2px_2px_0_0_rgba(255,107,107,1)]">
                    <ShieldCheck className="h-3 w-3" /> {user?.isVerified ? 'Verified Account' : 'Get Verified'}
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] p-6 border-2 border-[var(--bulletin-border)] shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
               <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-4">About Me</div>
               <p className="text-[11px] leading-relaxed italic">
                 "{user?.bio || 'No bio provided.'}"
               </p>
            </div>
          </aside>

          <div className="min-w-0">
            {activeTab === 'profile' && (
              <form onSubmit={hsp(onUpdateProfile)} className="space-y-12">
                <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
                  <div className="mb-8">
                    <div className="inline-block bg-[#fffacd] dark:bg-yellow-900/40 border border-[var(--bulletin-border)] px-2 py-0.5 text-[8px] font-black uppercase tracking-widest mb-2 text-black dark:text-white">Section 01</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Personal Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={labelBase}>Full Name</label>
                      <input type="text" className={fieldBase} {...rp('name')} />
                      {pe.name && <p className={errorBase}>{pe.name.message}</p>}
                    </div>
                    <div>
                      <label className={labelBase}>Current Location</label>
                      <input type="text" className={fieldBase} {...rp('location')} />
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t-2 border-[var(--bulletin-border)]/5">
                    <label className={labelBase}>About Me <span className="normal-case font-normal opacity-40">— Brief biography</span></label>
                    <textarea rows={3} className={`${fieldBase} resize-none`} {...rp('bio')} maxLength={500} />
                  </div>
                </div>

                <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
                  <div className="mb-8">
                    <div className="inline-block bg-[#e0f2f7] dark:bg-sky-900/20 border border-[var(--bulletin-border)] px-2 py-0.5 text-[8px] font-black uppercase tracking-widest mb-2 text-black dark:text-white">Section 02</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Student Info</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={labelBase}>Student ID Number</label>
                      <input type="text" className={fieldBase} {...rp('studentId')} />
                    </div>
                    <div>
                      <label className={labelBase}>Program of Study</label>
                      <select className={selectBase} {...rp('department')}>
                        <option value="">Select Program</option>
                        {refPrograms.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelBase}>Academic Level</label>
                      <select className={selectBase} {...rp('currentLevel')}>
                        <option value="">Select Level</option>
                        {refLevels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelBase}>Residence Hall / Hostel</label>
                      <select className={selectBase} {...rp('residenceHall')}>
                        <option value="">Select Residence</option>
                        {refHalls.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
                  <div className="mb-8">
                    <div className={`inline-block border border-[var(--bulletin-border)] px-2 py-0.5 text-[8px] font-black uppercase tracking-widest mb-2 ${isSeller ? 'bg-[#ff6b6b] text-white' : 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]'}`}>
                      Section 03
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">
                      {isSeller ? 'Shop Info' : 'Contact Details'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {user?.roles?.includes('seller') && (
                      <>
                        <div>
                          <label className={labelBase}>Shop Name</label>
                          <input type="text" className={fieldBase} {...rp('storeName')} />
                        </div>
                        <div>
                          <label className={labelBase}>Registration ID</label>
                          <input type="text" className={fieldBase} {...rp('brandName')} />
                        </div>
                      </>
                    )}
                    <div>
                      <label className={labelBase}>Mobile Number</label>
                      <input type="tel" className={fieldBase} {...rp('phone')} />
                      {pe.phone && <p className={errorBase}>{pe.phone.message}</p>}
                    </div>
                    <div>
                      <label className={labelBase}>Official Email <span className="normal-case font-normal opacity-40">— Locked</span></label>
                      <input type="email" value={user?.email || ''} disabled className={fieldDisabled} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
                  <div className="hidden md:block">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-30 text-[var(--bulletin-text)]">Update Settings</div>
                    <div className="text-xs font-bold text-[var(--bulletin-text)]">Changes are applied immediately across the marketplace.</div>
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full md:w-auto border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-10 py-4 text-sm font-black uppercase tracking-widest hover:bg-[#ff6b6b] hover:text-white transition-all shadow-[4px_4px_0_0_rgba(255,107,107,1)] active:translate-y-1 active:shadow-none"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={hspw(onChangePassword)} className="max-w-xl">
                <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
                  <div className="mb-8">
                    <div className="inline-block bg-[#ff6b6b] border border-[var(--bulletin-border)] px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white mb-2">Security</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Password & Security</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className={labelBase}>Current Password</label>
                      <div className="relative">
                        <input type={showCurrent ? 'text' : 'password'} className={fieldBase} {...rpw('currentPassword')} />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2 text-[var(--bulletin-muted)] hover:text-[var(--bulletin-text)]">
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelBase}>New Password</label>
                        <input type={showNew ? 'text' : 'password'} className={fieldBase} {...rpw('newPassword')} />
                      </div>
                      <div>
                        <label className={labelBase}>Confirm New Password</label>
                        <input type={showConfirm ? 'text' : 'password'} className={fieldBase} {...rpw('confirmNewPassword')} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="mt-10 w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] py-4 text-xs font-black uppercase tracking-widest hover:bg-[#ff6b6b] hover:text-white transition-colors shadow-[4px_4px_0_0_rgba(255,107,107,1)]"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </BulletinSection>

      {showRoleModal && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bulletin-card)] border-2 border-[var(--bulletin-border)] w-full max-w-sm shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative p-8 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5 opacity-40 hover:opacity-100" />
            </button>
            
            <div className="mb-4">
               <Repeat className="h-8 w-8 mb-3" />
               <h2 className="text-xl font-black uppercase tracking-tight">
                 {isSeller ? 'Switch to Buying?' : 'Switch to Selling?'}
               </h2>
               <p className="text-sm opacity-70 mt-2 leading-relaxed">
                 {isSeller 
                   ? "You'll switch to the buyer dashboard. Your shop and items for sale remain visible to others, and you can switch back at any time."
                   : "You'll switch to the seller dashboard to manage your products, track sales stats, and process orders. You can switch back anytime."}
               </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2.5 text-xs font-bold uppercase transition-colors hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRoleSwitch}
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-4 py-2.5 text-xs font-bold uppercase transition-all hover:bg-[#ff6b6b] hover:border-[#ff6b6b] flex items-center justify-center shadow-[2px_2px_0_0_var(--bulletin-shadow)]"
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default ProfilePage;