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
1. **Supabase Fix (URGENT)**:
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` to **Vercel Settings** -> Environment Variables.
   - **Redeploy** on Vercel after adding them.
2. **Cloudflare Settings**:
   - Set **SSL/TLS** to **"Full (Strict)"**.
   - Enable **"Always Use HTTPS"**.
3. **Redeploy Web App**: 
   - Ensure `VITE_API_URL=https://api.quadsmarket.tech/api` is also set in Vercel.
   - Trigger a new deployment.

## 🛠️ Maintenance Commands
- **Check Logs**: `pm2 logs quads-api`
- **Restart API**: `pm2 restart quads-api`
- **Check Nginx Status**: `sudo systemctl status nginx`
- **SSL Renewal**: Certbot is set to auto-renew, but you can test with `sudo certbot renew --dry-run`.