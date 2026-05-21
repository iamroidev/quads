import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import AppAlert from "../components/AppAlert";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import referenceService, { Program, Hall } from "../services/reference.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID  = '912061029071-85lvqadits5rfpivqjmjlctp8dov4dte.apps.googleusercontent.com';
const EXPO_CLIENT_ID = '912061029071-9cu0hecip5gl1qbkq6mmpm6bsk9nlfa7.apps.googleusercontent.com';
const IOS_CLIENT_ID  = '912061029071-0jpqu35u6ir7oa537ufjfgdbkl74i2pb.apps.googleusercontent.com';

// ── Picker modal ──────────────────────────────────────────────────────────────
interface PickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  colors: any;
}

const PickerModal: React.FC<PickerModalProps> = ({
  visible, title, options, selected, onSelect, onClose, colors,
}) => {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: colors.surface, borderTopWidth: 3, borderColor: colors.boardBorder, maxHeight: "80%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 2, borderColor: colors.boardBorder }}>
            <Text style={{ fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2, color: colors.text }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.primary, textTransform: "uppercase", letterSpacing: 1 }}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 12, borderBottomWidth: 2, borderColor: colors.boardBorder }}>
            <TextInput
              style={{ borderWidth: 2, borderColor: colors.boardBorder, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text }}
              placeholder="Search..."
              placeholderTextColor={colors.textDisabled}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.boardBorder, backgroundColor: selected === item ? colors.primary : colors.surface }}
                onPress={() => { onSelect(item); setQuery(""); onClose(); }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: selected === item ? colors.primaryContent : colors.text }}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", padding: 24, color: colors.textSecondary, fontSize: 12, textTransform: "uppercase", fontWeight: "700" }}>No results</Text>
            }
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </Modal>
  );
};

