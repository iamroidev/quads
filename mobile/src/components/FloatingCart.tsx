import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { colors, shadows } from '../theme';

export const FloatingCart: React.FC = () => {
  const navigation = useNavigation<any>();
  const { totalItems } = useCart();

  const currentRouteName = useNavigationState(state => {
    if (!state) return null;
    let route: any = state.routes[state.index];
    while (route && route.state) {
      const activeState = route.state;
      if (activeState && typeof activeState.index === 'number' && activeState.routes) {
        route = activeState.routes[activeState.index];
      } else {
        break;
      }
    }
    return route ? route.name : null;
  });

  const hiddenScreens = ['Cart', 'Checkout', 'OrderDetail', 'Chat', 'Settings', 'Scanner'];

  const pan = useRef(new Animated.ValueXY()).current;
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      offset.current = value;
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Capture gesture only on drag movement beyond 5 pixels
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: offset.current.x,
          y: offset.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  if (totalItems === 0 || (currentRouteName && hiddenScreens.includes(currentRouteName))) {
    return null;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.floatingBasket,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('Cart');
        }}
        style={styles.innerTouchable}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="basket" size={26} color="#1f1a14" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingBasket: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fbbf24', // Premium warm gold color
    borderWidth: 2.5,
    borderColor: '#1f1a14',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#1f1a14',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  innerTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444', // Alert red
    borderWidth: 1.5,
    borderColor: '#1f1a14',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});

export default FloatingCart;
