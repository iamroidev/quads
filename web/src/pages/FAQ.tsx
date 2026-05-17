import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  ShoppingBag,
  Shield,
  User,
  CreditCard,
} from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  items: FAQItem[];
}

/* ─── FAQ Data ────────────────────────────────────────────────────────────── */

const FAQ_CATEGORIES: FAQCategory[] = [
  /* ── Getting Started ─────────────────────────────────────────────────── */
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: <HelpCircle className="h-4 w-4" />,
    accent: 'bg-[#ff6b6b]',
    items: [
      {
        id: 'what-is-quads',
        question: 'What is QUADS?',
        answer: (
          <>
            <p>
              QUADS is the official campus marketplace for students of the{' '}
              <strong>University of Mines and Technology (UMaT)</strong>, Tarkwa, Ghana.
              It lets you buy, sell, and trade campus items — textbooks, electronics,
              clothing, hostel essentials — securely within the UMaT student community.
            </p>
            <p className="mt-3">
              Every transaction is backed by an escrow payment system so your money is
              always protected until you confirm you've received exactly what you paid for.
            </p>
          </>
        ),
      },
      {
        id: 'who-can-join',
        question: 'Who can join QUADS?',
        answer: (
          <p>
            QUADS is exclusively for <strong>verified UMaT students</strong>. You must
            have an active UMaT institutional email address (e.g.,{' '}
            <code className="border border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-1.5 py-0.5 text-[12px] font-black">
              name@st.umat.edu.gh
            </code>
            ) to register. Non-institutional emails are not accepted, keeping the community
            safe and trustworthy for everyone on campus.
          </p>
        ),
      },
      {
        id: 'is-it-free',
        question: 'Is it free to use?',
        answer: (
          <p>
            Yes — completely free. QUADS charges{' '}
            <strong className="text-[#ff6b6b]">0% trading fees</strong>. There are no
            listing fees, no commission cuts, and no hidden charges. Every pesewa you earn
            from a sale goes directly to you.
          </p>
        ),
      },
      {
        id: 'how-to-register',
        question: 'How do I register?',
        answer: (
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Go to the{' '}
              <Link
                to="/register"
                className="underline font-black hover:text-[#ff6b6b] transition-colors"
              >
                Register page
              </Link>{' '}
              and enter your UMaT institutional email.
            </li>
            <li>Create a strong password and confirm it.</li>
            <li>Check your inbox for a verification link and click it to confirm your email.</li>
            <li>
              Visit the{' '}
              <Link
                to="/verification"
                className="underline font-black hover:text-[#ff6b6b] transition-colors"
              >
                Verification page
              </Link>{' '}
              and upload a clear photo of your student ID card.
            </li>
            <li>
              Once approved (usually within minutes), you can start browsing and buying!
            </li>
          </ol>
        ),
      },
    ],
  },

  /* ── Buying ───────────────────────────────────────────────────────────── */
  {
    id: 'buying',
    label: 'Buying',
    icon: <ShoppingBag className="h-4 w-4" />,
    accent: 'bg-sky-500',
    items: [
      {
        id: 'how-to-buy',
        question: 'How do I buy an item?',
        answer: (
          <ol className="list-decimal pl-5 space-y-2">
            <li>Browse the marketplace or use the search bar to find what you need.</li>
            <li>Open a listing and review the description, photos, and seller profile.</li>
            <li>
              Click <strong>"Buy Now"</strong> (or add it to your cart for multiple items).
            </li>
            <li>Complete payment through the platform — funds are held in secure escrow.</li>
            <li>Arrange a campus meetup with the seller at a designated safety zone.</li>
            <li>Inspect the item and confirm receipt to release payment to the seller.</li>
          </ol>
        ),
      },
      {
        id: 'is-payment-secure',
        question: 'Is payment secure?',
        answer: (
          <p>
            Absolutely. When you pay, funds are held by our <strong>escrow system</strong>{' '}
            and are NOT released to the seller until you confirm the item arrived and
            matches the listing description. All payments are processed via{' '}
            <strong>Paystack</strong>, a PCI-compliant payment gateway used across Africa.
          </p>
        ),
      },
      {
        id: 'item-not-as-described',
        question: "What if the item isn't as described?",
        answer: (
          <>
            <p>
              Do <strong>not</strong> confirm receipt if the item is wrong or damaged.
              Instead:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mt-3">
              <li>
                Open a <strong>Dispute</strong> directly from your Order Detail page.
              </li>
              <li>Describe the issue clearly and attach photos where possible.</li>
              <li>
                Our campus moderators will review your case within{' '}
                <strong>24 hours</strong>.
              </li>
              <li>
                If the item is returned in its original condition, a full refund is issued
                to your QUADS wallet.
              </li>
            </ol>
          </>
        ),
      },
      {
        id: 'meet-seller',
        question: 'Can I meet the seller in person?',
        answer: (
          <p>
            Yes — in-person meetups are <strong>encouraged</strong> so you can inspect
            the item before confirming receipt. Always meet at a{' '}
            <strong>designated campus safety zone</strong> such as the Library foyer, the
            Student Center, or another busy public spot on campus. Never meet off-campus
            or in isolated areas, and never pay outside of the QUADS platform.
          </p>
        ),
      },
    ],
  },

  /* ── Selling ──────────────────────────────────────────────────────────── */
  {
    id: 'selling',
    label: 'Selling',
    icon: <CreditCard className="h-4 w-4" />,
    accent: 'bg-emerald-500',
    items: [
      {
        id: 'how-to-list',
        question: 'How do I list an item?',
        answer: (
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Complete{' '}
              <Link
                to="/seller/onboarding"
                className="underline font-black hover:text-[#ff6b6b] transition-colors"
              >
                Seller Onboarding
              </Link>{' '}
              from your profile (one-time setup, under 2 minutes).
            </li>
            <li>
              Click <strong>"+ Sell Something"</strong> in the nav bar or from your Seller
              Dashboard.
            </li>
            <li>Fill in the item title, category, condition, price, and description.</li>
            <li>Upload at least one clear, well-lit photo of the actual item.</li>
            <li>Hit Submit — your listing goes live on the marketplace immediately.</li>
          </ol>
        ),
      },
      {
        id: 'what-can-i-sell',
        question: 'What can I sell?',
        answer: (
          <>
            <p className="mb-4">
              Anything a fellow UMaT student might need! Popular categories include:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase tracking-widest">
              {[
                'Textbooks & Notes',
                'Electronics & Gadgets',
                'Clothing & Accessories',
                'Hostel Furniture & Items',
                'Stationery & Supplies',
                'Student Services',
              ].map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-3 py-2"
                >
                  <span className="h-2 w-2 shrink-0 bg-[#ff6b6b]" />
                  {cat}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px]">
              See the{' '}
              <Link
                to="/terms#prohibited"
                className="underline font-black hover:text-[#ff6b6b] transition-colors"
              >
                prohibited items list
              </Link>{' '}
              for what you cannot sell on the platform.
            </p>
          </>
        ),
      },
      {
        id: 'how-do-i-get-paid',
        question: 'How do I get paid?',
        answer: (
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Once a buyer confirms receipt, funds are released from escrow immediately.
            </li>
            <li>The amount appears in your <strong>QUADS Wallet</strong> instantly.</li>
            <li>
              Go to{' '}
              <Link
                to="/seller/payouts"
                className="underline font-black hover:text-[#ff6b6b] transition-colors"
              >
                Seller Payouts
              </Link>{' '}
              and request a withdrawal to your linked Mobile Money (MoMo) wallet.
            </li>
            <li>Withdrawals are processed within 24–48 hours on business days.</li>
          </ol>
        ),
      },
      {
        id: 'seller-fees',
        question: 'Are there any fees for sellers?',
        answer: (
          <p>
            <strong className="text-[#ff6b6b]">None.</strong> QUADS charges{' '}
            <strong>no listing fees</strong> and takes a{' '}
            <strong>0% commission</strong> on every sale. The platform is completely free
            for the entire UMaT student community.
          </p>
        ),
      },
    ],
  },

  /* ── Safety & Trust ───────────────────────────────────────────────────── */
  {
    id: 'safety',
    label: 'Safety & Trust',
    icon: <Shield className="h-4 w-4" />,
    accent: 'bg-amber-500',
    items: [
      {
        id: 'verify-sellers',
        question: 'How do I know sellers are real students?',
        answer: (
          <p>
            Every QUADS user is verified using their{' '}
            <strong>UMaT institutional email</strong> and a photo of their{' '}
            <strong>student ID card</strong>. Our moderation team manually reviews all
            submissions before granting full access. You will see a{' '}
            <span className="inline-flex items-center gap-1 border-2 border-emerald-600 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
              ✓ Verified
            </span>{' '}
            badge on every confirmed student's profile, so you always know exactly who
            you're dealing with.
          </p>
        ),
      },
      {
        id: 'what-if-scammed',
        question: 'What if I get scammed?',
        answer: (
          <>
            <p>
              Don't panic. Our escrow system means your money is still held safely if you
              have not yet confirmed receipt. Here's what to do:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mt-3">
              <li>
                <strong>Do NOT confirm receipt</strong> if something seems wrong.
              </li>
              <li>
                File a <strong>Dispute</strong> from your Order Detail page with all
                relevant details.
              </li>
              <li>
                Our team reviews all disputes within <strong>24 hours</strong> and will
                mediate a fair resolution.
              </li>
              <li>
                Fraudulent sellers are permanently banned and reported to UMaT Student
                Affairs.
              </li>
            </ol>
            <p className="mt-4">
              You can also reach us directly at{' '}
              <a
                href="mailto:support@quadsmarket.tech"
                className="underline font-black hover:text-[#ff6b6b] transition-colors"
              >
                support@quadsmarket.tech
              </a>
              .
            </p>
          </>
        ),
      },
      {
        id: 'prohibited-items',
        question: 'What items are prohibited?',
        answer: (
          <>
            <p className="mb-4">
              The following items are <strong>strictly banned</strong>. Listing any of them
              results in immediate account suspension:
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-black uppercase tracking-widest">
              {[
                'Alcohol & Narcotics',
                'Counterfeit Currency or Items',
                'Exam Papers & Academic Leaks',
                'Prescription Medications',
                'Weapons of Any Kind',
                'Stolen Property',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 border-2 border-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-red-700 dark:text-red-300"
                >
                  <span className="text-sm shrink-0">&#10060;</span>
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px]">
              See the full{' '}
              <Link
                to="/terms#prohibited"
                className="underline font-black hover:text-[#ff6b6b] transition-colors"
              >
                Terms & Rules
              </Link>{' '}
              page for the complete policy.
            </p>
          </>
        ),
      },
    ],
  },

  /* ── Account & Technical ──────────────────────────────────────────────── */
  {
    id: 'account',
    label: 'Account & Technical',
    icon: <User className="h-4 w-4" />,
    accent: 'bg-purple-500',
    items: [
      {
        id: 'forgot-password',
        question: 'I forgot my password — what do I do?',
        answer: (
          <p>
            On the{' '}
            <Link
              to="/login"
              className="underline font-black hover:text-[#ff6b6b] transition-colors"
            >
              Login page
            </Link>
            , click the <strong>"Forgot Password"</strong> link below the sign-in button.
            Enter your UMaT institutional email and we'll send you a secure password-reset
            link. The link expires after <strong>1 hour</strong> for your security.
          </p>
        ),
      },
      {
        id: 'contact-support',
        question: 'How do I contact support?',
        answer: (
          <div className="space-y-4">
            <p>There are three ways to reach the QUADS support team:</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Email',
                  value: 'support@quadsmarket.tech',
                  href: 'mailto:support@quadsmarket.tech',
                  bg: 'bg-[var(--bulletin-card)]',
                },
                {
                  label: 'Live Chat',
                  value: 'In-app chat widget',
                  href: '/contact',
                  bg: 'bg-[#e0f2f7] dark:bg-sky-900/20',
                },
                {
                  label: 'Support Ticket',
                  value: 'Via Contact page',
                  href: '/contact',
                  bg: 'bg-[var(--bulletin-card)]',
                },
              ].map((ch) => (
                <a
                  key={ch.label}
                  href={ch.href}
                  className={`${ch.bg} border-2 border-[var(--bulletin-border)] p-4 block hover:-translate-y-1 transition-all shadow-[3px_3px_0_0_var(--bulletin-shadow)]`}
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 text-[var(--bulletin-text)] mb-1">
                    {ch.label}
                  </div>
                  <div className="text-[12px] font-black text-[var(--bulletin-text)]">
                    {ch.value}
                  </div>
                </a>
              ))}
            </div>
            <p className="text-[12px] opacity-60">
              Support hours: Monday – Friday, 8:00 AM – 6:00 PM (GMT).
            </p>
          </div>
        ),
      },
      {
        id: 'become-seller',
        question: 'How do I become a seller?',
        answer: (
          <>
            <p>Becoming a seller on QUADS is quick — under 2 minutes:</p>
            <ol className="list-decimal pl-5 space-y-2 mt-3">
              <li>Ensure your account is verified (student ID confirmed).</li>
              <li>
                Go to your{' '}
                <Link
                  to="/profile"
                  className="underline font-black hover:text-[#ff6b6b] transition-colors"
                >
                  Profile
                </Link>{' '}
                and click <strong>"Become a Seller"</strong>, or navigate directly to{' '}
                <Link
                  to="/seller/onboarding"
                  className="underline font-black hover:text-[#ff6b6b] transition-colors"
                >
                  Seller Onboarding
                </Link>
                .
              </li>
              <li>Enter a shop name and a brief description of what you sell.</li>
              <li>Link your Mobile Money (MoMo) wallet for receiving payouts.</li>
              <li>
                Submit — your seller role activates immediately and you can start listing!
              </li>
            </ol>
          </>
        ),
      },
    ],
  },
];

