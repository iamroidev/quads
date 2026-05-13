# Mobile App Design System — CampusMarketplace

> **Scope:** This document covers the React Native (Expo) mobile app located at `mobile/`.
> The web app has a completely separate design system — see `web/BULLETIN_DESIGN_SYSTEM.md`.

---

## Stack

| Tool | Version / Notes |
|---|---|
| **Framework** | React Native via Expo (EAS build) |
| **Navigation** | React Navigation v6 (Bottom tabs + Stack) |
| **Styling** | `StyleSheet.create()` — no Tailwind, no NativeWind |
| **Safe area** | `react-native-safe-area-context` |
| **Auth** | Supabase + custom JWT (same server as web) |
| **Push** | Expo Push Notifications (token stored server-side) |

---

## Design Language

The mobile app uses a **warm-toned editorial market aesthetic** — distinct from the web's bulletin board style, but sharing the same anti-slop principles:

- ❌ No rounded cards (all corners are square, `borderRadius: 0`)
- ❌ No gradient buttons
- ❌ No shadows with blur
- ❌ No card elevation/drop shadows
- ✅ Hard borders (`borderWidth: 1`)
- ✅ Uppercase labels with tight letter-spacing
- ✅ Heavy font weights (`fontWeight: '800'` / `'900'`)
- ✅ Dark hero sections on dark warm-black background (`#1f1a14`)
- ✅ Warm cream/parchment surface tones (not cold white)

---

## Core Theme — `src/theme.ts`

**Always import from `../theme` — never hardcode these values inline.**

```ts
import { colors, spacing, type } from '../theme';
```

### Colors

```ts
colors.bg        = '#f8f4ec'   // Main screen background — warm parchment
colors.surface   = '#fffdf8'   // Cards, form panels — cream paper
colors.text      = '#1f1a14'   // Primary text — dark warm-black
colors.muted     = '#7b6f61'   // Secondary text, subtitles
colors.border    = '#ddcfb8'   // All borders — warm tan
colors.accent    = '#2f5d4f'   // CTA links, focus states — forest green
colors.accentAlt = '#c57f3f'   // Search button, highlights — amber
colors.danger    = '#b3453a'   // Error states, destructive actions
```

### Additional inline colors used across screens

These appear frequently in stylesheets and should be treated as de-facto tokens:

```ts
'#1f1a14'              // Dark hero background, primary button fill
'#f4ecdd'              // ScreenHeader background — lighter than bg
'#fffdf8'              // Card / form surface (same as colors.surface)
'rgba(0,0,0,0.45)'     // Featured image overlay
'rgba(255,255,255,0.08)' // Dark hero input fill
'rgba(255,255,255,0.18)' // Dark hero input border
```

### Spacing

```ts
spacing.xs = 6
spacing.sm = 10
spacing.md = 14
spacing.lg = 20
spacing.xl = 28
```

### Typography

```ts
type.label    = { fontSize: 10, letterSpacing: 1.6, fontWeight: '800' }
type.title    = { fontSize: 28, fontWeight: '900' }
type.subtitle = { fontSize: 14, fontWeight: '500' }
```

---

## Components

### `ScreenHeader` — `src/components/ScreenHeader.tsx`

Used at the top of every main screen (inside the tab, above the scroll).

```tsx
import ScreenHeader from '../components/ScreenHeader';

<ScreenHeader
  eyebrow="Campus marketplace"   // Optional — small uppercase label above title
  title="Orders"                  // Required — large uppercase heading
  subtitle="Track your purchases" // Optional — muted description line
/>
```

**Visual spec:**
- Background: `#f4ecdd` (lighter than main bg)
- Bottom border: `colors.border`
- Eyebrow: 10px, `#7c6f60`, uppercase, letterSpacing 1.6, weight 800
- Title: 28px, `colors.text`, uppercase, weight 900, letterSpacing -0.4
- Subtitle: 13px, `#7b6f61`, lineHeight 18

### `AppAlert` — `src/components/AppAlert.tsx`