const RegisterScreen = ({ navigation }: any) => {
  const { sendRegistrationOtp, verifyOtpAndRegister, googleLogin } = useAuth();

  const [_googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId:    WEB_CLIENT_ID,
    androidClientId: EXPO_CLIENT_ID,
    iosClientId:     IOS_CLIENT_ID,
    redirectUri: makeRedirectUri({
      native: 'com.googleusercontent.apps.912061029071-9cu0hecip5gl1qbkq6mmpm6bsk9nlfa7:/oauthredirect',
    }),
  });
  const { colors } = useTheme();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const styles = getStyles(colors, isMobile);

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<any[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "" as "" | "buyer" | "seller",
    studentId: "",
    department: "",
    residenceHall: "",
    currentLevel: "",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: "", message: "" });

  // Reference data for campus pickers
  const [programs, setPrograms] = useState<Program[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [activePicker, setActivePicker] = useState<"department" | "residenceHall" | "currentLevel" | null>(null);

  useEffect(() => {
    referenceService.getAll().then(data => {
      setPrograms(data.programs);
      setHalls(data.halls);
      setLevels(data.levels);
    }).catch(() => {});
  }, []);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isRoleChosen = useMemo(
    () => form.role === "buyer" || form.role === "seller",
    [form.role],
  );

  const goToPasswordStep = () => {
    if (!tosAccepted) {
      setAlertState({
        visible: true,
        title: "Terms of Service",
        message: "You must accept the Terms of Service and Privacy Policy to register.",
      });
      return;
    }

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setAlertState({
        visible: true,
        title: "Missing details",
        message: "Name, email and phone are required before continuing.",
      });
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAlertState({
        visible: true,
        title: "Invalid email",
        message: "Enter a valid email address before continuing.",
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      studentId: prev.studentId.trim(),
      location: prev.location.trim(),
    }));

    setStep(3);
  };

  const handleRegister = async () => {
    const normalized = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      studentId: form.studentId.trim(),
      location: form.location.trim(),
    };

    if (
      !normalized.name ||
      !normalized.email ||
      !normalized.phone ||
      !normalized.password ||
      !isRoleChosen
    ) {
      setAlertState({
        visible: true,
        title: "Missing fields",
        message: "Role, name, email, phone, and password are required.",
      });
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalized.email)) {
      setAlertState({
        visible: true,
        title: "Invalid email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (normalized.password.length < 6) {
      setAlertState({
        visible: true,
        title: "Weak password",
        message: "Password must be at least 6 characters.",
      });
      return;
    }
    if (normalized.password !== normalized.confirmPassword) {
      setAlertState({
        visible: true,
        title: "Password mismatch",
        message: "Passwords do not match.",
      });
      return;
    }

    // Step 3 — send OTP and advance to step 4
    setIsLoading(true);
    try {
      await sendRegistrationOtp(normalized.email);
      setResendCountdown(60);
      setStep(4);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to send verification code";
      setAlertState({ visible: true, title: "Verification Failed", message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) { setOtpError('Enter the 6-digit code from your email.'); return; }
    setOtpError('');
    setIsLoading(true);
    try {
      const normalized = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      };
      await verifyOtpAndRegister(normalized.email, otpCode, {
        name:          normalized.name,
        phone:         normalized.phone,
        role:          normalized.role as 'buyer' | 'seller',
        password:      normalized.password,
        studentId:     normalized.studentId,
        department:    normalized.department,
        residenceHall: normalized.residenceHall,
        currentLevel:  normalized.currentLevel,
        location:      normalized.location,
      });
      await AsyncStorage.setItem('quads_is_new_user', '1');
      // AuthContext handles navigation via user state change
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Verification failed";
      setOtpError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      await sendRegistrationOtp(form.email.trim().toLowerCase());
      setResendCountdown(60);
    } catch {
      setAlertState({ visible: true, title: "Resend Failed", message: "Could not resend code. Please try again." });
    }
  };

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) {
        setAlertState({ visible: true, title: "Google sign-up failed", message: "No ID token received from Google." });
        setIsLoading(false);
        return;
      }
      const selectedRole: "buyer" | "seller" = form.role === "seller" ? "seller" : "buyer";
      googleLogin(idToken, selectedRole).then(async (res) => {
        if (res?.isNewUser) {
          await AsyncStorage.setItem('quads_is_new_user', '1');
        }
      }).catch((err: any) => {
        setAlertState({ visible: true, title: "Google sign-up failed", message: err.response?.data?.message || err.message || "Google sign-up failed" });
      }).finally(() => setIsLoading(false));
    } else if (googleResponse?.type === 'error') {
      setAlertState({ visible: true, title: "Google sign-up failed", message: googleResponse.error?.message || "Google sign-up failed" });
      setIsLoading(false);
    } else if (googleResponse?.type === 'dismiss' || googleResponse?.type === 'cancel') {
      setIsLoading(false);
    }
  }, [googleResponse]);

  const handleGooglePress = () => {
    if (!isRoleChosen) {
      setAlertState({ visible: true, title: "Choose role first", message: "Select Buy or Sell before continuing with Google." });
      return;
    }
    setIsLoading(true);
    promptGoogleAsync();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View style={styles.heroWrap}>
            <View style={[styles.letterRow, { alignItems: 'flex-end', gap: 5, marginBottom: 12 }]}>
              <View
                style={[
                  styles.letterCard,
                  {
                    width: 54,
                    height: 54,
                    borderWidth: 3,
                    borderColor: colors.boardBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  },
                ]}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderWidth: 5.5,
                  borderColor: colors.boardBorder,
                  backgroundColor: 'transparent',
                }} />
                <View style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  width: 10,
                  height: 5,
                  backgroundColor: colors.boardBorder,
                  transform: [{ rotate: '45deg' }],
                }} />
                <View style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.pinRed,
                  borderWidth: 1.2,
                  borderColor: colors.boardBorder,
                }} />
              </View>
              {['U', 'A', 'D', 'S'].map((char, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.letterCard,
                    {
                      width: 22,
                      height: 22,
                      borderWidth: 1.5,
                      borderColor: colors.boardBorder,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 1,
                    },
                  ]}
                >
                  <Text style={[styles.letterText, { fontSize: 11, fontWeight: '900' }]}>{char}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.eyebrow}>Create account</Text>
            <Text style={styles.title}>Join QUADS</Text>
            <Text style={styles.subtitle}>
              {step === 1 && "Step 1: choose your role."}
              {step === 2 && "Step 2: add your details."}
              {step === 3 && "Step 3: confirm details."}
              {step === 4 && "Step 4: verify your email."}
            </Text>
            <View style={styles.polaroidFrame}>
              <Image
                source={require("../../assets/marketillustration2.jpg")}
                style={styles.heroArt}
              />
              <View style={styles.redThumbtack}>
                <View style={styles.pinReflection} />
                <View style={styles.pinShadow} />
              </View>
            </View>

            <View style={styles.stepDots}>
              {[1, 2, 3, 4].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    step >= (s as 1 | 2 | 3 | 4) && styles.stepDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>I want to</Text>
                  <View style={styles.roleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        form.role === "buyer" && styles.roleButtonActive,
                      ]}
                      onPress={() => updateForm("role", "buyer")}
                    >
                      <Text
                        style={[
                          styles.roleText,
                          form.role === "buyer" && styles.roleTextActive,
                        ]}
                      >
                        Buy
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        form.role === "seller" && styles.roleButtonActive,
                      ]}
                      onPress={() => updateForm("role", "seller")}
                    >
                      <Text
                        style={[
                          styles.roleText,
                          form.role === "seller" && styles.roleTextActive,
                        ]}
                      >
                        Sell
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    !isRoleChosen && styles.buttonDisabled,
                  ]}
                  onPress={() => isRoleChosen && setStep(2)}
                  disabled={!isRoleChosen}
                >
                  <Text style={styles.buttonText}>Continue with Email</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.divider} />
                </View>

                <Pressable
                  onPress={handleGooglePress}
                  disabled={isLoading || !isRoleChosen}
                  style={({ pressed }) => [
                    styles.googleBtn,
                    pressed && { opacity: 0.85 },
                    (!isRoleChosen || isLoading) && { opacity: 0.45 },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.googleBtnText}>
                      Continue with Google
                    </Text>
                  )}
                </Pressable>
              </>
            ) : step === 2 ? (
              <>
                {[
                  ["Full Name *", "name", "Kwame Asante", "default", "sentences"],
                  ["Email *", "email", "you@email.com", "email-address", "none"],
                  ["Phone Number *", "phone", "0XX XXX XXXX", "phone-pad", "none"],
                  ["Student ID (Optional)", "studentId", "Your institutional student ID", "default", "none"],
                ].map(([label, key, placeholder, keyboard, autoCapitalize]) => (
                  <View style={styles.inputGroup} key={key}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={placeholder}
                      placeholderTextColor={colors.textDisabled}
                      value={(form as any)[key]}
                      onChangeText={(v: string) => updateForm(key, v)}
                      keyboardType={keyboard as any}
                      autoCapitalize={autoCapitalize as any}
                    />
                  </View>
                ))}

                {/* Program of Study picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Program of Study *</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => setActivePicker("department")}>
                    <Text style={[styles.pickerBtnText, !form.department && { opacity: 0.35 }]}>
                      {form.department || "Select your program…"}
                    </Text>
                    <Text style={styles.pickerChevron}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Residence Hall / Hostel picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Residence Hall / Hostel *</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => setActivePicker("residenceHall")}>
                    <Text style={[styles.pickerBtnText, !form.residenceHall && { opacity: 0.35 }]}>
                      {form.residenceHall || "Select your hall or hostel…"}
                    </Text>
                    <Text style={styles.pickerChevron}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Academic Level picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Academic Level *</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => setActivePicker("currentLevel")}>
                    <Text style={[styles.pickerBtnText, !form.currentLevel && { opacity: 0.35 }]}>
                      {form.currentLevel || "Select your level…"}
                    </Text>
                    <Text style={styles.pickerChevron}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Picker modals */}
                <PickerModal
                  visible={activePicker === "department"}
                  title="Program of Study"
                  options={programs.map(p => p.name)}
                  selected={form.department}
                  onSelect={v => updateForm("department", v)}
                  onClose={() => setActivePicker(null)}
                  colors={colors}
                />
                <PickerModal
                  visible={activePicker === "residenceHall"}
                  title="Residence Hall / Hostel"
                  options={halls.map(h => h.name)}
                  selected={form.residenceHall}
                  onSelect={v => updateForm("residenceHall", v)}
                  onClose={() => setActivePicker(null)}
                  colors={colors}
                />
                <PickerModal
                  visible={activePicker === "currentLevel"}
                  title="Academic Level"
                  options={levels}
                  selected={form.currentLevel}
                  onSelect={v => updateForm("currentLevel", v)}
                  onClose={() => setActivePicker(null)}
                  colors={colors}
                />

                {/* Password fields */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="At least 6 characters"
                      placeholderTextColor={colors.textDisabled}
                      value={form.password}
                      onChangeText={(v) => updateForm("password", v)}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(p => !p)}>
                      <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.textDisabled}
                      value={form.confirmPassword}
                      onChangeText={(v) => updateForm("confirmPassword", v)}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(p => !p)}>
                      <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* ToS Checkbox */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginVertical: 18,
                    padding: 10,
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  }}
                  onPress={() => setTosAccepted(p => !p)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderWidth: 2,
                      borderColor: colors.text,
                      backgroundColor: tosAccepted ? colors.text : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {tosAccepted && (
                      <Text style={{ color: colors.surface, fontSize: 11, fontWeight: "900" }}>✓</Text>
                    )}
                  </View>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: colors.text }}>
                    I agree to the{" "}
                    <Text
                      style={{ color: colors.primary, textDecorationLine: "underline" }}
                      onPress={() => WebBrowser.openBrowserAsync("https://quads.app/terms")}
                    >
                      Terms of Service
                    </Text>{" "}
                    and{" "}
                    <Text
                      style={{ color: colors.primary, textDecorationLine: "underline" }}
                      onPress={() => WebBrowser.openBrowserAsync("https://quads.app/privacy")}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>

                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    onPress={goToPasswordStep}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : step === 3 ? (
              <>
                {/* Step 3 — confirm details and send OTP */}
                <View style={{ borderWidth: 2, borderColor: colors.border, padding: 16, marginBottom: 20, backgroundColor: colors.surfaceSecondary }}>
                  <Text style={[styles.label, { marginBottom: 12 }]}>Confirm your details</Text>
                  {[
                    ['Name', form.name],
                    ['Email', form.email],
                    ['Phone', form.phone],
                    ['Role', form.role.toUpperCase()],
                    ['Password', form.password ? '•'.repeat(form.password.length) : ''],
                    ['Program', form.department],
                    ['Hall', form.residenceHall],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{v}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled, { flex: 1 }]}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonText}>{isLoading ? 'Sending code...' : 'Send Verification Code'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Step 4 — OTP entry */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={[styles.label, { color: colors.accent, marginBottom: 6 }]}>VERIFY YOUR EMAIL</Text>
                  <Text style={{ fontSize: isMobile ? 20 : 24, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: -0.5 }}>Enter the code.</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 20 }}>
                    We sent a 6-digit code to {'\n'}<Text style={{ color: colors.text, fontWeight: '700' }}>{form.email}</Text>
                  </Text>
                </View>

                {/* 6 OTP boxes */}
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TextInput
                      key={i}
                      ref={r => { otpRefs.current[i] = r; }}
                      style={{
                        width: 46, height: 56,
                        borderWidth: 3,
                        borderColor: otpError ? colors.danger : (otpCode[i] ? colors.text : colors.border),
                        backgroundColor: colors.surface,
                        textAlign: 'center',
                        fontSize: 22, fontWeight: '900',
                        color: colors.text,
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={otpCode[i] || ''}
                      // iOS autofill: textContentType="oneTimeCode" on first box
                      textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      onChangeText={v => {
                        const digit = v.replace(/\D/g, '').slice(-1);
                        const arr = otpCode.split('');
                        arr[i] = digit;
                        const joined = arr.join('').slice(0, 6);
                        setOtpCode(joined);
                        setOtpError('');
                        if (digit && i < 5) otpRefs.current[i + 1]?.focus();
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !otpCode[i] && i > 0) {
                          otpRefs.current[i - 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </View>

                {otpError ? <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginBottom: 12 }}>{otpError}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, (isLoading || otpCode.length !== 6) && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading || otpCode.length !== 6}
                >
                  <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Confirm & Create Account'}</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  <TouchableOpacity onPress={() => { setStep(3); setOtpCode(''); setOtpError(''); }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleResendOtp} disabled={resendCountdown > 0}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: resendCountdown > 0 ? colors.muted : colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>

        <AppAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          onClose={() =>
            setAlertState({ visible: false, title: "", message: "" })
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isMobile = true) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: isMobile ? 16 : 22,
    paddingVertical: 14,
  },
  heroWrap: { marginBottom: isMobile ? 12 : 16 },
  eyebrow: {
    color: colors.primary,
    fontSize: isMobile ? 9 : 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "800",
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: isMobile ? 26 : 34,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  subtitle: { marginTop: 5, color: colors.textSecondary, fontSize: isMobile ? 12 : 13, lineHeight: isMobile ? 18 : 20 },
  stepDots: { flexDirection: "row", gap: 6, marginTop: 8 },
  stepDot: { width: 16, height: 3, backgroundColor: colors.surfaceSecondary },
  stepDotActive: { backgroundColor: colors.primary },
  polaroidFrame: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    padding: 8,
    paddingBottom: 20,
    transform: [{ rotate: "-1.5deg" }],
    zIndex: 10,
  },
  heroArt: {
    width: "100%",
    height: 160,
    borderWidth: 2,
    borderColor: colors.boardBorder,
  },
  redThumbtack: {
    position: "absolute",
    top: -10,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pinRed,
    borderWidth: 2,
    borderColor: colors.boardBorder,
    zIndex: 30,
  },
  pinReflection: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  pinShadow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primaryPressed,
    transform: [{ translateX: -1.5 }, { translateY: -1.5 }],
  },
  form: {
    backgroundColor: colors.surface,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 0,
  },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 60 },
  eyeButton: { position: "absolute", right: 12, top: 13 },
  eyeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  roleContainer: { flexDirection: "row", gap: 12 },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  roleButtonActive: { borderColor: colors.boardBorder, backgroundColor: colors.primary },
  roleText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  roleTextActive: { color: colors.primaryContent },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: colors.primaryContent,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.boardBorder, opacity: 0.2 },
  dividerText: {
    marginHorizontal: 8,
    color: colors.text,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  googleBtn: {
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  googleBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  rowActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryBtn: {
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { fontSize: 13, color: colors.textSecondary },
  link: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  letterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    marginBottom: 8,
  },
  letterCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.boardBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  letterText: {
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  pickerBtnText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "700",
    flex: 1,
  },
  pickerChevron: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 8,
  },
});

export default RegisterScreen;

