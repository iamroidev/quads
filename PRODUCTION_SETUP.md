# QUADS — Production Setup Guide

This guide walks you through everything needed to make QUADS work online for real users.

---

## 1. Overview — What Connects to What

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Vercel (Web)   │◄────►│  AWS EC2 (API)   │◄────►│ MongoDB Atlas   │
│  Static React   │      │  Express + Node  │      │  Database       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  Paystack       │      │  Cloudinary      │
│  Payments       │      │  Image Storage   │
└─────────────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Google OAuth   │
│  Sign-in        │
└─────────────────┘
```

---

## 2. Environment Variables — What MUST Change

> **⚠️ IMPORTANT**: All env vars now live in a SINGLE root `.env` file.  
> The old per-package `server/.env`, `web/.env` files have been removed.  
> Only `mobile/.env` survives (Expo limitation — contains a subset of root vars).  
> **Why?** Multiple `.env` files get out of sync — one gets updated, the other doesn't, causing bugs.

### 2.1 Root `.env` — CRITICAL CHANGES

| Variable | Override File | Current Value | What to Change To | Where to Get It |
|----------|--------------|--------------|-------------------|-----------------|
| `NODE_ENV` | `server/.env.production` | `development` | `production` | Just type it |
| `MONGODB_URI` | `server/.env.production` | `mongodb+srv://...` | MongoDB Atlas string | [MongoDB Atlas](https://cloud.mongodb.com) |
| `JWT_SECRET` | `server/.env.production` | (current) | Random 64-char string | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLIENT_URL` | `server/.env.production` | `http://localhost:5200` | Your Vercel URL | Vercel dashboard |
| `PAYSTACK_SECRET_KEY` | shared (root `.env`) | `sk_live_...` | ✅ Already live — keep it | Paystack dashboard |
| `PAYSTACK_PUBLIC_KEY` | shared (root `.env`) | `pk_live_...` | ✅ Already live — keep it | Paystack dashboard |
| `SMTP_FROM` | `server/.env.production` | `noreply@campusmarketplace.com` | `noreply@yourdomain.com` | Your domain |
| `PLATFORM_COMMISSION` | shared (root `.env`) | `10` | Your commission % | Your choice |

**⚠️ NEW variables you may need to add (to `server/.env.production`):**

```bash
# Paystack Webhook Security
PAYSTACK_WEBHOOK_SECRET=whsec_your_paystack_webhook_secret

# Paystack Transfer (for payouts)
PAYSTACK_COMMISSION_PERCENT=10
```

### 2.2 Web Frontend (`web/.env.production`) — OVERRIDE FILE

> Vite now reads from the root `.env` via `envDir: '..'` in vite.config.ts.  
> But you can still override VITE_* vars in `web/.env.production` for production builds.

```bash
VITE_API_URL=https://your-aws-ec2-ip.amazonaws.com/api
VITE_SOCKET_URL=https://your-aws-ec2-ip.amazonaws.com
```

> **Important**: The web app currently falls back to `/api` which only works when API and web are on the same domain. Since web is on Vercel and API is on AWS, you MUST set the full API URL.

### 2.3 Mobile App (`mobile/.env` or `app.json`)

> `mobile/.env` now contains ONLY EXPO_PUBLIC_* vars (subset of root `.env`).  
> Update it separately for production:

```bash
EXPO_PUBLIC_API_URL=https://your-aws-ec2-ip.amazonaws.com/api
EXPO_PUBLIC_SOCKET_URL=https://your-aws-ec2-ip.amazonaws.com
```

---

## 3. External Services — Step-by-Step Setup

### 3.1 MongoDB Atlas (Database)

**If you don't have it yet:**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Log in
3. Create a new cluster (FREE tier: M0 — 512MB, shared)
4. Choose region closest to your AWS server (e.g., `us-east-1`)
5. Create a database user:
   - Username: `quads_admin`
   - Password: Generate a strong password, SAVE IT
6. Under **Network Access** → **IP Access List**:
   - Click "Add IP Address"
   - Choose "Allow access from anywhere" (0.0.0.0/0) — needed since AWS EC2 IP is dynamic
7. Go to **Database** → **Connect** → **Drivers** → **Node.js**
8. Copy the connection string:
   ```
   mongodb+srv://quads_admin:<password>@cluster0.xxxxx.mongodb.net/quads?retryWrites=true&w=majority
   ```
