import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BulletinCard } from '../components/BulletinCard';
import { C } from '../tokens';

interface SceneProblemProps { width: number; height: number }

const FakeListing: React.FC<{
  title: string; price: string; desc: string;
  width: number; delay: number; warn?: boolean;
}> = ({ title, price, desc, width, delay, warn = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const y = interpolate(
    spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14 } }),
    [0, 1], [40, 0]
  );
  const op = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ opacity: op, transform: `translateY(${y}px)` }}>
      <BulletinCard offset={3} borderWidth={2} style={{ width, marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'stretch', padding: 0, backgroundColor: C.surface,
        }}>
          {/* Color swatch */}
          <div style={{
            width: 70, flexShrink: 0,
            backgroundColor: warn ? '#ffe5e5' : '#f0f0f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {warn && (
              <span style={{ fontSize: 28, fontWeight: 900, color: '#e74c3c', fontFamily: 'sans-serif' }}>?</span>
            )}
          </div>
          {/* Text */}
          <div style={{ padding: '12px 14px' }}>
            <div style={{
              fontSize: 14, fontWeight: 900, color: C.text,
              textTransform: 'uppercase', fontFamily: 'sans-serif', letterSpacing: -0.3,
            }}>{title}</div>
            <div style={{
              fontSize: 18, fontWeight: 900, color: C.accent, fontFamily: 'sans-serif', marginTop: 2,
            }}>{price}</div>
            <div style={{
              fontSize: 11, color: warn ? '#e74c3c' : C.muted, fontFamily: 'sans-serif', marginTop: 4,
              fontStyle: warn ? 'italic' : 'normal',
            }}>{desc}</div>
          </div>
        </div>
      </BulletinCard>
    </div>
  );
};

export const SceneProblem: React.FC<SceneProblemProps> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = height > width;

  const cardW = isPortrait ? width * 0.88 : width * 0.42;
  const titleFs = isPortrait ? width * 0.065 : height * 0.065;

  const titleOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const titleY  = interpolate(
    spring({ frame, fps, config: { damping: 14 } }), [0, 1], [-30, 0]
  );

  const crossOp = interpolate(frame, [100, 115], [0, 1], { extrapolateRight: 'clamp' });

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
      padding: '40px 0',
    }}>
      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px),linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: `${width * 0.07}px ${width * 0.07}px`,
      }} />

      {/* Headline */}
      <div style={{
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
        textAlign: 'center',
        marginBottom: isPortrait ? 36 : 28,
        padding: '0 32px',
      }}>
        <div style={{
          fontSize: titleFs * 0.55,
          fontWeight: 900,
          color: C.accent,
          textTransform: 'uppercase',
          letterSpacing: 2,
          fontFamily: 'sans-serif',
          marginBottom: 8,
        }}>The Problem</div>
        <div style={{
          fontSize: titleFs,
          fontWeight: 900,
          color: C.text,
          textTransform: 'uppercase',
          letterSpacing: -1,
          fontFamily: 'sans-serif',
          lineHeight: 1.1,
        }}>
          Campus buying<br />shouldn't be this<br />sketchy.
        </div>
      </div>

      {/* Fake bad listings */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}>
        <FakeListing title="iPhone 14 Pro Max" price="GHS 200" desc="No photos. No name. Meet at STC." width={cardW} delay={10} warn />
        <FakeListing title="Calculus Textbook" price="GHS 50"  desc="Unknown seller. No reviews." width={cardW} delay={18} warn />
        <FakeListing title="Dorm Room Chair"   price="GHS 80"  desc="No contact. Cash only. Unverified." width={cardW} delay={26} warn />
      </div>

      {/* Big red cross overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: crossOp * 0.15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: isPortrait ? width * 0.7 : height * 0.7,
          fontWeight: 900,
          color: C.accent,
          fontFamily: 'sans-serif',
          lineHeight: 1,
        }}>×</div>
      </div>
    </div>
  );
};
