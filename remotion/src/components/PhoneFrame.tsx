import React from 'react';
import { C } from '../tokens';

interface PhoneFrameProps {
  width: number;
  children: React.ReactNode;
  dark?: boolean;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ width, children, dark = false }) => {
  const height = width * (19.5 / 9);
  const bw     = width * 0.04;
  const radius = width * 0.12;
  const border = dark ? '#333333' : C.border;
  const frame  = dark ? '#0a0a0a' : C.text;
  const shadow = dark ? '#000000' : C.shadow;
  const notchW = width * 0.35;
  const notchH = width * 0.06;

  return (
    <div style={{
      position: 'relative',
      width:  width  + bw * 2,
      height: height + bw * 2,
      borderRadius: radius + bw,
      backgroundColor: frame,
      boxShadow: `8px 8px 0 0 ${shadow}, 0 0 0 ${bw}px ${border}`,
      flexShrink: 0,
    }}>
      {/* Screen area */}
      <div style={{
        position: 'absolute',
        top:    bw,
        left:   bw,
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: dark ? '#0a0a0a' : C.bg,
      }}>
        {children}
      </div>

      {/* Notch */}
      <div style={{
        position: 'absolute',
        top:  bw + 8,
        left: bw + (width - notchW) / 2,
        width:  notchW,
        height: notchH,
        borderRadius: notchH,
        backgroundColor: frame,
        zIndex: 10,
      }} />

      {/* Status bar fake clock */}
      <div style={{
        position: 'absolute',
        top:  bw + 14,
        left: bw + 20,
        fontSize: width * 0.045,
        fontWeight: 700,
        color: dark ? '#ffffff' : '#111111',
        fontFamily: 'sans-serif',
        zIndex: 11,
        opacity: 0.85,
      }}>9:41</div>
      <div style={{
        position: 'absolute',
        top:  bw + 14,
        right: bw + 20,
        fontSize: width * 0.038,
        fontWeight: 700,
        color: dark ? '#ffffff' : '#111111',
        fontFamily: 'sans-serif',
        zIndex: 11,
        opacity: 0.85,
        display: 'flex',
        gap: 4,
        alignItems: 'center',
      }}>
        <span>●●●●</span>
        <span>100%</span>
      </div>
    </div>
  );
};
