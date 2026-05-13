import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
  Check,
  Lock,
  Smartphone,
  Store,
  ShoppingBag,
  Megaphone,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import notificationService from '../services/notification.service';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

type Tab = 'notifications' | 'privacy' | 'account';

const labelBase = 'text-[10px] font-bold uppercase tracking-wider opacity-60';
const descBase = 'text-[11px] opacity-60 mt-0.5';

interface NotifPrefs {
  newMessage: boolean;
  newOrder: boolean;
  orderUpdate: boolean;
  promotion: boolean;
  newFollower: boolean;
  featuredListings: boolean;
  [key: string]: boolean;
}

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

const SettingsPage: React.FC = () => {
  const { user, refreshUser, changePassword } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    newMessage: true,
    newOrder: true,
    orderUpdate: true,
    promotion: false,
    newFollower: false,
    featuredListings: false,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
  const [togglingPush, setTogglingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const isSellerView = isSeller;

  // Load saved prefs
  useEffect(() => {
    const stored = localStorage.getItem('notifPrefs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifPrefs((p) => ({ ...p, ...parsed }));
      } catch {}
    }
  }, []);

  const notificationItems = [
    ...(isSellerView
      ? [
          { key: 'newOrder', label: 'New orders', desc: 'Alert when a buyer places an order' },
          { key: 'promotion', label: 'Promotions', desc: 'Feature discounts and campaign opportunities' },
          { key: 'featuredListings', label: 'Featured opportunities', desc: 'Get notified about featured slot availability' },
        ]
      : [
          { key: 'orderUpdate', label: 'Order updates', desc: 'Status changes on your purchases' },
          { key: 'promotion', label: 'Deals & offers', desc: 'Promotional offers from sellers' },
        ]),
    { key: 'newMessage', label: 'New messages', desc: 'When someone sends you a chat' },
    ...(isSellerView ? [{ key: 'newFollower', label: 'New followers', desc: 'When someone follows your store' }] : []),
  ];

  const saveNotifPrefs = async () => {
    setSavingNotif(true);
    try {
      localStorage.setItem('notifPrefs', JSON.stringify(notifPrefs));
      // Save prefs to server via notifications endpoint
      await api.put('/notifications/preferences', notifPrefs);
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

  const fieldBase = 'w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

  return (
    <BulletinLayout subtitle="Settings" section="10">
      {/* Dark header with tabs (no title to avoid redundancy) */}
      <div className="border-b border-black bg-black">
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30">Settings</p>
              <h1 className="mt-1 text-2xl font-bold text-white">Account & preferences</h1>
            </div>
          </div>

          <div className="flex border-t border-white/[0.12] mt-8">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wider border-t-2 -mt-px transition-colors ${
                  activeTab === t.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/30 hover:text-white/60'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[#faf8f5]">
        {/* ══ NOTIFICATIONS ══ */}
        {activeTab === 'notifications' && (
          <div>
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60">Preferences</div>
              <h2 className="mt-1 text-lg font-bold">Notification settings</h2>
              <div className="mt-3 border-t border-black" />
            </div>

            <p className="text-[12px] opacity-70 mb-6 max-w-lg">
              {isSellerView
                ? 'Control sales alerts, buyer messages, and promotion opportunities for your store.'
                : 'Control order, chat, and deal alerts for your buying activity.'}
            </p>

            <BulletinCard rotation={0} bgColor="bg-white" className="mb-6 p-0">
              {notificationItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between px-5 py-4 border-b border-black last:border-b-0">
                  <div className="pr-4">
                    <div className="text-[12px] font-bold">{item.label}</div>
                    <div className={descBase}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`relative h-6 w-10 flex-shrink-0 border border-black transition-colors ${
                      notifPrefs[item.key] ? 'bg-black' : 'bg-white'
                    }`}
                    role="switch"
                    aria-checked={notifPrefs[item.key]}
                  >
                    <span
                      className={`absolute top-0.5 h-[18px] w-[18px] border border-black bg-white transition-transform ${
                        notifPrefs[item.key] ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </BulletinCard>

            <div className="flex justify-end mb-8">
              <button
                onClick={saveNotifPrefs}
                disabled={savingNotif}
                className="border border-black bg-black px-6 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors disabled:opacity-40"
              >
                {savingNotif ? 'Saving...' : 'Save preferences'}
              </button>
            </div>

            {/* Push Notifications */}
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-60">This Device</div>
              <h3 className="mt-1 text-base font-bold">Push Notifications</h3>
              <div className="mt-3 border-t border-black mb-6" />

              <BulletinCard rotation={0} bgColor="bg-[#fefdfb]" className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[12px] font-bold">Enable browser notifications</div>
                      <div className={descBase}>
                        {isSellerView
                          ? 'Get real-time sales and buyer chat alerts for this browser.'
                          : 'Get instant order and seller reply alerts for this browser.'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePush}
                    disabled={togglingPush}
                    className={`relative h-6 w-10 flex-shrink-0 border border-black transition-colors disabled:opacity-50 ${
                      pushEnabled ? 'bg-black' : 'bg-white'
                    }`}
                    role="switch"
                    aria-checked={pushEnabled}
                  >
                    <span
                      className={`absolute top-0.5 h-[18px] w-[18px] border border-black bg-white transition-transform ${
                        pushEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>
              </BulletinCard>

              <div className="flex justify-end">
                <button
                  onClick={handleTestPush}
                  disabled={!pushEnabled || testingPush}
                  className="border border-black bg-white px-4 py-2 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all"
                >
                  <Bell className="inline-block h-3 w-3 mr-1" />
                  {testingPush ? 'Sending...' : 'Send test push'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRIVACY & SECURITY ══ */}
        {activeTab === 'privacy' && (
          <div>
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60">Privacy</div>
              <h2 className="mt-1 text-lg font-bold">Privacy & Security</h2>
              <div className="mt-3 border-t border-black" />
            </div>

            <div className="max-w-lg space-y-5">
              <BulletinCard rotation={-0.3} bgColor="bg-white">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] font-bold">Password</div>
                    <div className={descBase}>
                      Update your password from your profile page.
                    </div>
                    <Link to="/profile" className="mt-2 inline-block border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">
                      Go to Profile →
                    </Link>
                  </div>
                </div>
              </BulletinCard>

              <BulletinCard rotation={0.3} bgColor="bg-white">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] font-bold">Account security</div>
                    <div className={descBase}>
                      Your account is protected by email authentication. 
                      Password changes are handled securely via your profile settings.
                    </div>
                  </div>
                </div>
              </BulletinCard>

              <BulletinCard rotation={-0.3} bgColor="bg-[#e0f2f7]">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] font-bold">Session management</div>
                    <div className={descBase}>
                      You are currently logged in on this device. 
                      Sign out from any device via your account settings.
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
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60">Danger zone</div>
              <h2 className="mt-1 text-lg font-bold">Delete account</h2>
              <div className="mt-3 border-t border-black" />
            </div>

            <BulletinCard rotation={0.5} bgColor="bg-[#fce4ec]" className="max-w-lg">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12px] font-bold">Permanently delete your account</div>
                  <div className={descBase}>
                    This will remove all your listings, orders, and data. This action cannot be undone.
                  </div>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <Trash2 className="inline-block h-3.5 w-3.5 mr-1" />
                  Delete my account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase">Type DELETE to confirm</p>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className={fieldBase}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmation(''); }}
                      className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'DELETE' || deleting}
                      className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-red-600 disabled:opacity-40"
                    >
                      {deleting ? 'Deleting...' : 'Confirm delete'}
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