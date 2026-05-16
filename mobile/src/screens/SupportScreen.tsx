import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const SupportScreen = () => {
  const openLink = (url: string) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader eyebrow="Help" title="Support" subtitle="Get help with your account or orders." />
        <TouchableOpacity style={styles.option} onPress={() => openLink('mailto:support@quadsmarket.tech')}>
          <Ionicons name="mail-outline" size={24} color={colors.text} />
          <Text style={styles.optionText}>Email Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => openLink('https://wa.me/233551500736')}>
          <Ionicons name="logo-whatsapp" size={24} color={colors.accent} />
          <Text style={styles.optionText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  optionText: { fontSize: 14, fontWeight: '900', marginLeft: 16 },
});

export default SupportScreen;