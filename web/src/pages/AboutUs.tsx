import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Shield,
  Users,
  Zap,
  Star,
  Globe,
  TrendingUp,
  Package,
  ArrowRight,
  MapPin,
  BookOpen,
  Cpu,
} from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

/* ─── static data ───────────────────────────────────────────── */

const VALUES: {
  icon: React.FC<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
  tagBg: string;
  rotate: string;
  description: string;
}[] = [
  {
    icon: Shield,
    label: 'Trust',
    color: 'text-emerald-500',
    bg: 'bg-[#d1fae5] dark:bg-emerald-900/30',
    tagBg: 'bg-emerald-500',
    rotate: '-1deg',
    description:
      'Every seller is identity-verified with a UMaT student email and ID. You always know exactly who you are dealing with.',
  },
  {
    icon: Zap,
    label: 'Safety',
    color: 'text-[#ff6b6b]',
    bg: 'bg-[#ffe4e4] dark:bg-red-900/30',
    tagBg: 'bg-[#ff6b6b]',
    rotate: '1.2deg',
    description:
      'Payments are held in escrow until delivery is confirmed. Campus meetup zones ensure every exchange stays safe.',
  },
  {
    icon: Users,
    label: 'Community',
    color: 'text-sky-500',
    bg: 'bg-[#e0f2f7] dark:bg-sky-900/30',
    tagBg: 'bg-sky-500',
    rotate: '-0.5deg',
    description:
      'Built for students, by students. Every feature was born from a real campus pain point we lived ourselves.',
  },
  {
    icon: Heart,
    label: 'Transparency',
    color: 'text-amber-500',
    bg: 'bg-[#fef9c3] dark:bg-yellow-900/30',
    tagBg: 'bg-amber-500',
    rotate: '0.8deg',
    description:
      '0% trading fees. Open policies. No hidden costs or data selling. What you see is what you get — always.',
  },
];

const STATS: {
  value: string;
  label: string;
  sub: string;
  rotate: string;
  accent: boolean;
}[] = [
  {
    value: '0%',
    label: 'Trading Fees',
    sub: 'Always free for every student',
    rotate: '-0.8deg',
    accent: true,
  },
  {
    value: 'UMaT',
    label: 'Verified Only',
    sub: 'Student-exclusive access',
    rotate: '1.2deg',
    accent: false,
  },
  {
    value: '🔒',
    label: 'Escrow Protected',
    sub: 'Every single transaction',
    rotate: '-1.5deg',
    accent: false,
  },
  {
    value: '⚡',
    label: 'Student Built',
    sub: 'No external investors',
    rotate: '0.7deg',
    accent: true,
  },
];

const TEAM_ROLES: {
  role: string;
  detail: string;
  icon: React.FC<{ className?: string }>;
  rotate: string;
}[] = [
  { role: 'Full-Stack Eng.',   detail: 'Express, TS, WebSockets & MongoDB', icon: Cpu,    rotate: '-1deg'   },
  { role: 'UI/UX & Identity',  detail: 'Hardened Neobrutalist Design System', icon: Star,   rotate: '1.2deg'  },
  { role: 'Mobile App',        detail: 'Native Expo & React Native Client',  icon: Globe,  rotate: '0.5deg'  },
  { role: 'Operations & Sec',  detail: 'MoMo Escrow, AWS & Supabase Auth',   icon: MapPin, rotate: '-0.8deg' },
];

/* ─── page component ─────────────────────────────────────────── */

