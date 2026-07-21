// src/features/client/components/ClientMenu.jsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { authStore, isAdminUser } from "../../../shared/store/authStore";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(300, SCREEN_WIDTH * 0.82);

const ITEMS = [
  { key: "perfil", icon: "person", label: "Mi Perfil", color: COLORS.primary, to: "Profile" },
  {
    key: "recargas",
    icon: "add-card",
    label: "Recargas",
    color: COLORS.accentOrange,
    to: "Recargas",
  },
  { key: "multas", icon: "warning", label: "Ver multas", color: COLORS.accentGold, to: "Fines" },
  { key: "pagar", icon: "payments", label: "Pagar multa", color: COLORS.error, to: "PayFine" },
  { key: "consultas", icon: "search", label: "Consultas", color: COLORS.secondary, to: "Consultas" },
  { key: "mapa", icon: "map", label: "Ver mapa", color: COLORS.success, to: "Map" },
  { key: "chat", icon: "chat", label: "Chat de ayuda", color: COLORS.accentGold, to: "Chat" },
];

const ClientMenu = ({ visible, onClose, navigation }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(ITEMS.map(() => new Animated.Value(0))).current;

  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);
  const getRegisteredProfile = authStore((state) => state.getRegisteredProfile);
  const isAdmin = isAdminUser(user);
  const profile = getRegisteredProfile(user?.username) || {};

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      itemAnims.forEach((a) => a.setValue(0));
      Animated.timing(slideAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      Animated.stagger(
        45,
        itemAnims.map((a) =>
          Animated.timing(a, { toValue: 1, duration: 240, useNativeDriver: true })
        )
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [PANEL_WIDTH, 0] });

  const goTo = (item) => {
    onClose();
    navigation.navigate(item.to, item.params);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <View style={styles.profileHeader}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={28} color={COLORS.surface} />
                </View>
              )}
              <Text style={styles.profileName}>
                {profile.name
                  ? `${profile.name} ${profile.surname || ""}`.trim()
                  : user?.username || "Usuario"}
              </Text>
              <Text style={styles.profileMeta}>
                {isAdmin ? "Administrador" : "Conductor"} · @{user?.username || "—"}
              </Text>
              {profile.phone ? <Text style={styles.profileMeta}>{profile.phone}</Text> : null}
              {profile.email ? <Text style={styles.profileMeta}>{profile.email}</Text> : null}
            </View>

            <ScrollView style={styles.itemsList} contentContainerStyle={styles.itemsContent}>
              {ITEMS.map((item, index) => {
                const anim = itemAnims[index];
                return (
                  <Animated.View
                    key={item.key}
                    style={{
                      opacity: anim,
                      transform: [
                        {
                          translateX: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [24, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <Pressable
                      style={styles.item}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        goTo(item);
                      }}
                    >
                      <View style={[styles.iconChip, { backgroundColor: `${item.color}22` }]}>
                        <MaterialIcons name={item.icon} size={20} color={item.color} />
                      </View>
                      <Text style={styles.itemText}>{item.label}</Text>
                      <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                style={styles.logoutButton}
                onPress={() => {
                  onClose();
                  logout();
                }}
              >
                <MaterialIcons name="logout" size={18} color={COLORS.error} />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </Pressable>
              <Text style={styles.version}>Versión 1.0.0</Text>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  panel: {
    width: PANEL_WIDTH,
    height: "100%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  profileName: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
  },
  profileMeta: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 20,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: "700",
    fontSize: FONT_SIZE.sm,
  },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
  },
});

export default ClientMenu;
