import React from 'react';
import { Composition } from 'remotion';
import { QuadsTeaser } from './Teaser';
import { TOTAL_FRAMES, FPS, VERTICAL, HORIZONTAL } from './tokens';

export const Root: React.FC = () => {
  return (
    <>
      {/* 9:16 vertical — Instagram Reels, TikTok, YouTube Shorts */}
      <Composition
        id="QuadsTeaserVertical"
        component={QuadsTeaser}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={VERTICAL.width}
        height={VERTICAL.height}
      />

      {/* 16:9 horizontal — YouTube, LinkedIn, presentations */}
      <Composition
        id="QuadsTeaserHorizontal"
        component={QuadsTeaser}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={HORIZONTAL.width}
        height={HORIZONTAL.height}
      />
    </>
  );
};
