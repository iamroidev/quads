# QUADS — Phase 2 Roadmap

## ✅ Completed (Production Launch)

- [x] **Automatic Payout System**: Secure Paystack disbursement every 15 mins.
- [x] **Seller Earnings Ledger**: Real-time transaction history for sellers.
- [x] **Resend API Integration**: 100% email delivery via Axios-based API calls.
- [x] **Role-Based Branding**: Personalized welcome emails for Buyers and Sellers.
- [x] **Deployment Sync**: Robust `./sync-platform.ps1` for pushing local updates to EC2.
- [x] **Growth Toolkit**: Functional Coupons, Bundles, and Campaign boosting.
- [x] **Automatic Discovery**: In-page coupon surfacing for buyers (Amazon-style).
- [x] **Price Alert System**: Saved items with price tracking and change notifications (>5% triggers alerts).
- [x] **Social Discovery**: Follow/unfollow system, follower feeds, and new follower notifications.

## 🚀 Next Phase: Scaling & Engagement

### 1. 📱 Mobile Sync & App Store Prep
*   **Deep Linking**: Set up universal links so that email notifications (e.g., "New Message") open the mobile app directly.
*   **Push Notifications**: Finalize Expo Push Token storage in the `User` model to enable real-time mobile alerts.
*   **EAS Build**: Run production builds for Android/iOS to test end-to-end auth on real devices.

### 2. 💬 Communication & Trust
*   **SMS Gateway (AWS SNS)**: Integrate SMS alerts for order confirmations, providing a fallback for users without data.
*   **Verification Badges**: Implement the "Scholar Badge" logic for students who have verified their institutional ID.
*   **Dispute Center**: Create a basic UI for buyers to flag issues with an order, freezing the payout in escrow.

### 3. 🎨 Marketing & Growth
*   **Premium Share Previews**: Update `index.html` with dynamic OpenGraph tags so product links look stunning on WhatsApp.
*   **Analytics Dashboard**: Complete the `GrowthService` wiring to track which categories are trending.
*   **SEO Audit**: Ensure all product pages are indexable with proper meta descriptions.

### 4. 🔮 Future Enhancements (Post-MVP)
*   **Escrow Service**: For high-value transactions (>GHS 500)
*   **AR Product Preview**: Mobile AR view for products (furniture, electronics)
*   **AI-Powered Pricing**: Machine learning suggestions for optimal pricing
*   **Offline Mode**: Cache product listings for browsing without internet
*   **Bulk Operations**: For power sellers (bulk price updates, bulk relisting)

## 🛠️ Maintenance Commands
| Goal | Command |
| :--- | :--- |
| **Sync Update** | `powershell -File .\sync-platform.ps1 "commit message"` |
| **Check API Health** | `curl https://api.quadsmarket.tech/api/health` |
| **View Live Logs** | `ssh ec2 "pm2 logs quads-api"` |
| **Database Check** | Access MongoDB Atlas Dashboard (Cluster: `quads`) |
| **Run Price Check** | `npm run price-check` (manual trigger for price alert cron) |

---
*Updated by Antigravity AI — 2026-05-17*