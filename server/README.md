# QUADS Backend API 🛡️

This is the core Express.js engine powering the QUADS Marketplace. It handles real-time communication, secure payments, and database orchestration.

## 🚀 Stack
- **Runtime**: Node.js (v16 in Production)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose) + Supabase
- **Real-time**: Socket.io
- **Process Management**: PM2

## 📦 Production Deployment
The server is currently hosted on **AWS EC2** at `https://api.quadsmarket.tech`.

### Maintenance Commands (On EC2)
```bash
cd /home/ec2-user/quads
# Update code
git pull
# Rebuild
npm run build
# Restart
npx pm2 restart quads-api
```

## 🛠️ Local Development
1. Create a `.env` file based on `.env.example`.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## 🧪 Testing
```bash
npm test
```

## 🛡️ Administrative Scripts
- **Seed Admin**: `npm run seed:admin`
- **Make Admin**: `npx ts-node src/scripts/make-admin.ts <email>`

---
*Maintained by **iamroidev***
