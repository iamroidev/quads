import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { QLogo, Tagline } from '../components/QLogo';
import { C } from '../tokens';

interface SceneHookProps {
  width: number;
  height: number;
}

export const SceneHook: React.FC<SceneHookProps> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isPortrait = height > width;
  const logoSize   = isPortrait ? width * 0.28 : height * 0.28;

  // Background flash-in
  const bgOp = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  // Scan-line grid animation
  const gridOp = interpolate(frame, [2, 12], [0, 0.07], { extrapolateRight: 'clamp' });

  // Logo entrance
  const logoY = interpolate(
    spring({ frame, fps, config: { damping: 14, stiffness: 180 } }),
    [0, 1], [80, 0]
  );

  // Flash white on frame 0
  const flashOp = interpolate(frame, [0, 3, 6], [1, 0.4, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      width, height,
      backgroundColor: C.bg,
      opacity: bgOp,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Cork-board grid texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: gridOp,
        backgroundImage: `
          linear-gradient(${C.border} 1px, transparent 1px),
          linear-gradient(90deg, ${C.border} 1px, transparent 1px)
        `,
        backgroundSize: `${width * 0.07}px ${width * 0.07}px`,
      }} />

      {/* Decorative corner pins */}
      {[
        { top: height * 0.06, left: width * 0.08 },
        { top: height * 0.06, right: width * 0.08 },
        { bottom: height * 0.06, left: width * 0.08 },
        { bottom: height * 0.06, right: width * 0.08 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...pos,
          width: width * 0.025,
          height: width * 0.025,
          borderRadius: '50%',
          backgroundColor: [C.pinRed, C.pinYellow, C.pinBlue, C.success][i],
          border: `2px solid ${C.border}`,
          opacity: interpolate(frame, [i * 3, i * 3 + 6], [0, 1], { extrapolateRight: 'clamp' }),
        }} />
      ))}

      {/* Main logo */}
      <div style={{ transform: `translateY(${logoY}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <QLogo size={logoSize} animate />
        <Tagline size={logoSize} delay={15} />
      </div>

      {/* UMaT subtext */}
      <div style={{
        position: 'absolute',
        bottom: height * 0.08,
        opacity: interpolate(frame, [18, 28], [0, 1], { extrapolateRight: 'clamp' }),
        fontSize: isPortrait ? width * 0.035 : height * 0.03,
        fontWeight: 700,
        color: C.textSec,
        fontFamily: 'sans-serif',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: 'center',
      }}>
        University of Mines & Technology · Tarkwa, Ghana
      </div>

      {/* White flash overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#fff',
        opacity: flashOp,
        pointerEvents: 'none',
      }} />
    </div>
  );
};