/* ─── Accordion Item Component ────────────────────────────────────────────── */

interface AccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  item,
  isOpen,
  onToggle,
  index,
}) => (
  <div
    className={`border-4 border-[var(--bulletin-border)] transition-all duration-200 ${
      isOpen
        ? 'bg-[var(--bulletin-card)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]'
        : 'bg-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-border)] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)]'
    }`}
  >
    {/* Question row */}
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      className="w-full flex items-start justify-between gap-4 p-4 md:p-6 cursor-pointer text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bulletin-text)] focus-visible:ring-inset"
    >
      <div className="flex items-start gap-3 md:gap-5 flex-1 min-w-0">
        {/* Index number badge */}
        <span className="shrink-0 mt-0.5 h-6 w-6 md:h-7 md:w-7 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center text-[9px] md:text-[10px] font-black text-[var(--bulletin-text)] opacity-50">
          {String(index + 1).padStart(2, '0')}
        </span>
        {/* Question text */}
        <span className="text-sm md:text-base font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-snug group-hover:text-[#ff6b6b] transition-colors">
          {item.question}
        </span>
      </div>

      {/* Chevron toggle */}
      <span className="shrink-0 mt-0.5 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-1 transition-colors group-hover:bg-[var(--bulletin-text)] group-hover:text-[var(--bulletin-bg)]">
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[var(--bulletin-text)] group-hover:text-[var(--bulletin-bg)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--bulletin-text)] group-hover:text-[var(--bulletin-bg)]" />
        )}
      </span>
    </button>

    {/* Answer panel */}
    {isOpen && (
      <div className="border-t-4 border-[var(--bulletin-border)] px-4 md:px-6 py-4 md:py-6">
        <div className="flex gap-4">
          {/* Coral accent left bar */}
          <div className="shrink-0 w-1 bg-[#ff6b6b] self-stretch" />
          <div className="text-sm md:text-[15px] font-bold leading-relaxed text-[var(--bulletin-text)] opacity-80 flex-1 min-w-0 space-y-2">
            {item.answer}
          </div>
        </div>
      </div>
    )}
  </div>
);

