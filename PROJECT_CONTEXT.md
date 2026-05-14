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

### Web — "Bulletin Board" Design
→ Full spec in `web/BULLETIN_DESIGN_SYSTEM.md`

- **Visuals**: Hard black borders, hard offset shadows, monospace typography (`font-mono`).
- **Metaphor**: Physical campus notices, polaroid framing, red thumbtack accents.
- **Color Tokens**: `#faf8f5` (Board), `#fffacd` (Success), `#ff6b6b` (Alert).

### Mobile — "Warm Editorial Market" Design
→ Full spec in `mobile/MOBILE_DESIGN_SYSTEM.md`

- **Visuals**: Zero-radius corners, warm parchment backgrounds, dark hero headers.
- **Color Tokens**: `#f8f4ec` (Bg), `#1f1a14` (Hero), `#2f5d4f` (Accent).

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

## Feature Status

### ✅ Fully Implemented (Cross-Platform)

- **Identity & Auth**: email/password + Google (Supabase exchange).
- **Commerce**: Product CRUD, Polaroid grids, horizontal category scrolls.
- **Transactions**: Secure checkout (Paystack integration), order tracking, status badges.
- **Social**: Real-time Socket.io chat, offer objects (negotiation), reviews.
- **Verification**: Institutional email & SMS OTP verification (AWS SNS).
- **Operations**: Dispute mediation center, seller analytics, CSV bulk import (Web).
- **Administration**: Command Center (/admin), moderation queues, retry job dispatch.

---

## Server Endpoints Reference

```
Auth:           /api/auth/* (register, login, google, me, onboarding)
Verification:   /api/verification/* (email, sms, verify, status)
Products:       /api/products/* (crud, import, moderate, feature)
Orders:         /api/orders/* (create, status, cancel, history)
Chat:           /api/conversations/* (messages, read-sync, offers)
Admin:          /api/admin/* (stats, moderation, ops, users)
```

---

## Running Locally

```bash
# Server
cd server && npm run dev         # starts on :5000

# Web
cd web && npm run dev            # starts on :5173

# Mobile
cd mobile && npx expo start      # open in Expo Go
```

---
**Last Updated**: 2026-05-14
**Version**: 2.0.0 (Hardened QUADS Edition)
