import { Appearance } from 'react-native';

export const lightColors = {
  bg: "#f8f7f4",       // Parchment board background
  surface: "#fffdf8",  // Clean paper card
  text: "#000000",     // Pitch black identity text
  muted: "#666666",
  border: "#000000",   // Hard black neobrutalist borders
  accent: "#ff6b6b",   // Soft red highlight
  accentAlt: "#fffacd",// Canary yellow notice card background
  danger: "#ff6b6b",
};

export const darkColors = {
  bg: "#0f0f11",       // Obsidian dark board background
  surface: "#18181c",  // Deep slate card surface
  text: "#f8f7f4",     // Crisp off-white text
  muted: "#a0a0a0",
  border: "#ffffff",   // Bold off-white neobrutalist borders in dark mode!
  accent: "#ff8282",   // High-contrast pink-red highlights
  accentAlt: "#2c281e",// Deep amber notice background
  danger: "#ff8282",
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
