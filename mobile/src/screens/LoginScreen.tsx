import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import AppAlert from "../components/AppAlert";
import { supabase } from "../services/supabase";

WebBrowser.maybeCompleteAuthSession();

const extractOAuthParams = (redirectUrl: string) => {
  const result: Record<string, string> = {};
  try {
    const url = new URL(redirectUrl);
    const query = new URLSearchParams(url.search);
    query.forEach((value, key) => {
      result[key] = value;
    });

    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const fragment = new URLSearchParams(hash);
    fragment.forEach((value, key) => {
      result[key] = value;
    });
  } catch {
    const [, queryPart = ""] = redirectUrl.split("?");
    const [queryOnly = "", hashPart = ""] = queryPart.split("#");
    const query = new URLSearchParams(queryOnly);
    query.forEach((value, key) => {
      result[key] = value;
    });
    const fragment = new URLSearchParams(hashPart);
    fragment.forEach((value, key) => {
      result[key] = value;
    });
  }

  return result;
};

const LoginScreen = ({ navigation }: any) => {
  const { sendLoginOtp, verifyOtpAndLogin, googleLogin } = useAuth();
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

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<any[]>([]);
  const [alertState, setAlertState] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: "", message: "",
  });

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setAlertState({ visible: true, title: "Invalid email", message: "Please enter a valid email address." });
      return;
    }
    setIsLoading(true);
    try {
      await sendLoginOtp(email.toLowerCase());
      setOtpSent(true);
      setResendCountdown(60);
    } catch (error: any) {
      setAlertState({ visible: true, title: "Failed", message: error.message || "Could not send code." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) { setOtpError("Enter the 6-digit code from your email."); return; }
    setOtpError("");
    setIsLoading(true);
    try {
      await verifyOtpAndLogin(email, otpCode);
    } catch (error: any) {
      setOtpError(error.message || "Incorrect code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      await sendLoginOtp(email.toLowerCase());
      setResendCountdown(60);
    } catch {
      setAlertState({ visible: true, title: "Failed", message: "Could not resend code." });
    }
  };

  const handleGooglePress = async () => {
    setIsLoading(true);
    try {
      const redirectTo = Linking.createURL("auth/callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Unable to start Google sign-in.");
      }

      const authResult = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (authResult.type !== "success" || !authResult.url) {
        if (authResult.type === "cancel") return;
        throw new Error("Google sign-in did not complete.");
      }

      const parsed = Linking.parse(authResult.url);
      const params = {
        ...extractOAuthParams(authResult.url),
        ...(parsed.queryParams as
          | Record<string, string | undefined>
          | undefined),
      };

      const code = typeof params.code === "string" ? params.code : undefined;
      let accessToken: string | undefined;

      if (code) {
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        accessToken = exchangeData.session?.access_token;
        if (exchangeError || !accessToken) {
          throw new Error(
            exchangeError?.message || "Supabase Google session failed.",
          );
        }
      } else {
        const oauthAccessToken =
          typeof params.access_token === "string"
            ? params.access_token
            : undefined;
        const oauthRefreshToken =
          typeof params.refresh_token === "string"
            ? params.refresh_token
            : undefined;

        if (!oauthAccessToken || !oauthRefreshToken) {
          throw new Error("Missing OAuth code/tokens from Google redirect.");
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: oauthAccessToken,
            refresh_token: oauthRefreshToken,
          });

        accessToken = sessionData.session?.access_token;
        if (sessionError || !accessToken) {
          throw new Error(
            sessionError?.message || "Supabase session setup failed.",
          );
        }
      }

      const result = await googleLogin(accessToken);
      if (result?.isNewUser) {
        setAlertState({
          visible: true,
          title: "Sign up first",
          message:
            "No account found. Please sign up with Google and choose a role.",
        });
        setTimeout(() => navigation.getParent()?.navigate("Register"), 500);
      } else if (result?.needsProfileCompletion) {
        setAlertState({
          visible: true,
          title: "Profile incomplete",
          message: "Continue and update phone/store details in profile.",
        });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.userMessage ||
        error.message ||
        "Google sign-in failed";
      setAlertState({ visible: true, title: "Google sign-in failed", message });
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue buying and selling on campus.</Text>
            <View style={styles.polaroidFrame}>
              <Image source={require("../../assets/marketillustration1.jpg")} style={styles.heroArt} />
              <View style={styles.redThumbtack}>
                <View style={styles.pinReflection} />
                <View style={styles.pinShadow} />
              </View>
            </View>
          </View>
          <View style={styles.form}>
            {!otpSent ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@email.com"
                    placeholderTextColor={colors.textDisabled}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleSendOtp}
                    returnKeyType="send"
                  />
                </View>
                <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={isLoading}>
                  <Text style={styles.buttonText}>{isLoading ? "Sending..." : "Send Login Code"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.label, { color: colors.accent }]}>VERIFY YOUR EMAIL</Text>
                  <Text style={{ fontSize: isMobile ? 18 : 22, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: -0.5, marginTop: 4 }}>Enter the code.</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 20 }}>
                    Sent to <Text style={{ color: colors.text, fontWeight: '700' }}>{email}</Text>
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
                  <Text style={styles.buttonText}>{isLoading ? "Verifying..." : "Sign In"}</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                  <TouchableOpacity onPress={() => { setOtpSent(false); setOtpCode(''); setOtpError(''); }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>← Change Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleResendOtp} disabled={resendCountdown > 0}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: resendCountdown > 0 ? colors.muted : colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            <Pressable onPress={handleGooglePress} disabled={isLoading} style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }, isLoading && { opacity: 0.5 }]}>
              {isLoading ? <ActivityIndicator color={colors.text} /> : (
                <View style={styles.googleInner}>
                  <Image source={require("../../assets/adaptive-icon.png")} style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.footer}>
              <Text style={styles.footerText}>No account yet? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.link}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
        <AppAlert visible={alertState.visible} title={alertState.title} message={alertState.message} onClose={() => setAlertState({ visible: false, title: "", message: "" })} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isMobile = true) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: isMobile ? 16 : 22, paddingVertical: 14 },
  heroWrap: { marginBottom: isMobile ? 16 : 24, zIndex: 10 },
  eyebrow: { color: colors.primary, fontSize: isMobile ? 9 : 10, textTransform: "uppercase", letterSpacing: 2, fontWeight: "900" },
  title: { marginTop: 6, color: colors.text, fontSize: isMobile ? 26 : 32, fontWeight: "900", textTransform: "uppercase", letterSpacing: -0.5 },
  subtitle: { marginTop: 6, color: colors.textSecondary, fontSize: isMobile ? 12 : 13, fontWeight: "700", lineHeight: isMobile ? 18 : 20 },
  polaroidFrame: { marginTop: 14, backgroundColor: colors.surface, borderWidth: colors.boardBorderWidth, borderColor: colors.boardBorder, padding: 8, paddingBottom: 16, transform: [{ rotate: "-1.5deg" }], zIndex: 10 },
  heroArt: { width: "100%", height: isMobile ? 120 : 160, borderWidth: 2, borderColor: colors.boardBorder },
  redThumbtack: { position: "absolute", top: -10, left: "50%", marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.pinRed, borderWidth: 2, borderColor: colors.boardBorder, zIndex: 30 },
  pinReflection: { position: "absolute", top: 2, left: 2, width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.6)" },
  pinShadow: { position: "absolute", top: "50%", left: "50%", width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.primaryPressed, transform: [{ translateX: -1.5 }, { translateY: -1.5 }] },
  form: { backgroundColor: colors.surface, borderWidth: colors.boardBorderWidth, borderColor: colors.boardBorder, padding: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: "900", color: colors.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.2 },
  input: { borderWidth: colors.boardBorderWidth, borderColor: colors.boardBorder, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, fontWeight: "600", color: colors.text, backgroundColor: colors.surfaceSecondary, borderRadius: 0 },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 60 },
  eyeButton: { position: "absolute", right: 12, top: 15 },
  eyeText: { color: colors.primary, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  button: { backgroundColor: colors.primary, paddingVertical: 15, alignItems: "center", marginTop: 8, borderWidth: colors.boardBorderWidth, borderColor: colors.boardBorder },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.primaryContent, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.4 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 14 },
  divider: { flex: 1, height: 2, backgroundColor: colors.boardBorder, opacity: 0.2 },
  dividerText: { marginHorizontal: 12, color: colors.text, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: "900" },
  googleBtn: { borderWidth: colors.boardBorderWidth, borderColor: colors.boardBorder, paddingVertical: 14, alignItems: "center", backgroundColor: colors.surface },
  googleInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  googleIcon: { width: 16, height: 16 },
  googleBtnText: { color: colors.text, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.4 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  link: { fontSize: 12, color: colors.primary, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.1 },
  forgotBtn: { alignItems: "center", paddingVertical: 10 },
  forgotText: { fontSize: 11, color: colors.text, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  letterRow: { flexDirection: "row", alignItems: "flex-end", gap: 5, marginBottom: 8 },
  letterCard: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.boardBorder, justifyContent: "center", alignItems: "center" },
  letterText: { color: colors.text, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", fontWeight: "900" },
});

export default LoginScreen;
