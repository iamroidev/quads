# QUADS — Deployment Status & Final Steps

## ✅ Completed
- [x] **Production Security**: Generated secure 32-byte `JWT_SECRET` and updated production env.
- [x] **Server Deployment**: Built and deployed backend to AWS EC2 (`54.167.221.2`).
- [x] **Environment Optimization**: Configured Node 16 for GLIBC compatibility and PM2 for process management.
- [x] **Reverse Proxy**: Set up Nginx to handle port 80/443 traffic.
- [x] **Domain & SSL**: Linked `api.quadsmarket.tech` to EC2 and provisioned a **Let's Encrypt SSL certificate**.
- [x] **Official Branding**: Integrated `support@quadsmarket.tech` and `admin@quadsmarket.tech` for all system communications.
- [x] **Web App Sync**: Updated `web/.env.production` with the secure API URL.

## 📍 Production Details
- **API URL**: `https://api.quadsmarket.tech/api`
- **Socket URL**: `https://api.quadsmarket.tech`
- **Nginx Config**: `/etc/nginx/conf.d/quads.conf`
- **PM2 Process**: `quads-api`

## 🚀 Action Items for User
1. **Redeploy Web App**: 
   - Update Vercel environment variables to use `VITE_API_URL=https://api.quadsmarket.tech/api`.
   - Trigger a new deployment.
2. **Update Paystack Webhook**:
   - URL: `https://api.quadsmarket.tech/api/payments/webhook`
3. **Frontend Domain (Optional)**:
   - If you want the frontend at `https://quadsmarket.tech`, point the A record for the apex domain (`@`) to Vercel's IP: `76.76.21.21`.

## 🛠️ Maintenance Commands
- **Check Logs**: `pm2 logs quads-api`
- **Restart API**: `pm2 restart quads-api`
- **Check Nginx Status**: `sudo systemctl status nginx`
- **SSL Renewal**: Certbot is set to auto-renew, but you can test with `sudo certbot renew --dry-run`.