9. Replace `<password>` with your actual password
10. This is your `MONGODB_URI`

---

### 3.2 Paystack Dashboard (Payments + Payouts)

**Login**: [dashboard.paystack.com](https://dashboard.paystack.com)

#### A. Webhooks (Critical — tells your server when payment succeeds)

1. Go to **Settings** → **API Keys & Webhooks**
2. Scroll to **Webhooks**
3. Add webhook URL:
   ```
   https://your-aws-ec2-ip.amazonaws.com/api/payments/webhook
   ```
   (Replace with your actual server URL)
4. Events to listen for: `charge.success`, `transfer.success`, `transfer.failed`
5. Save the **Webhook Secret** — this goes in `server/.env` as `PAYSTACK_WEBHOOK_SECRET`

#### B. Transfers (For paying sellers)

1. Go to **Transfers** → **Settings**
2. Enable transfers if not already enabled
3. Set up transfer recipient (your platform's bank account or MoMo)
4. Note: The code creates transfer recipients dynamically per seller

#### C. API Keys

Your live keys are stored in `.env` (never commit them):
- `PAYSTACK_SECRET_KEY=sk_live_<your-paystack-secret-key>`
- `PAYSTACK_PUBLIC_KEY=pk_live_<your-paystack-public-key>`

✅ If they are already set in `.env`, keep them. Find them in your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developers).

---

### 3.3 Google Cloud Console (Google Sign-In)

**Login**: [console.cloud.google.com](https://console.cloud.google.com)

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID (stored as `GOOGLE_CLIENT_ID` in `.env`)
3. Click **Edit** (pencil icon)
4. Under **Authorized JavaScript origins**, ADD:
   ```
   https://web-3q1q9bvna-roi-dev.vercel.app
   https://your-custom-domain.com     (if you have one)
   ```
5. Under **Authorized redirect URIs**, ADD:
   ```
   https://web-3q1q9bvna-roi-dev.vercel.app/auth/callback
   https://your-aws-ec2-ip.amazonaws.com/api/auth/google/callback
   ```
6. Click **Save**

> ⚠️ **IMPORTANT**: Google OAuth will reject requests from URLs not in this list. If users can't sign in with Google, this is why.

---

### 3.4 Vercel Dashboard (Web Frontend)

**Login**: [vercel.com/dashboard](https://vercel.com/dashboard)

1. Find your project: `quads-web` or `web`
2. Click **Settings** → **Environment Variables**
3. Add:
   ```
   VITE_API_URL = https://your-aws-ec2-ip.amazonaws.com/api
   ```
4. Click **Save**
5. Redeploy the project (Vercel → Deployments → Redeploy)

---

### 3.5 Cloudinary (Image Storage)

Your credentials are stored in `.env` (never commit them):
- `CLOUDINARY_CLOUD_NAME=<your-cloud-name>`
- `CLOUDINARY_API_KEY=<your-api-key>`
- `CLOUDINARY_API_SECRET=<your-api-secret>`

✅ If they are already set in `.env`, keep them. Find them in your [Cloudinary console](https://console.cloudinary.com/). Make sure your Cloudinary account is active.

---

### 3.6 Supabase

Your Supabase project credentials are stored in `.env` (never commit them):
- `SUPABASE_URL=<your-supabase-project-url>`
- `SUPABASE_SERVICE_KEY=<your-supabase-service-key>`

**Do you need to change this?**

❌ **NO** — Supabase URL stays the same. It's the same project for dev and production.

✅ **YES** — If you want separate dev/prod databases, create a new Supabase project and update the URL + key.

---

### 3.7 AWS SNS (SMS Verification)

You already have AWS CLI configured (Account: `806889657718`).

**What's already working:**
- `AWS_REGION=us-east-1`
- `AWS_SNS_SENDER_ID=CAMPUS` (or change to `QUADS`)
- AWS credentials are read from `~/.aws/credentials`

**Do you need to change anything?**

❌ **NO** — AWS SNS uses your local AWS credentials file. As long as:
1. Your AWS account is active
2. SNS is enabled in your region
3. You have permission to send SMS

✅ **YES** — Update `AWS_SNS_SENDER_ID` to `QUADS` for branding.

---

### 3.8 Resend (Email)

You have Resend configured:
- `SMTP_HOST=smtp.resend.com`
- `SMTP_PASS=re_SavrDqdV_FHskRzRZ794gXdyky8MhNZcq`
- `SMTP_FROM=noreply@quadsmarket.tech`

**Do you need to change anything?**

✅ **YES** — Update `SMTP_FROM` to your actual domain:
```bash
SMTP_FROM=noreply@quads.app  # or your actual domain
```

⚠️ The domain `quadsmarket.tech` must be verified in Resend dashboard for emails to send reliably.

---

## 4. Server Deployment Checklist

### Step 1: Build the server locally
```bash
cd server
npm install
npm run build
```

### Step 2: Create production `.env`
Edit `server/.env.production` with production values. The root `.env` stays as your dev config.

### Step 3: Deploy to AWS
```bash
cd ..  # back to project root
bash deploy-aws.sh
```

### Step 4: Copy files to EC2
```bash
# Replace with your actual EC2 IP
scp -i quads-key.pem -r server/dist server/package.json server/package-lock.json server/.env.production server/uploads ec2-user@YOUR_EC2_IP:/home/ec2-user/quads/
```

### Step 5: SSH and start
```bash
ssh -i quads-key.pem ec2-user@YOUR_EC2_IP
cd /home/ec2-user/quads
npm install --production
pm2 start dist/app.js --name quads-api
pm2 save
pm2 startup
```

### Step 6: Test the API
```bash
curl https://YOUR_EC2_IP:5000/api/health
```
Should return:
```json
{"success":true,"message":"QUADS API is running","timestamp":"..."}
```

---

## 5. Post-Deployment Verification

### Test the full flow:

1. **Open web app**: https://web-3q1q9bvna-roi-dev.vercel.app
2. **Sign up** with email
3. **Create a listing** (upload image → Cloudinary)
4. **Buy the listing** (Paystack test card: `4084 0840 8408 4081`, CVV: `123`, Expiry: any future date)
5. **Check payout** — Log in as admin, go to Admin Dashboard → Payouts tab
6. **Verify auto-payout** — Wait 15 minutes or trigger manually

---

## 6. Quick FAQ

**Q: Will it work everywhere online?**
A: YES, once all env vars are set correctly and all external services are configured. The web is already on Vercel (global CDN). The API will be on AWS (global). Paystack works in Ghana, Nigeria, South Africa.

**Q: Do I need to update Supabase URL?**
A: NO — the Supabase project URL stays the same for dev and production. Only update if you want a separate production database.

**Q: Do I need to update Google Console?**
A: YES — add your Vercel URL and AWS API URL to "Authorized JavaScript origins" and "Authorized redirect URIs". Without this, Google Sign-In will fail.

**Q: What about Paystack?**
A: You need to:
1. Set the webhook URL in Paystack dashboard
2. Enable transfers (if not already)
3. Add `PAYSTACK_WEBHOOK_SECRET` to `.env`

**Q: What about the mobile app?**
A: Update `EXPO_PUBLIC_API_URL` to your AWS API URL, then build with EAS:
```bash
cd mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Q: Do I need a custom domain?**
A: Not immediately. Vercel gives you a free subdomain. AWS gives you a free EC2 subdomain. But for production, buy a domain (e.g., `quads.app`) and point it to both.

---

## 7. Summary — What to Do Right Now

### Immediate (Today):
1. ✅ **Web is deployed** — https://web-3q1q9bvna-roi-dev.vercel.app
2. ⬜ **Set up MongoDB Atlas** — Get connection string
3. ⬜ **Set up Paystack webhook** — Add your future AWS URL
4. ⬜ **Update Google Console** — Add Vercel URL to authorized origins
5. ⬜ **Create `server/.env.production`** — With all production values

### This Week:
6. ⬜ **Deploy backend to AWS** — Run `deploy-aws.sh`
7. ⬜ **Test end-to-end** — Sign up, list, buy, payout
8. ⬜ **Set custom domain** — Optional but recommended

### Next Week:
9. ⬜ **Build mobile app** — EAS build for iOS/Android
10. ⬜ **Security hardening** — Rate limiting, input validation
11. ⬜ **Add tests** — Jest + React Testing Library
