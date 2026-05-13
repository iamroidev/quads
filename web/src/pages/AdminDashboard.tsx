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
      <BulletinLayout title="Admin Dashboard" subtitle="Administration" section="18">
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-black" />
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout title="Admin Dashboard" subtitle="Administration" section="18">
      {/* Tab bar */}
      <div className="border-b border-black bg-white">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeTab === tab.value
                    ? 'border-black text-black'
                    : 'border-transparent opacity-40 hover:opacity-70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[#faf8f5]">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px border border-black bg-black">
              {statCards.map((card) => (
                <div key={card.label} className="bg-white p-5">
                  <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider opacity-50">
                    <card.icon className="h-3.5 w-3.5" />
                    {card.label}
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <BulletinCard rotation={-0.3} bgColor="bg-white" className="!p-0 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between border-b border-black px-5 py-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Moderation queue</p>
                    <div className="mt-1 text-sm font-bold">Flagged listings</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={runAutomationSweep} disabled={runningAutomation} className="border border-black bg-white px-2.5 py-1.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all">
                      {runningAutomation ? 'Running...' : 'Run sweep'}
                    </button>
                    <button onClick={fetchModerationQueue} className="border border-black bg-white px-2.5 py-1.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-black/20">
                  {moderationQueue.products.length === 0 ? (
                    <p className="p-5 text-[12px] opacity-50">No flagged listings waiting.</p>
                  ) : moderationQueue.products.map((product) => (
                    <div key={product._id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[12px] font-bold">{product.title}</p>
                          <p className="mt-1 text-[11px] opacity-50">{typeof product.seller === 'string' ? 'Seller' : product.seller.name}</p>
                          {product.flagReason && (
                            <p className="mt-2 text-[11px] text-red-600">Reason: {product.flagReason}</p>
                          )}
                        </div>
                        <button onClick={() => setActiveTab('products')} className="border border-black bg-black px-2.5 py-1 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </BulletinCard>

              <BulletinCard rotation={0.3} bgColor="bg-white" className="!p-0 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                <div className="border-b border-black px-5 py-4">
                  <p className="text-[10px] uppercase tracking-wider opacity-50">Moderation queue</p>
                  <div className="mt-1 text-sm font-bold">Open disputes</div>
                </div>
                <div className="divide-y divide-black/20">
                  {moderationQueue.disputes.length === 0 ? (
                    <p className="p-5 text-[12px] opacity-50">No active disputes in queue.</p>
                  ) : moderationQueue.disputes.map((dispute) => (
                    <div key={dispute._id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[12px] font-bold">#{dispute.order.orderNumber}</p>
                          <p className="mt-1 text-[11px] opacity-50">{dispute.reason.replace(/_/g, ' ')}</p>
                          <p className="mt-2 text-[11px] opacity-70 line-clamp-2">{dispute.description}</p>
                        </div>
                        <button onClick={() => setActiveTab('disputes')} className="border border-black bg-black px-2.5 py-1 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </BulletinCard>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
              <div className="text-sm font-bold uppercase tracking-wider opacity-60">User Management</div>
              <div className="flex gap-2">
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users" className={fieldBase} />
                <button onClick={fetchUsers} className="border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">Search</button>
              </div>
            </div>
            <div className="border border-black divide-y divide-black/20 bg-white">
              {users.map((user) => (
                <div key={user._id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold">{user.name}</p>
                    <p className="text-[10px] opacity-50 mt-0.5">{user.email} &middot; {user.role}</p>
                    <div className="flex gap-2 mt-1.5">
                      {user.isVerified && (
                        <span className="text-[9px] border border-black px-1.5 py-0.5 bg-[#fffacd] font-bold uppercase">Verified</span>
                      )}
                      {user.isBanned && (
                        <span className="text-[9px] border border-black px-1.5 py-0.5 bg-[#fce4ec] font-bold uppercase">Banned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.role === 'seller' && (
                      <button onClick={() => handleToggleVerifySeller(user)} disabled={busyId === user._id} className="border border-black bg-black px-2.5 py-1.5 text-[8px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black disabled:opacity-40">
                        {busyId === user._id ? '...' : user.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    )}
                    <button onClick={() => handleToggleBan(user)} disabled={busyId === user._id} className="border border-black bg-[#fce4ec] px-2.5 py-1.5 text-[8px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all">
                      {busyId === user._id ? '...' : user.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
              <div className="text-sm font-bold uppercase tracking-wider opacity-60">Product Moderation</div>
              <div className="flex gap-2">
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products" className={fieldBase} />
                <button onClick={fetchProducts} className="border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">Search</button>
              </div>
            </div>
            <div className="border border-black divide-y divide-black/20 bg-white">
              {products.map((product) => (
                <div key={product._id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold">{product.title}</p>
                    <p className="text-[10px] opacity-50 mt-0.5">
                      GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })} &middot;{' '}
                      {typeof product.seller === 'string' ? 'Seller' : product.seller.name}
                    </p>
                    <div className="flex gap-2 mt-1.5">
                      {product.isFlagged && (
                        <span className="text-[9px] border border-black px-1.5 py-0.5 bg-[#fce4ec] font-bold uppercase">Flagged</span>
                      )}
                      {product.isFeatured && (
                        <span className="text-[9px] border border-black px-1.5 py-0.5 bg-[#fffacd] font-bold uppercase">Featured</span>
                      )}
                      <span className="text-[9px] border border-black px-1.5 py-0.5 bg-[#f0e8f4] font-bold uppercase capitalize">{product.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleFeatured(product)} disabled={busyId === product._id} className="border border-black bg-black px-2.5 py-1.5 text-[8px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black disabled:opacity-40">
                      {busyId === product._id ? '...' : product.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    {product.isFlagged && (
                      <button onClick={() => handleClearFlag(product)} disabled={busyId === product._id} className="border border-black bg-white px-2.5 py-1.5 text-[8px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all">
                        {busyId === product._id ? '...' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
              <div className="text-sm font-bold uppercase tracking-wider opacity-60">Order Monitoring</div>
              <div className="flex gap-2">
                <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search order number" className={fieldBase} />
                <button onClick={fetchOrders} className="border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">Search</button>
              </div>
            </div>
            <div className="border border-black divide-y divide-black/20 bg-white">
              {orders.map((order) => (
                <div key={order._id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Link to={`/orders/${order._id}`} className="text-[12px] font-bold hover:underline">#{order.orderNumber}</Link>
                      <p className="text-[10px] opacity-50 mt-0.5">
                        Buyer: {order.buyer.name} &middot; Seller: {order.seller.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] opacity-50 capitalize mt-0.5">{order.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="p-4 text-[12px] opacity-50">No orders found.</p>}
            </div>
          </div>
        )}

        {/* Disputes */}
        {activeTab === 'disputes' && (
          <div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
              <div className="text-sm font-bold uppercase tracking-wider opacity-60">Dispute Center</div>
              <button onClick={fetchDisputes} className="border border-black bg-white px-3 py-1.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">Refresh</button>
            </div>
            <div className="border border-black divide-y divide-black/20 bg-white">
              {disputes.map((dispute) => (
                <div key={dispute._id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-black ${DISPUTE_STATUS_COLORS[dispute.status] || 'bg-white'}`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                      <Link to={`/orders/${dispute.order._id}`} className="text-[11px] font-bold hover:underline">
                        Order #{dispute.order.orderNumber}
                      </Link>
                    </div>
                    <p className="text-[12px] font-bold mt-2">Reason: {dispute.reason}</p>
                    <p className="text-[12px] opacity-70 mt-1 line-clamp-2">{dispute.description}</p>
                    <p className="text-[10px] opacity-50 mt-2">
                      Raised by {dispute.raisedBy.name} against {dispute.against.name}
                      <br/>
                      <span className="text-[9px] uppercase tracking-wider mt-1 block">
                        {new Date(dispute.createdAt).toLocaleString()}
                      </span>
                    </p>
                    {dispute.adminNote && (
                      <div className="mt-3 p-3 bg-[#faf8f5] border-l-2 border-black text-[11px]">
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1">Admin Note</p>
                        <p>{dispute.adminNote}</p>
                      </div>
                    )}
                    {dispute.evidence && dispute.evidence.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {dispute.evidence.map((item, index) => (
                          <a key={`${dispute._id}-evidence-${index}`} href={item} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 border border-black px-2 py-1 text-[9px] font-bold uppercase hover:bg-[#f0e8f4] transition-colors">
                            Evidence <AlertTriangle className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setSelectedDispute(dispute); setDisputeStatus(dispute.status); setAdminNote(dispute.adminNote || ''); }}
                    className="border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black flex-shrink-0">
                    Manage
                  </button>
                </div>
              ))}
              {disputes.length === 0 && <p className="p-4 text-[12px] opacity-50">No disputes found.</p>}
            </div>
          </div>
        )}

        {/* Ops */}
        {activeTab === 'ops' && (
          <div className="space-y-8">
            <BulletinCard rotation={-0.3} bgColor="bg-white">
              <div className="text-sm font-bold uppercase tracking-wider mb-3">Queue Retry Job</div>
              <div className="grid gap-2 sm:grid-cols-3">
                <select value={newRetryType} onChange={(e) => setNewRetryType(e.target.value as any)} className={fieldBase}>
                  <option value="notification">notification</option>
                  <option value="import">import</option>
                  <option value="payment">payment</option>
                  <option value="moderation">moderation</option>
                </select>
                <input value={newRetryPayload} onChange={(e) => setNewRetryPayload(e.target.value)} className={`${fieldBase} sm:col-span-2`} />
              </div>
              <button onClick={queueRetryJob} disabled={busyId === 'retry-queue'} className="mt-3 border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black disabled:opacity-40">
                {busyId === 'retry-queue' ? '...' : 'Queue Job'}
              </button>
            </BulletinCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <BulletinCard rotation={0.3} bgColor="bg-white" className="!p-0 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                <div className="border-b border-black px-5 py-4">
                  <div className="text-sm font-bold uppercase tracking-wider">Retry Jobs</div>
                </div>
                <div className="divide-y divide-black/20">
                  {retryJobs.length === 0 ? (
                    <p className="p-4 text-[12px] opacity-50">No retry jobs yet.</p>
                  ) : retryJobs.map((job) => (
                    <div key={job._id} className="p-4 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase">{job.type}</p>
                        <p className="text-[10px] opacity-50 mt-0.5">{job.status} · attempts {job.attempts}/{job.maxAttempts}</p>
                      </div>
                      <button onClick={() => runRetry(job._id)} disabled={busyId === job._id} className="border border-black bg-white px-2.5 py-1 text-[8px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all">
                        {busyId === job._id ? '...' : 'Run'}
                      </button>
                    </div>
                  ))}
                </div>
              </BulletinCard>

              <BulletinCard rotation={-0.3} bgColor="bg-white" className="!p-0 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                <div className="border-b border-black px-5 py-4">
                  <div className="text-sm font-bold uppercase tracking-wider">Audit Logs</div>
                </div>
                <div className="divide-y divide-black/20 max-h-[480px] overflow-auto">
                  {opsAuditLogs.length === 0 ? (
                    <p className="p-4 text-[12px] opacity-50">No audit logs yet.</p>
                  ) : opsAuditLogs.map((log) => (
                    <div key={log._id} className="p-4">
                      <p className="text-[11px] font-bold uppercase">{log.action}</p>
                      <p className="text-[10px] opacity-50 mt-1">{log.scope} · {log.status} · {new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </BulletinCard>
            </div>
          </div>
        )}
      </BulletinSection>

      {/* Dispute Management Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="border border-black bg-white w-full max-w-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <div className="p-5 border-b border-black flex justify-between items-center">
              <div className="flex items-center gap-2 text-base font-bold uppercase">
                <AlertTriangle className="w-5 h-5" />
                Manage Dispute
              </div>
              <button onClick={() => setSelectedDispute(null)} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
            </div>
            
            <div className="p-5">
              <div className="mb-6 bg-[#faf8f5] p-4 border border-black">
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-2">Order Info</p>
                <p className="text-[12px] font-bold">Order #{selectedDispute.order.orderNumber}</p>
                <p className="text-[12px] opacity-70">Amount: GHS {selectedDispute.order.totalAmount.toFixed(2)}</p>
                <div className="h-px bg-black/20 my-3" />
                <p className="text-[12px]"><span className="opacity-50">Raised By:</span> {selectedDispute.raisedBy.name}</p>
                <p className="text-[12px] mt-1"><span className="opacity-50">Against:</span> {selectedDispute.against.name}</p>
              </div>

              <div className="mb-5">
                <label className="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-2">Update Status</label>
                <select value={disputeStatus} onChange={(e) => setDisputeStatus(e.target.value)} className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black">
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed (No Action)</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-2">Admin Note</label>
                <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black resize-none min-h-[100px]"
                  placeholder="Enter resolution details..." />
              </div>
            </div>

            <div className="p-5 border-t border-black flex justify-end gap-3 bg-[#faf8f5]">
              <button onClick={() => setSelectedDispute(null)} className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">Cancel</button>
              <button onClick={handleUpdateDispute} disabled={busyId === 'dispute-update'} className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black disabled:opacity-40">
                {busyId === 'dispute-update' ? '...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default AdminDashboard;