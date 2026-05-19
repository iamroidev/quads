import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneHook }      from './scenes/SceneHook';
import { SceneProblem }   from './scenes/SceneProblem';
import { SceneTrust }     from './scenes/SceneTrust';
import { SceneDiscovery } from './scenes/SceneDiscovery';
import { SceneChat }      from './scenes/SceneChat';
import { SceneCTA }       from './scenes/SceneCTA';
import { SCENE, SCENE_START } from './tokens';

// Transition overlay between scenes
const Wipe: React.FC<{ startFrame: number; color?: string }> = ({ startFrame, color = '#111111' }) => {
  const frame = useCurrentFrame();
  const rel = frame - startFrame;

  if (rel < -3 || rel > 8) return null;

  const op = rel < 0
    ? 1 - (rel + 3) / 3          // fade out last 3 frames of previous scene
    : 1 - (rel / 8);             // flash fade at scene start

  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: color,
      opacity: Math.max(0, Math.min(1, op)),
      pointerEvents: 'none',
      zIndex: 100,
    }} />
  );
};

export const QuadsTeaser: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#F5ECD7' }}>
      <Sequence from={SCENE_START.HOOK}      durationInFrames={SCENE.HOOK}>
        <SceneHook width={width} height={height} />
      </Sequence>

      <Sequence from={SCENE_START.PROBLEM}   durationInFrames={SCENE.PROBLEM}>
        <SceneProblem width={width} height={height} />
      </Sequence>

      <Sequence from={SCENE_START.TRUST}     durationInFrames={SCENE.TRUST}>
        <SceneTrust width={width} height={height} />
      </Sequence>

      <Sequence from={SCENE_START.DISCOVERY} durationInFrames={SCENE.DISCOVERY}>
        <SceneDiscovery width={width} height={height} />
      </Sequence>

      <Sequence from={SCENE_START.CHAT}      durationInFrames={SCENE.CHAT}>
        <SceneChat width={width} height={height} />
      </Sequence>

      <Sequence from={SCENE_START.CTA}       durationInFrames={SCENE.CTA}>
        <SceneCTA width={width} height={height} />
      </Sequence>

      {/* Flash transitions at every scene boundary */}
      {Object.values(SCENE_START).slice(1).map((sf, i) => (
        <Wipe key={i} startFrame={sf} />
      ))}
    </AbsoluteFill>
  );
};
