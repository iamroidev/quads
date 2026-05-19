import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, AppColors } from './tokens';
import { setGlobalTheme } from '../theme';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeCtx {
  theme: ThemeType;
  colors: AppColors;
  isDark: boolean;
  setTheme: (theme: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'system',
  colors: lightColors,
  isDark: false,
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');

  // Load saved theme preference on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userThemePreference');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (e) {
        console.warn('Failed to load saved theme preference', e);
      }
    };
    loadSavedTheme();
  }, []);

  // Update isDark whenever theme or systemScheme changes
  useEffect(() => {
    const activeDark =
      theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    setIsDark(activeDark);
    setGlobalTheme(activeDark ? 'dark' : 'light');
  }, [theme, systemScheme]);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('userThemePreference', newTheme);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/** Convenience hook — returns live reactive colors object. Use this in every component. */
export const useColors = () => useContext(ThemeContext).colors;
