# QUADS (Private)

QUADS is a premium, high-fidelity campus commerce platform designed for student buying, selling, trust-based operations, and administrative oversight. 

## Product Identity: "Bulletin Board"
The platform utilizes a unique **Bulletin Board Design System**, inspired by physical campus notice boards. It avoids generic SaaS "slop" (gradients, rounded corners, glassmorphism) in favor of:
- Rigid black borders and hard-offset shadows.
- Polaroid-style product framing with rotation.
- Monospace technical typography.
- Fragmented, paper-on-board layout metaphors.

## Core Capabilities

- **Marketplace Intelligence**:
  - Real-time price insights and smart pricing assistance.
  - Social proof surfaces (Sold feeds, Trending drops).
- **Growth Tooling**:
  - Campaign scheduling and featured listing boosts.
  - Native coupon and bundle creation for sellers.
  - Advanced CSV bulk import with visual preview.
- **Trust & Safety**:
  - Institutional verification flow.
  - Secure dispute mediation center.
  - Profile completion gates for high-trust actions.
- **Messaging Subsystem**:
  - Real-time socket-based chat with typing indicators.
  - Integrated offer objects and transaction metadata.

## System Architecture

- `web/` — React + Vite (Hardened Bulletin System)
- `server/` — Express + TypeScript (Mongoose/Supabase/Socket.io)
- `mobile/` — Expo React Native (Rebranded QUADS app)

## Administrative Access

Admins have access to the **Command Center** at `/admin`. 

### Initializing Demo Admin
To seed a test administrator (`admin@quads.app` / `password123`), run:
```bash
cd server
npm run seed:admin
```

### Promoting Existing Users
To promote a specific user to the `admin` role via CLI:
```bash
cd server
npx ts-node src/scripts/make-admin.ts <email>
```

---
*This repository is maintained for private product development.*
