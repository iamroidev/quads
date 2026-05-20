# QUADS — Next Steps & Backlog

## Infrastructure (Do Soon)

### EC2 OS Migration (Node 16 → 20)
Amazon Linux 2 cannot run Node 18+. Current workaround: Google OAuth uses axios tokeninfo instead of google-auth-library. When ready to migrate:
1. Allocate an **Elastic IP** on AWS and attach it to the current instance (keeps IP static forever)
2. Launch new **Amazon Linux 2023** instance (same region, same key pair)
3. SCP `.env` and `~/quads/` to new instance
4. Install Node 20, PM2, run `npm install --production`
5. Attach Elastic IP to new instance — DNS and mobile app config unchanged
6. Terminate old instance
> No DNS change, no mobile rebuild needed if Elastic IP is used.

### GitHub Secrets (CI/CD blocked until set)
Add these at https://github.com/iamroidev/quads/settings/secrets/actions:
- `EC2_SSH_KEY` — full contents of `quads-key.pem` (enables auto-deploy on push)
- `EXPO_TOKEN` — from expo.dev account settings (enables auto Android build)

---

## Features

### High Priority
- [ ] **Phone number verification** — Africa's Talking for Ghana (MTN/Telecel/AirtelTigo). Add as optional step after OTP email registration. Required for sellers receiving payouts.
- [ ] **In-app dispute resolution flow** — buyers/sellers can upload evidence, chat within dispute thread, admin mediates. Currently disputes are raised but resolution is manual.
- [ ] **Seller payout dashboard improvements** — show payout history timeline, estimated next payout date, commission breakdown per order.
- [ ] **Product video support** — already in schema, needs upload UI in CreateEditProduct and video player in ProductDetail.
- [ ] **Bundle deals** — sellers create product bundles with combined discount. GrowthTools schema exists, no UI.
- [ ] **Coupon codes** — sellers issue percentage/fixed discount codes. Schema exists, no checkout integration.

### Medium Priority
- [ ] **Order tracking timeline** — visual step-by-step progress (Paid → Confirmed → Ready → Completed) in OrderDetail.
- [ ] **Seller analytics charts** — revenue over time, top products, repeat buyers. Currently just number cards.
- [ ] **Campus Pulse improvements** — currently only has activity feed. Add event posts, lost & found persistence to DB (currently AsyncStorage only).
- [ ] **Following feed** — buyers follow sellers and see their new listings. Schema/endpoint exists, UI is minimal.
- [ ] **Search with filters** — current search is basic. Add price range, condition, delivery method, distance filters.
- [ ] **Review system** — buyers can rate sellers after order completion. Schema exists, no UI trigger.

### Lower Priority
- [ ] **Referral system** — share link, earn credit when friend registers and makes first purchase.
- [ ] **Flash sale creation UI** — sellers can set flash sale price + end time from their listing management screen.
- [ ] **Saved searches / price alert preferences** — users configure which saved items trigger price alerts.
- [ ] **Admin broadcast push from mobile** — currently web-admin only.

---

## UI/UX Improvements

### Mobile
- [ ] **Bottom tab spacing** — on narrow phones (360px) tab labels overlap. Consider icon-only tabs on small screens.
- [ ] **Product image zoom** — pinch-to-zoom on ProductDetail image gallery.
- [ ] **Skeleton loaders** — replace ActivityIndicator spinners with skeleton screens on HomeScreen, Browse, OrdersList.
- [ ] **Pull-to-refresh** — add to all list screens (Orders, Browse, Notifications).
- [ ] **Haptic feedback** — add light haptics on button presses, OTP box entry, cart add.
- [ ] **Offline state** — show banner when network is unavailable instead of silent failures.

### Web
- [ ] **Responsive admin dashboard** — currently breaks on tablet. Tables need horizontal scroll or card layout on <768px.
- [ ] **Product image carousel** — web ProductDetail only shows first image. Add swipe/dots navigation.
- [ ] **Toast positioning** — currently top-right. Move to bottom-center on mobile web.
- [ ] **Loading states on form submissions** — some forms lack disabled state during submit.

---

## Technical Debt

- [ ] **Remove `supabaseJwt.ts`** — unused file still in `server/src/utils/`. Safe to delete.
- [ ] **Update `seedDemoAdmin.ts`** — still references Supabase. Update to direct MongoDB user creation.
- [ ] **`retryJob` worker implementation** — `runRetryJob` marks jobs completed without executing them. Implement actual dispatch by job type.
- [ ] **Migrate LostFound to MongoDB** — currently AsyncStorage (mobile) + localStorage (web). Data is lost on app reinstall.
- [ ] **Rate limiting tuning** — auth endpoints have rate limits but no IP-based blocking for brute force OTP attempts across sessions.
- [ ] **Move hardcoded EC2 IP out of CI** — currently `54.167.221.2` is hardcoded in `.github/workflows/ci.yml`. Move to `EC2_HOST` secret.

---

## Remotion Teaser Video
The programmatic video is in `remotion/`. Run `npm start` inside to preview, `npm run render:both` to export MP4s. Currently uses color-block placeholders for product images — replace with real screenshots for final version.

```bash
cd remotion && npm install && npm run render:both
```