Custom modal alert. Use instead of `Alert.alert()` for consistent styling.

```tsx
import AppAlert from '../components/AppAlert';

const [alertState, setAlertState] = useState({ visible: false, title: '', message: '' });

<AppAlert
  visible={alertState.visible}
  title={alertState.title}
  message={alertState.message}
  onClose={() => setAlertState({ visible: false, title: '', message: '' })}
/>
```

### `AuthHero` — `src/components/AuthHero.tsx`

Shared hero block for Login/Register screens (eyebrow + title + subtitle + optional image).

---

## Layout Patterns

### Screen Shell

Every screen should follow this shell:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const MyScreen = ({ navigation }: any) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader eyebrow="Section" title="Screen Name" />
      {/* content */}
    </ScrollView>
  </SafeAreaView>
);
```

### Section Header (inside scroll)

```tsx
<View style={styles.sectionHeader}>
  <Text style={styles.sectionLabel}>LATEST</Text>
  <Text style={styles.sectionTitle}>Recent Listings</Text>
</View>

// styles:
sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
sectionLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', letterSpacing: 1.8, textTransform: 'uppercase' },
sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1f1a14', marginTop: 2, textTransform: 'uppercase' },
```

### Product Card (2-column grid)

```tsx
card: {
  flex: 1,
  backgroundColor: '#fffdf8',
  borderRadius: 0,              // ALWAYS 0 — no rounding
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: colors.border,
},
cardImage: { width: '100%', height: 120, backgroundColor: '#e5e7eb' },
cardBody: { padding: 8 },
cardTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
cardPrice: { marginTop: 4, fontSize: 14, fontWeight: '800', color: colors.accent },
cardMeta: { marginTop: 2, fontSize: 10, color: '#9a8e7f', textTransform: 'uppercase', letterSpacing: 0.9 },
```

### Horizontal Scroll

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
  {items.map(item => (
    <TouchableOpacity key={item._id} style={{ width: 220, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fffdf8', padding: 14 }}>
      {/* content */}
    </TouchableOpacity>
  ))}
</ScrollView>
```

### Form Panel

```tsx
form: {
  backgroundColor: '#fffdf8',
  borderWidth: 1,
  borderColor: '#dccfb8',
  padding: 20,
},
label: {
  fontSize: 11, fontWeight: '800', color: '#6f6559',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.2,
},
input: {
  borderWidth: 1, borderColor: '#ddcfb8',
  paddingHorizontal: 14, paddingVertical: 12,
  fontSize: 15, color: '#1f1a14',
  backgroundColor: '#fff',
  borderRadius: 0,   // ALWAYS 0
},
```

### Primary Button

```tsx
button: { backgroundColor: '#1f1a14', paddingVertical: 13, alignItems: 'center' },
buttonText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
```

### Secondary / Outline Button

```tsx
outlineBtn: { borderWidth: 1, borderColor: colors.border, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fffdf8' },
outlineBtnText: { color: '#1f1a14', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
```

### Dark CTA Block

```tsx
darkCta: {
  marginHorizontal: 16, marginBottom: 20, borderWidth: 1,
  borderColor: '#2f2921', backgroundColor: '#1f1a14', padding: 14,
},
darkCtaTop: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
darkCtaTitle: { marginTop: 6, fontSize: 18, color: '#fff', fontWeight: '900', textTransform: 'uppercase' },
darkCtaSub: { marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
```

### Status Badge

```tsx
badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.border },
badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

// Colors by status:
// active   → backgroundColor: '#d1fae5', color: '#065f46'  (soft green)
// sold     → backgroundColor: '#ede9fe', color: '#5b21b6'  (soft purple)
// pending  → backgroundColor: '#fef3c7', color: '#92400e'  (amber)
// rejected → backgroundColor: '#fee2e2', color: '#991b1b'  (soft red)
```

---

## Hero Section (Dark)

Used on `HomeScreen`. When you need a full-bleed dark section:

