import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Circle,
  Package,
  MoreVertical,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chat.service';
import { MessagePopulated, Conversation } from '../types';
import { LoadingSpinner } from '../components/ui';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const ChatRoom: React.FC = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage: socketSendMessage,
    markAsRead: socketMarkAsRead,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
  } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessagePopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferPanel, setShowOfferPanel] = useState(false);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});
  const [respondingOffer, setRespondingOffer] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const fetchData = async () => {
      try {
        const convsRes = await chatService.getConversations();
        const conv = convsRes.data.conversations.find((c) => c._id === conversationId);
        if (conv) setConversation(conv);
        const msgsRes = await chatService.getMessages(conversationId, 1, 50);
        setMessages(msgsRes.data.messages);
        setHasMore(msgsRes.data.pagination.page < msgsRes.data.pagination.pages);
        setPage(1);
      } catch (err) {
        toast.error('Failed to load conversation');
        navigate('/messages');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [conversationId, navigate]);

  useEffect(() => {
    if (!conversationId || loading) return;
    joinConversation(conversationId);
    socketMarkAsRead(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, loading, joinConversation, leaveConversation, socketMarkAsRead]);

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom(false);
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsub = onNewMessage((message) => {
      if (message.conversation === conversationId) {
        setMessages((prev) => [...prev, message]);
        socketMarkAsRead(conversationId!);
        setTimeout(() => scrollToBottom(), 50);
      }
    });
    return unsub;
  }, [conversationId, onNewMessage, socketMarkAsRead, scrollToBottom]);

  useEffect(() => {
    const unsub = onMessageRead((data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (!msg.readBy.includes(data.userId)) {
              return { ...msg, readBy: [...msg.readBy, data.userId] };
            }
            return msg;
          })
        );
      }
    });
    return unsub;
  }, [conversationId, onMessageRead]);

  useEffect(() => {
    let typingTimeout: ReturnType<typeof setTimeout>;
    const unsubStart = onTypingStart((data) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTypingUser(data.userName);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => setTypingUser(null), 3000);
      }
    });
    const unsubStop = onTypingStop((data) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) setTypingUser(null);
    });
    return () => { unsubStart(); unsubStop(); clearTimeout(typingTimeout); };
  }, [conversationId, user?._id, onTypingStart, onTypingStop]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMore = async () => {
    if (!conversationId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await chatService.getMessages(conversationId, nextPage, 50);
      setMessages((prev) => [...res.data.messages, ...prev]);
      setPage(nextPage);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId || sending) return;
    const content = inputValue.trim();
    setInputValue('');
    setSending(true);
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); stopTyping(conversationId); }
    try {
      socketSendMessage(conversationId, content);
    } catch {
      toast.error('Failed to send message');
      setInputValue(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const sendOffer = async () => {
    if (!conversationId) return;
    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid offer amount');
      return;
    }
    try {
      await chatService.sendMessage(conversationId, `Offer: GHS ${amount.toFixed(2)}`, 'text', {
        offer: { amount, status: 'pending' },
      });
      setOfferAmount('');
      setShowOfferPanel(false);
      toast.success('Offer sent!');
    } catch {
      toast.error('Failed to send offer');
    }
  };

  const handleRespondToOffer = async (
    msgId: string,
    status: 'accepted' | 'rejected' | 'countered'
  ) => {
    if (!conversationId || respondingOffer) return;
    const counterAmount =
      status === 'countered' ? Number(counterAmounts[msgId] || 0) : undefined;
    if (status === 'countered' && (!counterAmount || counterAmount <= 0)) {
      toast.error('Enter a valid counter amount');
      return;
    }
    setRespondingOffer(msgId);
    try {
      await chatService.respondToOffer(conversationId, msgId, status, counterAmount);
      // Optimistically update the message offer status in state
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msgId && m.offer
            ? { ...m, offer: { ...m.offer, status } }
            : m
        )
      );
      toast.success(
        status === 'accepted'
          ? '✅ Offer accepted!'
          : status === 'rejected'
          ? 'Offer declined'
          : 'Counter-offer sent!'
      );
      setCounterAmounts((prev) => { const n = { ...prev }; delete n[msgId]; return n; });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond to offer');
    } finally {
      setRespondingOffer(null);
    }
  };

  const sendQuickReply = async (label: string) => {
    if (!conversationId) return;
    try {
      await chatService.sendMessage(conversationId, label, 'text', { quickReplyLabel: label });
    } catch {
      toast.error('Failed to send quick reply');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!conversationId) return;
    startTyping(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(conversationId), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = async () => {
    if (!conversationId) return;
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await chatService.deleteConversation(conversationId);
      toast.success('Conversation deleted');
      navigate('/messages');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const otherParticipant = conversation?.participants.find((p) => p._id !== user?._id);
  const isOtherOnline = otherParticipant ? onlineUsers.has(otherParticipant._id) : false;

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <LoadingSpinner text="Loading conversation..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-[var(--bulletin-bg)] text-[var(--bulletin-text)]">
      {/* Bulletin Sticky Header */}
      <div className="sticky top-0 z-50 flex items-stretch border-b border-[var(--bulletin-border)] bg-[var(--bulletin-bg)]">
        <div className="flex-1 border-r border-[var(--bulletin-border)] bg-[#fff5e1] dark:bg-yellow-900/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/messages')} className="hover:underline text-black dark:text-yellow-200">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-[10px] uppercase tracking-wider opacity-40 text-black dark:text-yellow-200/60">Chat</span>
          </div>
        </div>
        <div className="flex-1 border-r border-[var(--bulletin-border)] bg-[#e8f4f8] dark:bg-sky-900/10 px-3 py-2">
          {otherParticipant && (
            <div className="flex items-center gap-2">
              {otherParticipant.avatar ? (
                <div className="w-6 h-6 border border-[var(--bulletin-border)] overflow-hidden flex-shrink-0">
                  <img src={otherParticipant.avatar} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-6 h-6 border border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-sky-900 dark:text-sky-200">
                  {otherParticipant.name.charAt(0)}
                </div>
              )}
              <span className="overflow-hidden text-ellipsis whitespace-nowrap font-bold text-[12px] text-sky-900 dark:text-sky-200">
                {otherParticipant.name}
              </span>
              {isOtherOnline && <div className="h-2 w-2 border border-[var(--bulletin-border)] bg-green-400 flex-shrink-0" />}
            </div>
          )}
        </div>
        <div className="flex-1 bg-[#f0e8f4] dark:bg-purple-900/10 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider opacity-40 text-purple-900 dark:text-purple-200">
              {typingUser ? 'is typing...' : isOtherOnline ? 'Online' : 'Offline'}
            </span>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:opacity-60 text-purple-900 dark:text-purple-200">
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] z-50 py-1 min-w-[160px]">
                  {conversation?.product && (
                    <Link
                      to={`/products/${conversation.product._id}`}
                      className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-sky-50 dark:hover:bg-sky-900/20 text-[var(--bulletin-text)]"
                      onClick={() => setShowMenu(false)}
                    >
                      <Package className="h-3 w-3" /> View Item
                    </Link>
                  )}
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-red-600"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product banner */}
      {conversation?.product && (
        <Link
          to={`/products/${conversation.product._id}`}
          className="flex items-center gap-3 px-4 py-2 border-b border-[var(--bulletin-border)] bg-[var(--bulletin-card)]"
        >
          {conversation.product.images?.[0] && (
            <div className="w-8 h-8 border border-[var(--bulletin-border)] overflow-hidden flex-shrink-0">
              <img src={conversation.product.images[0].url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold truncate text-[var(--bulletin-text)]">{conversation.product.title}</div>
            <div className="text-[10px] font-bold text-[var(--bulletin-text)] opacity-60">
              GHS {conversation.product.price.toFixed(2)}
            </div>
          </div>
          <ExternalLink className="h-4 w-4 opacity-40 flex-shrink-0 text-[var(--bulletin-text)]" />
        </Link>
      )}

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1" style={{ height: 'calc(100vh - 56px - 44px - 140px)' }}>
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 text-[9px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-40 transition-all text-[var(--bulletin-text)]"
            >
              {loadingMore ? 'Loading...' : 'See older messages'}
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = typeof msg.sender === 'object' && msg.sender._id === user?._id;
          const isSystem = msg.type === 'system';
          const prevMsg = messages[idx - 1];
          const showDate =
            !prevMsg ||
            new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

          return (
            <React.Fragment key={msg._id}>
              {showDate && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 border-t border-[var(--bulletin-border)]/10" />
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-30 text-[var(--bulletin-text)]">
                    {getDateLabel(msg.createdAt)}
                  </span>
                  <div className="flex-1 border-t border-[var(--bulletin-border)]/10" />
                </div>
              )}

              {isSystem ? (
                <div className="text-center py-2">
                  <span className="text-[10px] opacity-50 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[var(--bulletin-text)]">
                    {msg.content}
                  </span>
                </div>
              ) : (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[75%]`}>
                    <div className={`px-3 py-2 border border-[var(--bulletin-border)] ${
                      isMe
                        ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]'
                        : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)]'
                    } shadow-[2px_2px_0_0_var(--bulletin-shadow)]`}>
                      <p className="text-[12px] whitespace-pre-wrap break-words">{msg.content}</p>

                      {/* Offer bubble */}
                      {msg.offer && (
                        <div className={`mt-2 border-t ${ isMe ? 'border-[var(--bulletin-bg)]/20' : 'border-[var(--bulletin-text)]/10'} pt-2`}>
                          <div className={`flex items-center justify-between gap-2 flex-wrap`}>
                            <span className={`text-[11px] font-bold ${ isMe ? 'text-[var(--bulletin-bg)]/80' : '' }`}>
                              GHS {msg.offer.amount.toFixed(2)}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[var(--bulletin-border)] ${
                              msg.offer.status === 'pending'
                                ? isMe ? 'bg-white/10 text-white' : 'bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200'
                                : msg.offer.status === 'accepted'
                                ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200'
                                : msg.offer.status === 'rejected'
                                ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200'
                                : 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200'
                            }`}>
                              {msg.offer.status}
                            </span>
                          </div>

                          {/* Accept / Reject / Counter — only shown to the RECIPIENT when pending */}
                          {!isMe && msg.offer.status === 'pending' && (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleRespondToOffer(msg._id, 'accepted')}
                                  disabled={respondingOffer === msg._id}
                                  className="flex-1 border border-[var(--bulletin-border)] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 px-2 py-1 text-[9px] font-bold uppercase hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-40 transition-all"
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  onClick={() => handleRespondToOffer(msg._id, 'rejected')}
                                  disabled={respondingOffer === msg._id}
                                  className="flex-1 border border-[var(--bulletin-border)] bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200 px-2 py-1 text-[9px] font-bold uppercase hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-40 transition-all"
                                >
                                  ✕ Decline
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="New Price (GHS)"
                                  value={counterAmounts[msg._id] || ''}
                                  onChange={(e) =>
                                    setCounterAmounts((prev) => ({ ...prev, [msg._id]: e.target.value }))
                                  }
                                  className="flex-1 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-[var(--bulletin-border)]"
                                />
                                <button
                                  onClick={() => handleRespondToOffer(msg._id, 'countered')}
                                  disabled={respondingOffer === msg._id}
                                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] px-2 py-1 text-[9px] font-bold uppercase hover:shadow-[2px_2px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all"
                                >
                                  Counter
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((a, i) => (
                            <a key={`${a.url}-${i}`} href={a.url} target="_blank" rel="noreferrer" className={`block text-[10px] underline ${isMe ? 'text-[var(--bulletin-bg)]/70' : 'opacity-70'}`}>
                              {a.name || 'Attachment'}
                            </a>
                          ))}
                        </div>
                      )}
                      {msg.quickReplyLabel && (
                        <div className={`mt-1 text-[9px] uppercase tracking-wider ${isMe ? 'text-[var(--bulletin-bg)]/50' : 'opacity-50'}`}>Quick reply</div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] opacity-40 text-[var(--bulletin-text)]">
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                      {isMe && msg.readBy.length > 1 && (
                        <span className="text-[9px] opacity-60 text-sky-500">&#10003;&#10003;</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {typingUser && (
          <div className="flex justify-start mb-1">
            <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-2 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
              <div className="flex items-center gap-1.5">
                <div className="text-[10px] opacity-60 text-[var(--bulletin-text)]">{typingUser} is typing</div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3">
        {/* Quick replies */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {['Is this available?', 'Can you reduce the price?', 'Where can we meet?'].map((q) => (
            <button key={q} onClick={() => sendQuickReply(q)} className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] px-2 py-1 text-[8px] font-black uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              {q}
            </button>
          ))}
          <button
            onClick={() => setShowOfferPanel((v) => !v)}
            className={`border border-[var(--bulletin-border)] px-2 py-1 text-[8px] font-black uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${
              showOfferPanel ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200'
            }`}
          >
            💰 Make Offer
          </button>
        </div>

        {/* Collapsible offer panel */}
        {showOfferPanel && (
          <div className="mb-3 flex items-center gap-2 border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/10 p-2 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
            <span className="text-[9px] font-black uppercase opacity-60 whitespace-nowrap text-black dark:text-yellow-200">Offer (GHS)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="e.g. 80.00"
              className="flex-1 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-border)]"
            />
            <button
              onClick={sendOffer}
              disabled={!offerAmount || Number(offerAmount) <= 0}
              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-3 py-1.5 text-[9px] font-black uppercase text-[var(--bulletin-bg)] hover:bg-[#ff6b6b] hover:text-white disabled:opacity-40 transition-colors"
            >
              Send
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Write something..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 text-[16px] font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] placeholder:text-[var(--bulletin-muted)] text-[var(--bulletin-text)]"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[var(--bulletin-bg)] font-bold hover:bg-[#ff6b6b] hover:text-white transition-colors disabled:opacity-40 shadow-[4px_4px_0_0_var(--bulletin-shadow)] active:translate-y-1 active:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;