import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Shield,
  Trash2,
  AlertTriangle,
  Lock,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import notificationService from '../services/notification.service';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

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
  const { user } = useAuth();
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
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.notificationPrefs) {
      setNotifPrefs(user.notificationPrefs);
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller';

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
      await api.delete('/auth/account');
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
    <BulletinLayout subtitle="Settings" section="10" hideBreadcrumbs={true}>
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
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#ff6b6b] mb-3">Account Management</p>
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
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Notification Engine</h2>
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
                <div className={labelBase}>Local Machine</div>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Push Delivery</h3>
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
                          ? 'Maintain real-time situational awareness for platform critical events.'
                          : isSeller
                          ? 'Maintain real-time situational awareness for incoming sales.'
                          : 'Receive instant ping on order dispatch and tracking updates.'}
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

              <div className="flex justify-end">
                <button
                  onClick={handleTestPush}
                  disabled={!pushEnabled || testingPush}
                  className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none disabled:opacity-40 transition-all text-[var(--bulletin-text)]"
                >
                  <Bell className="inline-block h-3 w-3 mr-2" />
                  {testingPush ? 'Sending...' : 'Test Notification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRIVACY & SECURITY ══ */}
        {activeTab === 'privacy' && (
          <div>
            <div className="mb-8 border-b-2 border-[var(--bulletin-border)] pb-4">
              <div className={labelBase}>Privacy</div>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Security Audit</h2>
            </div>

            <div className="max-w-2xl space-y-8">
              <BulletinCard rotation={-0.5} bgColor="bg-[#fffacd] dark:bg-yellow-900/20" className="border-2 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-[var(--bulletin-text)]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Access Credentials</div>
                    <div className={descBase}>
                      Modify your cryptographic authentication keys from the profile module.
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
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Integrity Protocol</div>
                    <div className={descBase}>
                      Your ledger is secured via email authentication. Zero third-party telemetry is injected into your operational flow.
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
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">Active Session</div>
                    <div className={descBase}>
                      You are authenticated on this terminal. Terminate session globally via account settings to force re-authentication.
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
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-red-600 dark:text-red-400">Account Termination</h2>
            </div>

            <BulletinCard rotation={0.5} bgColor="bg-[#fce4ec] dark:bg-red-900/20" className="max-w-xl border-4 border-red-600 dark:border-red-400 shadow-[12px_12px_0_0_rgba(220,38,38,0.5)] p-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="h-12 w-12 border-4 border-red-600 dark:border-red-400 bg-white dark:bg-black flex items-center justify-center flex-shrink-0 text-red-600 dark:text-red-400 animate-pulse">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[16px] font-black uppercase tracking-tight text-red-600 dark:text-red-400">Permanent Erasure</div>
                  <div className="text-[12px] font-bold opacity-80 mt-2 text-red-600/80 dark:text-red-400/80 leading-relaxed">
                    Executing this command will irreversibly wipe all operational data, listings, and transaction history. Recovery is impossible.
                  </div>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border-4 border-red-600 dark:border-red-400 bg-transparent px-6 py-4 text-[12px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-400 dark:hover:text-black transition-all"
                >
                  <Trash2 className="inline-block h-4 w-4 mr-2" />
                  Initiate Deletion
                </button>
              ) : (
                <div className="space-y-4 border-t-2 border-red-600/20 dark:border-red-400/20 pt-6 mt-6">
                  <p className="text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Type DELETE to confirm authorization</p>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="w-full border-4 border-red-600 dark:border-red-400 bg-white dark:bg-black p-4 text-[14px] font-black uppercase focus:outline-none focus:ring-0 text-red-600 dark:text-red-400 placeholder:text-red-600/30 dark:placeholder:text-red-400/30"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmation(''); }}
                      className="flex-1 border-4 border-red-600 dark:border-red-400 bg-white dark:bg-black px-4 py-4 text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-600/10 transition-colors"
                    >
                      Abort
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'DELETE' || deleting}
                      className="flex-1 border-4 border-red-600 dark:border-red-400 bg-red-600 dark:bg-red-400 px-4 py-4 text-[11px] font-black uppercase tracking-widest text-white dark:text-black transition-colors hover:bg-red-700 dark:hover:bg-red-300 disabled:opacity-40"
                    >
                      {deleting ? 'Executing...' : 'Confirm Purge'}
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