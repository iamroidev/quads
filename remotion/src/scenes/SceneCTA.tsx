import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { QLogo, Tagline } from '../components/QLogo';
import { BulletinCard } from '../components/BulletinCard';
import { C } from '../tokens';

interface SceneCTAProps { width: number; height: number }

// Simple QR-code-like grid
const QRCode: React.FC<{ size: number }> = ({ size }) => {
  const cell = size / 21;
  // Deterministic "QR" pattern — static decoration
  const PATTERN = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,1,1,0,0,1,1,0,0,1,0,0,1,0,1],
    [1,1,0,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,0,1,0],
    [0,0,1,0,1,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,1],
    [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,0,1,0,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,0,0,0,1,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,0,1,1,0,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,1,0,1,0,0,0,1,1,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0],
    [1,1,1,1,1,1,1,0,0,0,0,1,0,1,0,0,0,1,0,0,1],
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(21, ${cell}px)`,
      gridTemplateRows:    `repeat(21, ${cell}px)`,
      gap: 0,
      backgroundColor: '#fff',
      padding: cell,
      border: `3px solid ${C.border}`,
    }}>
      {PATTERN.flat().map((bit, i) => (
        <div key={i} style={{ backgroundColor: bit ? C.text : '#fff', width: cell, height: cell }} />
      ))}
    </div>
  );
};

export const SceneCTA: React.FC<SceneCTAProps> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = height > width;

  const logoSize = isPortrait ? width * 0.24 : height * 0.22;
  const qrSize   = isPortrait ? width * 0.38 : height * 0.3;

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 200, mass: 0.8 } });
  const logoY     = interpolate(logoScale, [0, 1], [-60, 0]);

  const urlOp     = interpolate(frame, [12, 22], [0, 1], { extrapolateRight: 'clamp' });
  const qrOp      = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: 'clamp' });
  const qrScale   = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 10, stiffness: 200 } });

  const ctaOp     = interpolate(frame, [30, 42], [0, 1], { extrapolateRight: 'clamp' });
  const ctaY      = interpolate(
    spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 14 } }),
    [0, 1], [30, 0]
  );

  const titleFs = isPortrait ? width * 0.072 : height * 0.06;

  return (
    <div style={{
      width, height,
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      gap: isPortrait ? 28 : 20,
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px),linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: `${width * 0.07}px ${width * 0.07}px`,
      }} />

      {/* Corner pins */}
      {[
        { top: height * 0.04, left: width * 0.06 },
        { top: height * 0.04, right: width * 0.06 },
        { bottom: height * 0.04, left: width * 0.06 },
        { bottom: height * 0.04, right: width * 0.06 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: width * 0.022, height: width * 0.022,
          borderRadius: '50%',
          backgroundColor: [C.pinRed, C.pinYellow, C.pinBlue, C.success][i],
          border: `2px solid ${C.border}`,
        }} />
      ))}

      {/* Logo */}
      <div style={{ transform: `translateY(${logoY}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <QLogo size={logoSize} animate />
        <Tagline size={logoSize} delay={12} />
      </div>

      {/* URL */}
      <div style={{
        opacity: urlOp,
        fontSize: titleFs,
        fontWeight: 900,
        color: C.text,
        textTransform: 'uppercase',
        fontFamily: 'sans-serif',
        letterSpacing: -0.5,
        textAlign: 'center',
      }}>quadsmarket.tech</div>

      {/* QR + label */}
      <div style={{
        opacity: qrOp,
        transform: `scale(${qrScale})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}>
        <BulletinCard offset={6} borderWidth={3} style={{ display: 'inline-flex' }}>
          <QRCode size={qrSize} />
        </BulletinCard>
        <div style={{
          fontSize: isPortrait ? width * 0.038 : height * 0.033,
          fontWeight: 900,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}>Scan to Join the Campus Marketplace</div>
      </div>

      {/* CTA button */}
      <div style={{
        opacity: ctaOp,
        transform: `translateY(${ctaY}px)`,
      }}>
        <div style={{
          backgroundColor: C.accent,
          border: `3px solid ${C.border}`,
          boxShadow: `6px 6px 0 0 ${C.border}`,
          padding: `${isPortrait ? width * 0.04 : height * 0.035}px ${isPortrait ? width * 0.1 : height * 0.08}px`,
        }}>
          <span style={{
            fontSize: isPortrait ? width * 0.055 : height * 0.045,
            fontWeight: 900,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontFamily: 'sans-serif',
          }}>Download Now — It's Free</span>
        </div>
      </div>
    </div>
  );
};
