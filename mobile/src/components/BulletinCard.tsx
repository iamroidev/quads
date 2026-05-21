import React, { useMemo } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getBulletinShadow } from '../theme/bulletinShadow';
import { useResponsive } from '../hooks/useResponsive';

type Size = 'sm' | 'md' | 'lg';

// Pin colors cycle through for visual variety
const PIN_COLORS = ['#FF6B6B', '#F1C40F', '#3498DB', '#27AE60'];

let pinCounter = 0;

export function BulletinCard({ children, size = 'lg', style, showPin = true }: {
  children: React.ReactNode;
  size?: Size;
  style?: ViewStyle | ViewStyle[];
  showPin?: boolean;
}) {
  const { colors } = useTheme();
  const { width } = useResponsive();

  const { borderWidth } = useMemo(() => {
    const resp = getBulletinShadow(width);
    return { borderWidth: resp.border };
  }, [width]);

  // Each card gets a deterministic pin color
  const pinColor = useMemo(() => {
    const color = PIN_COLORS[pinCounter % PIN_COLORS.length];
    pinCounter++;
    return color;
  }, []);

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Card surface with clean bottom/right border accent */}
      <View style={{
        backgroundColor: colors.surface,
        borderWidth,
        borderColor: colors.boardBorder,
        borderBottomWidth: borderWidth + 1,
        borderRightWidth: borderWidth + 1,
        borderRadius: 0,
        overflow: 'hidden',
      }}>
        {children}
      </View>

      {/* Decorative push-pin tack */}
      {showPin && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            left: 10,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: pinColor,
            borderWidth: 1.5,
            borderColor: colors.boardBorder,
            zIndex: 10,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 1,
              },
              android: { elevation: 3 },
            }),
          }}
          pointerEvents="none"
        />
      )}
    </View>
  );
}