```tsx
hero: {
  backgroundColor: '#1f1a14',
  paddingTop: 18, paddingBottom: 28, paddingHorizontal: 20,
},
heroGreeting: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 },
// Search input in dark hero:
searchInput: {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  borderRadius: 0,
  paddingHorizontal: 14, paddingVertical: 11,
  fontSize: 14, color: '#fff',
},
```

---

## Navigation Structure — `AppNavigator.tsx`

```
AppNavigator
├── AuthStack  (when not logged in)
│   ├── Login
│   └── Register
└── MainTabs  (when logged in)
    ├── HomeTab      → HomeScreen
    ├── ProductsTab  → ProductsScreen → ProductDetailScreen
    ├── SellerTab    → CreateListingScreen / MyListingsScreen / SellerAnalyticsScreen
    ├── OrdersTab    → OrdersScreen → OrderDetailScreen
    └── ProfileTab   → ProfileScreen → ProfileEditScreen → SettingsScreen
                                      → SavedScreen
                                      → NotificationsScreen
                                      → ConversationListScreen → ChatScreen
```

---

## Screen Inventory

| Screen | File | Status |
|---|---|---|
| Home | `HomeScreen.tsx` | ✅ Complete |
| Products | `ProductsScreen.tsx` | ✅ Complete |
| Product Detail | `ProductDetailScreen.tsx` | ✅ Complete |
| Login | `LoginScreen.tsx` | ✅ Complete |
| Register | `RegisterScreen.tsx` | ✅ Complete |
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
| **Verification** | *(missing)* | ❌ Not built yet |
| **Forgot Password** | *(missing)* | ❌ Not built yet |

### Missing Screens to Build

#### 1. VerificationScreen
- Route: add to `ProfileTab` stack or show as modal post-login for unverified sellers
- Should offer email OTP tab and phone OTP tab (mirrors web `Verification.tsx`)
- API: `POST /api/verification/send-email`, `POST /api/verification/send-sms`, `POST /api/verification/verify`

#### 2. ForgotPasswordScreen
- Route: add to `AuthStack` as screen reachable from `LoginScreen`
- Uses `supabase.auth.resetPasswordForEmail()` — no backend needed
- Show success state after sending

---

## Key Rules for Contributors

1. **No `borderRadius`** — always `0` or omit it (defaults to 0 in React Native)
2. **Import colors from `theme.ts`** — don't hardcode bg/border/text hex values
3. **Uppercase labels** — all section labels, button text, eyebrows: `textTransform: 'uppercase'`
4. **Heavy weights** — labels: `fontWeight: '800'`, titles: `fontWeight: '900'`, body: `'600'`
5. **No colored shadows** — React Native elevation/shadow should be avoided; use borders instead
6. **`borderRadius: 0`** on all inputs, buttons, and cards — explicitly set it to override platform defaults on Android
7. **`SafeAreaView` with `edges={['top']}`** on all screens (bottom is handled by the tab bar)
8. **Use `AppAlert` not `Alert.alert()`** for user-facing errors and confirmations

---

## File Structure

```
mobile/
├── src/
│   ├── theme.ts              ← SINGLE SOURCE OF TRUTH for colors/spacing/type
│   ├── components/
│   │   ├── AppAlert.tsx      ← Custom modal alert
│   │   ├── AuthHero.tsx      ← Auth screen hero block
│   │   └── ScreenHeader.tsx  ← Universal screen top header
│   ├── screens/              ← One file per screen
│   ├── navigation/
│   │   └── AppNavigator.tsx  ← All navigation config
│   ├── services/             ← API service modules (match web services)
│   ├── context/              ← AuthContext, SocketContext
│   └── types/                ← Shared TypeScript types
├── assets/                   ← Images, icons, splash
├── app.json                  ← Expo config, bundle ID, scheme
└── eas.json                  ← EAS build profiles
```

---

*Last updated: 2026-05-13*
*Covers: Expo SDK 51+, React Navigation 6*
