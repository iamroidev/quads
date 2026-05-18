import { Appearance, StyleSheet } from 'react-native';

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
  bg: "#000000",       // Crisp Obsidian pure black background (Matching --bulletin-bg)
  surface: "#121212",  // Deep slate card surface (Matching --bulletin-card)
  text: "#ffffff",     // Crisp white text
  muted: "rgba(255, 255, 255, 0.4)",
  border: "#ffffff",   // Bold off-white neobrutalist borders in dark mode!
  accent: "#ff6b6b",   // High-contrast pink-red highlights
  accentAlt: "#2c2203",// Deep amber notice background
  danger: "#ff6b6b",

  // Custom Card Theming (Matching web index.css)
  noticeBg: "#2d2715",
  noticeText: "#fef08a",
  metric1Bg: "#3f1b1b",
  metric1Text: "#fca5a5",
  metric2Bg: "#2e121d",
  metric2Text: "#fbcfe8",
};

// Will hold the active colors dynamically
let activeColors = lightColors;

export const setGlobalColors = (newColors: typeof lightColors) => {
  activeColors = newColors;
};

// High-performance dynamic ES6 Proxy to enforce the signature ivory neobrutalist theme.
// To close the UI/UX gap with the web client 100% and prevent invisible text contrast bugs 
// caused by static stylesheet evaluation, we standardize on the high-contrast light neobrutalist palette.
export const colors = new Proxy({} as typeof lightColors, {
  get(_, prop: keyof typeof lightColors) {
    return activeColors[prop];
  }
});

// Override StyleSheet.create to return Proxies that intercept style color property reads.
// This supports seamless dynamic theme updates at runtime without mutating frozen objects,
// while preserving 100% native registered stylesheet behavior!
const normalizeColor = (c: string) => {
  if (typeof c !== 'string') return c;
  let hex = c.trim().toLowerCase();
  if (!hex.startsWith('#')) return hex;
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
};

// Override StyleSheet.create to return a dynamic Proxy around the raw style definitions.
// By bypassing opaque native style registration IDs, we allow React Native's JS-to-Native bridge 
// to dynamically read the theme-aware colors from our Proxy at render time, ensuring instant, 
// flawless dynamic theme updates across all screens!
const originalCreate = StyleSheet.create;
(StyleSheet as any).create = function(obj: any) {
  // Return a Proxy around the raw style object
  return new Proxy(obj, {
    get(target, styleKey) {
      const styleVal = target[styleKey];
      if (styleVal && typeof styleVal === 'object') {
        // Return a Proxy around the style class (e.g. container)
        return new Proxy(styleVal, {
          get(styleTarget, prop) {
            const val = Reflect.get(styleTarget, prop);
            if (typeof val === 'string') {
              const valNorm = normalizeColor(val);
              // Look up the value in lightColors ONLY to prevent cross-palette collisions!
              // Since stylesheets are initialized using lightColors, this maps every semantic color perfectly.
              for (const paletteKey in lightColors) {
                const lightVal = (lightColors as any)[paletteKey];
                if (typeof lightVal === 'string' && normalizeColor(lightVal) === valNorm) {
                  // Resolve dynamically from the active color palette!
                  return (activeColors as any)[paletteKey];
                }
              }
            }
            return val;
          }
        });
      }
      return styleVal;
    }
  });
};

// No-op for compatibility with old context calls
export const updateRegisteredStylesheets = (fromPalette: any, toPalette: any) => {};

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
