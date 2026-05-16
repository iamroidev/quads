import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const TermsScreen = () => (
  <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader eyebrow="Legal" title="Terms of Service" />
      <Text style={styles.text}>
        By using QUADS, you agree to our terms. Products sold through this platform are between students.
        QUADS is not responsible for items sold by third parties.
      </Text>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  text: { fontSize: 12, lineHeight: 20, color: colors.text },
});

export default TermsScreen;