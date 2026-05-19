// theme/tokens.ts — bulletin board style, accent #FF6B6B

export const lightColors = {
  // ── backgrounds ──────────────────────────────────
  background:       '#F5ECD7',  // warm cork board
  surface:          '#FFFDF7',  // pinned card face
  surfaceSecondary: '#FFF5E6',  // tinted card / input bg
  border:           '#1a1a1a',  // legacy compatibility

  // ── bulletin board chrome ─────────────────────────
  boardBorder:      '#1a1a1a',  // thick card border color
  boardShadow:      '#1a1a1a',  // hard offset shadow color
  boardShadowSm:    '2px 2px 0px 0px #1a1a1a',   // tags / badges
  boardShadowMd:    '4px 4px 0px 0px #1a1a1a',   // buttons
  boardShadowLg:    '6px 6px 0px 0px #1a1a1a',   // cards
  boardBorderWidth: 2,   // px — standard border width in RN

  // ── text ─────────────────────────────────────────
  text:             '#111111',
  textSecondary:    '#6B6B6B',
  textDisabled:     '#ABABAB',

  // ── accent ───────────────────────────────────────
  primary:          '#FF6B6B',
  primaryPressed:   '#C0392B',
  primaryContent:   '#FFFFFF',
  primaryTint:      '#FFF0F0',
  primaryTintText:  '#C0392B',

  // ── pin colors (decorative tacks) ────────────────
  pinRed:    '#FF6B6B',
  pinYellow: '#F1C40F',
  pinBlue:   '#3498DB',
  pinGreen:  '#27AE60',

  // ── semantic ──────────────────────────────────────
  success:         '#27AE60',
  successContent:  '#FFFFFF',
  successTint:     '#EAF7EF',
  successTintText: '#1A7A42',
  danger:          '#E74C3C',
  dangerContent:   '#FFFFFF',
  dangerTint:      '#FDECEA',
  dangerTintText:  '#A93226',

  // ── legacy compatibility ──────────────────────────
  accent:           '#FF6B6B',
  accentAlt:        '#C0392B',
  bg:               '#F5ECD7',
  muted:            '#6B6B6B',
  noticeBg:         '#FFF0F0',
  metric1Bg:        '#FFF0F0',
  metric1Text:      '#C0392B',

  overlay:   'rgba(0,0,0,0.45)',
  statusBar: 'dark-content',
} as const;

export const darkColors = {
  // ── backgrounds ──────────────────────────────────
  background:       '#0a0a0a',  // crisp obsidian background
  surface:          '#1a1a1a',  // deep charcoal card
  surfaceSecondary: '#2C2C2C',  // tinted inner layout / input bg
  border:           '#333333',  // legacy compatibility

  // ── bulletin board chrome ─────────────────────────
  boardBorder:      '#333333',  // crisp charcoal border in dark mode
  boardShadow:      '#000000',  // solid black shadow for modern contrast
  boardShadowSm:    '2px 2px 0px 0px #000000',
  boardShadowMd:    '4px 4px 0px 0px #000000',
  boardShadowLg:    '6px 6px 0px 0px #000000',
  boardBorderWidth: 2,

  // ── text ─────────────────────────────────────────
  text:             '#F0F0F0',
  textSecondary:    '#9A9A9A',
  textDisabled:     '#4A4A4A',

  // ── accent ───────────────────────────────────────
  primary:          '#FF8E8E',
  primaryPressed:   '#FF6B6B',
  primaryContent:   '#1A0000',
  primaryTint:      '#3B1414',
  primaryTintText:  '#FF8E8E',

  // ── pin colors ────────────────────────────────────
  pinRed:    '#FF8E8E',
  pinYellow: '#F7DC6F',
  pinBlue:   '#5DADE2',
  pinGreen:  '#58D68D',

  // ── semantic ──────────────────────────────────────
  success:         '#2ECC71',
  successContent:  '#001A09',
  successTint:     '#0D2E1A',
  successTintText: '#6EE7A0',
  danger:          '#E74C3C',
  dangerContent:   '#FFFFFF',
  dangerTint:      '#2E1212',
  dangerTintText:  '#F48171',

  // ── legacy compatibility ──────────────────────────
  accent:           '#FF8E8E',
  accentAlt:        '#FF6B6B',
  bg:               '#0a0a0a',
  muted:            '#9A9A9A',
  noticeBg:         '#3B1414',
  metric1Bg:        '#3B1414',
  metric1Text:      '#FF8E8E',

  overlay:   'rgba(0,0,0,0.65)',
  statusBar: 'light-content',
} as const;

export type AppColors = {
  readonly [K in keyof typeof lightColors]: (typeof lightColors)[K] extends number ? number : string;
};
