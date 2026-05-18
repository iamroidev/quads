import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, setGlobalColors, updateRegisteredStylesheets } from '../theme';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => Promise<void>;
  colors: typeof lightColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');

  // Load saved theme preference on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userThemePreference');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeState(savedTheme);
        }
      } catch (e) {
        console.warn('Failed to load saved theme preference', e);
      }
    };
    loadSavedTheme();
  }, []);

  // Update active colors whenever theme or systemScheme changes
  useEffect(() => {
    const activeDark =
      theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    const oldColors = isDark ? darkColors : lightColors;
    const newColors = activeDark ? darkColors : lightColors;

    // Swap color values dynamically in all registered stylesheets
    updateRegisteredStylesheets(oldColors, newColors);

    setIsDark(activeDark);
    setGlobalColors(newColors);
  }, [theme, systemScheme]);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('userThemePreference', newTheme);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const activeColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors: activeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
