
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

  if (loading && page === 1) {
    return <LoadingSpinner text="Loading notifications..." fullScreen />;
  }

  return (
    <BulletinLayout title="Notifications" subtitle="Inbox" section="08">
      <BulletinSection bgColor="bg-[#faf8f5]">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 border-b border-black pb-3">
          <div className="text-[10px] uppercase tracking-wider opacity-60">
            {pagination ? `${pagination.total} notification${pagination.total !== 1 ? 's' : ''}` : ''}
          </div>
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="border border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all"
          >
            <CheckCheck className="inline-block h-3 w-3 mr-1" />
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="border border-black bg-[#fffacd] p-12 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <Bell className="h-12 w-12 mx-auto opacity-40 mb-4" />
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">All clear</div>
            <div className="text-lg font-bold mb-2">No notifications yet</div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`border border-black p-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                  item.isRead ? 'bg-white' : 'bg-[#fffacd]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {!item.isRead && (
                      <div className="w-2 h-2 border border-black bg-black mb-2" />
                    )}
                    <div className="text-[12px] font-bold">{item.title}</div>
                    <div className="text-[12px] opacity-70 mt-1">{item.message}</div>
                    <div className="text-[10px] opacity-50 mt-2">
                      {new Date(item.createdAt).toLocaleString('en-GH')}
                    </div>
                    {item.link && (
                      <Link
                        to={item.link}
                        className="inline-block mt-2 border border-black bg-white px-2 py-0.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                      >
                        View details
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        className="border border-black bg-white p-1.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="border border-black bg-white p-1.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:bg-[#fce4ec] transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-black">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <span className="text-[10px] font-bold uppercase opacity-60">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page >= pagination.pages || loading}
              className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all"
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