import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Platform, Animated, PanResponder, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useColors } from '../theme/ThemeContext';
import { navigationRef } from '../navigation/navigationRef';

const BUTTON_SIZE = 56;
const EDGE_MARGIN = 16;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const FloatingCart: React.FC = () => {
  const colors = useColors();
  const { totalItems } = useCart();

  // Fixed position state — no drifting accumulation
  const [pos, setPos] = useState({
    x: SCREEN_W - BUTTON_SIZE - EDGE_MARGIN,
    y: SCREEN_H - BUTTON_SIZE - 100,
  });
  const posRef = useRef(pos);
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      position: 'absolute',
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      zIndex: 9999,
    },
    button: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      backgroundColor: colors.pinYellow,
      borderWidth: 2.5,
      borderColor: colors.boardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.boardShadow,
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        android: { elevation: 6 },
      }),
    },
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      color: colors.dangerContent,
      fontSize: 9,
      fontWeight: '900',
    },
  }), [colors]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_e, g) => {
        isDragging.current = true;
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_e, g) => {
        // Snap to nearest edge, clamp within screen
        const newX = Math.max(EDGE_MARGIN, Math.min(
          SCREEN_W - BUTTON_SIZE - EDGE_MARGIN,
          posRef.current.x + g.dx,
        ));
        const newY = Math.max(60, Math.min(
          SCREEN_H - BUTTON_SIZE - 80,
          posRef.current.y + g.dy,
        ));

        // Snap to left or right edge
        const snappedX = newX < SCREEN_W / 2
          ? EDGE_MARGIN
          : SCREEN_W - BUTTON_SIZE - EDGE_MARGIN;

        pan.setValue({ x: 0, y: 0 });
        const next = { x: snappedX, y: newY };
        posRef.current = next;
        setPos(next);
      },
    })
  ).current;

  const currentRouteName = useNavigationState(state => {
    if (!state) return null;
    let route: any = state.routes[state.index];
    while (route?.state) {
      const s = route.state;
      if (typeof s.index === 'number' && s.routes) route = s.routes[s.index];
      else break;
    }
    return route ? route.name : null;
  });

  const hiddenScreens = ['Cart', 'Checkout', 'OrderDetail', 'Chat', 'Settings', 'Scanner'];

  if (totalItems === 0 || (currentRouteName && hiddenScreens.includes(currentRouteName))) {
    return null;
  }

  const handlePress = () => {
    if (isDragging.current) return;
    if (navigationRef.isReady()) {
      navigationRef.navigate('Cart');
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          left: pos.x,
          top: pos.y,
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={styles.button}>
        <Ionicons name="basket" size={22} color={colors.text} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingCart;
