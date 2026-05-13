# CampusMarketplace — Project Context

> **Read this before making any changes.**
> This document is the single source of truth for project architecture, design rules, and contributor context.

---

## What Is This?

A campus-only peer-to-peer marketplace for UMaT (University of Mines and Technology, Ghana) students to buy and sell items: textbooks, gadgets, hostel gear, clothing, and more.

**Three apps, one server:**

| App | Path | Tech | Purpose |
|---|---|---|---|
| **Web** | `web/` | React + Vite + Tailwind | Main buyer/seller experience in the browser |
| **Mobile** | `mobile/` | React Native + Expo | Native iOS/Android app |
| **Server** | `server/` | Node.js + Express + MongoDB | Shared REST API + WebSocket server |

---

## Architecture

```
campusmarketplace/
├── web/          Web app (Vite + React + Tailwind)
├── mobile/       Mobile app (Expo + React Native)
├── server/       Backend API (Express + MongoDB)
├── shared/       Shared TypeScript types & constants
└── .env          Root env (used by server)
```

### Server API Base: `http://localhost:5000/api`

All auth, products, orders, chat, notifications, and verification go through this server. Both web and mobile hit the same endpoints.

---

## Auth System

- **Provider:** Supabase (Google OAuth + email/password)
- **Session:** Supabase handles tokens; we exchange for a custom **JWT** signed by our server
- **Flow:** Supabase sign-in → send `supabaseAccessToken` to `/api/auth/login` or `/api/auth/google` → receive our JWT → store in localStorage (web) or SecureStore (mobile)
- **Roles:** Every user is either a `buyer` or `seller` (switchable in profile)

---

## ⚠️ Critical: Two Separate Design Systems

**The web and mobile apps have completely different design languages. Never cross-apply styles.**

### Web — "Bulletin Board" Design
→ Full spec in `web/BULLETIN_DESIGN_SYSTEM.md`
→ Applied status in `web/BULLETIN_DESIGN_APPLIED.md`

- React + Tailwind CSS utility classes
- Hard black borders (`border border-black`)
- Hard offset shadows (`shadow-[4px_4px_0_0_rgba(0,0,0,1)]`)
- Warm cream palette (`#faf8f5`, `#fffacd`, `#fce4ec`, `#e0f2f7`)
- Monospace font (`font-mono`)
- Uppercase tracking labels
- `BulletinLayout` / `BulletinSection` / `BulletinCard` wrapper components required on all pages

### Mobile — "Warm Editorial Market" Design
→ Full spec in `mobile/MOBILE_DESIGN_SYSTEM.md`

- React Native `StyleSheet.create()`
- `borderRadius: 0` everywhere (no rounding)
- Warm parchment palette (`#f8f4ec`, `#fffdf8`, `#ddcfb8`)
- Dark hero sections (`#1f1a14`)
- Accent green (`#2f5d4f`) + amber (`#c57f3f`)
- All theme tokens live in `mobile/src/theme.ts`
- `ScreenHeader` + `AppAlert` components used on all screens

---

## Environment Variables

### Root `.env` (used by server via `dotenv`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `CLOUDINARY_*` | Image upload (Cloudinary) |
| `PAYSTACK_*` | Payment processing |
| `SMTP_HOST/PORT/USER/PASS` | Email (currently: Resend via SMTP) |
| `SMTP_FROM` | From address for emails |
| `AWS_ACCESS_KEY_ID/SECRET` | AWS credentials (optional — falls back to `aws configure`) |
| `AWS_REGION` | AWS region for SNS SMS |
| `AWS_SNS_SENDER_ID` | SMS sender name |
| `VAPID_*` | Web Push notification keys |
| `SUPABASE_URL` | Supabase project URL |
| `CLIENT_URL` | Web app URL (for CORS + email links) |

### Mobile `mobile/.env`

