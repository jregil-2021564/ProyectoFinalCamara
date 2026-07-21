// src/features/client/screens/ProfileScreen.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import PhotoActionSheet from "../components/PhotoActionSheet";
import { authStore, isAdminUser } from "../../../shared/store/authStore";
import { useAuth } from "../../auth/hooks/useAuth";
import { useClientApi } from "../hooks/useClientApi";
import { getEmail, getPlaca, getTitular } from "../utils/accountFormat";
import { FONT_SIZE, SPACING } from "../../../shared/constants/theme";

// ─── Paleta local "Apple-like" — solo para esta pantalla ───────────────────
const P = {
  bg: "#F5F5F7",
  card: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.055)",
  textPrimary: "#1D1D1F",
  textSecondary: "#86868B",
  accent: "#D97A22",
  red: "#E0402C",
  divider: "rgba(0,0,0,0.07)",
};

const SHADOW_SOFT = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
};

const RiseIn = ({ children, delay = 0, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, friction: 9, tension: 60, useNativeDriver: true }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const InfoRow = ({ label, value, isLast }) => (
  <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>
      {value || "No disponible"}
    </Text>
  </View>
);

const ProfileScreen = () => {
  const navigation = useNavigation();
  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);
  const updateUser = authStore((state) => state.updateUser);
  const getRegisteredProfile = authStore((state) => state.getRegisteredProfile);
  const saveRegisteredProfile = authStore((state) => state.saveRegisteredProfile);
  const registeredProfile = getRegisteredProfile(user?.username) || {};
  const isAdmin = isAdminUser(user);

  const { getAccount } = useClientApi();
  const { updateProfilePicture, loading: uploadingPhoto } = useAuth();

  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  const load = useCallback(async () => {
    setLoadingAccount(true);
    const res = await getAccount();
    if (res.success) setAccount(res.data?.cuenta || res.data?.data || res.data);
    setLoadingAccount(false);
  }, [getAccount]);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Aplica la foto elegida: intenta subirla al backend; si no hay URL
  // persistente de vuelta, usa un data URI base64 (sí sobrevive recargar,
  // a diferencia del blob: que da el picker en web).
  const applyPickedPhoto = async (asset) => {
    const dataUri = asset.base64
      ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
      : asset.uri;

    const uploadResult = await updateProfilePicture(asset);
    const remoteUrl =
      uploadResult?.data?.profilePicture ||
      uploadResult?.data?.data?.profilePicture ||
      uploadResult?.data?.user?.profilePicture ||
      null;

    const finalPhoto = remoteUrl || dataUri;
    updateUser({ profilePicture: finalPhoto });
    saveRegisteredProfile(user?.username, { ...registeredProfile, profilePicture: finalPhoto });
  };

  const pickFromLibrary = async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    applyPickedPhoto(result.assets[0]);
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      applyPickedPhoto(result.assets[0]);
    } catch (err) {
      Alert.alert("No disponible", "No se pudo acceder a la cámara en este dispositivo.");
    }
  };

  const removePhoto = () => {
    updateUser({ profilePicture: null });
    saveRegisteredProfile(user?.username, { ...registeredProfile, profilePicture: null });
  };

  const titular = getTitular(account);
  const email = getEmail(account);
  const placa = getPlaca(account, null, registeredProfile.placa);
  const displayName = titular !== "—" ? titular : user?.username || "Usuario";

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={26} color={P.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={{ backgroundColor: P.bg }} contentContainerStyle={styles.content}>
        <RiseIn delay={0}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarShadowWrap}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={44} color={P.textSecondary} />
                </View>
              )}
              {uploadingPhoto ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </View>
            <Pressable onPress={() => setSheetVisible(true)} hitSlop={8}>
              <Text style={styles.editLink}>Editar</Text>
            </Pressable>
          </View>
        </RiseIn>

        <RiseIn delay={80}>
          <View style={styles.card}>
            <InfoRow label="Nombre" value={displayName} />
            <InfoRow label="Usuario" value={user?.username} />
            <InfoRow label="Correo" value={email !== "—" ? email : registeredProfile.email} />
            <InfoRow label="Teléfono" value={registeredProfile.phone} />
            <InfoRow label="Placa" value={placa} isLast />
          </View>
        </RiseIn>

        <RiseIn delay={140}>
          <View style={styles.card}>
            <InfoRow label="Rol" value={isAdmin ? "Administrador" : "Conductor"} isLast />
          </View>
        </RiseIn>

        {loadingAccount && !account ? (
          <ActivityIndicator color={P.textSecondary} style={styles.spinner} />
        ) : null}

        <RiseIn delay={200}>
          <Pressable style={styles.logoutButton} onPress={() => logout()}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </RiseIn>
      </ScrollView>

      <PhotoActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onTakePhoto={takePhoto}
        onPickPhoto={pickFromLibrary}
        onRemovePhoto={user?.profilePicture ? removePhoto : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: P.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: P.bg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(120,120,128,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: P.textPrimary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  avatarShadowWrap: {
    marginBottom: SPACING.sm,
    borderRadius: 56,
    ...SHADOW_SOFT,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 56,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  editLink: {
    color: P.accent,
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  card: {
    backgroundColor: P.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW_SOFT,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm + 3,
    borderBottomWidth: 1,
    borderBottomColor: P.divider,
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: P.textPrimary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: P.textSecondary,
    maxWidth: "60%",
    textAlign: "right",
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  logoutButton: {
    backgroundColor: P.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
    ...SHADOW_SOFT,
  },
  logoutText: {
    color: P.red,
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
});

export default ProfileScreen;
