import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  Ban,
  Package,
  Flag,
  Star,
  ShoppingCart,
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService, { AdminDashboardStats, DisputePopulated } from '../services/admin.service';
import orderService from '../services/order.service';
import { OrderPopulated, ProductPopulated, User } from '../types';
import { Link } from 'react-router-dom';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

type AdminTab = 'overview' | 'users' | 'products' | 'orders' | 'disputes' | 'ops';

const TABS: { value: AdminTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'users', label: 'Users' },
  { value: 'products', label: 'Products' },
  { value: 'orders', label: 'Orders' },
  { value: 'disputes', label: 'Disputes' },
  { value: 'ops', label: 'Ops' },
];

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-[#fce4ec] text-black',
  under_review: 'bg-[#fffacd] text-black',
  resolved: 'bg-[#fffacd] text-black',
  closed: 'bg-[#f0e8f4] text-black',
};

const fieldBase = 'w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [orders, setOrders] = useState<OrderPopulated[]>([]);
  const [disputes, setDisputes] = useState<DisputePopulated[]>([]);
  const [moderationQueue, setModerationQueue] = useState<{ products: ProductPopulated[]; disputes: DisputePopulated[] }>({
    products: [],
    disputes: [],
  });

  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Dispute management state
  const [selectedDispute, setSelectedDispute] = useState<DisputePopulated | null>(null);
  const [disputeStatus, setDisputeStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [opsAuditLogs, setOpsAuditLogs] = useState<any[]>([]);
  const [retryJobs, setRetryJobs] = useState<any[]>([]);
  const [newRetryType, setNewRetryType] = useState<'import' | 'notification' | 'payment' | 'moderation'>('notification');
  const [newRetryPayload, setNewRetryPayload] = useState('{"note":"manual retry"}');

  const fetchStats = async () => {
    try {
      const res = await adminService.getDashboardStats();
      if (res.success) setStats(res.data.stats);
    } catch {
      toast.error('Failed to load dashboard stats');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminService.getUsers({ limit: 50, search: userSearch || undefined });
      if (res.success) setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await adminService.getProducts({ limit: 50, search: productSearch || undefined });
      if (res.success) setProducts(res.data.products);
    } catch {
      toast.error('Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await adminService.getOrders({ limit: 50, search: orderSearch || undefined });
      if (res.success) setOrders(res.data.orders);
    } catch {
      toast.error('Failed to load orders');
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await adminService.getDisputes({ limit: 50 });
      if (res.success) setDisputes(res.data.disputes);
    } catch {
      toast.error('Failed to load disputes');
    }
  };

  const fetchModerationQueue = async () => {
    try {
      const res = await adminService.getModerationQueue({ limit: 10 });
      if (res.success) setModerationQueue(res.data);
    } catch {
      toast.error('Failed to load moderation queue');
    }
  };

  const runAutomationSweep = async () => {
    setRunningAutomation(true);
    try {
      const res = await orderService.runAutomationSweep();
      if (res.success) {
        toast.success(`Sweep done: ${res.data.abandonedCheckoutCount} abandoned + ${res.data.inventoryLowAlertCount} low-stock alerts`);
      }
    } catch {
      toast.error('Failed to run automation sweep');
    } finally {
      setRunningAutomation(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchProducts(), fetchOrders(), fetchDisputes(), fetchModerationQueue()]);
    setLoading(false);
  };

  const fetchOpsData = async () => {
    try {
      const [logsRes, jobsRes] = await Promise.all([
        adminService.getOpsAuditLogs({ limit: 40 }),
        adminService.getRetryJobs({ limit: 40 }),
      ]);
      if (logsRes.success) setOpsAuditLogs(logsRes.data.logs || []);
      if (jobsRes.success) setRetryJobs(jobsRes.data.jobs || []);
    } catch {
      toast.error('Failed to load ops data');
    }
  };

  useEffect(() => {
    refreshAll();
    fetchOpsData();
  }, []);

  const queueRetryJob = async () => {
    setBusyId('retry-queue');
    try {
      let parsedPayload: Record<string, any> = {};
      try {
        parsedPayload = JSON.parse(newRetryPayload || '{}');
      } catch {
        toast.error('Retry payload must be valid JSON');
        setBusyId(null);
        return;
      }
      const res = await adminService.enqueueRetryJob({
        type: newRetryType,
        payload: parsedPayload,
      });
      if (res.success) {
        toast.success('Retry job queued');
        fetchOpsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to queue retry job');
    } finally {
      setBusyId(null);
    }
  };

  const runRetry = async (jobId: string) => {
    setBusyId(jobId);
    try {
      const res = await adminService.runRetryJob(jobId);
      if (res.success) {
        toast.success('Retry job executed');
        fetchOpsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to run retry job');
    } finally {
      setBusyId(null);
    }
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Users', value: stats.totalUsers, icon: Users },
      { label: 'Sellers', value: stats.totalSellers, icon: UserCheck },
      { label: 'Banned', value: stats.bannedUsers, icon: Ban },
      { label: 'Products', value: stats.totalProducts, icon: Package },
      { label: 'Flagged', value: stats.flaggedProducts, icon: Flag },
      { label: 'Featured', value: stats.featuredProducts, icon: Star },
      { label: 'Orders', value: stats.totalOrders, icon: ShoppingCart },
      { label: 'Pending', value: stats.pendingOrders, icon: Clock },
      { label: 'Completed', value: stats.completedOrders, icon: CheckCircle },
      { label: 'Revenue', value: `GHS ${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp },
      { label: 'Disputes', value: stats.openDisputes, icon: AlertTriangle },
    ];
  }, [stats]);

  const handleToggleBan = async (user: User) => {
    setBusyId(user._id);
    try {
      const res = await adminService.setUserBanStatus(user._id, !user.isBanned);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? res.data.user : u)));
        toast.success(user.isBanned ? 'User unbanned' : 'User banned');
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVerifySeller = async (user: User) => {
    setBusyId(user._id);
    try {
      const res = await adminService.setSellerVerification(user._id, !user.isVerified);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? res.data.user : u)));
        toast.success(res.data.user.isVerified ? 'Seller verified' : 'Seller unverified');
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update seller verification');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (product: ProductPopulated) => {
    setBusyId(product._id);
    try {
      const res = await adminService.updateProductModeration(product._id, {
        isFeatured: !product.isFeatured,
      });
      if (res.success) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.product : p)));
        toast.success(res.data.product.isFeatured ? 'Product featured' : 'Product unfeatured');
        fetchStats();
      }
    } catch {
      toast.error('Failed to update featured status');
    } finally {
      setBusyId(null);
    }
  };

  const handleClearFlag = async (product: ProductPopulated) => {
    setBusyId(product._id);
    try {
      const res = await adminService.updateProductModeration(product._id, {
        isFlagged: false,
        flagReason: '',
      });
      if (res.success) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.product : p)));
        toast.success('Product flag cleared');
        fetchStats();
      }
    } catch {
      toast.error('Failed to clear product flag');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateDispute = async () => {
    if (!selectedDispute) return;
    setBusyId('dispute-update');
    try {
      const res = await adminService.updateDisputeStatus(selectedDispute._id, disputeStatus, adminNote);
      if (res.success) {
        setDisputes((prev) => prev.map((d) => (d._id === selectedDispute._id ? res.data.dispute : d)));
        toast.success('Dispute updated');
        setSelectedDispute(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update dispute');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <BulletinLayout title="Central Command" subtitle="System Administration" section="18">
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-12 w-12 border-4 border-black border-t-[#ff6b6b] animate-spin mb-4" />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Accessing Data...</div>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout title="Central Command" subtitle="Administration" section="18">
      {/* Tab bar */}
      <div className="border-b-4 border-black bg-[var(--bulletin-card)] sticky top-[72px] z-50">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                  activeTab === tab.value
                    ? 'bg-black text-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]'
                    : 'bg-transparent text-[var(--bulletin-text)] border-transparent opacity-40 hover:opacity-100 hover:border-black/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {statCards.map((card, idx) => (
                <BulletinCard 
                  key={card.label} 
                  rotation={(idx % 2 === 0 ? 1 : -1) * (Math.random() * 0.5)}
                  className="!p-6"
                >
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
                    <card.icon className="h-4 w-4" />
                    {card.label}
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-[var(--bulletin-text)]">{card.value}</p>
                </BulletinCard>
              ))}
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              <div className="relative">
                <div className="absolute -top-4 left-6 h-8 w-32 bg-[#ffd700]/40 rotate-[-2deg] z-10" />
                <BulletinCard rotation={-0.3} className="!p-0 border-2">
                  <div className="flex items-center justify-between border-b-2 border-black/10 px-6 py-5 bg-[#faf8f5] dark:bg-black/20">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-white">Moderation Queue</p>
                      <div className="mt-1 text-sm font-black uppercase text-black dark:text-white">Flagged Listings</div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={runAutomationSweep} disabled={runningAutomation} className="border-2 border-black bg-black text-white px-3 py-1.5 text-[9px] font-black uppercase hover:bg-[#ff6b6b] transition-all disabled:opacity-20">
                        {runningAutomation ? '...' : 'Sweep'}
                      </button>
                      <button onClick={fetchModerationQueue} className="border-2 border-black bg-white text-black px-3 py-1.5 text-[9px] font-black uppercase hover:bg-[#fffacd] transition-all">
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="divide-y-2 divide-black/5 max-h-[400px] overflow-auto">
                    {moderationQueue.products.length === 0 ? (
                      <p className="p-8 text-[12px] font-bold opacity-30 text-center uppercase tracking-widest">Board is Clean</p>
                    ) : moderationQueue.products.map((product) => (
                      <div key={product._id} className="p-6 hover:bg-black/5 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[13px] font-black uppercase text-[var(--bulletin-text)]">{product.title}</p>
                            <p className="mt-1 text-[11px] font-bold opacity-40 text-[var(--bulletin-text)]">
                              By {typeof product.seller === 'string' ? 'Unknown' : product.seller.name}
                            </p>
                            {product.flagReason && (
                              <div className="mt-3 bg-[#ff6b6b]/10 border-l-4 border-[#ff6b6b] p-2 text-[11px] font-bold text-[#ff6b6b]">
                                REASON: {product.flagReason}
                              </div>
                            )}
                          </div>
                          <button onClick={() => setActiveTab('products')} className="border-2 border-black bg-black text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-[#ff6b6b] transition-all">
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </BulletinCard>
              </div>

              <div className="relative">
                <div className="absolute -top-4 right-6 h-8 w-32 bg-[#fffacd]/40 rotate-[2deg] z-10" />
                <BulletinCard rotation={0.3} className="!p-0 border-2">
                  <div className="border-b-2 border-black/10 px-6 py-5 bg-[#e0f2f7] dark:bg-sky-900/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-sky-900 dark:text-sky-200">Open Disputes</p>
                    <div className="mt-1 text-sm font-black uppercase text-sky-900 dark:text-sky-200">System Conflicts</div>
                  </div>
                  <div className="divide-y-2 divide-black/5 max-h-[400px] overflow-auto">
                    {moderationQueue.disputes.length === 0 ? (
                      <p className="p-8 text-[12px] font-bold opacity-30 text-center uppercase tracking-widest">No Active Conflicts</p>
                    ) : moderationQueue.disputes.map((dispute) => (
                      <div key={dispute._id} className="p-6 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[13px] font-black uppercase text-[var(--bulletin-text)]">Order #{dispute.order.orderNumber}</p>
                            <p className="mt-1 text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-tighter">
                              {dispute.reason.replace(/_/g, ' ')}
                            </p>
                            <p className="mt-2 text-[11px] font-bold opacity-60 text-[var(--bulletin-text)] line-clamp-2 italic">
                              "{dispute.description}"
                            </p>
                          </div>
                          <button onClick={() => setActiveTab('disputes')} className="border-2 border-black bg-black text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-sky-500 transition-all">
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </BulletinCard>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Identity Registry</h3>
                <p className="text-[12px] font-bold opacity-40 text-[var(--bulletin-text)] uppercase tracking-widest">Manage Community Access</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 text-[var(--bulletin-text)]" />
                  <input 
                    value={userSearch} 
                    onChange={(e) => setUserSearch(e.target.value)} 
                    placeholder="Search by name or email..." 
                    className="w-full border-4 border-black bg-[var(--bulletin-card)] p-3 pl-12 text-[13px] font-black focus:outline-none text-[var(--bulletin-text)]" 
                  />
                </div>
                <button onClick={fetchUsers} className="border-4 border-black bg-black text-white px-6 py-3 text-[12px] font-black uppercase hover:bg-[#ff6b6b] transition-all">
                  Query
                </button>
              </div>
            </div>
            
            <div className="border-4 border-black bg-[var(--bulletin-card)] divide-y-4 divide-black/5 shadow-[12px_12px_0_0_var(--bulletin-shadow)]">
              {users.map((user) => (
                <div key={user._id} className="p-6 flex items-center justify-between gap-6 hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 border-4 border-black bg-[#ff6b6b] flex items-center justify-center text-white text-xl font-black">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[15px] font-black uppercase text-[var(--bulletin-text)]">{user.name}</p>
                      <p className="text-[11px] font-bold opacity-40 text-[var(--bulletin-text)]">{user.email} · {user.role}</p>
                      <div className="flex gap-2 mt-2">
                        {user.isVerified && (
                          <span className="text-[8px] border-2 border-black px-2 py-0.5 bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200 font-black uppercase tracking-widest">Verified</span>
                        )}
                        {user.isBanned && (
                          <span className="text-[8px] border-2 border-black px-2 py-0.5 bg-[#ff6b6b] text-white font-black uppercase tracking-widest">Banned</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {user.role === 'seller' && (
                      <button 
                        onClick={() => handleToggleVerifySeller(user)} 
                        disabled={busyId === user._id} 
                        className={`border-4 border-black px-4 py-2 text-[10px] font-black uppercase transition-all disabled:opacity-20 ${user.isVerified ? 'bg-white text-black' : 'bg-[#fffacd] text-black'}`}
                      >
                        {busyId === user._id ? '...' : user.isVerified ? 'Revoke Trust' : 'Verify Shop'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleToggleBan(user)} 
                      disabled={busyId === user._id} 
                      className={`border-4 border-black px-4 py-2 text-[10px] font-black uppercase transition-all disabled:opacity-20 ${user.isBanned ? 'bg-black text-white' : 'bg-[#ff6b6b] text-white'}`}
                    >
                      {busyId === user._id ? '...' : user.isBanned ? 'Lift Ban' : 'Suspend'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Manifest Review</h3>
                <p className="text-[12px] font-bold opacity-40 text-[var(--bulletin-text)] uppercase tracking-widest">Audit Active Board Listings</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <input 
                  value={productSearch} 
                  onChange={(e) => setProductSearch(e.target.value)} 
                  placeholder="Search listings..." 
                  className="w-full md:w-80 border-4 border-black bg-[var(--bulletin-card)] p-3 text-[13px] font-black focus:outline-none text-[var(--bulletin-text)]" 
                />
                <button onClick={fetchProducts} className="border-4 border-black bg-black text-white px-6 py-3 text-[12px] font-black uppercase hover:bg-[#ff6b6b] transition-all">
                  Query
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, idx) => (
                <BulletinCard 
                  key={product._id} 
                  rotation={(idx % 2 === 0 ? 0.5 : -0.5)}
                  className="group relative border-2"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 border-2 border-black ${product.isFlagged ? 'bg-[#ff6b6b] text-white' : 'bg-[#fffacd] text-black'}`}>
                      {product.status}
                    </div>
                    {product.isFeatured && (
                      <Star className="h-4 w-4 text-[#ff6b6b] fill-current" />
                    )}
                  </div>
                  
                  <h4 className="text-lg font-black uppercase tracking-tight text-[var(--bulletin-text)] mb-1 group-hover:text-[#ff6b6b] transition-colors">{product.title}</h4>
                  <p className="text-[12px] font-bold opacity-40 text-[var(--bulletin-text)] mb-4">
                    GHS {product.price.toFixed(2)} · By {typeof product.seller === 'string' ? 'Seller' : product.seller.name}
                  </p>
                  
                  {product.isFlagged && product.flagReason && (
                    <div className="mb-6 bg-[#ff6b6b]/10 border-l-4 border-[#ff6b6b] p-3 text-[11px] font-bold text-[#ff6b6b]">
                      FLAG: {product.flagReason}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggleFeatured(product)} 
                      disabled={busyId === product._id} 
                      className={`flex-1 border-2 border-black px-3 py-2 text-[9px] font-black uppercase transition-all ${product.isFeatured ? 'bg-white text-black' : 'bg-black text-white hover:bg-[#ff6b6b]'}`}
                    >
                      {busyId === product._id ? '...' : product.isFeatured ? 'Unfeature' : 'Promote'}
                    </button>
                    {product.isFlagged && (
                      <button 
                        onClick={() => handleClearFlag(product)} 
                        disabled={busyId === product._id} 
                        className="flex-1 border-2 border-black bg-white text-black px-3 py-2 text-[9px] font-black uppercase hover:bg-[#fffacd] transition-all"
                      >
                        {busyId === product._id ? '...' : 'Clear Flag'}
                      </button>
                    )}
                  </div>
                </BulletinCard>
              ))}
            </div>
          </div>
        )}

        {/* Disputes */}
        {activeTab === 'disputes' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Tribunal Console</h3>
                <p className="text-[12px] font-bold opacity-40 text-[var(--bulletin-text)] uppercase tracking-widest">Adjudicate Member Conflicts</p>
              </div>
              <button onClick={fetchDisputes} className="border-4 border-black bg-[var(--bulletin-card)] text-[var(--bulletin-text)] px-6 py-3 text-[11px] font-black uppercase hover:bg-[#fffacd] transition-all shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
                Sync Data
              </button>
            </div>

            <div className="space-y-6">
              {disputes.map((dispute, idx) => (
                <div 
                  key={dispute._id} 
                  className="relative group"
                  style={{ transform: `rotate(${(idx % 2 === 0 ? 0.3 : -0.3)}deg)` }}
                >
                  <div className="absolute -top-3 left-10 h-6 w-6 rounded-full bg-black/10 border-2 border-black shadow-inner z-10 hidden md:block" />
                  <div className="border-4 border-black bg-[var(--bulletin-card)] p-8 shadow-[12px_12px_0_0_var(--bulletin-shadow)] flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-black ${DISPUTE_STATUS_COLORS[dispute.status] || 'bg-white'}`}>
                          {dispute.status.replace('_', ' ')}
                        </span>
                        <span className="text-[12px] font-black text-[var(--bulletin-text)] uppercase opacity-30">Case ID: {dispute._id.slice(-8)}</span>
                        <Link to={`/orders/${dispute.order._id}`} className="text-[12px] font-black text-[#ff6b6b] uppercase underline decoration-2 underline-offset-4 hover:opacity-70 transition-all">
                          Order #{dispute.order.orderNumber}
                        </Link>
                      </div>

                      <h4 className="text-xl font-black uppercase text-[var(--bulletin-text)] mb-2">Issue: {dispute.reason.replace(/_/g, ' ')}</h4>
                      <p className="text-[14px] font-bold text-[var(--bulletin-text)] opacity-70 mb-6 italic border-l-4 border-black/10 pl-4">
                        "{dispute.description}"
                      </p>

                      <div className="grid grid-cols-2 gap-8 text-[11px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mb-8">
                        <div>
                          <p className="mb-1">Complainant</p>
                          <p className="text-black dark:text-white opacity-100">{dispute.raisedBy.name}</p>
                        </div>
                        <div>
                          <p className="mb-1">Respondent</p>
                          <p className="text-black dark:text-white opacity-100">{dispute.against.name}</p>
                        </div>
                      </div>

                      {dispute.adminNote && (
                        <div className="mb-8 p-4 bg-[#fffacd] dark:bg-yellow-900/20 border-2 border-black">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black dark:text-yellow-200 mb-2">Internal Admin Ledger</p>
                          <p className="text-[12px] font-bold text-black dark:text-white">{dispute.adminNote}</p>
                        </div>
                      )}

                      {dispute.evidence && dispute.evidence.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {dispute.evidence.map((item, i) => (
                            <a key={i} href={item} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-2 border-black bg-white text-black px-4 py-2 text-[10px] font-black uppercase hover:bg-sky-50 transition-all">
                              View Exhibit {i+1} <AlertTriangle className="h-4 w-4" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => { setSelectedDispute(dispute); setDisputeStatus(dispute.status); setAdminNote(dispute.adminNote || ''); }}
                      className="w-full md:w-40 border-4 border-black bg-black text-white px-6 py-4 text-[12px] font-black uppercase hover:bg-[#ff6b6b] transition-all shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]"
                    >
                      Intervene
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ops */}
        {activeTab === 'ops' && (
          <div className="space-y-12">
            <div className="relative">
              <div className="absolute -top-4 left-6 h-8 w-32 bg-[#ffd700]/40 rotate-[1deg] z-10" />
              <BulletinCard rotation={-0.3} className="border-2 p-8">
                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--bulletin-text)] mb-6">Manual Job Dispatch</h3>
                <div className="grid gap-6 md:grid-cols-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">System Scope</label>
                    <select value={newRetryType} onChange={(e) => setNewRetryType(e.target.value as any)} className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-3 text-[13px] font-black focus:outline-none text-[var(--bulletin-text)]">
                      <option value="notification">Notifications</option>
                      <option value="import">Data Import</option>
                      <option value="payment">Financials</option>
                      <option value="moderation">Moderation</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">JSON Payload</label>
                    <input 
                      value={newRetryPayload} 
                      onChange={(e) => setNewRetryPayload(e.target.value)} 
                      className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-3 text-[13px] font-black focus:outline-none text-[var(--bulletin-text)]" 
                    />
                  </div>
                  <button 
                    onClick={queueRetryJob} 
                    disabled={busyId === 'retry-queue'} 
                    className="border-4 border-black bg-black text-white px-8 py-3.5 text-[12px] font-black uppercase hover:bg-[#ff6b6b] transition-all disabled:opacity-20"
                  >
                    {busyId === 'retry-queue' ? '...' : 'Queue Dispatch'}
                  </button>
                </div>
              </BulletinCard>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              <div className="relative">
                <BulletinCard rotation={0.2} className="!p-0 border-2">
                  <div className="border-b-2 border-black/10 px-6 py-5 bg-[#faf8f5] dark:bg-black/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-white">Active Retry Queue</p>
                  </div>
                  <div className="divide-y-2 divide-black/5 max-h-[500px] overflow-auto">
                    {retryJobs.map((job) => (
                      <div key={job._id} className="p-6 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[13px] font-black uppercase text-[var(--bulletin-text)]">{job.type}</p>
                          <p className="text-[11px] font-bold opacity-40 text-[var(--bulletin-text)] mt-1">
                            Status: <span className="text-sky-600">{job.status}</span> · Attempts {job.attempts}/{job.maxAttempts}
                          </p>
                        </div>
                        <button 
                          onClick={() => runRetry(job._id)} 
                          disabled={busyId === job._id} 
                          className="border-2 border-black bg-black text-white px-4 py-2 text-[9px] font-black uppercase hover:bg-[#ff6b6b] transition-all disabled:opacity-20"
                        >
                          {busyId === job._id ? '...' : 'Force Run'}
                        </button>
                      </div>
                    ))}
                  </div>
                </BulletinCard>
              </div>

              <div className="relative">
                <BulletinCard rotation={-0.2} className="!p-0 border-2">
                  <div className="border-b-2 border-black/10 px-6 py-5 bg-[#e0f2f7] dark:bg-sky-900/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-sky-900 dark:text-sky-200">System Audit Logs</p>
                  </div>
                  <div className="divide-y-2 divide-black/5 max-h-[500px] overflow-auto no-scrollbar">
                    {opsAuditLogs.map((log) => (
                      <div key={log._id} className="p-6 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-[13px] font-black uppercase text-[var(--bulletin-text)]">{log.action.replace(/_/g, ' ')}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 border-2 border-black ${log.status === 'success' ? 'bg-[#fffacd] text-black' : 'bg-[#ff6b6b] text-white'}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold opacity-40 text-[var(--bulletin-text)] mt-2">
                          Scope: {log.scope} · {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </BulletinCard>
              </div>
            </div>
          </div>
        )}
      </BulletinSection>

      {/* Dispute Management Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="border-4 border-black bg-[var(--bulletin-card)] w-full max-w-xl shadow-[16px_16px_0_0_rgba(0,0,0,0.5)] relative overflow-hidden" style={{ transform: 'rotate(-0.5deg)' }}>
            {/* Modal Tape */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-8 w-40 bg-[#ff6b6b]/60 rotate-[1deg] z-10" />
            
            <div className="p-8 border-b-4 border-black bg-[#faf8f5] dark:bg-black/20 flex justify-between items-end pt-16">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Tribunal Intervene</p>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Manage Dispute</h2>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="h-10 w-10 border-4 border-black bg-white flex items-center justify-center hover:bg-[#ff6b6b] hover:text-white transition-all text-xl font-black">✕</button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="bg-[#fffacd] dark:bg-yellow-900/20 p-6 border-4 border-black">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 text-black dark:text-yellow-200 mb-3">Case Context</p>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-black uppercase text-black dark:text-white">Order #{selectedDispute.order.orderNumber}</p>
                  <p className="text-sm font-black text-[#ff6b6b]">GHS {selectedDispute.order.totalAmount.toFixed(2)}</p>
                </div>
                <div className="h-0.5 bg-black/10 my-4" />
                <div className="grid grid-cols-2 gap-4 text-[11px] font-bold text-black dark:text-white/70">
                  <p>RAISED BY: <span className="text-black dark:text-white font-black">{selectedDispute.raisedBy.name}</span></p>
                  <p>AGAINST: <span className="text-black dark:text-white font-black">{selectedDispute.against.name}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 text-[var(--bulletin-text)]">Adjudication Status</label>
                <select 
                  value={disputeStatus} 
                  onChange={(e) => setDisputeStatus(e.target.value)} 
                  className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-4 text-[13px] font-black focus:outline-none text-[var(--bulletin-text)]"
                >
                  <option value="open">Open Case</option>
                  <option value="under_review">Under Active Review</option>
                  <option value="resolved">Mark Resolved</option>
                  <option value="closed">Close (Dismissed)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 text-[var(--bulletin-text)]">Administrative Verdict</label>
                <textarea 
                  value={adminNote} 
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-4 text-[13px] font-black focus:outline-none min-h-[120px] resize-none text-[var(--bulletin-text)]"
                  placeholder="Enter detailed resolution notes for the ledger..." 
                />
              </div>
            </div>

            <div className="p-8 border-t-4 border-black flex justify-end gap-4 bg-[#faf8f5] dark:bg-black/20">
              <button 
                onClick={() => setSelectedDispute(null)} 
                className="border-4 border-black bg-white text-black px-6 py-3 text-[12px] font-black uppercase hover:bg-[#e0f2f7] transition-all"
              >
                Decline
              </button>
              <button 
                onClick={handleUpdateDispute} 
                disabled={busyId === 'dispute-update'} 
                className="border-4 border-black bg-black text-white px-8 py-3 text-[12px] font-black uppercase hover:bg-[#ff6b6b] transition-all disabled:opacity-20 shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]"
              >
                {busyId === 'dispute-update' ? '...' : 'Apply Verdict'}
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default AdminDashboard;