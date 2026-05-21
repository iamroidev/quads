import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Shield,
  Trash2,
  AlertTriangle,
  Lock,
  Smartphone,
  Download,
  Check,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import notificationService from '../services/notification.service';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';
import { QRCodeSVG } from 'qrcode.react';

type Tab = 'notifications' | 'privacy' | 'account';

const labelBase = 'text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]';
const descBase = 'text-[11px] font-bold opacity-60 mt-1 text-[var(--bulletin-text)]';

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-3.5 w-3.5" /> },
  { id: 'privacy', label: 'Privacy & Security', icon: <Lock className="h-3.5 w-3.5" /> },
  { id: 'account', label: 'Account', icon: <Shield className="h-3.5 w-3.5" /> },
];

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) return existing;
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch {
    // Not supported
  }
}

interface NotifPrefs {
  orderUpdates: boolean;
  messages: boolean;
  reviews: boolean;
  promotions: boolean;
  systemAlerts: boolean;
  [key: string]: boolean;
}

const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    orderUpdates: true,
    messages: true,
    reviews: true,
    promotions: false,
    systemAlerts: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
  const [togglingPush, setTogglingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  // 2FA TOTP State
  const [totpEnabled, setTotpEnabled] = useState(user?.totpEnabled || false);
  const [wizardStep, setWizardStep] = useState<'none' | 'setup' | 'verify'>('none');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [totpSetupError, setTotpSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [totpDisablePassword, setTotpDisablePassword] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [totpDisableError, setTotpDisableError] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);

  useEffect(() => {
    if (user?.notificationPrefs) {
      setNotifPrefs(user.notificationPrefs);
    }
    if (user) {
      setTotpEnabled(user.totpEnabled || false);
    }
  }, [user]);

  const handleStartTotpSetup = async () => {
    setSetupLoading(true);
    setTotpSetupError('');
    try {
      const res = await api.post('/auth/totp/setup');
      setQrCodeUrl(res.data.qrCodeUrl);
      setTotpSecret(res.data.secret);
      setWizardStep('setup');
    } catch (err: any) {
      setTotpSetupError(err.response?.data?.message || 'Failed to start 2FA setup');
      toast.error('Failed to initialize 2FA');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyTotpSetup = async () => {
    if (totpToken.trim().length !== 6) {
      setTotpSetupError('Please enter a 6-digit verification code');
      return;
    }
    setVerifyLoading(true);
    setTotpSetupError('');
    try {
      await api.post('/auth/totp/verify', { token: totpToken.trim() });
      toast.success('Two-factor authentication enabled!');
      setWizardStep('none');
      setTotpToken('');
      await refreshUser();
    } catch (err: any) {
      setTotpSetupError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!totpDisablePassword) {
      setTotpDisableError('Please enter your password to disable 2FA');
      return;
    }
    setDisableLoading(true);
    setTotpDisableError('');
    try {
      await api.post('/auth/totp/disable', { password: totpDisablePassword });
      toast.success('Two-factor authentication disabled');
      setShowDisableConfirm(false);
      setTotpDisablePassword('');
      await refreshUser();
    } catch (err: any) {
      setTotpDisableError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setDownloadingData(true);
    try {
      const res = await api.get('/users/data-export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quads-data-export-${user?._id || 'user'}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Your data export has downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to download user data. Please try again.');
    } finally {
      setDownloadingData(false);
    }
  };

  const isAdmin = user?.roles?.includes('admin');
  const isSeller = user?.roles?.includes('seller');

  const notificationItems = isAdmin
    ? [
        { key: 'systemAlerts', label: 'System critical alerts', desc: 'High-priority server and platform health notices' },
        { key: 'messages', label: 'Direct communications', desc: 'Internal system messages and staff inquiries' },
      ]
    : isSeller
    ? [
        { key: 'messages', label: 'Inquiries & Chats', desc: 'When a potential buyer sends you a message' },
        { key: 'orderUpdates', label: 'Sales & Orders', desc: 'Notifications for new sales and status updates' },
        { key: 'reviews', label: 'Store Feedback', desc: 'When a buyer leaves a review or rating' },
        { key: 'promotions', label: 'Seller Growth', desc: 'Tips and promotional opportunities for your shop' },
      ]
    : [
        { key: 'messages', label: 'Seller Replies', desc: 'When a seller responds to your inquiry' },
        { key: 'orderUpdates', label: 'Order Tracking', desc: 'Status updates on your purchases' },
        { key: 'reviews', label: 'Review Reminders', desc: 'Nudges to leave feedback for recent purchases' },
        { key: 'promotions', label: 'Deals & Drops', desc: 'Exclusive offers and new item notifications' },
      ];

  const saveNotifPrefs = async () => {
    setSavingNotif(true);
    try {
      await api.put('/auth/settings/notifications', notifPrefs);
      toast.success('Notification preferences saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSavingNotif(false);
    }
  };

  const handleTogglePush = async () => {
    setTogglingPush(true);
    try {
      if (pushEnabled) {
        setPushEnabled(false);
        toast.success('Push notifications disabled');
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const registration = await registerServiceWorker();
          if (registration) {
            setPushEnabled(true);
            toast.success('Push notifications enabled');
          } else {
            toast.error('Could not register service worker');
          }
        } else {
          toast.error('Permission denied');
        }
      }
    } catch {
      toast.error('Failed to toggle push notifications');
    } finally {
      setTogglingPush(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      await notificationService.sendTestPush();
      toast.success('Test push sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test push');
    } finally {
      setTestingPush(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      toast.success('Account deleted. Redirecting...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const fieldBase = 'w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-3 text-[12px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30';

  return (
    <BulletinLayout subtitle="Settings" section="10" hideBreadcrumbs={true} showFooter={false}>
      <div className="border-b-4 border-[var(--bulletin-border)] bg-[#111] dark:bg-[#1a1a1a]">
        <div className="mx-auto max-w-[1400px] px-6 py-12">
          <div className="flex items-end justify-between">
            <div>
              <nav className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
                <span className="opacity-40">/</span>
                <Link to="/dashboard" className="hover:opacity-100 transition-opacity">Dashboard</Link>
                <span className="opacity-40">/</span>
                <span className="opacity-100 text-white">Settings</span>
              </nav>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#ff6b6b] mb-3">Manage Account</p>
              <h1 className="text-4xl font-black uppercase tracking-tight text-white">Preferences</h1>
            </div>
          </div>

          <div className="flex border-t-2 border-white/10 mt-10">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-t-2 -mt-0.5 transition-colors ${
                  activeTab === t.id
                    ? 'border-[#ff6b6b] text-[#ff6b6b] bg-white/5'
                    : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* ══ NOTIFICATIONS ══ */}
        {activeTab === 'notifications' && (
          <div>
            <div className="mb-8 border-b-2 border-[var(--bulletin-border)] pb-4">
              <div className={labelBase}>Preferences</div>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Notification Settings</h2>
            </div>

            <p className="text-[12px] font-bold opacity-70 mb-8 max-w-xl text-[var(--bulletin-text)]">
              {isAdmin 
                ? 'Configure delivery channels for platform health telemetry and administrative inquiries.'
                : isSeller
                ? 'Configure delivery channels for sales alerts, buyer inquiries, and growth opportunities.'
                : 'Configure delivery channels for order status, seller replies, and promotional drops.'}
            </p>

            <BulletinCard rotation={0.5} bgColor="bg-[var(--bulletin-card)]" className="mb-8 p-0 border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] overflow-hidden">
              {notificationItems.map((item, idx) => (
                <div key={item.key} className={`flex items-center justify-between px-6 py-5 ${idx !== notificationItems.length - 1 ? 'border-b-2 border-[var(--bulletin-border)]' : ''}`}>
                  <div className="pr-6">
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">{item.label}</div>
                    <div className={descBase}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`relative h-8 w-14 flex-shrink-0 border-2 border-[var(--bulletin-border)] transition-colors ${
                      notifPrefs[item.key] ? 'bg-black dark:bg-[#fffacd]' : 'bg-[var(--bulletin-bg)]'
                    }`}
                    role="switch"
                    aria-checked={notifPrefs[item.key]}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] dark:bg-black transition-transform ${
                        notifPrefs[item.key] ? 'translate-x-[26px]' : 'translate-x-[4px]'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </BulletinCard>

            <div className="flex justify-end mb-12">
              <button
                onClick={saveNotifPrefs}
                disabled={savingNotif}
                className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-40"
              >
                {savingNotif ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>

            {/* Push Notifications */}
            <div>
              <div className="mb-8 border-b-2 border-[var(--bulletin-border)] pb-4">
                <div className={labelBase}>This Device</div>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Alerts</h3>
              </div>

              <BulletinCard rotation={-0.5} bgColor="bg-[#e0f2f7] dark:bg-sky-900/20" className="mb-6 border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-[var(--bulletin-text)]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Browser Push Active</div>
                      <div className={descBase}>
                        {isAdmin
                          ? 'Be notified immediately about platform health.'
                          : isSeller
                          ? 'Be notified immediately when you make a sale.'
                          : 'Get alerts when your order is sent or updated.'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePush}
                    disabled={togglingPush}
                    className={`relative h-8 w-14 flex-shrink-0 border-2 border-[var(--bulletin-border)] transition-colors disabled:opacity-50 ml-4 ${
                      pushEnabled ? 'bg-black dark:bg-[#fffacd]' : 'bg-[var(--bulletin-bg)]'
                    }`}
                    role="switch"
                    aria-checked={pushEnabled}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] dark:bg-black transition-transform ${
                        pushEnabled ? 'translate-x-[26px]' : 'translate-x-[4px]'
                      }`}
                    />
                  </button>
                </div>
              </BulletinCard>
            </div>
          </div>
        )}

        {/* ══ PRIVACY & SECURITY ══ */}
        {activeTab === 'privacy' && (
          <div>
            <div className="mb-8 border-b-2 border-[var(--bulletin-border)] pb-4">
              <div className={labelBase}>Privacy</div>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Security Settings</h2>
            </div>

            <div className="max-w-2xl space-y-8">
              {/* ── Two-Factor Authentication Card ── */}
              <BulletinCard rotation={0.5} bgColor="bg-[var(--bulletin-card)]" className="border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-6 relative">
                {/* Vintage Tape Accent */}
                <div className="absolute -top-3 left-6 h-6 w-24 bg-[#ff6b6b]/40 rotate-2 pointer-events-none animate-pulse" />
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-[var(--bulletin-text)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[16px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Two-Factor Authentication</h3>
                      {totpEnabled ? (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-500 text-[9px] font-black uppercase px-2 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-500 text-[9px] font-black uppercase px-2 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
                          DISABLED
                        </span>
                      )}
                    </div>
                    
                    <p className={descBase}>
                      Secure your account using a time-based one-time password (TOTP) generated by apps like Google Authenticator, Authy, or 1Password.
                    </p>

                    {/* Wizard Setup Step */}
                    {wizardStep === 'setup' && (
                      <div className="mt-6 border-2 border-dashed border-[var(--bulletin-border)] p-5 bg-[var(--bulletin-bg)] space-y-5">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#ff6b6b]">2FA Wizard Setup</p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* QR Code Container styled like a pinned polaroid */}
                          <div className="bg-white p-4 border-2 border-[var(--bulletin-border)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] flex flex-col items-center">
                            {qrCodeUrl ? (
                              <QRCodeSVG value={qrCodeUrl} size={140} fgColor="#000000" bgColor="#ffffff" />
                            ) : (
                              <div className="w-[140px] h-[140px] flex items-center justify-center">
                                <RefreshCw className="h-6 w-6 animate-spin opacity-40 text-black" />
                              </div>
                            )}
                            <div className="text-[9px] font-bold text-gray-500 mt-2 tracking-tighter">Scan with authenticator app</div>
                          </div>

                          <div className="flex-1 space-y-3">
                            <p className="text-[12px] font-bold text-[var(--bulletin-text)]">
                              Or enter this secret key manually in your app:
                            </p>
                            <div className="bg-[var(--bulletin-card)] p-3 border-2 border-[var(--bulletin-border)] font-mono text-[13px] font-bold select-all break-all text-center">
                              {totpSecret}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 border-t-2 border-[var(--bulletin-border)]/20 pt-4">
                          <label className="block text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">
                            Enter 6-Digit Authenticator Code
                          </label>
                          <div className="flex gap-4">
                            <input
                              type="text"
                              value={totpToken}
                              onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="w-40 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 text-[16px] font-black text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] placeholder:opacity-30"
                            />
                            <button
                              onClick={handleVerifyTotpSetup}
                              disabled={verifyLoading || totpToken.length !== 6}
                              className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-4 py-3 text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all"
                            >
                              {verifyLoading ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                          </div>
                          {totpSetupError && (
                            <p className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">{totpSetupError}</p>
                          )}
                        </div>

                        <div className="flex justify-end mt-4">
                          <button
                            onClick={() => setWizardStep('none')}
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-text)] hover:underline text-xs"
                          >
                            Cancel Setup
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Enable / Disable Buttons */}
                    {wizardStep === 'none' && !totpEnabled && (
                      <div className="mt-4">
                        <button
                          onClick={handleStartTotpSetup}
                          disabled={setupLoading}
                          className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all disabled:opacity-50"
                        >
                          {setupLoading ? 'Initializing Setup...' : 'Setup Authenticator app →'}
                        </button>
                      </div>
                    )}

                    {totpEnabled && !showDisableConfirm && (
                      <div className="mt-4">
                        <button
                          onClick={() => { setShowDisableConfirm(true); setTotpDisableError(''); }}
                          className="border-2 border-red-600 dark:border-red-400 bg-transparent px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-[4px_4px_0_0_rgba(220,38,38,0.2)]"
                        >
                          Disable 2FA
                        </button>
                      </div>
                    )}

                    {showDisableConfirm && (
                      <div className="mt-6 border-2 border-red-500/20 bg-red-500/5 p-5 space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                          Confirm password to disable 2FA
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input
                            type="password"
                            value={totpDisablePassword}
                            onChange={(e) => setTotpDisablePassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 text-[12px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] placeholder:opacity-30 text-[var(--bulletin-text)]"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowDisableConfirm(false); setTotpDisablePassword(''); }}
                              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] px-4 py-3 text-[10px] font-black uppercase tracking-widest"
                            >
                              Abort
                            </button>
                            <button
                              onClick={handleDisableTotp}
                              disabled={disableLoading || !totpDisablePassword}
                              className="border-2 border-red-600 bg-red-600 text-white px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(220,38,38,0.3)] disabled:opacity-40"
                            >
                              {disableLoading ? 'Disabling...' : 'Confirm Disable'}
                            </button>
                          </div>
                        </div>
                        {totpDisableError && (
                          <p className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">{totpDisableError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </BulletinCard>

              {/* ── Download My Data Card ── */}
              <BulletinCard rotation={-0.5} bgColor="bg-[#fffacd] dark:bg-yellow-900/20" className="border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-6 relative">
                {/* Yellow tape decoration */}
                <div className="absolute -top-3 right-8 h-6 w-20 bg-[#ffd700]/40 -rotate-3 pointer-events-none" />

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center flex-shrink-0">
                    <Download className="h-5 w-5 text-[var(--bulletin-text)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Download My Data</h3>
                    <p className={descBase}>
                      Export all stored account data, listings, order history, and preferences under GDPR compliance rules as a structured JSON backup.
                    </p>
                    
                    <div className="mt-4">
                      <button
                        onClick={handleDownloadData}
                        disabled={downloadingData}
                        className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all flex items-center gap-2"
                      >
                        {downloadingData ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Compiling Data Export...
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            Download My Data
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </BulletinCard>

              <BulletinCard rotation={-0.5} bgColor="bg-[var(--bulletin-card)]" className="border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-[var(--bulletin-text)]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Login Info</div>
                    <div className={descBase}>
                      Change your password from your profile.
                    </div>
                    <Link to="/profile" className="mt-4 inline-block border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] transition-all hover:-translate-y-1 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
                      Change Password →
                    </Link>
                  </div>
                </div>
              </BulletinCard>

              <BulletinCard rotation={0.5} bgColor="bg-[var(--bulletin-card)]" className="border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-[var(--bulletin-text)]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Safety Rules</div>
                    <div className={descBase}>
                      Your account is secured. We don't share your data with anyone else.
                    </div>
                  </div>
                </div>
              </BulletinCard>

              <BulletinCard rotation={-0.5} bgColor="bg-[#e0f2f7] dark:bg-sky-900/20" className="border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-[var(--bulletin-text)]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Active Login</div>
                    <div className={descBase}>
                      You are logged in on this device.
                    </div>
                  </div>
                </div>
              </BulletinCard>
            </div>
          </div>
        )}

        {/* ══ ACCOUNT ══ */}
        {activeTab === 'account' && (
          <div>
            <div className="mb-8 border-b-2 border-[var(--bulletin-border)] pb-4">
              <div className={labelBase}>Danger Zone</div>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-red-600 dark:text-red-400">Delete Account</h2>
            </div>

            <BulletinCard rotation={0.5} bgColor="bg-[#fce4ec] dark:bg-red-900/20" className="max-w-xl border-4 border-red-600 dark:border-red-400 shadow-[12px_12px_0_0_rgba(220,38,38,0.5)] p-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="h-12 w-12 border-4 border-red-600 dark:border-red-400 bg-white dark:bg-black flex items-center justify-center flex-shrink-0 text-red-600 dark:text-red-400 animate-pulse">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[16px] font-black uppercase tracking-tight text-red-600 dark:text-red-400">Delete Account</div>
                  <div className="text-[12px] font-bold opacity-80 mt-2 text-red-600/80 dark:text-red-400/80 leading-relaxed">
                    Doing this will remove all your account data, items, and history. You cannot get it back.
                  </div>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border-4 border-red-600 dark:border-red-400 bg-transparent px-6 py-4 text-[12px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-400 dark:hover:text-black transition-all"
                >
                  <Trash2 className="inline-block h-4 w-4 mr-2" />
                  Start Deletion
                </button>
              ) : (
                <div className="space-y-4 border-t-2 border-red-600/20 dark:border-red-400/20 pt-6 mt-6">
                  <p className="text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Type DELETE to confirm</p>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="w-full border-4 border-red-600 dark:border-red-400 bg-white dark:bg-black p-4 text-[14px] font-black uppercase focus:outline-none focus:ring-0 text-red-600 dark:text-red-400 placeholder:text-red-600/30 dark:placeholder:text-red-400/30"
                  />

                  {!user?.googleId ? (
                    <>
                      <p className="text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Enter your password to confirm</p>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your Password"
                        className="w-full border-4 border-red-600 dark:border-red-400 bg-white dark:bg-black p-4 text-[14px] font-black focus:outline-none focus:ring-0 text-red-600 dark:text-red-400 placeholder:text-red-600/30 dark:placeholder:text-red-400/30"
                      />
                    </>
                  ) : (
                    <div className="border-2 border-dashed border-red-600/30 dark:border-red-400/30 p-3 bg-red-600/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 opacity-80">
                        🛡️ Social Login Connected: No password confirmation needed.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmation(''); setDeletePassword(''); }}
                      className="flex-1 border-4 border-red-600 dark:border-red-400 bg-white dark:bg-black px-4 py-4 text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-600/10 transition-colors"
                    >
                      Abort
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={
                        deleteConfirmation !== 'DELETE' || 
                        (!user?.googleId && !deletePassword) || 
                        deleting
                      }
                      className="flex-1 border-4 border-red-600 dark:border-red-400 bg-red-600 dark:bg-red-400 px-4 py-4 text-[11px] font-black uppercase tracking-widest text-white dark:text-black transition-colors hover:bg-red-700 dark:hover:bg-red-300 disabled:opacity-40"
                    >
                      {deleting ? 'Deleting...' : 'Delete Now'}
                    </button>
                  </div>
                </div>
              )}
            </BulletinCard>
          </div>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SettingsPage;