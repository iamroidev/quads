import React, { useMemo } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getBulletinShadow } from '../theme/bulletinShadow';
import { useResponsive } from '../hooks/useResponsive';

type Size = 'sm' | 'md' | 'lg';

const BASE_OFFSET: Record<Size, number> = {
  sm: 2,
  md: 4,
  lg: 5,
};

export function BulletinCard({ children, size = 'lg', style }: {
  children: React.ReactNode;
  size?: Size;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  const { width } = useResponsive();

  const { borderWidth, offset } = useMemo(() => {
    const resp = getBulletinShadow(width);
    const scaleFactor = resp.offset / 6;
    return {
      borderWidth: resp.border,
      offset: Math.max(2, Math.round(BASE_OFFSET[size] * scaleFactor)),
    };
  }, [width, size]);

  // On iOS: native shadow gives a soft blur — not neobrutalist.
  // We use a positioned View underneath to create the hard offset shadow
  // that matches the web's box-shadow approach.
  // On Android: elevation gives a soft shadow too, so we do the same approach.

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Hard offset shadow layer — sits behind the card */}
      <View
        style={{
          position: 'absolute',
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          backgroundColor: colors.boardShadow,
          borderRadius: 0,
        }}
        pointerEvents="none"
      />
      {/* Card surface */}
      <View style={{
        backgroundColor: colors.surface,
        borderWidth,
        borderColor: colors.boardBorder,
        borderRadius: 0,
        overflow: 'hidden',
        // Native shadow as fallback on iOS for accessibility / elevation
        ...Platform.select({
          ios: {
            shadowColor: colors.boardShadow,
            shadowOffset: { width: offset, height: offset },
            shadowOpacity: 1,
            shadowRadius: 0,
          },
        }),
      }}>
        {children}
      </View>
    </View>
  );
}
