# QUADS — Project Context

> **Read this before making any changes.**
> This document is the single source of truth for project architecture, design rules, and contributor context.

---

## What Is This?

QUADS is a premium, high-fidelity peer-to-peer campus commerce platform. It enables students to buy and sell textbooks, gadgets, hostel gear, and services within a trusted, institutional ecosystem.

**Three apps, one server:**

| App | Path | Tech | Purpose |
|---|---|---|---|
| **Web** | `web/` | React + Vite + Tailwind | Hardened "Bulletin Board" experience |
| **Mobile** | `mobile/` | React Native + Expo | "Warm Editorial" mobile experience |
| **Server** | `server/` | Node.js + Express + MongoDB | Shared REST API + WebSocket server |

---

## Architecture

```
quads/
├── web/          Web app (Hardened Bulletin System)
├── mobile/       Mobile app (Warm Editorial System)
├── server/       Backend API (Express + MongoDB)
├── shared/       Shared contracts & utilities
└── .env          Root env (used by server)
```

### Server API Base: `http://localhost:5000/api`

All auth, products, orders, chat, notifications, and verification go through this server. Both web and mobile hit the same endpoints.

---

## Auth System

- **Provider:** Supabase (Google OAuth + email/password)
- **Session:** Supabase handles tokens; we exchange for a custom **JWT** signed by our server.
- **Flow:** Supabase sign-in → send `supabaseAccessToken` to `/api/auth/login` or `/api/auth/google` → receive our JWT → store in localStorage (web) or SecureStore (mobile).
- **Standalone Security**: Auth pages (Login, Register, Password Reset) are decoupled from global app layouts to emphasize security focus.

---

## ⚠️ Critical: Two Separate Design Systems

**The web and mobile apps have distinct design languages. Never cross-apply styles.**

### 1. Web — "Bulletin Board" Design Spec

The web app utilizes a "Bulletin Board" design language inspired by physical campus notice boards, street market signage, and vintage newspaper layouts. This system creates a tactile, high-contrast, and memorable user experience that stands out from generic web templates.

#### Design Principles
- **Zero-Slop Policy**: No gradients, no rounded corners, no glassmorphism, no traditional heroes.
- **Physical Metaphor**: Pinned notices, polaroid framing, hard offset shadows (`shadow-[4px_4px_0_0_black]`), technical monospace typography (`font-mono`).
- **Interactive State**: On hover, cards should lift (`-translate-y-1`) and stabilize (rotate back to `0deg`).

#### Color Palette (Paper Tokens)
- `bg-[#f8f7f4]` - Board Background (warm cream).
- `bg-[#fffdf8]` - Standard Paper Card.
- `bg-[#fffacd]` - Yellow Notice (important/success).
- `bg-[#e0f2f7]` - Blue Signal (informative).
- `bg-[#fce4ec]` - Pink Accent (promotional).
- `bg-[#ff6b6b]` - Secondary Accent (thumbtacks/buttons).

---

### 2. Mobile — "Warm Editorial Market" Design Spec

The mobile app implements a "Warm Editorial Market" design system tailored for a premium native feel on iOS and Android. It avoids rounded corners in favor of a structural, vintage-newspaper-inspired look.

#### Design Principles
- **Zero-Radius Cornering**: Absolute square edges for all screens, inputs, and components.
- **Textured Backgrounds**: Premium warm-parchment background textures with deep charcoal hero elements.
- **Layout Rhythm**: Clear horizontal scrolls, neobrutalist separators, and mathematically balanced grids.

#### Color Palette
- `#f8f4ec` - Primary Parchment Background.
- `#1f1a14` - Hero Container (deep charcoal).
- `#2f5d4f` - Main Forest Green Accent.
- `#d4af37` / `#fffacd` - Premium Gold Highlighters.

---

## Environment Variables

### Root `.env` (used by server)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `PAYSTACK_*` | Payment processing |
| `SMTP_*` | Email services (support@quads.app) |
| `AWS_*` | SMS and Infrastructure |
| `SUPABASE_*` | Authentication provider |

---

## 📊 Platform Integration & Audit Status

The platform has been thoroughly reviewed and calibrated to align both web and mobile features.

### 🟢 Implemented Features
| Feature | Status | Details |
| :--- | :--- | :--- |
| **Campus Pulse Feed** | ✅ LIVE | Algorithm-driven discovery (Hyper-local + Trending + Following). |
| **Negotiation Engine** | ✅ LIVE | Formal **"Make Offer"** flow with structured bidding. |
| **QR Handoff Security**| ✅ LIVE | 6-digit secure code verification for safe campus meetups. |
| **Scholar Verification**| ✅ LIVE | Automatic badge for `@umat.edu.gh` institutional emails. |
| **Vacation Mode** | ✅ LIVE | "Away" switch to pause listings during exams/holidays. |
| **Social Following** | ✅ LIVE | Multi-user following system with reputation/follower counts. |
| **Payments & Cart** | ✅ LIVE | Multi-item checkout + Paystack + Multi-seller order splitting. |
| **Analytics Engine** | ✅ LIVE | Tracking Chat Initiated, Offers, and Engagement Funnels. |
| **AI Support Bot** | ✅ LIVE | Smart AI bot assistant for instant student help. |
| **Growth Toolkit** | ✅ LIVE | Creating Featured Campaigns and scheduling Smart Coupons. |

### 🛠️ Infrastructure Audit (AWS EC2)
* **Node.js**: v16.20.2 (Stable)
* **Database**: MongoDB (Atlas) - Social Graph & Order Ledger Active.
* **Process Manager**: PM2 (Active: `quads-api`)
* **Email Status**: **VERIFIED** (Resend / `quadsmarket.tech` domain)
* **Environment**: Single root `.env` — server/web/mobile all read from one source.

---

## Server Endpoints Reference

```
Auth:           /api/auth/* (register, login, google, me, onboarding)
Verification:   /api/verification/* (email, sms, verify, status)
Products:       /api/products/* (crud, import, moderate, feature)
Orders:         /api/orders/* (create, status, cancel, history)
Chat:           /api/conversations/* (messages, read-sync, offers)
Admin:          /api/admin/* (stats, moderation, ops, users)
Support:        /api/support/* (ai-user, ticket)
Growth:         /api/growth/* (campaigns)
```

---

## Running Locally

```bash
# Server
cd server && npm run dev         # starts on :5000

# Web
cd web && npm run dev            # starts on :5200

# Mobile
cd mobile && npx expo start      # open in Expo Go
```

---
**Last Updated**: 2026-05-17
**Version**: 2.2.0 (Hardened & Consolidated Edition)
