import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Trash2,
  Circle,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chat.service';
import { Conversation } from '../types';
import { LoadingSpinner } from '../components/ui';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onlineUsers, onConversationUpdated } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convToDelete, setConvToDelete] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success) setConversations(res.data.conversations);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    
    // Auto-start Support Chat if requested via query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('support') === 'true') {
      const startSupport = async () => {
        try {
          const res = await chatService.getAiUser();
          if (res.success) {
            const convRes = await chatService.getOrCreateConversation(res.data.userId);
            if (convRes.success) {
              navigate(`/messages/${convRes.data.conversation._id}`, { replace: true });
            }
          }
        } catch (err) {
          console.error('Failed to start AI support:', err);
        }
      };
      startSupport();
    }
  }, [fetchConversations, navigate]);

  useEffect(() => {
    const unsub = onConversationUpdated((updatedConv) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === updatedConv._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedConv;
          next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          return next;
        }
        return [updatedConv, ...prev];
      });
    });
    return unsub;
  }, [onConversationUpdated]);

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConvToDelete(conversationId);
  };

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p._id !== user?._id) || conv.participants[0];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const other = getOtherParticipant(conv);
    const query = searchQuery.toLowerCase();
    return (
      other.name.toLowerCase().includes(query) ||
      conv.product?.title?.toLowerCase().includes(query) ||
      conv.lastMessage?.content?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <LoadingSpinner text="Loading messages..." fullScreen />;
  }

  return (
    <BulletinLayout title="Messages" subtitle="My Chats" section="07">
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Search */}
        {conversations.length > 0 && (
          <div className="relative mb-6 border-b border-[var(--bulletin-border)] pb-3">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-4 py-2 bg-transparent text-[12px] font-bold focus:outline-none placeholder:text-[var(--bulletin-muted)]"
            />
          </div>
        )}

        {/* Conversation List */}
        {filteredConversations.length === 0 ? (
          <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-12 text-center shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
            <MessageSquare className="h-12 w-12 mx-auto opacity-40 mb-4" />
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">
              {searchQuery ? 'No results' : 'Empty'}
            </div>
            <div className="text-lg font-bold mb-4">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </div>
            <div className="text-[12px] opacity-60 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Message a seller on an item to start a chat'}
            </div>
            {!searchQuery && (
              <button
                onClick={() => navigate('/products')}
                className="inline-block border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] transition-colors hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] shadow-[2px_2px_0_0_var(--bulletin-shadow)]"
              >
                Browse Items
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isOnline = onlineUsers.has(other._id);
              const hasUnread = (conv.unreadCount || 0) > 0;

              return (
                <Link
                  key={conv._id}
                  to={`/messages/${conv._id}`}
                  className={`block border border-[var(--bulletin-border)] p-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] ${
                    hasUnread ? 'bg-[#fffacd] dark:bg-yellow-900/20' : 'bg-[var(--bulletin-card)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {other.avatar ? (
                        <div className="w-10 h-10 border border-[var(--bulletin-border)] overflow-hidden">
                          <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 border border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center font-bold text-sm text-[var(--bulletin-text)]">
                          {other.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border border-[var(--bulletin-border)] bg-green-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className={`text-[12px] truncate ${hasUnread ? 'font-bold' : 'font-bold'}`}>
                          {other.name}
                          {other.isVerified && <span className="ml-1 text-[10px] opacity-60">&#10003;</span>}
                        </div>
                        {conv.lastMessage && (
                          <span className="text-[10px] opacity-50 flex-shrink-0">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.product && (
                        <div className="flex items-center gap-1 text-[10px] opacity-50 mb-0.5">
                          <Package className="h-3 w-3" />
                          <span className="truncate">{conv.product.title}</span>
                        </div>
                      )}
                      {conv.lastMessage ? (
                        <div className={`text-[11px] truncate ${hasUnread ? 'font-bold' : 'opacity-70'}`}>
                          {conv.lastMessage.type === 'system'
                            ? conv.lastMessage.content
                            : conv.lastMessage.sender === user?._id
                            ? `You: ${conv.lastMessage.content}`
                            : conv.lastMessage.content}
                        </div>
                      ) : (
                        <div className="text-[11px] opacity-40 italic">No messages yet</div>
                      )}
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasUnread && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] text-[9px] font-bold">
                          {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteClick(e, conv._id)}
                        disabled={deletingId === conv._id}
                        className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-1 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-[#fce4ec] dark:hover:bg-red-900/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <ChevronRight className="h-4 w-4 opacity-30" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </BulletinSection>
      {/* ── CUSTOM CONFIRM MODAL ── */}
      {convToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="border-4 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[16px_16px_0_0_var(--bulletin-shadow)] max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--bulletin-text)] mb-3">Delete Chat?</h3>
            <p className="text-xs font-bold text-[var(--bulletin-text)] opacity-60 mb-6 font-mono leading-relaxed">
              Are you sure you want to permanently delete this conversation? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-none transition-all text-[var(--bulletin-text)]"
                onClick={() => setConvToDelete(null)}
              >
                Discard
              </button>
              <button
                className="flex-1 border-2 border-black dark:border-white bg-[#ff6b6b] text-white py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-none transition-all"
                onClick={async () => {
                  const id = convToDelete;
                  setConvToDelete(null);
                  setDeletingId(id);
                  try {
                    await chatService.deleteConversation(id);
                    setConversations((prev) => prev.filter((c) => c._id !== id));
                    toast.success('Conversation deleted');
                  } catch {
                    toast.error('Failed to delete conversation');
                  } finally {
                    setDeletingId(null);
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default Messages;