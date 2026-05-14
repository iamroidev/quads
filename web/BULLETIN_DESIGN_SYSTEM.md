# Bulletin Board Design System (QUADS)

## Overview
The QUADS platform utilizes a "Bulletin Board" design language inspired by physical campus notice boards, street market signage, and vintage newspaper layouts. This system creates a tactile, high-contrast, and memorable user experience that stands out from generic web templates.

## Core Principles

### 1. **Zero-Slop Policy**
- ❌ **No Hero Sections**: Use fragmented headers with industrial metadata.
- ❌ **No Gradients**: Use solid, high-contrast colors and paper tokens.
- ❌ **No Rounded Corners**: All elements are rigid and square.
- ❌ **No Glassmorphism**: Use solid paper surfaces with hard shadows.

### 2. **Physical Metaphor**
- **Pinned Notices**: Element containers overlap and use rotation to feel like pinned paper.
- **Polaroid Framing**: Product images are framed in white borders with tape accents.
- **Hard Shadows**: Shadows are opaque and offset (`shadow-[4px_4px_0_0_black]`).
- **Technical Monospace**: Primary typography uses monospace fonts for a "typewriter" or "protocol" feel.

### 3. **Standalone Security Subsystems**
- Authentication pages (Login, Signup, Forgot Password) are **decoupled** from the global navigation to emphasize security and focus.
- These pages use a high-contrast split-screen or centered-card layout.

## Color Palette (The Paper Tokens)

### Backgrounds
- `bg-[#f8f7f4]` - Primary board background (warm cream).
- `bg-[#fffdf8]` - Standard paper card.
- `bg-[#fffacd]` - Yellow notice (important).
- `bg-[#e0f2f7]` - Blue signal (informative).
- `bg-[#fce4ec]` - Pink accent (promotional).

### Accents
- `bg-black` - Primary identity color.
- `bg-[#ff6b6b]` - Secondary highlight (thumbtacks, primary buttons).

## Component Library

### `BulletinLayout`
The root wrapper. Handles theme-aware headers/footers and industrial breadcrumbs.
- `section`: Numeric code for the current module (e.g., "01").
- `hideHero`: Removes the large institutional title for sub-pages.

### `BulletinSection`
The container for content blocks. Uses the `bg-[var(--bulletin-bg)]` token to ensure consistency.

### `BulletinCard`
The core atomic unit. 
- `rotation`: Degree of offset (recommended -1.5 to 1.5).
- `shadow`: Always hard-edged.

## Interactive States

- **Lift & Stabilize**: On hover, cards should lift (`-translate-y-1`) and rotate back to `0deg`.
- **Thumbtack Detail**: Important notices use the `BrandMark` component or red square accents to indicate they are "pinned".

## Responsive Patterns

- **Horizontal Strips**: For categories and products on small screens, use `overflow-x-auto` with `scrollbar-hide`.
- **Newspaper Grid**: Content should collapse into single-column layouts on mobile while maintaining the border-heavy aesthetic.

---
**Last Updated**: 2026-05-14
**Design Version**: 2.0 (Hardened QUADS Edition)
