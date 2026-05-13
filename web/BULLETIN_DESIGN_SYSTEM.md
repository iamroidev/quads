# Bulletin Board Design System

## Overview
The CampusMarketplace web app uses a unique "Bulletin Board" design language inspired by physical campus notice boards and street markets. This system avoids all common web design tropes and creates a timeless, tactile experience.

## Core Principles

### 1. **No AI Slop**
- ❌ No hero sections
- ❌ No gradient buttons
- ❌ No rounded cards
- ❌ No parallax scroll
- ❌ No glassmorphism
- ❌ No centered CTAs
- ❌ No bootstrap gridsalso there's 

### 2. **Bulletin Board Metaphor**
- Fragmented layouts (like pinned notices)
- Rotated elements (polaroid-style)
- Hard shadows (paper on board)
- Monospace typography (typewriter feel)
- Tape effects (visual anchors)

## Color Palette

### Background Colors
```css
bg-[#f8f7f4]  /* Main background - warm cream */
bg-[#faf8f5]  /* Section 1 - warm off-white */
bg-[#f5f9fa]  /* Section 2 - cool off-white */
bg-[#faf8f3]  /* Section 3 - neutral warm */
bg-[#fcfbf8]  /* Section 4 - subtle cream */
```

### Header Strip Colors
```css
bg-[#fff5e1]  /* Left - warm cream */
bg-[#e8f4f8]  /* Middle - cool blue-gray */
bg-[#f0e8f4]  /* Right - soft lavender */
```

### Notice/Card Colors
```css
bg-[#fffacd]  /* Yellow notice - lemon chiffon */
bg-[#e0f2f7]  /* Blue notice - ice blue */
bg-[#fce4ec]  /* Pink notice - blush pink */
bg-[#fefdfb]  /* White card - paper white */
bg-[#fffef9]  /* Warm white - cream paper */
```

## Components

### BulletinLayout
Wraps entire pages with consistent header and footer.

```tsx
import { BulletinLayout } from '../components/layout/BulletinLayout';

<BulletinLayout 
  title="Page Title" 
  subtitle="Section name"
  section="02"
>
  {/* Your content */}
</BulletinLayout>
```

### BulletinSection
Creates consistent content sections.

```tsx
import { BulletinSection } from '../components/layout/BulletinLayout';

<BulletinSection
  title="Section Title"
  subtitle="Section 01"
  bgColor="bg-[#faf8f5]"
  action={<Link to="/view-all">View all →</Link>}
>
  {/* Section content */}
</BulletinSection>
```

### BulletinCard
Creates rotated, shadowed cards.

```tsx
import { BulletinCard } from '../components/layout/BulletinLayout';

<BulletinCard 
  rotation={-1.5} 
  bgColor="bg-[#fffacd]"
>
  <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">
    Label
  </div>
  <div className="font-bold">Content</div>
</BulletinCard>
```

## Typography

### Font Stack
```css
font-mono  /* Primary - monospace for technical feel */
```

### Text Sizes
```css
text-[10px]  /* Labels, metadata */
text-[11px]  /* Small text, links */
text-[12px]  /* Body text */
text-[13px]  /* Default body */
text-base    /* Headings (16px) */
text-lg      /* Section titles (18px) */
text-2xl     /* Page titles (24px) */
```

### Text Styles
```css
uppercase tracking-wider opacity-40  /* Labels */
font-bold                            /* Emphasis */
leading-tight                        /* Compact text */
```

## Borders & Shadows

### Borders
```css
border border-black  /* All borders are solid black, 1px */
```

### Shadows
```css
shadow-[3px_3px_0_0_rgba(0,0,0,1)]  /* Small shadow */
shadow-[4px_4px_0_0_rgba(0,0,0,1)]  /* Medium shadow */
shadow-[6px_6px_0_0_rgba(0,0,0,1)]  /* Large shadow */
shadow-[8px_8px_0_0_rgba(0,0,0,1)]  /* Extra large shadow */
```

