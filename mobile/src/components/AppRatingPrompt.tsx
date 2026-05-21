import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeContext';

const ORDER_COUNT_KEY = 'completedOrderCount';
const RATING_PROMPTED_KEY = 'hasPromptedRating';
const PROMPT_AFTER_ORDERS = 5;

/**
 * Call this whenever a buyer's order reaches "completed" status.
 * It increments the local counter and returns true when the threshold
 * is hit AND the user has not yet been prompted.
 */
export async function maybePromptRating(): Promise<boolean> {
  try {
    const [countStr, prompted] = await Promise.all([
      AsyncStorage.getItem(ORDER_COUNT_KEY),
      AsyncStorage.getItem(RATING_PROMPTED_KEY),
    ]);
    if (prompted === 'true') return false;
    const count = parseInt(countStr ?? '0', 10) + 1;
    await AsyncStorage.setItem(ORDER_COUNT_KEY, String(count));
    if (count >= PROMPT_AFTER_ORDERS) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

interface AppRatingPromptProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppRatingPrompt({ visible, onClose }: AppRatingPromptProps) {
  const colors = useColors();
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async () => {
    setSubmitting(true);
    try {
      await AsyncStorage.setItem(RATING_PROMPTED_KEY, 'true');
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      }
    } catch (err) {
      console.warn('App rating error:', err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  const handleMaybeLater = async () => {
    try {
      // Don't mark as prompted — allow re-prompt on next milestone
      await AsyncStorage.setItem(ORDER_COUNT_KEY, '0');
    } catch {}
    onClose();
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(RATING_PROMPTED_KEY, 'true');
    } catch {}
    onClose();
  };

  const styles = React.useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    container: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      padding: 24,
    },
    pin: {
      position: 'absolute',
      top: -10,
      left: '50%',
      marginLeft: -10,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.pinYellow,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      zIndex: 10,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      textTransform: 'uppercase',
      letterSpacing: 2,
      textAlign: 'center',
      marginTop: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginVertical: 8,
      letterSpacing: -0.5,
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginVertical: 12,
    },
    description: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    primaryBtn: {
      backgroundColor: colors.text,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      paddingVertical: 13,
      alignItems: 'center',
      marginBottom: 10,
    },
    primaryBtnText: {
      color: colors.bg,
      fontSize: 12,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    secondaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    secondaryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    secondaryBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
  }), [colors]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.pin} />
          <Text style={styles.eyebrow}>Enjoying QUADS?</Text>
          <Text style={styles.title}>Rate Our App</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name="star" size={28} color={colors.pinYellow} />
            ))}
          </View>
          <Text style={styles.description}>
            You've just completed your order. Your feedback helps us improve the campus marketplace for every UMaT student.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
            onPress={handleRate}
            disabled={submitting}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Opening Store...' : 'Rate on App Store'}
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleMaybeLater}>
              <Text style={styles.secondaryBtnText}>Maybe Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDismiss}>
              <Text style={styles.secondaryBtnText}>No Thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
