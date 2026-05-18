import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import AppAlert from "../components/AppAlert";
import { colors, shadows } from "../theme";
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
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

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

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertState({
        visible: true,
        title: "Missing fields",
        message: "Please fill in all fields.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email.toLowerCase(), password);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.userMessage ||
        error.message ||
        "Login failed";
      setAlertState({ visible: true, title: "Login failed", message });
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroWrap}>
            {/* Branded Subscript Logo Lockup (Matches the brand identity 100%!) */}
            <View style={[styles.letterRow, { alignItems: 'flex-end', gap: 5, marginBottom: 12 }]}>
              
              {/* Massive Vector Q-Logo (Scaled to 54x54 for login page header balance) */}
              <View
                style={[
                  styles.letterCard,
                  {
                    width: 54,
                    height: 54,
                    borderWidth: 3,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    ...shadows.bulletin,
                  },
                ]}
              >
                {/* Bold Stencil Q (Inner Ring) */}
                <View style={{
                  width: 24,
                  height: 24,
                  borderWidth: 5.5,
                  borderColor: colors.border,
                  backgroundColor: 'transparent',
                }} />
                
                {/* Bold Stencil Q (Rotated Tail) */}
                <View style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  width: 10,
                  height: 5,
                  backgroundColor: colors.border,
                  transform: [{ rotate: '45deg' }],
                }} />

                {/* Red Thumbtack detail (Top Right) */}
                <View style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#ff6b6b',
                  borderWidth: 1.2,
                  borderColor: colors.border,
                }} />
              </View>

              {/* Subscript letters: U A D S (Compact 22x22 for clean header proportions) */}
              {['U', 'A', 'D', 'S'].map((char, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.letterCard,
                    {
                      width: 22,
                      height: 22,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 1,
                      ...shadows.bulletin,
                    },
                  ]}
                >
                  <Text style={[styles.letterText, { fontSize: 11, fontWeight: '900' }]}>{char}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue buying and selling on campus.
            </Text>
            <View style={styles.polaroidFrame}>
              <Image
                source={require("../../assets/marketillustration1.jpg")}
                style={styles.heroArt}
              />
              <View style={styles.redThumbtack}>
                <View style={styles.pinReflection} />
                <View style={styles.pinShadow} />
              </View>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@st.umat.edu.gh"
                placeholderTextColor="#9a8e7f"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9a8e7f"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Signing in..." : "Login"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              onPress={handleGooglePress}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.5 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <View style={styles.googleInner}>
                  <Image
                    source={require("../../assets/adaptive-icon.png")}
                    style={styles.googleIcon}
                  />
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
        </ScrollView>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  heroWrap: { marginBottom: 24, zIndex: 10 },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "900",
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  polaroidFrame: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "#000",
    padding: 8,
    paddingBottom: 20,
    transform: [{ rotate: "-1.5deg" }],
    ...shadows.bulletin,
    zIndex: 10,
  },
  heroArt: {
    width: "100%",
    height: 160,
    borderWidth: 2,
    borderColor: "#000",
  },
  redThumbtack: {
    position: "absolute",
    top: -10,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff6b6b",
    borderWidth: 2,
    borderColor: "#000",
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
    backgroundColor: "#991b1b",
    transform: [{ translateX: -1.5 }, { translateY: -1.5 }],
  },
  form: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 20,
    ...shadows.bulletin,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 0,
  },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 60 },
  eyeButton: { position: "absolute", right: 12, top: 15 },
  eyeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  button: {
    backgroundColor: colors.text,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.bulletin,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 14,
  },
  divider: { flex: 1, height: 2, backgroundColor: colors.border },
  dividerText: {
    marginHorizontal: 12,
    color: colors.text,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontWeight: "900",
  },
  googleBtn: {
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  googleInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  googleIcon: { width: 16, height: 16 },
  googleBtnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  link: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  forgotBtn: { alignItems: "center", paddingVertical: 10 },
  forgotText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  letterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    marginBottom: 8,
  },
  letterCard: {
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  letterText: {
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
  },
});

export default LoginScreen;
