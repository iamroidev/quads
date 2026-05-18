# UX Review Checklist

Use this checklist before marking any screen as ready-to-ship on **web** or **mobile**.

---

## 1. Loading & Error States
- [ ] Every async operation shows a **loading spinner / skeleton** while in-flight
- [ ] Every async operation shows an **error state** (toast or inline message) on failure
- [ ] Empty states are present when a list has no items (use `BulletinEmptyState` on web)
- [ ] Retry affordance is available for failed network requests

## 2. Form Validation & Feedback
- [ ] Required fields are clearly marked
- [ ] Inline validation fires on blur (not just on submit)
- [ ] Submit button is disabled / shows loading state while submitting
- [ ] Success confirmation is shown after a write operation
- [ ] Destructive actions (delete, cancel order) require a confirmation dialog

## 3. Accessibility
- [ ] Colour contrast meets WCAG AA (≥ 4.5:1 for normal text)
- [ ] All interactive elements are keyboard-reachable and have visible focus rings
- [ ] Images have meaningful `alt` text (or `alt=""` for decorative images)
- [ ] Form inputs are labelled (use `<label>` or `aria-label`)

## 4. Responsiveness (Web)
- [ ] Screen renders correctly at 375 px (mobile), 768 px (tablet), 1280 px (desktop)
- [ ] No horizontal scroll at any breakpoint
- [ ] Touch targets are ≥ 44 × 44 px

## 5. Navigation & Deep Links
- [ ] Back-navigation returns the user to the correct previous screen
- [ ] Authenticated routes redirect unauthenticated users to `/login` (web) or `LoginScreen` (mobile)
- [ ] Role-gated routes redirect unauthorised users appropriately
- [ ] Deep links (product, order, chat) resolve correctly on both platforms

## 6. Cross-Platform Parity
- [ ] Feature behaves identically on web and mobile (or the difference is intentional and documented)
- [ ] Shared language/copy matches between web and mobile
- [ ] Notification triggers fire for both platforms (push + browser)

## 7. Performance
- [ ] Page/screen first meaningful paint is < 2 s on a mid-range device over 4 G
- [ ] Images are served at an appropriate resolution (Cloudinary auto-optimisation enabled)
- [ ] No layout shift (CLS) caused by late-loading images or fonts

## 8. Trust & Safety
- [ ] "Report" affordance is available on every listing, chat, and order screen
- [ ] Verified-seller badge is displayed wherever seller identity is shown
- [ ] Prices and availability reflect live data (not stale cache)

---

**Owner**: Product & Design lead  
**Review cadence**: Every sprint before demo day
