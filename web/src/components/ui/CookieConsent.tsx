import React, { useState, useEffect } from 'react';
import { Shield, Cookie, X } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('quads-cookie-consent');
    if (!consent) {
      // Small delay for micro-animation entrance
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('quads-cookie-consent', 'all');
    localStorage.setItem('quads-cookie-analytics', 'true');
    localStorage.setItem('quads-cookie-marketing', 'true');
    setVisible(false);
  };

  const handleDeclineAll = () => {
    localStorage.setItem('quads-cookie-consent', 'essential');
    localStorage.setItem('quads-cookie-analytics', 'false');
    localStorage.setItem('quads-cookie-marketing', 'false');
    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('quads-cookie-consent', 'custom');
    localStorage.setItem('quads-cookie-analytics', analyticsConsent.toString());
    localStorage.setItem('quads-cookie-marketing', marketingConsent.toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50 animate-bounce-in">
      <div 
        className="relative border-4 border-black bg-[#fffacd] dark:bg-[#2c2b20] p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] text-black dark:text-yellow-100"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        {/* Washi Tape Accent */}
        <div className="absolute -top-3 left-1/3 -translate-x-1/2 w-28 h-6 bg-pink-400/80 dark:bg-pink-600/80 border-2 border-black border-dashed flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white transform -rotate-2 select-none shadow-[2px_2px_0_0_rgba(0,0,0,0.15)]">
          ★ Cookie Policy ★
        </div>

        {/* Close Button */}
        <button
          onClick={handleDeclineAll}
          className="absolute top-3 right-3 border-2 border-black bg-white dark:bg-black p-1 hover:bg-red-200 transition-colors text-black dark:text-yellow-100"
          title="Close / Necessary Only"
        >
          <X className="h-4 w-4" />
        </button>

        {!showPreferences ? (
          <div>
            <div className="flex items-center gap-3 mb-3 mt-2">
              <div className="p-2 border-2 border-black bg-yellow-200 dark:bg-yellow-900/40 text-black dark:text-yellow-100">
                <Cookie className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight">Cookie Consent</h4>
            </div>
            
            <p className="text-xs font-bold leading-relaxed mb-5 opacity-80">
              We use cookies to personalize your campus experience, analyze search behavior, and keep escrow payments secure. Acceptance makes our bulletin board stickier!
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleAcceptAll}
                className="w-full border-2 border-black bg-black text-white hover:bg-pink-500 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                Accept All
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex-1 border-2 border-black bg-white text-black hover:bg-yellow-100 py-2 text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  Preferences
                </button>
                <button
                  onClick={handleDeclineAll}
                  className="flex-1 border-2 border-black bg-white text-black hover:bg-red-100 py-2 text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  Essential Only
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="p-2 border-2 border-black bg-yellow-200 dark:bg-yellow-900/40 text-black dark:text-yellow-100">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight">Preferences</h4>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-2 border-2 border-black bg-white/50 dark:bg-black/20">
                <div>
                  <div className="text-[10px] font-black uppercase">Essential</div>
                  <div className="text-[9px] opacity-60">Authentication & Escrow (Always Active)</div>
                </div>
                <input type="checkbox" checked disabled className="h-4 w-4 accent-black" />
              </div>

              <div className="flex items-center justify-between p-2 border-2 border-black bg-white/50 dark:bg-black/20">
                <div>
                  <div className="text-[10px] font-black uppercase">Analytics</div>
                  <div className="text-[9px] opacity-60">Optimize search & recommendations</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={analyticsConsent} 
                  onChange={(e) => setAnalyticsConsent(e.target.checked)} 
                  className="h-4 w-4 accent-black cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between p-2 border-2 border-black bg-white/50 dark:bg-black/20">
                <div>
                  <div className="text-[10px] font-black uppercase">Marketing</div>
                  <div className="text-[9px] opacity-60">Personalized promotional tags</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={marketingConsent} 
                  onChange={(e) => setMarketingConsent(e.target.checked)} 
                  className="h-4 w-4 accent-black cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPreferences(false)}
                className="flex-1 border-2 border-black bg-white text-black hover:bg-yellow-100 py-2 text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 border-2 border-black bg-black text-white hover:bg-pink-500 py-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
