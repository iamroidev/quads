import React, { useState } from 'react';
import { 
  HelpCircle, 
  ShieldCheck, 
  Search, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const ARTICLES = {
  help: [
    {
      title: 'Getting Started with QUADS',
      content: 'Welcome to the official QUADS platform for UMaT. Use your institutional email (@st.umat.edu.gh) to register. After login, visit the Security Center to verify your account. You can browse listings on the Board or switch to Seller mode to manage your own store.'
    },
    {
      title: 'Safe Buying Guide',
      content: 'Message sellers directly via Chat. All meetups must happen on campus (e.g., Library foyer or Student Center). Use our secure payment system; funds are held until you confirm receipt of the item.'
    },
    {
      title: 'Selling and Store Management',
      content: 'Create listings with clear titles and high-quality photos. When an item sells, coordinate the meetup. Once the buyer confirms receipt, your payout is processed to your linked MoMo wallet within 24-48 hours.'
    }
  ],
  safety: [
    {
      title: 'Payment Safety',
      content: 'Our secure payment system holds buyer funds until the transaction is complete. NEVER pay via direct MoMo transfer outside the platform or pay "advance money" in advance. Report any user asking for external payments.'
    },
    {
      title: 'Inspection Checklist',
      content: 'Test electronics thoroughly (battery, ports, Wi-Fi). Check textbooks for missing pages. Meet near a power outlet for appliances. Do not confirm the transaction if the item does not match the description.'
    },
    {
      title: 'Reporting and Security',
      content: 'Use the Report button for fraudulent listings. In emergencies, contact UMaT Campus Security: +233 (0) XXX XXX XXX. Our moderation team reviews all reports within 24 hours.'
    }
  ]
};

const Support: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  const filterArticles = (list: { title: string, content: string }[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(art => 
      art.title.toLowerCase().includes(query) || 
      art.content.toLowerCase().includes(query)
    );
  };

  const filteredHelp = filterArticles(ARTICLES.help);
  const filteredSafety = filterArticles(ARTICLES.safety);
  const hasNoResults = filteredHelp.length === 0 && filteredSafety.length === 0;

  return (
    <BulletinLayout title="Support" subtitle="Help Guides" section="00" hideBreadcrumbs={true}>
      
      {/* Hero / Search */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="max-w-4xl mx-auto py-8">
          <div className="grid md:grid-cols-[1fr_350px] gap-8 items-start">
            <div>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 opacity-40 text-[var(--bulletin-text)]" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guides..." 
                  className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 pl-16 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] text-[var(--bulletin-text)] placeholder:opacity-30 placeholder:text-[var(--bulletin-text)]"
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-[12px] font-black uppercase tracking-widest opacity-60 text-[var(--bulletin-text)]">
                <span>Quick Links:</span>
                <a href="#help" className="underline decoration-2 underline-offset-4 hover:text-[#ff6b6b] transition-all">Help Center</a>
                <a href="#safety" className="underline decoration-2 underline-offset-4 hover:text-[#ff6b6b] transition-all">Safety Center</a>
                <Link to="/contact" className="underline decoration-2 underline-offset-4 hover:text-[#ff6b6b] transition-all flex items-center gap-2">
                  Contact Support <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-950/10 p-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)] rotate-[0.5deg]">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[#b25e00] dark:text-[#ffcc80]">Instant Assistance</div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  🤖 QUADS AI Assistant
                </h3>
                <p className="text-[11px] font-bold opacity-60 mb-4 leading-tight">Need help with escrow, payment verification, or listing? Ask our live support bot!</p>
                <Link to="/messages?support=true" className="w-full inline-block border-2 border-black dark:border-white bg-black text-white dark:bg-white dark:text-black py-2.5 text-center text-[10px] font-black uppercase tracking-widest hover:bg-[#ff6b6b] hover:text-white dark:hover:bg-[#ff6b6b] dark:hover:text-white transition-all shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5">
                  Start Live Chat →
                </Link>
              </div>

              <div className="border-4 border-[var(--bulletin-border)] bg-[#e0f2f7] dark:bg-sky-900/40 p-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)] rotate-[-0.5deg]">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-sky-900 dark:text-sky-200">Institutional Safety</div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-sky-900 dark:text-sky-200">Official Protocols</h3>
                <p className="text-[11px] font-bold opacity-60 mb-4 leading-tight text-sky-900 dark:text-sky-200">Read our community guidelines and safety documentation to ensure secure transactions.</p>
                <Link to="/terms" className="w-full inline-block border-2 border-black bg-black text-white py-2.5 text-center text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                  Read Rules →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </BulletinSection>

      {hasNoResults && (
        <BulletinSection bgColor="bg-[var(--bulletin-card)]">
          <div className="text-center py-20 border-4 border-dashed border-[var(--bulletin-border)]/40 shadow-[8px_8px_0_0_rgba(0,0,0,0.05)] dark:shadow-none">
            <div className="text-6xl mb-6">📭</div>
            <h3 className="text-3xl font-black uppercase tracking-tight text-[var(--bulletin-text)] mb-2">No guides found</h3>
            <p className="opacity-60 mb-8 text-[14px] font-bold text-[var(--bulletin-text)]">Try different keywords or reach out to us directly.</p>
            <Link to="/contact" className="inline-block border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-8 py-4 text-[12px] font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              Go to Contact Page
            </Link>
          </div>
        </BulletinSection>
      )}

      {/* Accordion Lists */}
      <BulletinSection title="Help Center" subtitle="Marketplace Guides" id="help" bgColor="bg-[var(--bulletin-bg)] border-t-4 border-[var(--bulletin-border)]">
        <div className="space-y-6">
          {filteredHelp.map((art, i) => (
            <div key={i} className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <button 
                onClick={() => toggleAccordion(`help-${i}`)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <HelpCircle className="h-6 w-6 text-black dark:text-[#ffd700]" />
                  <span className="text-lg md:text-xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">{art.title}</span>
                </div>
                {expandedIndex === `help-${i}` ? <ChevronUp className="h-6 w-6 text-[var(--bulletin-text)]" /> : <ChevronDown className="h-6 w-6 text-[var(--bulletin-text)]" />}
              </button>
              {expandedIndex === `help-${i}` && (
                <div className="p-6 md:p-8 pt-0 border-t-4 border-dashed border-[var(--bulletin-border)]/20 mt-4">
                  <p className="text-[14px] font-bold leading-relaxed opacity-80 text-[var(--bulletin-text)] pt-4">
                    {art.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </BulletinSection>

      <BulletinSection title="Safety Center" subtitle="Safe Trading" id="safety" bgColor="bg-[var(--bulletin-card)] border-t-4 border-[var(--bulletin-border)]">
        <div className="space-y-6">
          {filteredSafety.map((art, i) => (
            <div key={i} className="border-4 border-[var(--bulletin-border)] bg-[#e0f2f7] dark:bg-sky-900/40 shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <button 
                onClick={() => toggleAccordion(`safety-${i}`)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-sky-700 dark:text-sky-300" />
                  <span className="text-lg md:text-xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">{art.title}</span>
                </div>
                {expandedIndex === `safety-${i}` ? <ChevronUp className="h-6 w-6 text-[var(--bulletin-text)]" /> : <ChevronDown className="h-6 w-6 text-[var(--bulletin-text)]" />}
              </button>
              {expandedIndex === `safety-${i}` && (
                <div className="p-6 md:p-8 pt-0 border-t-4 border-dashed border-[var(--bulletin-border)]/20 mt-4">
                  <p className="text-[14px] font-bold leading-relaxed opacity-80 text-[var(--bulletin-text)] pt-4">
                    {art.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </BulletinSection>

      <BulletinSection title="Policies" subtitle="Terms of Use" id="legal" bgColor="bg-[#fffacd] dark:bg-yellow-900/20 border-t-4 border-[var(--bulletin-border)]">
        <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-8 md:p-12 shadow-[12px_12px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.5deg)' }}>
          <div className="max-w-3xl">
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-6 text-[var(--bulletin-text)]">Market Rules</h4>
            <div className="space-y-6 text-[14px] font-bold leading-relaxed text-[var(--bulletin-text)] opacity-80">
              <p>QUADS is a community-driven platform for UMaT students. We provide the tools for campus commerce but do not take ownership of listed items.</p>
              <p>Users are responsible for their own safety during meetups. Always meet in public, well-lit campus areas.</p>
              <p>Things you can't sell: Alcohol, Tobacco, Weapons, Academic Dishonesty services, and anything illegal under Ghanaian law.</p>
            </div>
            <div className="mt-12 flex gap-8 border-t-4 border-[var(--bulletin-border)] pt-8">
              <Link to="/terms" className="text-[12px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 flex items-center gap-2 text-[var(--bulletin-text)] hover:text-[#ff6b6b] transition-opacity">
                Terms of Service <ExternalLink className="h-4 w-4" />
              </Link>
              <Link to="/terms#privacy" className="text-[12px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 flex items-center gap-2 text-[var(--bulletin-text)] hover:text-[#ff6b6b] transition-opacity">
                Privacy Policy <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Support;
