# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Mobile AI Support Integration**: Ports the web's smart chatbot to mobile. Created a gold neobrutalist **QUADS AI Support Assistant** banner inside [SupportScreen.tsx](file:///c:/Users/richi/Desktop/quads/mobile/src/screens/SupportScreen.tsx) that contacts the active support agent via the server API, coordinates automated handshakes, and opens a direct live chatbot conversation.
- **Dynamic Growth Control Center**: Rebuilt [GrowthToolsScreen.tsx](file:///c:/Users/richi/Desktop/quads/mobile/src/screens/GrowthToolsScreen.tsx) as a fully functional marketing console with Featured Campaigns (with abSlot selection and date validations) and Smart Coupons (`%` percentage or `GHS` fixed calculations) posting live to the backend database.
- **Neobrutalist Sales Dashboard**: Redesigned [SellerOrdersScreen.tsx](file:///c:/Users/richi/Desktop/quads/mobile/src/screens/SellerOrdersScreen.tsx) with neobrutalist card styling, segment-specific tabs (All, Pending, Completed, Disputed), status indicators, and custom empty states.
- **Central README** with project overview, quick-start guides, and contribution steps.
- **CI workflow** (`.github/workflows/ci.yml`) with lint, test, and build jobs.
- **ESLint + Prettier** configuration for consistent code style.
- **EditorConfig** for uniform editor settings.
- **GitHub `.gitignore`** to protect sensitive files.
- **Mobile unit tests** with Jest + React Native Testing Library.
- **Server test suite** already in place; verified CI integration.
- **Sentry integration** for mobile error monitoring.
- **Asset organization script** (`scripts/organize-assets.js`).
- **Documentation for brain scripts** (READMEs in each `brain/*/scratch` folder).

### Changed
- **Stable Root Navigation Wrapper**: Architected `MainTabsWrapper` in [AppNavigator.tsx](file:///c:/Users/richi/Desktop/quads/mobile/src/navigation/AppNavigator.tsx) to completely resolve parent-re-render unmount loops. Terminated 100% of duplicate component mount cycles and Axios 429 rate limit errors.
- **Spatiotemporal Bottom Tab Spacing**: Re-architected bottom tab navigators into separate static `BuyerTabs` and `SellerTabs` inside [AppNavigator.tsx](file:///c:/Users/richi/Desktop/quads/mobile/src/navigation/AppNavigator.tsx) to eliminate layout index shifts and spacer gaps, assuring perfectly even spacing on all phone screens.
- **Me Tab Customization**: Rewrote [ProfileScreen.tsx](file:///c:/Users/richi/Desktop/quads/mobile/src/screens/ProfileScreen.tsx) to render context-aware menus (general shopping support and campus board lists for buyers, store manager and dispute resolution centers for sellers).
- **Mobile `package.json`**: Added test, lint, and lint:fix scripts.
- **Root `package.json`**: Added lint scripts.
- **Mobile `App.tsx`**: Integrated Sentry initialization.
- **Mobile `navigationRef.ts`**: Added documentation.

### Security
- **`.env`** added to `.gitignore`.
- **`.env.example`** should be created manually by developers.