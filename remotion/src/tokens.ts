export const C = {
  bg:             '#F5ECD7',
  surface:        '#FFFDF7',
  surfaceAlt:     '#FFF5E6',
  text:           '#111111',
  textSec:        '#6B6B6B',
  border:         '#1a1a1a',
  shadow:         '#1a1a1a',
  accent:         '#FF6B6B',
  accentPressed:  '#C0392B',
  success:        '#27AE60',
  successTint:    '#EAF7EF',
  muted:          '#6B6B6B',
  pinRed:         '#FF6B6B',
  pinYellow:      '#F1C40F',
  pinBlue:        '#3498DB',
  white:          '#FFFFFF',
  black:          '#000000',
};

export const FPS = 30;

// Scene durations in frames
export const SCENE = {
  HOOK:       5  * FPS,   // 0–5s
  PROBLEM:    7  * FPS,   // 5–12s
  TRUST:      8  * FPS,   // 12–20s
  DISCOVERY:  10 * FPS,   // 20–30s
  CHAT:       10 * FPS,   // 30–40s
  CTA:        5  * FPS,   // 40–45s
};

export const TOTAL_FRAMES = Object.values(SCENE).reduce((a, b) => a + b, 0); // 45s

// Scene start frames
export const SCENE_START = {
  HOOK:       0,
  PROBLEM:    SCENE.HOOK,
  TRUST:      SCENE.HOOK + SCENE.PROBLEM,
  DISCOVERY:  SCENE.HOOK + SCENE.PROBLEM + SCENE.TRUST,
  CHAT:       SCENE.HOOK + SCENE.PROBLEM + SCENE.TRUST + SCENE.DISCOVERY,
  CTA:        SCENE.HOOK + SCENE.PROBLEM + SCENE.TRUST + SCENE.DISCOVERY + SCENE.CHAT,
};

// Dimensions
export const VERTICAL   = { width: 1080, height: 1920 };
export const HORIZONTAL = { width: 1920, height: 1080 };
