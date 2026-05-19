import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneFrame } from '../components/PhoneFrame';
import { BulletinCard } from '../components/BulletinCard';
import { C } from '../tokens';

interface SceneChatProps { width: number; height: number }

const MESSAGES = [
  { from: 'buyer',  text: 'Hi! Is the calculator still available?',          frame: 8  },
  { from: 'seller', text: 'Yes! Still available. Barely used.',              frame: 22 },
  { from: 'buyer',  text: 'Can you do GHS 180? I can pick up today.',        frame: 36 },
  { from: 'seller', text: 'Deal. Meet at the SRC block at 3pm?',             frame: 52 },
  { from: 'buyer',  text: 'Perfect. I\'ll pay through QUADS now.',           frame: 66 },
  { from: 'system', text: 'Kofi sent an order of GHS 180 — confirm to lock', frame: 78 },
];

const Bubble: React.FC<{
  msg: typeof MESSAGES[0];
  screenW: number;
  startFrame: number;
}> = ({ msg, screenW, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isSender = msg.from === 'buyer';
  const isSystem = msg.from === 'system';

  const sc = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    from: 0, to: 1,
    config: { damping: 12, stiffness: 260, mass: 0.7 },
  });

  if (frame < startFrame) return null;

  if (isSystem) {
    return (
      <div style={{
        alignSelf: 'center',
        transform: `scale(${sc})`,
        backgroundColor: C.surfaceAlt,
        border: `1.5px solid ${C.border}`,
        padding: `${screenW * 0.02}px ${screenW * 0.05}px`,
        marginBottom: 8,
        maxWidth: '90%',
      }}>
        <span style={{
          fontSize: screenW * 0.038,
          color: C.muted,
          fontFamily: 'sans-serif',
          fontStyle: 'italic',
          textAlign: 'center',
          display: 'block',
        }}>{msg.text}</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isSender ? 'flex-end' : 'flex-start',
      marginBottom: 8,
      paddingLeft:  isSender ? screenW * 0.15 : 0,
      paddingRight: isSender ? 0 : screenW * 0.15,
      transform: `scale(${sc})`,
      transformOrigin: isSender ? 'right center' : 'left center',
    }}>
      <div style={{
        backgroundColor: isSender ? C.text : C.surface,
        border: `2px solid ${C.border}`,
        padding: `${screenW * 0.025}px ${screenW * 0.04}px`,
        boxShadow: `2px 2px 0 0 ${C.shadow}`,
        maxWidth: '80%',
      }}>
        <span style={{
          fontSize: screenW * 0.048,
          color: isSender ? '#fff' : C.text,
          fontFamily: 'sans-serif',
          lineHeight: 1.4,
        }}>{msg.text}</span>
      </div>
    </div>
  );
};

