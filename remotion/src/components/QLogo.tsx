import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../tokens';

interface QLogoProps {
  size?: number;
  animate?: boolean;
  dark?: boolean;
}

export const QLogo: React.FC<QLogoProps> = ({ size = 120, animate = true, dark = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bg       = dark ? '#1a1a1a' : C.surface;
  const border   = dark ? '#ffffff' : C.border;
  const textCol  = dark ? '#ffffff' : C.text;
  const shadowC  = dark ? '#000000' : C.shadow;

  const scale = animate
    ? spring({ frame, fps, from: 0, to: 1, config: { damping: 12, stiffness: 200, mass: 0.8 } })
    : 1;

  const rotate = animate
    ? interpolate(spring({ frame, fps, from: 0, to: 1, config: { damping: 14 } }), [0, 1], [-8, 0])
    : 0;

  const bw   = Math.max(2, size * 0.052);   // border width
  const inner = size * 0.47;                 // inner Q frame
  const iBw   = size * 0.1;                  // inner border width
  const tail  = { w: size * 0.18, h: size * 0.09 };
  const pin   = size * 0.155;
  const tileS = size * 0.37;
  const tileFontSize = size * 0.18;
  const offset = size * 0.066;              // shadow offset
  const gap    = size * 0.06;

  const tileStyle: React.CSSProperties = {
    width:  tileS,
    height: tileS,
    border: `${bw * 0.9}px solid ${border}`,
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `${offset * 0.5}px ${offset * 0.5}px 0 0 ${shadowC}`,
    flexShrink: 0,
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      transformOrigin: 'center bottom',
    }}>
      {/* Q box */}
      <div style={{
        position: 'relative',
        width: size,
        height: size,
        border: `${bw}px solid ${border}`,
        backgroundColor: bg,
        boxShadow: `${offset}px ${offset}px 0 0 ${shadowC}`,
        flexShrink: 0,
      }}>
        {/* Inner square Q frame */}
        <div style={{
          position: 'absolute',
          top: (size - inner) / 2,
          left: (size - inner) / 2,
          width: inner,
          height: inner,
          border: `${iBw}px solid ${textCol}`,
          backgroundColor: 'transparent',
        }} />
        {/* Q tail */}
        <div style={{
          position: 'absolute',
          bottom: size * 0.155,
          right:  size * 0.13,
          width:  tail.w,
          height: tail.h,
          backgroundColor: textCol,
          transform: 'rotate(45deg)',
        }} />
        {/* Red pin */}
        <div style={{
          position: 'absolute',
          top:   size * 0.075,
          right: size * 0.075,
          width:  pin,
          height: pin,
          borderRadius: '50%',
          backgroundColor: C.pinRed,
          border: `${bw * 0.75}px solid ${border}`,
        }} />
      </div>

      {/* U A D S tiles */}
      {['U','A','D','S'].map((ch, i) => {
        const tileScale = animate
          ? spring({ frame: Math.max(0, frame - i * 3), fps, from: 0, to: 1, config: { damping: 14, stiffness: 220 } })
          : 1;
        return (
          <div key={ch} style={{
            ...tileStyle,
            marginBottom: size * 0.025,
            transform: `scale(${tileScale})`,
          }}>
            <span style={{
              fontSize: tileFontSize,
              fontWeight: 900,
              color: textCol,
              fontFamily: 'sans-serif',
              lineHeight: 1,
            }}>{ch}</span>
          </div>
        );
      })}
    </div>
  );
};

export const Tagline: React.FC<{ size?: number; dark?: boolean; delay?: number }> = ({
  size = 120, dark = false, delay = 10,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const border  = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const textCol = dark ? 'rgba(255,255,255,0.45)' : C.muted;

  const op = spring({ frame: Math.max(0, frame - delay), fps, from: 0, to: 1, config: { damping: 20 } });

  return (
    <div style={{
      opacity: op,
      marginTop: size * 0.13,
      fontSize: size * 0.075,
      fontWeight: 900,
      letterSpacing: size * 0.018,
      color: textCol,
      textTransform: 'uppercase',
      fontFamily: 'sans-serif',
      borderTop: `2px solid ${border}`,
      paddingTop: size * 0.08,
      textAlign: 'center',
    }}>
      THE OFFICIAL INSTITUTIONAL MARKETPLACE
    </div>
  );
};
