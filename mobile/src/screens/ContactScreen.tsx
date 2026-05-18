import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const ContactScreen = () => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'technical' | 'payment' | 'safety' | 'account'>('technical');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail || !trimmedSubject || !trimmedMessage) {
      Alert.alert('Required Fields', 'Please fill in email, subject, and message.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/support/ticket', {
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
        category,
      });
      Alert.alert('Ticket Submitted', 'Thank you! The support team has received your inquiry and will follow up via email.');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit ticket. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            eyebrow="SUPPORT OPERATORS"
            title="Get In Touch"
            subtitle="Submit an official ticket or contact the team directly."
          />

          {/* Quick info boxes */}
          <View style={styles.infoRow}>
            <View style={[styles.infoBox, { transform: [{ rotate: '-0.5deg' }] }]}>
              <Ionicons name="mail-outline" size={24} color={colors.text} />
              <Text style={styles.infoLabel}>EMAIL SUPPORT</Text>
              <Text style={styles.infoValue}>support@quadsmarket.tech</Text>
            </View>

            <View style={[styles.infoBox, { transform: [{ rotate: '0.5deg' }] }]}>
              <Ionicons name="time-outline" size={24} color={colors.text} />
              <Text style={styles.infoLabel}>OPERATING HOURS</Text>
              <Text style={styles.infoValue}>Mon - Fri, 8AM - 6PM</Text>
            </View>
          </View>

          {/* Physical Desk & Safety Zone */}
          <View style={styles.warningBox}>
            <Ionicons name="location-outline" size={20} color="#ff6b6b" />
            <Text style={styles.warningText}>
              <Text style={{ fontWeight: '900' }}>Physical Desk:</Text> Tovet Hostel. For emergencies, contact UMaT Campus Security immediately.
            </Text>
          </View>

          {/* Ticket Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>📋 OPEN SUPPORT TICKET</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Institutional Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="name@student.umat.edu.gh"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Inquiry Category *</Text>
              <View style={styles.categoryRow}>
                {(['technical', 'payment', 'safety', 'account'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn,
                      category === cat && styles.categoryBtnActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief summary of the issue"
                placeholderTextColor="#9ca3af"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Message */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Detailed Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Explain the problem or request in detail..."
                placeholderTextColor="#9ca3af"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size={16} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Official Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
  infoBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadows.bulletin,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.muted,
    marginTop: 8,
    letterSpacing: 1.5,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text,
    marginTop: 4,
  },
  warningBox: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#ffe4e4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadows.bulletin,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c53030',
    flex: 1,
    lineHeight: 16,
  },
  formCard: {
    margin: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
    ...shadows.bulletin,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBtn: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryBtnActive: {
    backgroundColor: colors.text,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
  },
  categoryTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: colors.text,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.bulletin,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default ContactScreen;
