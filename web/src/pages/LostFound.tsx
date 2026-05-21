import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import chatService from '../services/chat.service';
import lostFoundService, { LostFoundItem } from '../services/lostFound.service';
import { 
  Pin, 
  Plus, 
  X, 
  MapPin, 
  Clock, 
  Tag, 
  User, 
  Phone, 
  Camera, 
  Info,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { soundEffects } from '../utils/sounds';
import { useAuth } from '../context/AuthContext';

type PolaroidItem = LostFoundItem;

const CATEGORY_LABELS: Record<string, string> = {
  keys: '🔑 Keys',
  id_card: '🪪 Student ID',
  laptop: '💻 Electronics',
  phone: '📱 Smartphone',
  bag: '🎒 Backpack/Bag',
  books: '📚 Books/Notes',
  other: '📦 General Item',
};

export const LostFound: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [items, setItems] = useState<PolaroidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [activeItem, setActiveItem] = useState<PolaroidItem | null>(null);
  const [chatting, setChatting] = useState(false);
  const [itemToConfirmDelete, setItemToConfirmDelete] = useState<string | null>(null);
  
  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost' as 'lost' | 'found',
    title: '',
    category: 'other' as PolaroidItem['category'],
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    contactName: user?.name || '',
    contactInfo: '',
    imageUrl: '',
  });

  const fetchItems = async () => {
    try {
      const res = await lostFoundService.getItems();
      if (res.success) {
        // Map _id to id if needed for compatibility
        const mapped = res.data.map(item => ({
          ...item,
          id: item._id || item.id,
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error('Failed to load lost/found items:', err);
      toast.error('Could not load bulletin board items');
    } finally {
      setLoading(false);
    }
  };

  // Sync to database
  useEffect(() => {
    fetchItems();
  }, []);

  const handleFilterChange = (newFilter: typeof filter) => {
    soundEffects.playPinClick();
    setFilter(newFilter);
  };

  const handleOpenItem = (item: PolaroidItem) => {
    // Premium double micro-interaction!
    soundEffects.playFlashCharge();
    setTimeout(() => {
      soundEffects.playShutter();
      setActiveItem(item);
    }, 150);
  };

  const handleCloseItem = () => {
    soundEffects.playPinClick();
    setActiveItem(null);
  };

  const handleInitiateChat = async (item: PolaroidItem) => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in to initiate chat');
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }

    const itemUserId = typeof item.userId === 'object' ? item.userId?._id : item.userId;
    if (itemUserId === user._id) {
      toast.error("This is your own pin! You can't chat with yourself.");
      return;
    }

    setChatting(true);
    try {
      let targetUserId = itemUserId;

      // Fallback to Support AI Bot if no userId is attached (mock items)
      if (!targetUserId) {
        const supportRes = await chatService.getAiUser();
        if (supportRes.success) {
          targetUserId = supportRes.data.userId;
        } else {
          throw new Error('Could not retrieve support agent');
        }
      }

      const res = await chatService.getOrCreateConversation(targetUserId);
      if (res.success) {
        // Send a pre-populated context message about the lost item to make the chat feel alive
        try {
          await chatService.sendMessage(
            res.data.conversation._id,
            `Hi! I'm inquiring about the item pinned on the Lost & Found Board: "${item.title}" (${item.type === 'lost' ? 'Lost' : 'Found'} at ${item.location}).`
          );
        } catch (msgErr) {
          console.warn('Failed to send context message, continuing to room:', msgErr);
        }

        handleCloseItem();
        navigate(`/messages/${res.data.conversation._id}`);
      }
    } catch (err) {
      console.error('Failed to initiate chat:', err);
      toast.error('Could not start a conversation right now');
    } finally {
      setChatting(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.location.trim() || !formData.description.trim() || !formData.contactInfo.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Synthesize eject/motor paper whirr!
      soundEffects.playEject();

      const res = await lostFoundService.createItem({
        type: formData.type,
        title: formData.title,
        category: formData.category,
        date: formData.date,
        location: formData.location,
        description: formData.description,
        contactName: formData.contactName || 'Anonymous Scholar',
        contactInfo: formData.contactInfo,
        imageUrl: formData.imageUrl.trim() || undefined,
      });

      if (res.success) {
        setShowAddModal(false);
        toast.success(`${formData.type === 'lost' ? 'Lost' : 'Found'} item pinned successfully!`);
        fetchItems();

        // Reset Form
        setFormData({
          type: 'lost',
          title: '',
          category: 'other',
          date: new Date().toISOString().split('T')[0],
          location: '',
          description: '',
          contactName: user?.name || '',
          contactInfo: '',
          imageUrl: '',
        });
      }
    } catch (err: any) {
      console.error('Failed to pin item:', err);
      toast.error(err.response?.data?.message || 'Could not pin item to the board');
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playPinClick();
    
    // Find item to verify permissions (extra safety)
    const item = items.find(i => i.id === id || i._id === id);
    if (!item) return;
    
    const itemUserId = typeof item.userId === 'object' ? item.userId?._id : item.userId;
    const isOwner = itemUserId === user?._id;
    const isAdmin = user?.roles?.includes('admin');
    if (!isOwner && !isAdmin) {
      toast.error('You do not have permission to unpin this item');
      return;
    }
    
    setItemToConfirmDelete(id);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  // Vector Preset Previews so cards look beautifully stylized
  const renderVectorFallback = (category: PolaroidItem['category']) => {
    switch (category) {
      case 'keys':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
            <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 114 0c0 .417-.127.805-.343 1.127l.343.343a1 1 0 010 1.414l-2 2a1 1 0 01-.707.293H15a1 1 0 01-1-1v-1a1 1 0 01.293-.707l.343-.343A1.993 1.993 0 0115 7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.414 13.414L9 17.828V20a1 1 0 01-1 1H6a1 1 0 01-1-1v-2H4a1 1 0 01-1-1v-2a1 1 0 011-1h2.172l4.414-4.414" />
            </svg>
            <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 mt-2">No Photo Attached</span>
          </div>
        );
      case 'id_card':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
            <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 mt-2">No Photo Attached</span>
          </div>
        );
      case 'laptop':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
            <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 mt-2">No Photo Attached</span>
          </div>
        );
      case 'phone':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50/60 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
            <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 mt-2">No Photo Attached</span>
          </div>
        );
      case 'bag':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/60 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300">
            <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 mt-2">No Photo Attached</span>
          </div>
        );
      case 'books':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
            <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 mt-2">No Photo Attached</span>
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50/60 dark:bg-zinc-800/20 text-zinc-700 dark:text-zinc-400">
            <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 mt-2">No Photo Attached</span>
          </div>
        );
    }
  };

  return (
    <BulletinLayout
      title="Lost & Found Board"
      subtitle="Pins & Polaroids"
      section="08"
    >
      <Helmet>
        <title>Lost & Found Bulletin | QUADS Campus</title>
        <meta name="description" content="Dedicated, zero-fee Polaroid corkboard where UMaT students pin lost and found items." />
      </Helmet>

      {/* Intro section */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-4 border-[var(--bulletin-border)] pb-8 mb-8">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6b6b] mb-2 animate-bounce">
              Zero Fees, Secure Pinboard
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">
              Polaroid Pinboard
            </h1>
            <p className="text-[14px] font-bold opacity-60 text-[var(--bulletin-text)] mt-2 max-w-xl">
              Lost an ID card, keys, or textbook? Pin it below to alert the UMaT campus community. Tap any Polaroid to inspect the physical details.
            </p>
          </div>

          <button
            onClick={() => {
              soundEffects.playPinClick();
              if (!isAuthenticated) {
                toast.error('Please log in to pin a Polaroid');
                navigate('/login', { state: { from: window.location.pathname + window.location.search } });
                return;
              }
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-6 py-4 text-[11px] font-black uppercase tracking-widest shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> Pin New Polaroid
          </button>
        </div>

        {/* Filters Styled as corkboard filter pins */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-[var(--bulletin-card)] border-2 border-[var(--bulletin-border)] p-4 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-[#ff6b6b]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-text)] opacity-40">Filter Pins:</span>
          </div>
          
          <div className="flex gap-2">
            {[
              { key: 'all', label: '📌 All Polaroids' },
              { key: 'lost', label: '🔴 Lost Items' },
              { key: 'found', label: '🟢 Found Items' }
            ].map(btn => (
              <button
                key={btn.key}
                onClick={() => handleFilterChange(btn.key as any)}
                className={`border-2 border-[var(--bulletin-border)] px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 ${
                  filter === btn.key 
                    ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] shadow-none scale-95' 
                    : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── THE CORKBOARD GRID ── */}
        <div className="bg-[#edd6b8] dark:bg-[#1a130c] bg-[radial-gradient(#cfb28f_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#2f2010_1.5px,transparent_1.5px)] bg-[size:24px_24px] border-8 border-[#8b5a2b] dark:border-[#3d250d] p-8 md:p-12 shadow-[inset_0_4px_12px_rgba(0,0,0,0.3),8px_8px_0_0_var(--bulletin-shadow)] min-h-[500px] rounded-lg relative">
          
          {/* Wooden corner decorative nodes */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#5c3a17] dark:bg-[#1f1004] opacity-50 shadow-inner" />
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#5c3a17] dark:bg-[#1f1004] opacity-50 shadow-inner" />
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#5c3a17] dark:bg-[#1f1004] opacity-50 shadow-inner" />
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#5c3a17] dark:bg-[#1f1004] opacity-50 shadow-inner" />

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-[#5c3b1e] dark:text-amber-200/50">
              <FolderOpen className="h-16 w-16 opacity-30 stroke-[1.5]" />
              <h3 className="text-xl font-black uppercase mt-4 tracking-tight">corkboard is empty</h3>
              <p className="text-xs font-bold font-mono mt-1 opacity-75">No polaroids found matching this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredItems.map((item, index) => {
                // Pre-compute unique rotational offsets to simulate physical tactile chaos
                const rotations = ['rotate-[1.2deg]', 'rotate-[-1.5deg]', 'rotate-[2.2deg]', 'rotate-[-2.5deg]', 'rotate-[1deg]'];
                const cardRotation = rotations[index % rotations.length];
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    className={`cursor-pointer bg-white dark:bg-zinc-900 border-2 border-[#1c1813]/10 dark:border-white/5 p-4 pb-6 shadow-[6px_6px_0_0_rgba(28,24,19,0.15)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.4)] group hover:shadow-[12px_12px_0_0_rgba(28,24,19,0.25)] dark:hover:shadow-[12px_12px_0_0_rgba(255,107,107,0.15)] hover:scale-[1.03] transition-all duration-300 relative ${cardRotation}`}
                  >
                    {/* Retro Red Pin head */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-[#ff6b6b] border border-black/20 shadow-md z-20 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white/60 absolute top-0.5 left-1" />
                      <div className="h-4 w-[2px] bg-zinc-400 absolute top-4 transform origin-top rotate-[5deg] shadow-sm" />
                    </div>

                    {/* Polaroid Image Box */}
                    <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-black/5 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        renderVectorFallback(item.category)
                      )}

                      {/* Polaroid label tag */}
                      <span className={`absolute top-2 left-2 text-[8px] font-black uppercase px-2 py-0.5 tracking-widest shadow-sm ${
                        item.type === 'lost' 
                          ? 'bg-[#ff6b6b] text-white' 
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    {/* Scotch tape effect on the card */}
                    <div className="absolute top-1/2 left-4 h-4 w-12 bg-yellow-200/20 rotate-[-12deg] pointer-events-none" />

                    {/* Polaroid monospaced caption */}
                    <div className="mt-4 text-center">
                      <div className="truncate font-black uppercase text-xs tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
                        {item.title}
                      </div>
                      
                      <div className="flex flex-col items-center gap-1 mt-2 text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-500" /> {item.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(item.date).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* User's Delete button (if authenticated and is owner or admin) */}
                      {isAuthenticated && (item.userId === user?._id || user?.roles?.includes('admin')) && (
                        <button
                          onClick={(e) => handleDeleteItem(item.id || item._id || '', e)}
                          className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-600 hover:text-white px-2 py-1 text-[8px] font-black uppercase font-mono tracking-widest rounded"
                          title="Remove Pin"
                        >
                          Unpin Item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </BulletinSection>

      {/* ── MODAL: HIGH-FIDELITY ZOOMED-IN POLAROID DETAIL ── */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          {/* Modal card - styled as dynamic vintage large photo frame */}
          <div 
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border-4 border-zinc-950 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-zinc-950 dark:text-zinc-50 flex flex-col gap-6 scrollbar-hide"
            style={{ transform: 'rotate(-0.8deg)' }}
          >
            {/* Red thumbtack accent */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#ff6b6b] border-2 border-black/30 shadow-md flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white/60 absolute top-0.5 left-1" />
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseItem}
              className="absolute top-4 right-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 p-2 hover:bg-[#ff6b6b] hover:text-white transition-all rounded-full shadow-md border-2 border-transparent"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Item Title Banner */}
            <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-3 mt-4">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 tracking-wider inline-block mb-1.5 ${
                activeItem.type === 'lost' ? 'bg-[#ff6b6b] text-white' : 'bg-emerald-600 text-white'
              }`}>
                {activeItem.type}
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight font-mono">{activeItem.title}</h2>
            </div>

            {/* Modal Image Box */}
            <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center">
              {activeItem.imageUrl ? (
                <img src={activeItem.imageUrl} alt={activeItem.title} className="w-full h-full object-cover" />
              ) : (
                renderVectorFallback(activeItem.category)
              )}
            </div>

            {/* Modal Description */}
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4 bg-zinc-100 dark:bg-zinc-800/50 p-4 border border-zinc-950/10">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#ff6b6b]" />
                  <div>
                    <div className="text-[9px] opacity-40 uppercase">Location</div>
                    <div className="font-bold">{activeItem.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#ff6b6b]" />
                  <div>
                    <div className="text-[9px] opacity-40 uppercase">Date Tagged</div>
                    <div className="font-bold">{new Date(activeItem.date).toLocaleDateString('en-GH', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 bg-zinc-50 dark:bg-zinc-800/20 p-4 border border-zinc-950/10 leading-relaxed whitespace-pre-wrap">
                <div className="text-[9px] opacity-40 uppercase flex items-center gap-1">
                  <Info className="h-3 w-3" /> Narrative & Identifier Details
                </div>
                <p className="text-[11px] leading-relaxed font-bold opacity-80">{activeItem.description}</p>
              </div>

              {/* Contact Info card */}
              <div className="border-2 border-dashed border-[#ff6b6b]/40 bg-[#fffacd] dark:bg-yellow-950/10 p-4 relative">
                <div className="absolute top-1 right-2 text-[8px] font-black uppercase text-[#ff6b6b]">Contact Info</div>
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 opacity-40" />
                  <span className="font-bold text-[11px] uppercase tracking-wide">{activeItem.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <Phone className="h-4 w-4 opacity-40" />
                  <span>{activeItem.contactInfo}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <button
                onClick={handleCloseItem}
                className="flex-1 border-2 border-zinc-950 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 text-[11px] font-black uppercase tracking-widest text-center"
              >
                Close Pin
              </button>
              
              <button
                onClick={() => handleInitiateChat(activeItem)}
                disabled={chatting}
                className="flex-1 border-2 border-zinc-950 bg-zinc-950 hover:bg-[#ff6b6b] text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-[#ff6b6b] dark:hover:text-white py-3 text-[11px] font-black uppercase tracking-widest text-center transition-colors disabled:opacity-50"
              >
                {chatting ? 'Connecting...' : 'Initiate Chat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PIN NEW ITEM FORM ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-4 border-zinc-950 p-6 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-200 text-zinc-950 dark:text-zinc-50 max-h-[90vh] overflow-y-auto">
            
            {/* Close */}
            <button
              onClick={() => {
                soundEffects.playPinClick();
                setShowAddModal(false);
              }}
              className="absolute top-4 right-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 p-2 hover:bg-[#ff6b6b] hover:text-white transition-all rounded-full"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-3 mb-6 mt-4">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Camera className="h-6 w-6 text-[#ff6b6b]" /> Pinned Polaroid Details
              </h2>
              <p className="text-[10px] font-bold opacity-40 font-mono mt-1 uppercase">Pins are processed instantly and displayed on the campus corkboard</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4 font-mono text-xs">
              
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playPinClick();
                    setFormData({ ...formData, type: 'lost' });
                  }}
                  className={`border-2 border-zinc-950 py-3 font-black uppercase tracking-widest ${
                    formData.type === 'lost' ? 'bg-[#ff6b6b] text-white' : 'bg-transparent text-zinc-950 dark:text-zinc-50'
                  }`}
                >
                  🔴 Lost
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playPinClick();
                    setFormData({ ...formData, type: 'found' });
                  }}
                  className={`border-2 border-zinc-950 py-3 font-black uppercase tracking-widest ${
                    formData.type === 'found' ? 'bg-emerald-600 text-white' : 'bg-transparent text-zinc-950 dark:text-zinc-50'
                  }`}
                >
                  🟢 Found
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Item Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Faded Brown Leather Wallet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-2 border-zinc-950 bg-zinc-50 dark:bg-zinc-800 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Category *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full border-2 border-zinc-950 bg-zinc-50 dark:bg-zinc-800 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border-2 border-zinc-950 bg-zinc-50 dark:bg-zinc-800 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Campus Location *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. C-Block Lecture Hall / Cafeteria Counter"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border-2 border-zinc-950 bg-zinc-50 dark:bg-zinc-800 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Polaroid Image URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://images.unsplash.com/... or blank for category sketch"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border-2 border-zinc-950 bg-zinc-50 dark:bg-zinc-800 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1">Item Description / Details *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describe unique identifier marks, stickers, where to collect the item, or exact description details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-zinc-950 bg-zinc-50 dark:bg-zinc-800 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Contact Name & Info */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 border border-zinc-950/10">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-1">Your Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Peter M."
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full border-2 border-zinc-950 bg-white dark:bg-zinc-950 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-1">How to reach you *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Phone number / Room number"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    className="w-full border-2 border-zinc-950 bg-white dark:bg-zinc-950 p-2 font-bold focus:outline-none focus:border-[#ff6b6b] text-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playPinClick();
                    setShowAddModal(false);
                  }}
                  className="flex-1 border-2 border-zinc-950 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 text-[11px] font-black uppercase tracking-widest text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 border-2 border-zinc-950 bg-zinc-950 hover:bg-[#ff6b6b] text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-[#ff6b6b] dark:hover:text-white py-3 text-[11px] font-black uppercase tracking-widest text-center transition-colors"
                >
                  Pin Polaroid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── CUSTOM CONFIRM MODAL ── */}
      {itemToConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="border-4 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[16px_16px_0_0_var(--bulletin-shadow)] max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--bulletin-text)] mb-3">Unpin Polaroid?</h3>
            <p className="text-xs font-bold text-[var(--bulletin-text)] opacity-60 mb-6 font-mono leading-relaxed">
              Are you sure you want to permanently remove this polaroid pin from the UMaT campus corkboard?
            </p>
            <div className="flex gap-4">
              <button
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-none transition-all text-[var(--bulletin-text)]"
                onClick={() => setItemToConfirmDelete(null)}
              >
                Discard
              </button>
              <button
                className="flex-1 border-2 border-black dark:border-white bg-[#ff6b6b] text-white py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-0.5 hover:shadow-none transition-all"
                onClick={async () => {
                  soundEffects.playPinClick();
                  try {
                    await lostFoundService.deleteItem(itemToConfirmDelete);
                    setItems(items.filter(item => (item.id || item._id) !== itemToConfirmDelete));
                    toast.success('Pin removed');
                  } catch (err) {
                    console.error('Failed to unpin item:', err);
                    toast.error('Could not remove pin from the board');
                  } finally {
                    setItemToConfirmDelete(null);
                  }
                }}
              >
                Yes, Unpin
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default LostFound;