export const SceneChat: React.FC<SceneChatProps> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = height > width;

  const phoneW  = isPortrait ? width * 0.78 : height * 0.55;
  const screenW = phoneW;
  const screenH = phoneW * (19.5 / 9);

  const phoneY = interpolate(
    spring({ frame, fps, config: { damping: 14, stiffness: 140 } }),
    [0, 1], [100, 0]
  );

  // Typing indicator
  const showTyping = frame >= 14 && frame < 22 || frame >= 28 && frame < 36 || frame >= 44 && frame < 52;
  const dotPhase = (frame % 12) / 12;

  const screen = (
    <div style={{
      width: screenW, height: screenH,
      backgroundColor: C.bg,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Chat header */}
      <div style={{
        padding: `${screenH * 0.05}px ${screenW * 0.05}px ${screenW * 0.03}px`,
        borderBottom: `2px solid ${C.border}`,
        backgroundColor: C.surface,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: screenW * 0.13, height: screenW * 0.13,
          borderRadius: '50%',
          backgroundColor: '#3498db',
          border: `2px solid ${C.border}`,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: screenW * 0.065, fontWeight: 900, color: '#fff', fontFamily: 'sans-serif' }}>A</span>
        </div>
        <div>
          <div style={{ fontSize: screenW * 0.055, fontWeight: 900, color: C.text, fontFamily: 'sans-serif' }}>Ama Boateng</div>
          <div style={{ fontSize: screenW * 0.038, color: C.success, fontFamily: 'sans-serif', marginTop: 2 }}>● Verified Seller</div>
        </div>
        {/* Product thumb */}
        <BulletinCard style={{ marginLeft: 'auto' }} offset={2} borderWidth={1.5}>
          <div style={{
            width: screenW * 0.15, height: screenW * 0.18,
            backgroundColor: '#27ae60',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: screenW * 0.07, fontWeight: 900, color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif' }}>E</span>
          </div>
          <div style={{ padding: 4, backgroundColor: C.surface }}>
            <div style={{ fontSize: screenW * 0.035, fontWeight: 900, color: C.accent, fontFamily: 'sans-serif' }}>GHS 200</div>
          </div>
        </BulletinCard>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, padding: `${screenW * 0.04}px`,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', overflow: 'hidden',
      }}>
        {MESSAGES.map((m, i) => (
          <Bubble key={i} msg={m} screenW={screenW} startFrame={m.frame} />
        ))}

        {/* Typing indicator */}
        {showTyping && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            paddingLeft: 4, marginBottom: 8,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: screenW * 0.025,
                height: screenW * 0.025,
                borderRadius: '50%',
                backgroundColor: C.muted,
                opacity: 0.3 + 0.7 * Math.abs(Math.sin((dotPhase * Math.PI * 2) + i * 1.1)),
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        borderTop: `2px solid ${C.border}`,
        padding: `${screenW * 0.03}px ${screenW * 0.04}px`,
        backgroundColor: C.surface,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <div style={{
          flex: 1,
          border: `2px solid ${C.border}`,
          backgroundColor: C.bg,
          padding: `${screenW * 0.025}px ${screenW * 0.04}px`,
          fontSize: screenW * 0.045,
          color: C.muted,
          fontFamily: 'sans-serif',
        }}>Type a message...</div>
        <div style={{
          width: screenW * 0.1, height: screenW * 0.1,
          backgroundColor: C.accent,
          border: `2px solid ${C.border}`,
          boxShadow: `2px 2px 0 0 ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: screenW * 0.055, color: '#fff', fontFamily: 'sans-serif' }}>→</span>
        </div>
      </div>
    </div>
  );

  // Notification pop-in from top (frame 78)
  const notifScale = spring({
    frame: Math.max(0, frame - 78),
    fps,
    config: { damping: 12, stiffness: 260 },
  });
  const notifY = interpolate(notifScale, [0, 1], [-80, 0]);

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

      <div style={{ position: 'relative', transform: `translateY(${phoneY}px)` }}>
        <PhoneFrame width={phoneW}>{screen}</PhoneFrame>

        {/* Push notification banner */}
        {frame >= 78 && (
          <div style={{
            position: 'absolute',
            top: phoneW * 0.04 + 8,
            left: phoneW * 0.08,
            right: phoneW * 0.08,
            transform: `translateY(${notifY}px)`,
            zIndex: 20,
          }}>
            <div style={{
              backgroundColor: 'rgba(255,253,247,0.96)',
              border: `2px solid ${C.border}`,
              boxShadow: `4px 4px 0 0 ${C.shadow}`,
              padding: `${phoneW * 0.03}px ${phoneW * 0.04}px`,
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: phoneW * 0.03,
            }}>
              <div style={{
                width: phoneW * 0.1, height: phoneW * 0.1,
                backgroundColor: C.accent,
                border: `2px solid ${C.border}`,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: phoneW * 0.06, fontWeight: 900, color: '#fff', fontFamily: 'sans-serif' }}>Q</span>
              </div>
              <div>
                <div style={{ fontSize: phoneW * 0.045, fontWeight: 900, color: C.text, fontFamily: 'sans-serif' }}>New Order — GHS 180</div>
                <div style={{ fontSize: phoneW * 0.038, color: C.muted, fontFamily: 'sans-serif', marginTop: 2 }}>Kofi confirmed your listing</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isPortrait && (
        <div style={{ opacity: labelOp, maxWidth: width * 0.3, textAlign: 'left' }}>
          <div style={{
            fontSize: labelFs * 0.55, fontWeight: 900, color: C.accent,
            textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'sans-serif', marginBottom: 10,
          }}>Instant Deals</div>
          <div style={{
            fontSize: labelFs, fontWeight: 900, color: C.text,
            textTransform: 'uppercase', fontFamily: 'sans-serif', letterSpacing: -0.5, lineHeight: 1.15,
          }}>Negotiate.<br />Order.<br />Pay safely.</div>
          <div style={{
            marginTop: 16, fontSize: labelFs * 0.6, color: C.muted, fontFamily: 'sans-serif', lineHeight: 1.5,
          }}>Funds held in escrow<br />until you confirm receipt.</div>
        </div>
      )}
    </div>
  );
};
