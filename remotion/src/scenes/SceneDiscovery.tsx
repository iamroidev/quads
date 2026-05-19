import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneFrame } from '../components/PhoneFrame';
import { ProductCard } from '../components/ProductCard';
import { C } from '../tokens';

interface SceneDiscoveryProps { width: number; height: number }

const PRODUCTS = [
  { title: 'Calculus Textbook', price: 45,  condition: 'Good',     category: 'Books',       color: '#3498db' },
  { title: 'Campus Hoodie',     price: 120, condition: 'Like New', category: 'Clothing',    color: '#8e44ad' },
  { title: 'Graphic Calculator',price: 200, condition: 'New',      category: 'Electronics', color: '#27ae60' },
  { title: 'Desk Lamp',         price: 60,  condition: 'Good',     category: 'Furniture',   color: '#f39c12' },
  { title: 'Engineering Notes', price: 25,  condition: 'Fair',     category: 'Books',       color: '#e74c3c' },
  { title: 'Wireless Earbuds',  price: 180, condition: 'Like New', category: 'Electronics', color: '#1abc9c' },
];

const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothing', 'Food', 'Services'];

export const SceneDiscovery: React.FC<SceneDiscoveryProps> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = height > width;

  const phoneW   = isPortrait ? width * 0.78 : height * 0.55;
  const screenW  = phoneW;
  const screenH  = phoneW * (19.5 / 9);
  const cardW    = (screenW - 40) / 2;

  // Scroll animation — smooth downward scroll through product grid
  const scrollY = interpolate(frame, [15, fps * 8], [0, screenH * 0.55], {
    extrapolateRight: 'clamp',
    easing: (t) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
  });

  // Active category tab — changes at frame 90
  const activeCategory = frame < 90 ? 0 : frame < 150 ? 2 : 4;

  const phoneY = interpolate(
    spring({ frame, fps, config: { damping: 14, stiffness: 140 } }),
    [0, 1], [100, 0]
  );

  const screen = (
    <div style={{
      width: screenW,
      height: screenH,
      backgroundColor: C.bg,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: `${screenH * 0.05}px ${screenW * 0.05}px ${screenW * 0.03}px`,
        borderBottom: `2px solid ${C.border}`,
        backgroundColor: C.bg,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: screenW * 0.055,
          fontWeight: 900,
          color: C.accent,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontFamily: 'sans-serif',
        }}>CAMPUS BROWSE</div>
        <div style={{
          fontSize: screenW * 0.1,
          fontWeight: 900,
          color: C.text,
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
          letterSpacing: -0.5,
          marginTop: 2,
        }}>Marketplace</div>

        {/* Search bar */}
        <div style={{
          marginTop: screenW * 0.04,
          border: `2px solid ${C.border}`,
          backgroundColor: C.surface,
          padding: `${screenW * 0.03}px ${screenW * 0.04}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: `3px 3px 0 0 ${C.shadow}`,
        }}>
          <span style={{ fontSize: screenW * 0.06, color: C.muted }}>🔍</span>
          <span style={{
            fontSize: screenW * 0.05,
            color: C.muted,
            fontFamily: 'sans-serif',
          }}>Search listings...</span>
        </div>
      </div>

      {/* Category pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: `${screenW * 0.03}px ${screenW * 0.04}px`,
        flexShrink: 0,
        overflowX: 'hidden',
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: C.bg,
      }}>
        {CATEGORIES.map((cat, i) => (
          <div key={cat} style={{
            padding: `${screenW * 0.02}px ${screenW * 0.04}px`,
            backgroundColor: i === activeCategory ? C.text : C.surface,
            border: `2px solid ${C.border}`,
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}>
            <span style={{
              fontSize: screenW * 0.04,
              fontWeight: 900,
              color: i === activeCategory ? '#fff' : C.text,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontFamily: 'sans-serif',
            }}>{cat}</span>
          </div>
        ))}
      </div>

      {/* Product grid — scrolling */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: 16,
          transform: `translateY(-${scrollY}px)`,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {PRODUCTS.map((p, i) => {
            const cardOp = interpolate(frame, [i * 4, i * 4 + 8], [0, 1], { extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ opacity: cardOp }}>
                <ProductCard {...p} width={cardW} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Side label
  const labelOp = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });
  const labelFs = isPortrait ? width * 0.055 : height * 0.045;

  return (
    <div style={{
      width, height,
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: isPortrait ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isPortrait ? 24 : 60,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px),linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: `${width * 0.07}px ${width * 0.07}px`,
      }} />

      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <PhoneFrame width={phoneW}>{screen}</PhoneFrame>
      </div>

      {!isPortrait && (
        <div style={{ opacity: labelOp, maxWidth: width * 0.32, textAlign: 'left' }}>
          <div style={{
            fontSize: labelFs * 0.55, fontWeight: 900, color: C.accent,
            textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'sans-serif', marginBottom: 10,
          }}>Browse & Discover</div>
          <div style={{
            fontSize: labelFs, fontWeight: 900, color: C.text,
            textTransform: 'uppercase', fontFamily: 'sans-serif', letterSpacing: -0.5, lineHeight: 1.15,
          }}>Everything your campus needs, in one place.</div>
          <div style={{
            marginTop: 16, fontSize: labelFs * 0.6, color: C.muted, fontFamily: 'sans-serif', lineHeight: 1.5,
          }}>Books, electronics,<br />clothing, food & services.<br />Filter by hall, price & condition.</div>
        </div>
      )}
    </div>
  );
};
