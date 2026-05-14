# Mobile App Design System — QUADS

> **Scope:** This document covers the React Native (Expo) mobile app located at `mobile/`.
> The web app has a completely separate design system — see `web/BULLETIN_DESIGN_SYSTEM.md`.

---

## Stack

| Tool | Version / Notes |
|---|---|
| **Framework** | React Native via Expo (EAS build) |
| **Navigation** | React Navigation v6 (Bottom tabs + Stack) |
| **Styling** | `StyleSheet.create()` — No Tailwind |
| **Safe area** | `react-native-safe-area-context` |
| **Auth** | Supabase + custom JWT |
| **Push** | Expo Push Notifications |

---

## Design Language

The mobile app uses a **warm-toned editorial market aesthetic** — distinct from the web's bulletin board style, but sharing the same anti-slop principles:

- ❌ No rounded cards (all corners are square, `borderRadius: 0`)
- ❌ No gradient buttons or blurred shadows
- ✅ Hard borders (`borderWidth: 1`)
- ✅ Uppercase labels with tight letter-spacing
- ✅ Heavy font weights (`800` / `900`)
- ✅ Dark hero sections on dark warm-black background (`#1f1a14`)
- ✅ Warm cream/parchment surface tones (`#f8f4ec`)

---

## Core Theme — `src/theme.ts`

**Always import from `../theme` — never hardcode these values inline.**

### Colors
- `bg`: `#f8f4ec` (Warm parchment)
- `surface`: `#fffdf8` (Cream paper)
- `text`: `#1f1a14` (Dark warm-black)
- `border`: `#ddcfb8` (Warm tan)
- `accent`: `#2f5d4f` (Forest green)
- `accentAlt`: `#c57f3f` (Amber)

---

## Screen Inventory

| Screen | File | Status |
|---|---|---|
| Home | `HomeScreen.tsx` | ✅ Complete |
| Products | `ProductsScreen.tsx` | ✅ Complete |
| Product Detail | `ProductDetailScreen.tsx` | ✅ Complete |
| Login | `LoginScreen.tsx` | ✅ Complete |
| Register | `RegisterScreen.tsx` | ✅ Complete |
| Forgot Password | `ForgotPasswordScreen.tsx` | ✅ Complete |
| Verification | `VerificationScreen.tsx` | ✅ Complete |
| My Listings | `MyListingsScreen.tsx` | ✅ Complete |
| Create Listing | `CreateListingScreen.tsx` | ✅ Complete |
| Orders | `OrdersScreen.tsx` | ✅ Complete |
| Order Detail | `OrderDetailScreen.tsx` | ✅ Complete |
| Conversations | `ConversationListScreen.tsx` | ✅ Complete |
| Chat | `ChatScreen.tsx` | ✅ Complete |
| Notifications | `NotificationsScreen.tsx` | ✅ Complete |
| Profile | `ProfileScreen.tsx` | ✅ Complete |
| Profile Edit | `ProfileEditScreen.tsx` | ✅ Complete |
| Settings | `SettingsScreen.tsx` | ✅ Complete |
| Saved Items | `SavedScreen.tsx` | ✅ Complete |
| Seller Analytics | `SellerAnalyticsScreen.tsx` | ✅ Complete |
| Seller Onboarding | `SellerOnboardingScreen.tsx` | ✅ Complete |

---

## Key Rules for Contributors

1. **No `borderRadius`** — always `0`. Explicitly set it to override platform defaults.
2. **Import colors from `theme.ts`** — don't hardcode hex values.
3. **Uppercase labels** — all section labels, button text, eyebrows: `textTransform: 'uppercase'`.
4. **Heavy weights** — labels: `fontWeight: '800'`, titles: `fontWeight: '900'`.
5. **SafeAreaView with `edges={['top']}`** on all screens.
6. **Use `AppAlert`** instead of `Alert.alert()` for consistent branding.

---

*Last updated: 2026-05-14*
*Version: 2.0.0 (QUADS Rebranded)*
