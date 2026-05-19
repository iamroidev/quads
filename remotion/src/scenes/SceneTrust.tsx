import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneFrame } from '../components/PhoneFrame';
import { BulletinCard } from '../components/BulletinCard';
import { C } from '../tokens';

interface SceneTrustProps { width: number; height: number }

const CheckmarkSVG: React.FC<{ progress: number; size: number }> = ({ progress, size }) => {
  const totalLen = 80;
  const drawn = progress * totalLen;

  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      {/* Circle */}
      <circle
        cx="30" cy="30" r="26"
        fill={C.successTint}
        stroke={C.success}
        strokeWidth="4"
        strokeDasharray={`${2 * Math.PI * 26}`}
        strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(progress * 1.5, 1))}`}
        style={{ transformOrigin: '30px 30px', transform: 'rotate(-90deg)' }}
      />
      {/* Checkmark path */}
      <polyline
        points="16,32 26,42 46,20"
        fill="none"
        stroke={C.success}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={totalLen}
        strokeDashoffset={Math.max(0, totalLen - Math.max(0, drawn - 30))}
      />
    </svg>
  );
};

export const SceneTrust: React.FC<SceneTrustProps> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = height > width;

  const phoneW = isPortrait ? width * 0.72 : height * 0.52;

  // Phone slides up
  const phoneY = interpolate(
    spring({ frame, fps, config: { damping: 14, stiffness: 150 } }),
    [0, 1], [120, 0]
  );

  // Checkmark fires at frame 40
  const checkProgress = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  // Badge pop
  const badgeScale = spring({
    frame: Math.max(0, frame - 55),
    fps,
    config: { damping: 8, stiffness: 300 },
  });

  // Screen content
  const screenW = phoneW;
  const screenH = phoneW * (19.5 / 9);
  const padH    = screenH * 0.08;

  const screen = (
    <div style={{
      width:  screenW,
      height: screenH,
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: 'column',
      padding: `${padH}px ${screenW * 0.06}px`,
      boxSizing: 'border-box',
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: `2px solid ${C.border}`,
        paddingBottom: screenW * 0.04,
        marginBottom: screenW * 0.05,
      }}>
        <div style={{
          fontSize: screenW * 0.06,
          fontWeight: 900,
          color: C.accent,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontFamily: 'sans-serif',
        }}>VERIFICATION</div>
        <div style={{
          fontSize: screenW * 0.1,
          fontWeight: 900,
          color: C.text,
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
          letterSpacing: -0.5,
          lineHeight: 1.1,
          marginTop: 4,
        }}>Student ID<br />Verification</div>
      </div>

      {/* ID Card mock */}
      <BulletinCard offset={4} borderWidth={2} style={{ marginBottom: screenW * 0.05 }}>
        <div style={{
          backgroundColor: '#1a237e',
          padding: `${screenW * 0.04}px ${screenW * 0.05}px`,
          display: 'flex',
          alignItems: 'center',
          gap: screenW * 0.04,
        }}>
          {/* Avatar */}
          <div style={{
            width: screenW * 0.18,
            height: screenW * 0.22,
            backgroundColor: '#3949ab',
            border: '2px solid rgba(255,255,255,0.4)',
            flexShrink: 0,
          }} />
          {/* Info */}
          <div>
            <div style={{
              fontSize: screenW * 0.055,
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: 'sans-serif',
            }}>KOFI ASANTE</div>
            <div style={{
              fontSize: screenW * 0.042,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'sans-serif',
              marginTop: 3,
            }}>BSc. Mining Engineering</div>
            <div style={{
              fontSize: screenW * 0.038,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'sans-serif',
              marginTop: 2,
            }}>UMaT/FNRE/2023/0042</div>
          </div>
        </div>
        <div style={{
          backgroundColor: C.surface,
          padding: `${screenW * 0.03}px ${screenW * 0.05}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: screenW * 0.04, color: C.muted, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            UNIVERSITY OF MINES & TECHNOLOGY
          </span>
        </div>
      </BulletinCard>

      {/* Checkmark */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: screenW * 0.04,
      }}>
        <CheckmarkSVG progress={checkProgress} size={screenW * 0.35} />
      </div>

      {/* Verified badge */}
      <div style={{
        transform: `scale(${badgeScale})`,
        transformOrigin: 'center',
        marginTop: screenW * 0.03,
        alignSelf: 'center',
      }}>
        <div style={{
          backgroundColor: C.success,
          border: `2px solid ${C.border}`,
          padding: `${screenW * 0.025}px ${screenW * 0.06}px`,
          boxShadow: `3px 3px 0 0 ${C.border}`,
        }}>
          <span style={{
            fontSize: screenW * 0.065,
            fontWeight: 900,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontFamily: 'sans-serif',
          }}>VERIFIED STUDENT</span>
        </div>
      </div>
    </div>
  );

  // Side label
  const labelOp = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: 'clamp' });
  const labelFs = isPortrait ? width * 0.055 : height * 0.045;

  return (
    <div style={{
      width, height,
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: isPortrait ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isPortrait ? 32 : 60,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px),linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: `${width * 0.07}px ${width * 0.07}px`,
      }} />

      {/* Phone */}
      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <PhoneFrame width={phoneW}>
          {screen}
        </PhoneFrame>
      </div>

      {/* Side label */}
      <div style={{
        opacity: labelOp,
        maxWidth: isPortrait ? width * 0.8 : width * 0.35,
        textAlign: isPortrait ? 'center' : 'left',
      }}>
        <div style={{
          fontSize: labelFs * 0.55,
          fontWeight: 900,
          color: C.accent,
          textTransform: 'uppercase',
          letterSpacing: 2,
          fontFamily: 'sans-serif',
          marginBottom: 10,
        }}>Trust, Built In</div>
        <div style={{
          fontSize: labelFs,
          fontWeight: 900,
          color: C.text,
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
          letterSpacing: -0.5,
          lineHeight: 1.15,
        }}>Only verified<br />UMaT students<br />can trade.</div>
        <div style={{
          marginTop: 16,
          fontSize: labelFs * 0.6,
          color: C.muted,
          fontFamily: 'sans-serif',
          lineHeight: 1.5,
        }}>Every account is backed by<br />a valid student ID.</div>
      </div>
    </div>
  );
};