```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Feature Status

### ✅ Fully Implemented

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| Auth (email + Google) | ✅ | ✅ | Supabase + custom JWT |
| Product CRUD | ✅ | ✅ | Sellers only |
| Product listing & search | ✅ | ✅ | |
| CSV/Shopify import | ✅ | — | Web only |
| Orders + Paystack checkout | ✅ | ✅ | |
| Real-time chat | ✅ | ✅ | Socket.io |
| Price negotiation (offers) | ✅ | ❌ | Web done; mobile ChatScreen needs offer UI |
| In-app notifications | ✅ | ✅ | |
| Web push (PWA) | ✅ | — | VAPID keys set |
| Expo push (mobile) | — | ✅ | Auto-cleanup of dead tokens |
| Email (order events) | ✅ | — | Resend SMTP |
| SMS OTP (phone verification) | ✅ | ❌ | Uses AWS SNS via `aws configure` |
| Email OTP (verification) | ✅ | ❌ | SMTP email |
| Seller verification gate | ✅ | ❌ | Backend enforces; mobile needs UI |
| Reviews & ratings | ✅ | ✅ | |
| Saved items / wishlist | ✅ | ✅ | |
| Disputes | ✅ | — | |
| Admin dashboard | ✅ | — | |
| Seller analytics | ✅ | ✅ | |
| Seller onboarding | ✅ | ✅ | |
| Password reset | ✅ | ❌ | Web: Supabase email reset; mobile needs screen |
| Smart pricing assistant | ✅ | — | |

### ❌ Missing on Mobile (Priority Order)

1. **VerificationScreen** — sellers need to verify email/phone before listing
2. **ForgotPasswordScreen** — reachable from LoginScreen
3. **Offer/Negotiation UI** in ChatScreen — `respondToOffer` API already built
4. **Flash sales / promotions UI** — models exist server-side

---

## Server Endpoints Reference

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/google
  GET    /api/auth/me
  PUT    /api/auth/profile
  POST   /api/auth/profile/avatar
  PUT    /api/auth/change-password
  PUT    /api/auth/switch-role
  PUT    /api/auth/seller-onboarding

Verification:
  POST   /api/verification/send-email
  POST   /api/verification/send-sms
  POST   /api/verification/verify
  GET    /api/verification/status

Products:
  GET    /api/products
  POST   /api/products
  GET    /api/products/:id
  PUT    /api/products/:id
  DELETE /api/products/:id
  POST   /api/products/import-csv
  POST   /api/products/bulk-status
  POST   /api/products/bulk-details
  POST   /api/products/:id/duplicate

Orders:
  POST   /api/orders
  GET    /api/orders
  GET    /api/orders/:id
  PUT    /api/orders/:id/status
  PUT    /api/orders/:id/cancel

Payments:
  POST   /api/payments/initialize
  POST   /api/payments/webhook

Chat:
  POST   /api/conversations
  GET    /api/conversations
  GET    /api/conversations/:id/messages
  POST   /api/conversations/:id/messages
  PUT    /api/conversations/:id/read
  PATCH  /api/conversations/:id/messages/:msgId/offer   ← Accept/reject/counter
  DELETE /api/conversations/:id

Notifications:
  GET    /api/notifications
  PUT    /api/notifications/:id/read
  PUT    /api/notifications/read-all
  DELETE /api/notifications/:id
  POST   /api/notifications/push/subscribe
  POST   /api/notifications/push/test

Reviews:
  POST   /api/reviews
  GET    /api/reviews/product/:productId
  PUT    /api/reviews/:id/reply

Categories:
  GET    /api/categories

Admin:
  GET    /api/admin/users
  GET    /api/admin/stats
  ...
```

---

## SMS / Email Services

### Email — Resend (via SMTP)
- **Host:** `smtp.resend.com:465` (SSL)
- **From:** `noreply@campusmarketplace.com`
- ⚠️ Domain must be verified in [Resend dashboard](https://resend.com/domains) for production
- For testing: change `SMTP_FROM` to `onboarding@resend.dev`

### SMS — AWS SNS
- **Credentials:** Uses `aws configure` (profile in `~/.aws/credentials`)
- **Region:** `us-east-1` (or as set in `AWS_REGION`)
- Numbers auto-formatted to `+233` (Ghana) international format
- Type: `Transactional` (highest delivery priority)
- **Sender ID:** `CAMPUS` (may not display in all countries)

---

## Google OAuth Issue (Known)

The Google Sign-In button on web shows a `403 - origin not allowed` error in development.

**Fix:** Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → select your OAuth client → add `http://localhost:5173` to **Authorized JavaScript origins**.

This is a config-only fix — no code changes needed.

---

## Running Locally

```bash
# Server
cd server && npm run dev         # starts on :5000

# Web
cd web && npm run dev            # starts on :5173

# Mobile
cd mobile && npx expo start      # open in Expo Go or simulator
```

---

*Last updated: 2026-05-13*