/* ─── Main Page Component ─────────────────────────────────────────────────── */

const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');
  const [openId, setOpenId] = useState<string | null>('what-is-quads');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentCategory =
    FAQ_CATEGORIES.find((c) => c.id === activeCategory) ?? FAQ_CATEGORIES[0];

  const isSearching = searchQuery.trim().length > 0;

  /** When searching, scan ALL categories; otherwise show the active category only */
  const filteredItems: FAQItem[] = isSearching
    ? FAQ_CATEGORIES.flatMap((cat) =>
        cat.items.filter((item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : currentCategory.items;

  const handleToggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  const totalQuestions = FAQ_CATEGORIES.reduce(
    (sum, c) => sum + c.items.length,
    0
  );

  return (
    <BulletinLayout title="FAQ" subtitle="Frequently Asked Questions" section="08">

      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-10 md:py-16 relative overflow-hidden">
        {/* Large watermark */}
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 select-none text-[12rem] md:text-[18rem] font-black leading-none opacity-[0.04] text-[var(--bulletin-text)] pointer-events-none">
          FAQ
        </div>
        {/* Decorative tape strips */}
        <div className="absolute top-0 left-20 h-5 w-28 bg-[#ffd700]/40 rotate-[-2deg]" />
        <div className="absolute bottom-0 right-24 h-5 w-20 bg-[#ff6b6b]/30 rotate-[1.5deg]" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--bulletin-text)] opacity-40 mb-3">
            QUADS — UMaT Campus Marketplace
          </p>
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] mb-4 leading-none">
            Got Questions?
            <br />
            <span className="inline-block bg-[#ff6b6b] text-white px-3 mt-2 shadow-[4px_4px_0_0_var(--bulletin-shadow)] rotate-[-0.5deg]">
              We've Got Answers.
            </span>
          </h1>
          <p className="text-sm md:text-base font-bold opacity-60 text-[var(--bulletin-text)] max-w-xl leading-relaxed mt-4">
            Browse{' '}
            <strong className="opacity-100">{totalQuestions} answers</strong> across{' '}
            <strong className="opacity-100">{FAQ_CATEGORIES.length} categories</strong>,
            or search for exactly what you need below.
          </p>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="max-w-4xl mx-auto">

          {/* Search bar */}
          <div className="mb-6 md:mb-10">
            <div className="border-4 border-[var(--bulletin-border)] flex items-center gap-3 bg-[var(--bulletin-card)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] px-4 py-3 focus-within:shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-all">
              <Search className="h-5 w-5 shrink-0 text-[var(--bulletin-text)] opacity-40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenId(null);
                }}
                placeholder="Search questions... (e.g. payment, seller, register)"
                className="flex-1 bg-transparent text-[13px] md:text-[14px] font-bold text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30 focus:outline-none uppercase tracking-wide"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-text)] hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category tab row — hidden while the user is searching */}
          {!isSearching && (
            <div className="mb-6 md:mb-8 overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex gap-2 md:gap-3 min-w-max">
                {FAQ_CATEGORIES.map((cat) => {
                  const isActive = cat.id === activeCategory;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setOpenId(null);
                      }}
                      className={`flex items-center gap-2 border-4 border-[var(--bulletin-border)] px-3 md:px-5 py-2 md:py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bulletin-text)] ${
                        isActive
                          ? `${cat.accent} text-white shadow-[4px_4px_0_0_var(--bulletin-border)] -translate-y-[2px]`
                          : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)] shadow-[4px_4px_0_0_var(--bulletin-border)] hover:-translate-y-[1px] hover:shadow-[5px_5px_0_0_var(--bulletin-shadow)]'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                      {/* Item-count badge */}
                      <span
                        className={`border-2 border-current px-1.5 py-0.5 text-[9px] font-black leading-none ${
                          isActive ? 'border-white/50 bg-white/20' : 'opacity-40'
                        }`}
                      >
                        {cat.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search results context label */}
          {isSearching && (
            <div className="mb-5 flex items-center gap-3">
              <div className="border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/20 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-black dark:text-yellow-200">
                {filteredItems.length === 0
                  ? 'No results found'
                  : `${filteredItems.length} result${
                      filteredItems.length === 1 ? '' : 's'
                    } for "${searchQuery}"`}
              </div>
            </div>
          )}

          {/* Category section header — shown in normal (non-search) mode */}
          {!isSearching && (
            <div className="mb-5 md:mb-7 flex items-center gap-4">
              <div
                className={`${currentCategory.accent} border-4 border-[var(--bulletin-border)] p-3 text-white shadow-[4px_4px_0_0_var(--bulletin-border)]`}
              >
                {React.cloneElement(
                  currentCategory.icon as React.ReactElement<{ className: string }>,
                  { className: 'h-5 w-5' }
                )}
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 text-[var(--bulletin-text)]">
                  Category
                </div>
                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] leading-tight">
                  {currentCategory.label}
                </h2>
              </div>
            </div>
          )}

          {/* Accordion list */}
          {filteredItems.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {filteredItems.map((item, idx) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isOpen={openId === item.id}
                  onToggle={() => handleToggle(item.id)}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            /* Empty / no-results state */
            <div
              className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-10 md:p-16 text-center shadow-[8px_8px_0_0_var(--bulletin-shadow)]"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-20 text-[var(--bulletin-text)]" />
              <p className="text-lg md:text-xl font-black uppercase tracking-tight text-[var(--bulletin-text)] mb-2">
                No Matching Questions
              </p>
              <p className="text-[13px] font-bold opacity-50 text-[var(--bulletin-text)] mb-8 max-w-xs mx-auto">
                Try different keywords or clear the search to browse by category.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-8 py-3 text-[12px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Still need help? CTA card */}
          <div className="mt-10 md:mt-14">
            <div
              className="border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/20 p-6 md:p-10 shadow-[8px_8px_0_0_var(--bulletin-shadow)] relative overflow-hidden"
              style={{ transform: 'rotate(0.4deg)' }}
            >
              {/* Tape strip decoration */}
              <div className="absolute -top-3 left-8 h-5 w-24 bg-[#ffd700]/60 rotate-[-2deg]" />

              <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 text-black dark:text-yellow-200 mb-2">
                    Can't find your answer?
                  </p>
                  <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-black dark:text-yellow-100 leading-tight mb-3">
                    Still Need Help?
                  </h3>
                  <p className="text-[13px] font-bold opacity-70 leading-relaxed text-black dark:text-yellow-200">
                    Our campus support team is standing by. Reach us via email, live chat,
                    or drop by the support desk at Tovet Hostel — Mon–Fri, 8 AM–6 PM.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                  <Link
                    to="/contact"
                    className="flex-1 border-4 border-black bg-black text-white text-center py-4 px-6 text-[11px] md:text-[12px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] transition-all"
                  >
                    Open Support Ticket
                  </Link>
                  <a
                    href="mailto:support@quadsmarket.tech"
                    className="flex-1 border-4 border-black bg-transparent text-black dark:text-yellow-100 text-center py-4 px-6 text-[11px] md:text-[12px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                  >
                    Email Us Directly
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* ── Quick Links Footer Band ─────────────────────────────────────────── */}
      <BulletinSection bgColor="bg-[var(--bulletin-card)]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 text-[var(--bulletin-text)] mb-4">
            Related Pages
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Platform Rules', to: '/terms', desc: 'Marketplace policies' },
              { label: 'Privacy Policy', to: '/privacy', desc: 'How we use your data' },
              { label: 'Contact Us', to: '/contact', desc: 'Reach our team' },
              { label: 'Support Centre', to: '/support', desc: 'Help articles & guides' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 md:p-5 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all group"
              >
                <div className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] group-hover:text-[#ff6b6b] transition-colors mb-1">
                  {link.label}
                </div>
                <div className="text-[11px] font-bold opacity-40 text-[var(--bulletin-text)]">
                  {link.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </BulletinSection>

    </BulletinLayout>
  );
};

export default FAQPage;
