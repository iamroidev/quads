import { lightColors, darkColors } from './theme/tokens';

export { lightColors, darkColors };

// Global active theme — updated by ThemeProvider on every theme switch
let activeTheme: 'light' | 'dark' = 'light';
export const setGlobalTheme = (theme: 'light' | 'dark') => {
  activeTheme = theme;
};

// Reactive colors proxy — reads active theme at call time.
// Only used by `shadows` below. All screens should use useColors() instead.
const reactiveColors = {} as any;
Object.keys(lightColors).forEach((key) => {
  Object.defineProperty(reactiveColors, key, {
    get() {
      return (activeTheme === 'dark' ? darkColors : lightColors)[key as keyof typeof lightColors];
    },
    enumerable: true,
    configurable: true,
  });
});

// Shadows — reactive, read at render time via `shadows.bulletin` getter.
// Safe to use inside useMemo because the getter re-evaluates each call.
export const shadows = {
  get bulletin() {
    return {
      shadowColor: reactiveColors.boardShadow,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    };
  },
  get bulletinHeavy() {
    return {
      shadowColor: reactiveColors.boardShadow,
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    };
  },
};

export const spacing = {
  xs: 6, sm: 10, md: 14, lg: 20, xl: 28,
};

export const type = {
  label: {
    fontSize: 10, letterSpacing: 1.6,
    fontWeight: '900' as const, textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 26, fontWeight: '900' as const,
    textTransform: 'uppercase' as const, letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, fontWeight: '700' as const },
};