## Layout Patterns

### Polaroid Product Cards
```tsx
<div 
  className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]"
  style={{ transform: `rotate(${rotation}deg)` }}
>
  <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
    <img src={image} alt={title} className="h-full w-full object-cover" />
    {/* Tape effect */}
    <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60" 
         style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
  </div>
  <div className="mt-3 space-y-1">
    <div className="truncate font-bold leading-tight">{title}</div>
    <div className="text-base font-bold">GHS {price}</div>
  </div>
</div>
```

### Horizontal Scroll (Street Signs)
```tsx
<div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
  {items.map((item, idx) => (
    <div 
      key={item.id}
      className="flex-shrink-0 border border-black bg-white p-6"
      style={{ 
        width: '180px',
        transform: `rotate(${(idx % 2) * 2 - 1}deg)`
      }}
    >
      {/* Content */}
    </div>
  ))}
</div>
```

### Newspaper Columns
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <div key={item.id} className="flex gap-3 border border-black bg-white p-3">
      <div className="h-20 w-20 flex-shrink-0 border border-black/10 bg-gray-100">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="font-bold leading-tight line-clamp-2">{item.title}</div>
        <div className="text-[11px] opacity-50">{item.category}</div>
        <div className="font-bold">GHS {item.price}</div>
      </div>
    </div>
  ))}
</div>
```

## Interactive States

### Hover Effects
```css
/* Lift on hover */
transition-transform hover:-translate-y-1

/* Shadow increase on hover */
hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)]

/* Background change on hover */
hover:bg-[#f8f7f4]

/* Underline toggle */
hover:underline
hover:no-underline
```

### Rotation on Hover
```tsx
<div
  style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = `rotate(${rotation}deg)`;
  }}
>
  {/* Content */}
</div>
```

## Form Elements

### Input Fields
```tsx
<input
  type="text"
  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
/>
```

### Select Dropdowns
```tsx
<select className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black">
  <option>Option 1</option>
</select>
```

### Buttons
```tsx
{/* Primary button */}
<button className="border border-black bg-black px-3 py-1.5 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">
  Action
</button>

{/* Secondary button */}
<button className="border border-black bg-white px-3 py-1.5 text-[11px] font-bold uppercase transition-colors hover:bg-[#f8f7f4]">
  Action
</button>
```

## Responsive Design

### Mobile-First Approach
```css
/* Mobile: single column */
grid gap-4

/* Tablet: 2 columns */
md:grid-cols-2

/* Desktop: 4 columns */
lg:grid-cols-4
```

### Horizontal Scroll on Mobile
```css
overflow-x-auto pb-4 scrollbar-hide
```

## Usage Examples

### Converting Existing Pages

1. **Wrap with BulletinLayout**
```tsx
import { BulletinLayout } from '../components/layout/BulletinLayout';

const MyPage = () => {
  return (
    <BulletinLayout title="My Page" subtitle="Section" section="03">
      {/* Content */}
    </BulletinLayout>
  );
};
```

2. **Use BulletinSection for content blocks**
```tsx
<BulletinSection title="Products" subtitle="Section 01" bgColor="bg-[#faf8f5]">
  {/* Product grid */}
</BulletinSection>
```

3. **Apply bulletin styling to cards**
```tsx
<div className="border border-black bg-white p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
  {/* Card content */}
</div>
```

## Files to Reference

- `web/src/pages/Home.tsx` - Main homepage with all patterns
- `web/src/pages/ProductsBulletin.tsx` - Products page example
- `web/src/components/layout/BulletinLayout.tsx` - Layout components
- `web/src/index.css` - Custom utilities (scrollbar-hide)

## Design Philosophy

This design system creates a **timeless, tactile experience** that feels like a physical campus marketplace digitized. It avoids all trendy web design patterns and instead draws inspiration from:

- Physical bulletin boards
- Polaroid photos
- Street market signs
- Newspaper layouts
- Typewriter aesthetics

The result is a unique, memorable interface that stands out from generic web apps.
