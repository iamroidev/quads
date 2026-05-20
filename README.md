# QUADS — The Official Institutional Marketplace

**University of Mines and Technology · Tarkwa, Ghana**

A full-stack campus marketplace built exclusively for UMaT students — secure escrow payments, real-time chat, student ID verification, and mobile-first design.

---

## What's Built

| Layer | Stack |
|---|---|
| Mobile | React Native, Expo SDK 55, TypeScript |
| Web | Vite + React, Tailwind CSS, TypeScript |
| Server | Node.js 16, Express, MongoDB + Mongoose, Socket.io |
| Auth | Custom OTP (6-digit codes via Resend), Google OAuth (direct ID token) |
| Payments | Paystack (escrow + auto-payout to seller Mobile Money) |
| Push | Expo Push (mobile), Web Push / VAPID (web) |
| Storage | Cloudinary (images), MongoDB Atlas |
| Hosting | Vercel (web), AWS EC2 t4g.nano (server), EAS (Android APK) |
| Email | Resend API — branded QUADS template |
| Scheduled tasks | 7 background jobs (flash sales, stale orders, disputes, price drops, etc.) |

---

## Monorepo Structure

```
quads/
├── mobile/        React Native app (Expo SDK 55)
├── web/           Vite/React web app
├── server/        Node.js/Express API
├── remotion/      Programmatic teaser video (Remotion)
└── .github/       CI/CD workflows
```

---

## Getting Started

### Server

```bash
cd server
cp .env.example .env   # fill in MONGODB_URI, RESEND_API_KEY, PAYSTACK_SECRET_KEY, GOOGLE_CLIENT_IDS
npm install
npm run dev
```

### Web

```bash
cd web
npm install
npm run dev            # http://localhost:5173
```

### Mobile

```bash
cd mobile
npm install
npx expo start         # scan QR with Expo Go
```

### Required Environment Variables

| Variable | Where | Description |
|---|---|---|
| `MONGODB_URI` | server | MongoDB Atlas connection string |
| `JWT_SECRET` | server | Random secret for JWT signing |
| `SMTP_PASS` | server | Resend API key (used as SMTP_PASS) |
| `SMTP_FROM` | server | From email address |
| `PAYSTACK_SECRET_KEY` | server | Paystack live/test secret |
| `GOOGLE_CLIENT_IDS` | server | Comma-separated Google OAuth client IDs |
| `CLOUDINARY_*` | server | Cloudinary cloud name, API key/secret |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | server | Web push VAPID keys |
| `VITE_*` | web | API URL, Google client ID |
| `EXPO_PUBLIC_*` | mobile | API URL, Socket URL |

---

## CI/CD

Every push to `main` triggers:
- **Server** — TypeScript check → build → rsync to EC2 → pm2 reload *(requires `EC2_SSH_KEY` GitHub secret)*
- **Web** — TypeScript check → Vercel auto-deploy (GitHub integration)
- **Mobile** — TypeScript check → EAS build (Android APK) *(requires `EXPO_TOKEN` GitHub secret)*

Set secrets at: `https://github.com/iamroidev/quads/settings/secrets/actions`

---

## Auth Flow

No Supabase. Everything is server-side:

**Register:** `POST /api/auth/otp/send` (purpose=register) → 6-digit code via Resend → `POST /api/auth/otp/verify/register` + profile data → JWT

**Login:** `POST /api/auth/otp/send` (purpose=login) → 6-digit code → `POST /api/auth/otp/verify/login` → JWT

**Google:** Client gets ID token from Google → `POST /api/auth/google` → server verifies via `oauth2.googleapis.com/tokeninfo` → JWT

**Password reset:** `POST /api/auth/forgot-password` → OTP → `POST /api/auth/reset-password`

---

## Payments

Paystack escrow flow:
1. Buyer pays → funds held in Paystack balance
2. Seller confirms order, buyer verifies handoff (handoff code)
3. Auto-payout scheduler runs every 15 min → transfers to seller's registered Mobile Money

---

## Scheduled Background Tasks

| Task | Frequency | What it does |
|---|---|---|
| Flash sale expiry | 5 min | Clears `flashSalePrice` when `flashSaleEndsAt` passes |
| Stale order cancellation | 1 hr | Cancels unpaid orders after 24h |
| Dispute escalation | 1 hr | Flags open disputes >72h to admin |
| Reserved product release | 1 hr | Releases products stuck in `reserved` >48h |
| Sold-out check | 1 hr | Marks `stock: 0` products as `sold` |
| Price drop alerts | 30 min | Notifies saved-item users of price drops >5% |
| Draft listing cleanup | Weekly | Emails sellers with drafts >30 days old |

---

## Production URLs

- **Web:** https://quadsmarket.tech
- **API:** https://api.quadsmarket.tech/api
- **Admin:** https://quadsmarket.tech/admin (admin role required)

---

## Next Steps

See [NEXT.md](./NEXT.md) for the full feature backlog, infrastructure plans, and technical debt list.
