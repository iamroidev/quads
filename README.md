# QUADS Marketplace 🚀

**QUADS** is a premium, high-fidelity campus commerce platform designed for student buying, selling, trust-based operations, and administrative oversight. 

[![Site Status](https://img.shields.io/website?url=https%3A%2F%2Fquadsmarket.tech)](https://quadsmarket.tech)
[![Production Backend](https://img.shields.io/badge/backend-AWS%20EC2-orange)](https://api.quadsmarket.tech)
[![Frontend](https://img.shields.io/badge/frontend-Vercel-black)](https://quadsmarket.tech)

## 🎨 Product Identity: "Bulletin Board"
The platform utilizes a unique **Bulletin Board Design System**, inspired by physical campus notice boards. It avoids generic SaaS "slop" in favor of:
- **Rigid Aesthetics**: Sharp borders and hard-offset shadows.
- **Paper Metaphor**: Polaroid-style product framing with interactive rotation.
- **Premium Typography**: Monospace and technical font pairings.

## 🚀 Deployment Status (Production)
The platform is fully deployed and operational across the following stack:
- **Frontend**: [quadsmarket.tech](https://quadsmarket.tech) (Hosted on **Vercel** with **Cloudflare Proxy**).
- **Backend**: [api.quadsmarket.tech](https://api.quadsmarket.tech) (Hosted on **AWS EC2** using **PM2** and **Let's Encrypt**).
- **Database**: **MongoDB Atlas** (Managed Cloud Cluster).
- **Identity**: **Supabase Auth** (Secure Student Verification).

## 🛠️ Core Capabilities
- **Marketplace Intelligence**: Real-time price insights, smart pricing assistance, and social proof feeds.
- **Growth Tooling**: Campaign scheduling, featured listing boosts, and native coupon/bundle creation.
- **Trust & Safety**: Institutional verification flow, secure dispute mediation, and profile completion gates.
- **Real-time Messaging**: Socket-based chat with typing indicators and integrated transaction metadata.
- **Price Alert System**: Saved items with price tracking and change notifications (>5% triggers alerts).
- **Social Discovery**: Follow/unfollow system, follower feeds, and new follower notifications.

## 📂 Project Structure
- `web/` — React + Vite (The Hardened Bulletin UI).
- `server/` — Express + TypeScript (Mongoose/Supabase/Socket.io).
- `mobile/` — Expo React Native (The Rebranded QUADS App).

## 💻 Technical Setup

### Backend (Server)
```bash
cd server
npm install
npm run build
# Start in production
npx pm2 start dist/app.js --name quads-api
```

### Frontend (Web)
```bash
cd web
npm install
npm run dev
```

---
*Developed and maintained by **iamroidev** for the university community.*
