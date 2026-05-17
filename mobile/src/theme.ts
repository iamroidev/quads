export const colors = {
  bg: "#f8f7f4", // Primary board background
  surface: "#fffdf8", // Standard paper card
  text: "#000000", // Identity color
  muted: "#666666",
  border: "#000000", // Hard black borders
  accent: "#ff6b6b", // Red highlight
  accentAlt: "#fffacd", // Yellow notice
  danger: "#ff6b6b",
};

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
