import { Appearance } from 'react-native';

export const lightColors = {
  bg: "#faf8f5",       // Clean Ivory paper (Matching --bulletin-bg)
  surface: "#ffffff",  // Pure white card (Matching --bulletin-card)
  text: "#000000",     // Pitch black identity text
  muted: "rgba(0, 0, 0, 0.4)",
  border: "#000000",   // Hard black neobrutalist borders
  accent: "#ff6b6b",   // Soft red highlight
  accentAlt: "#fffacd",// Canary yellow notice card background
  danger: "#ff6b6b",
  
  // Custom Card Theming (Matching web index.css)
  noticeBg: "#fffacd",
  noticeText: "#000000",
  metric1Bg: "#e0f2f7",
  metric1Text: "#004d40",
  metric2Bg: "#fce4ec",
  metric2Text: "#880e4f",
};

export const darkColors = {
  bg: "#0a0a0a",       // Obsidian dark board background (Matching --bulletin-bg)
  surface: "#121212",  // Deep slate card surface (Matching --bulletin-card)
  text: "#ffffff",     // Crisp white text
  muted: "rgba(255, 255, 255, 0.4)",
  border: "#ffffff",   // Bold off-white neobrutalist borders in dark mode!
  accent: "#ff6b6b",   // High-contrast pink-red highlights
  accentAlt: "#2c2203",// Deep amber notice background
  danger: "#ff6b6b",

  // Custom Card Theming (Matching web index.css)
  noticeBg: "#2c2203",
  noticeText: "#ffd700",
  metric1Bg: "#05262e",
  metric1Text: "#80deea",
  metric2Bg: "#2d0816",
  metric2Text: "#f48fb1",
};

// High-performance dynamic ES6 Proxy to automatically return the active theme palette
export const colors = new Proxy({} as typeof lightColors, {
  get(_, prop: keyof typeof lightColors) {
    const isDark = Appearance.getColorScheme() === 'dark';
    const activePalette = isDark ? darkColors : lightColors;
    return activePalette[prop];
  }
});

export const shadows = {
  bulletin: {
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  bulletinHeavy: {
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

export const type = {
  label: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "900" as const,
    textTransform: "uppercase" as const,
  },
  title: {
    fontSize: 26,
    fontWeight: "900" as const,
    textTransform: "uppercase" as const,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, fontWeight: "700" as const },
};
