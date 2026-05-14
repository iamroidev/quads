import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui';
import notificationService from '../services/notification.service';
import { NotificationItem, PaginationInfo } from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const fetchNotifications = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(targetPage, 20);
      if (res.success) {
        setNotifications(res.data.notifications);
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
        );
      }
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark all notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((item) => item._id !== id));
      }
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    try {
      const res = await notificationService.subscribeToPush();
      if (res.success) {
        toast.success('Browser notifications enabled!');
      }
    } catch (err: any) {
      console.error('Push subscription error:', err);
      toast.error(err.message || 'Failed to enable notifications');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading && page === 1) {
    return <LoadingSpinner text="Loading notifications..." fullScreen />;
  }

  return (
    <BulletinLayout title="Notifications" subtitle="Inbox" section="08">
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b-4 border-[var(--bulletin-border)] pb-4 gap-4">
          <div className="text-[12px] font-black uppercase tracking-widest opacity-60 text-[var(--bulletin-text)]">
            {pagination ? `${pagination.total} notification${pagination.total !== 1 ? 's' : ''}` : ''}
          </div>
          <div className="flex gap-4">
            {pushSupported && (
              <button
                onClick={handleEnablePush}
                disabled={isSubscribing}
                className="border-4 border-[var(--bulletin-border)] bg-blue-500 text-white px-4 py-2 text-[10px] font-black uppercase shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all"
              >
                {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
              </button>
            )}
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-black uppercase shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all text-[var(--bulletin-text)]"
            >
              <CheckCheck className="inline-block h-4 w-4 mr-2" />
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/40 p-16 text-center shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.5deg)' }}>
            <Bell className="h-16 w-16 mx-auto opacity-40 mb-6 text-[var(--bulletin-text)]" />
            <div className="text-[12px] font-black uppercase tracking-widest opacity-60 mb-2 text-[var(--bulletin-text)]">All clear</div>
            <div className="text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">No notifications yet</div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`border-4 border-[var(--bulletin-border)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-colors ${
                  item.isRead ? 'bg-[var(--bulletin-card)]' : 'bg-[#fffacd] dark:bg-yellow-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {!item.isRead && (
                      <div className="w-3 h-3 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] mb-3" />
                    )}
                    <div className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">{item.title}</div>
                    <div className="text-[12px] font-bold opacity-80 mt-2 text-[var(--bulletin-text)]">{item.message}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-4 text-[var(--bulletin-text)]">
                      {new Date(item.createdAt).toLocaleString('en-GH')}
                    </div>
                    {item.link && (
                      <Link
                        to={item.link}
                        className="inline-block mt-4 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all"
                      >
                        View details
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 text-[10px] font-black uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="border-2 border-[var(--bulletin-border)] bg-[#fce4ec] dark:bg-red-900/40 p-2 text-[10px] font-black uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-12 pt-8 border-t-4 border-[var(--bulletin-border)]">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-3 text-[12px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all text-[var(--bulletin-text)]"
            >
              Previous
            </button>
            <span className="text-[12px] font-black uppercase tracking-widest opacity-60 text-[var(--bulletin-text)]">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page >= pagination.pages || loading}
              className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-3 text-[12px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all text-[var(--bulletin-text)]"
            >
              Next
            </button>
          </div>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Notifications;