const AboutUsPage: React.FC = () => {
  return (
    <BulletinLayout title="About Us" subtitle="The QUADS Story" section="00">

      {/* ══════════════════════════════════════════════════════
          HERO — "Keep it campus."
      ══════════════════════════════════════════════════════ */}
      <div className="border-b-4 border-[var(--bulletin-border)] bg-[#1a1a1a] dark:bg-[#0a0a0a] px-4 py-10 md:px-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] relative z-10">

          {/* decorative tape strips */}
          <div className="absolute -top-3 left-12 h-7 w-32 bg-[#ffd700]/50 rotate-[-2deg] z-10" />
          <div className="absolute -top-3 right-24 h-7 w-20 bg-[#ff6b6b]/40 rotate-[1.5deg] z-10" />

          {/* giant "Q" background watermark */}
          <div className="pointer-events-none absolute -right-10 -bottom-10 select-none text-[22rem] font-black leading-none opacity-[0.04] text-white rotate-[-10deg]">
            Q
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start gap-10 lg:gap-16">

            {/* headline block */}
            <div className="flex-1 min-w-0">
              <div className="inline-block border-2 border-[#ff6b6b] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[#ff6b6b] mb-6">
                University of Mines &amp; Technology &middot; Tarkwa, Ghana
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none text-white mb-6">
                Keep it<br />
                <span className="text-[#ff6b6b]">campus.</span>
              </h1>
              <p className="text-sm md:text-lg font-bold leading-relaxed text-white/60 max-w-xl">
                QUADS is the only marketplace built exclusively for UMaT students — a verified,
                safe, and fee-free space to buy, sell, and trade everything campus life demands.
                No middlemen. No strangers from outside campus. Just your peers.
              </p>
            </div>

            {/* sticky-note mission card */}
            <div
              className="w-full lg:w-auto lg:max-w-[300px] flex-shrink-0 border-4 border-black bg-[#fffacd] dark:bg-yellow-900/30 p-8 shadow-[12px_12px_0_0_#ff6b6b]"
              style={{ transform: 'rotate(2.5deg)' }}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 text-black dark:text-yellow-200">
                Our Mission
              </div>
              <p className="text-xl font-black uppercase tracking-tight leading-snug text-black dark:text-yellow-100">
                &ldquo;No middlemen. No scammers. Just verified peers trading safely.&rdquo;
              </p>
              <div className="mt-6 h-1 w-12 bg-[#ff6b6b]" />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          OUR STORY
      ══════════════════════════════════════════════════════ */}
      <BulletinSection
        id="story"
        bgColor="bg-[var(--bulletin-card)]"
        title="Our Story"
        subtitle="How It Started"
      >
        <div className="grid gap-8 lg:grid-cols-2 items-start">

          {/* problem side */}
          <div className="space-y-6">
            <div
              className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-6 md:p-10 shadow-[8px_8px_0_0_var(--bulletin-shadow)]"
              style={{ transform: 'rotate(-0.8deg)' }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3">
                  <BookOpen className="h-6 w-6 text-[#ff6b6b]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-[var(--bulletin-text)]">
                  The Problem
                </span>
              </div>
              <p className="text-sm md:text-base font-bold leading-relaxed opacity-80 text-[var(--bulletin-text)]">
                We were UMaT students trying to sell a graphics calculator and a barely-used lab coat.
                Spammy WhatsApp buy-and-sell groups were our only option — and they were a nightmare. Constant spam, flooded chats,
                no search features, scammers, and zero accountability. We got burned. Our friends got burned.
                Everyone had a horror story.
              </p>
            </div>

            <div
              className="border-4 border-[var(--bulletin-border)] bg-[#ffe4e4] dark:bg-red-900/20 p-6 md:p-10 shadow-[8px_8px_0_0_var(--bulletin-shadow)]"
              style={{ transform: 'rotate(0.8deg)' }}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff6b6b] mb-3">
                The Breaking Point
              </div>
              <p className="text-sm md:text-base font-bold leading-relaxed text-black dark:text-red-100 opacity-90">
                After one too many sketchy WhatsApp DMs from anonymous phone numbers claiming to be &ldquo;interested buyers,&rdquo; a small
                group of us decided: if no one else will fix this for UMaT students, we will.
              </p>
            </div>
          </div>

          {/* solution side */}
          <div
            className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-8 md:p-12 shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            {/* decorative tape */}
            <div className="absolute -top-3 right-10 h-6 w-20 bg-[#ffd700]/50 rotate-[2deg]" />

            <div className="flex items-center gap-4 mb-8">
              <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-[var(--bulletin-text)]">
                The Solution
              </span>
            </div>

            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6 text-[var(--bulletin-text)] leading-none">
              QUADS was born.
            </h3>
            <p className="text-sm md:text-base font-bold leading-relaxed opacity-80 text-[var(--bulletin-text)] mb-8">
              We built a marketplace that solves every pain point we experienced.
              Verified student identity so you always know who you are trading with.
              Escrow payments so nobody gets robbed. Campus-only access so strangers
              from outside can never touch the community. Zero fees because students
              should not pay extra to trade with each other.
            </p>
            <div className="border-l-4 border-[#ff6b6b] pl-6">
              <p className="text-[13px] font-black italic uppercase tracking-tight text-[var(--bulletin-text)] opacity-70">
                &ldquo;We didn&rsquo;t build QUADS for the idea. We built it because we needed it.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* ══════════════════════════════════════════════════════
          VALUES
      ══════════════════════════════════════════════════════ */}
      <BulletinSection
        id="values"
        bgColor="bg-[var(--bulletin-bg)]"
        title="What We Stand For"
        subtitle="Core Values"
      >
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, label, color, bg, tagBg, rotate, description }) => (
            <div
              key={label}
              className={`border-4 border-[var(--bulletin-border)] ${bg} p-6 md:p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] flex flex-col gap-5`}
              style={{ transform: `rotate(${rotate})` }}
            >
              <div className="flex items-start justify-between">
                <div className="border-4 border-[var(--bulletin-border)] bg-white dark:bg-black/30 p-3">
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div
                  className={`${tagBg} text-white text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]`}
                  style={{ transform: 'rotate(2deg)' }}
                >
                  {label}
                </div>
              </div>
              <p className="text-[13px] font-bold leading-relaxed opacity-80 text-[var(--bulletin-text)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </BulletinSection>

      {/* ══════════════════════════════════════════════════════
          BY THE NUMBERS — stat cards
      ══════════════════════════════════════════════════════ */}
      <BulletinSection
        id="numbers"
        bgColor="bg-[var(--bulletin-card)]"
        title="By the Numbers"
        subtitle="What Sets Us Apart"
      >
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ value, label, sub, rotate, accent }) => (
            <div
              key={label}
              className={`group border-4 border-[var(--bulletin-border)] p-6 md:p-8 flex flex-col gap-3 relative overflow-hidden hover:-translate-y-1 transition-transform cursor-default shadow-[8px_8px_0_0_var(--bulletin-shadow)] ${
                accent
                  ? 'bg-[#ffe4e4] dark:bg-red-900/20'
                  : 'bg-[var(--bulletin-bg)]'
              }`}
              style={{ transform: `rotate(${rotate})` }}
            >
              <div className="text-4xl md:text-5xl font-black text-[var(--bulletin-text)] leading-none">
                {value}
              </div>
              <div className="text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">
                {label}
              </div>
              <div className="text-[11px] font-bold opacity-40 text-[var(--bulletin-text)]">
                {sub}
              </div>
              {/* shimmer corner on hover */}
              <div className="absolute bottom-0 right-0 h-16 w-16 bg-[var(--bulletin-border)] opacity-5 rotate-45 translate-x-6 translate-y-6 group-hover:opacity-10 transition-opacity" />
            </div>
          ))}
        </div>
      </BulletinSection>

      {/* ══════════════════════════════════════════════════════
          THE TEAM
      ══════════════════════════════════════════════════════ */}
      <BulletinSection
        id="team"
        bgColor="bg-[#f0e8f4] dark:bg-purple-900/10"
        title="The Team"
        subtitle="Who Built This"
      >
        <div className="grid gap-8 lg:grid-cols-2 items-start">

          {/* intro blurb */}
          <div
            className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 md:p-12 shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative"
            style={{ transform: 'rotate(-0.7deg)' }}
          >
            <div className="absolute -top-3 left-16 h-6 w-28 bg-[#ffd700]/50 rotate-[-1.5deg]" />
            <div className="text-[9px] font-black uppercase tracking-[0.35em] opacity-40 mb-4 text-[var(--bulletin-text)]">
              Who Built This
            </div>
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-6 text-[var(--bulletin-text)]">
              A solo, independent student engineering feat.
            </h3>
            <p className="text-sm font-bold leading-relaxed opacity-70 text-[var(--bulletin-text)] mb-6">
              QUADS wasn't built by a massive corporate company or backed by venture capital. It was engineered entirely by a single student developer at the University of Mines and Technology.
              Frustrated by the chaotic spam, security risks, and scams inside campus WhatsApp buy-and-sell groups, I built, designed, and deployed the entire cross-platform ecosystem to give my fellow students a secure trading experience they can depend on.
            </p>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-[#ff6b6b]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] opacity-60">
                Tarkwa, Western Region, Ghana
              </span>
            </div>
          </div>

          {/* role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TEAM_ROLES.map(({ role, detail, icon: Icon, rotate }) => (
              <div
                key={role}
                className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)] flex flex-col gap-4"
                style={{ transform: `rotate(${rotate})` }}
              >
                <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 w-fit">
                  <Icon className="h-5 w-5 text-[#ff6b6b]" />
                </div>
                <div>
                  <div className="text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)] mb-1">
                    {role}
                  </div>
                  <div className="text-[11px] font-bold opacity-50 text-[var(--bulletin-text)]">
                    {detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BulletinSection>

      {/* ══════════════════════════════════════════════════════
          CTA — Join / Start Selling
      ══════════════════════════════════════════════════════ */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="relative overflow-hidden border-4 border-[var(--bulletin-border)] bg-[#1a1a1a] dark:bg-[#0a0a0a] p-10 md:p-16 lg:p-24 shadow-[16px_16px_0_0_#ff6b6b]">

          {/* tape decorations */}
          <div className="absolute -top-3 left-10 h-7 w-28 bg-[#ffd700]/50 rotate-[-2deg] z-10" />
          <div className="absolute -top-3 right-16 h-7 w-20 bg-[#ff6b6b]/40 rotate-[1.5deg] z-10" />

          {/* background watermark */}
          <div className="pointer-events-none absolute -right-12 -bottom-12 select-none text-[22rem] font-black leading-none opacity-[0.03] text-white rotate-[-12deg]">
            Q
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">

            {/* headline & body */}
            <div className="max-w-2xl">
              <div className="inline-block border-2 border-[#ff6b6b] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[#ff6b6b] mb-6">
                Join the Community
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-white mb-6">
                Ready to trade<br />
                <span className="text-[#ff6b6b]">the right way?</span>
              </h2>
              <p className="text-sm md:text-base font-bold leading-relaxed text-white/60 max-w-lg">
                Stop risking your money on unverified WhatsApp group strangers.
                Join QUADS — the only campus marketplace built with your safety in mind.
                Verified, free, and campus-only.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 flex-shrink-0 w-full sm:w-auto">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-3 border-4 border-white bg-[#ff6b6b] px-8 py-5 text-[13px] font-black uppercase tracking-widest text-white shadow-[6px_6px_0_0_rgba(255,255,255,0.15)] hover:-translate-y-1 hover:bg-white hover:text-black hover:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)] transition-all"
              >
                Join the Marketplace
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/sell"
                className="group inline-flex items-center justify-center gap-3 border-4 border-white/20 bg-white/5 px-8 py-5 text-[13px] font-black uppercase tracking-widest text-white/80 hover:-translate-y-1 hover:bg-white/10 hover:border-white/40 transition-all"
              >
                Start Selling
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </BulletinSection>

    </BulletinLayout>
  );
};

export default AboutUsPage;
