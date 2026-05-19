import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useColors } from "../theme/ThemeContext";
import AppAlert from "../components/AppAlert";

const ProfileEditScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [storeName, setStoreName] = useState(user?.storeName ?? "");
  const [brandName, setBrandName] = useState(user?.brandName ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: "", message: "" });

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: isMobile ? 12 : 16, paddingBottom: 40 },
    avatarWrap: { alignItems: "center", marginBottom: 4 },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    avatarFallback: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.text,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: { color: colors.bg, fontSize: isMobile ? 24 : 30, fontWeight: "800" },
    avatarHint: {
      marginTop: 8,
      fontSize: 11,
      color: colors.successTintText,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.1,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 18,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 0,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: isMobile ? 13 : 15,
      color: colors.text,
    },
    readonlyWrap: { marginTop: 18 },
    readonlyValue: {
      fontSize: isMobile ? 13 : 15,
      color: colors.text,
      paddingVertical: 11,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 0,
      borderWidth: 1,
      borderColor: colors.border,
    },
    readonlyNote: { marginTop: 4, fontSize: 11, color: colors.muted },
    saveBtn: {
      marginTop: 28,
      backgroundColor: colors.text,
      paddingVertical: 14,
      alignItems: "center",
    },
    saveBtnText: {
      color: colors.bg,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.3,
    },
    idSection: { marginTop: 18 },
    idVerifiedBadge: {
      backgroundColor: colors.successTint,
      borderWidth: 2,
      borderColor: colors.success,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    idVerifiedText: {
      color: colors.successTintText,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    idPendingBadge: {
      backgroundColor: colors.noticeBg,
      borderWidth: 2,
      borderColor: colors.pinYellow,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    idPendingText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 17,
    },
    idHint: {
      fontSize: 11,
      color: colors.muted,
      lineHeight: 17,
      marginBottom: 10,
    },
    idUploadBtn: {
      backgroundColor: colors.text,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      paddingVertical: 12,
      alignItems: "center",
    },
    idUploadBtnText: {
      color: colors.bg,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.1,
    },
  }), [colors]);

  const handleSave = async () => {
    if (!name.trim()) {
      setAlertState({ visible: true, title: "Required", message: "Name cannot be empty." });
      return;
    }
    setLoading(true);
    try {
      const res = await api.put("/auth/profile", {
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        storeName: storeName.trim(),
        brandName: brandName.trim(),
      });
      if (res.data.success) {
        await refreshUser();
        setAlertState({ visible: true, title: "Saved", message: "Profile updated successfully." });
        setTimeout(() => navigation.goBack(), 400);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update profile.";
      setAlertState({ visible: true, title: "Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAlertState({ visible: true, title: "Permission needed", message: "Allow photos access to upload avatar." });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled) return;
    const image = result.assets[0];
    const formData = new FormData();
    formData.append("avatar", { uri: image.uri, type: image.mimeType || "image/jpeg", name: image.fileName || `avatar-${Date.now()}.jpg` } as any);
    setLoading(true);
    try {
      const res = await api.post("/auth/profile/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data.success) {
        setAvatar(res.data.data.user.avatar || "");
        await refreshUser();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to upload avatar.";
      setAlertState({ visible: true, title: "Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{name?.charAt(0)?.toUpperCase() || "?"}</Text>
            </View>
          )}
          <Text style={styles.avatarHint}>Change profile photo</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={colors.muted} autoCapitalize="words" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+233 XX XXX XXXX" placeholderTextColor={colors.muted} keyboardType="phone-pad" />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. UMaT, Tarkwa" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Store Name</Text>
        <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} placeholder="Your store display name" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Brand Name</Text>
        <TextInput style={styles.input} value={brandName} onChangeText={setBrandName} placeholder="Brand identity name" placeholderTextColor={colors.muted} />

        <View style={styles.readonlyWrap}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.readonlyValue}>{user?.email}</Text>
          <Text style={styles.readonlyNote}>Email cannot be changed.</Text>
        </View>

        {/* Student ID card upload */}
        <View style={styles.idSection}>
          <Text style={styles.label}>Student ID Card</Text>
          {(user as any)?.idVerificationStatus === 'verified' ? (
            <View style={styles.idVerifiedBadge}>
              <Text style={styles.idVerifiedText}>ID Verified</Text>
            </View>
          ) : (user as any)?.idVerificationStatus === 'pending' ? (
            <View style={styles.idPendingBadge}>
              <Text style={styles.idPendingText}>Under Review — we'll notify you once approved</Text>
            </View>
          ) : (
            <>
              <Text style={styles.idHint}>
                Upload a photo of your UMaT student ID. Our team will verify it within 24 hours.
              </Text>
              <TouchableOpacity
                style={[styles.idUploadBtn, loading && { opacity: 0.5 }]}
                onPress={async () => {
                  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (!permission.granted) {
                    setAlertState({ visible: true, title: 'Permission needed', message: 'Allow photos access to upload your ID card.' });
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
                  if (result.canceled) return;
                  const image = result.assets[0];
                  const formData = new FormData();
                  formData.append('idCard', { uri: image.uri, type: image.mimeType || 'image/jpeg', name: `id-${Date.now()}.jpg` } as any);
                  setLoading(true);
                  try {
                    const res = await api.post('/auth/upload-id-card', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    if (res.data.success) {
                      await refreshUser();
                      setAlertState({ visible: true, title: 'Submitted', message: 'Your student ID has been submitted for review.' });
                    }
                  } catch (err: any) {
                    setAlertState({ visible: true, title: 'Error', message: err?.response?.data?.message || 'Upload failed.' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.idUploadBtnText}>Upload Student ID Photo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState({ visible: false, title: "", message: "" })}
      />
    </KeyboardAvoidingView>
  );
};

export default ProfileEditScreen;
