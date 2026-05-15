import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AiChatButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Don't show on messaging pages or if not logged in
  if (!isAuthenticated || location.pathname.startsWith('/messages')) {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/messages?support=true')}
      className="fixed bottom-8 right-8 z-[90] group flex items-center gap-3 bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] p-4 shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[12px_12px_0_0_var(--bulletin-shadow)] transition-all border-2 border-black"
    >
      <div className="flex flex-col items-end mr-2">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Instant</span>
        <span className="text-[12px] font-black uppercase tracking-tight">AI Support</span>
      </div>
      <div className="relative">
        <MessageSquare className="h-6 w-6" />
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-4 w-4 text-[#ffd700] animate-pulse" />
        </div>
      </div>
    </button>
  );
};
