// src/features/client/screens/AccountScreen.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import ClientHeader from "../components/ClientHeader";
import { authStore } from "../../../shared/store/authStore";
import { useClientApi } from "../hooks/useClientApi";
import {
  getEmail,
  getNumeroCuenta,
  getPlaca,
  getPuedesPagar,
  getSaldoStr,
  getTitular,
} from "../utils/accountFormat";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// ─── Sección animada (fade + slide sutil) ───────────────────────────────────
const FadeInSection = ({ children, delay = 0, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 480, delay, useNativeDriver: true }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const InfoLine = ({ icon, label, value, valueColor }) => (
  <View style={styles.infoLine}>
    <MaterialIcons name={icon} size={18} color={COLORS.textLight} style={styles.infoIcon} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const AccountScreen = () => {
  const { getAccount, getBalance, loading, error } = useClientApi();
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [accRes, balRes] = await Promise.all([getAccount(), getBalance()]);
    if (accRes.success) setAccount(accRes.data?.cuenta || accRes.data?.data || accRes.data);
    if (balRes.success) setBalance(balRes.data?.cuenta || balRes.data?.data || balRes.data);
  }, [getAccount, getBalance]);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const puedesPagar = getPuedesPagar(balance);
  const numeroCuenta = getNumeroCuenta(account);
  const titular = getTitular(account);
  const email = getEmail(account);
  const placa = getPlaca(account, balance);
  const saldoStr = getSaldoStr(balance, account);
  const estado = account?.estado || "Activa";

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ClientHeader title="Mi Cuenta" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !account ? (
          <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Tarjeta de cuenta, estilo credencial bancaria */}
            <FadeInSection delay={0}>
              <LinearGradient
                colors={["#0a1f47", "#08316D", "#1E336C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.accountCard}
              >
                <View style={styles.decorLine} />

                <View style={styles.accountCardTop}>
                  <Text style={styles.accountCardKicker}>CUENTA MUNICIPAL</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: puedesPagar ? "rgba(34,197,94,0.22)" : "rgba(240,180,41,0.22)" },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: puedesPagar ? "#4ade80" : COLORS.accentGold },
                      ]}
                    />
                    <Text style={styles.statusBadgeText}>{estado}</Text>
                  </View>
                </View>

                <Text style={styles.accountNumber}>{numeroCuenta}</Text>

                <View style={styles.accountCardBottom}>
                  <View>
                    <Text style={styles.accountCardMicroLabel}>SALDO DISPONIBLE</Text>
                    <Text style={styles.accountBalance}>{saldoStr}</Text>
                  </View>
                  <View style={styles.accountCardBottomRight}>
                    <Text style={styles.accountCardMicroLabel}>TITULAR</Text>
                    <Text style={styles.accountHolder} numberOfLines={1}>
                      {titular}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </FadeInSection>

            {/* Datos personales */}
            <FadeInSection delay={140}>
              <Text style={styles.sectionHeading}>Datos personales</Text>
              <View style={styles.card}>
                <InfoLine icon="badge" label="Titular" value={titular} />
                <View style={styles.divider} />
                <InfoLine icon="mail-outline" label="Correo" value={email} />
                <View style={styles.divider} />
                <InfoLine icon="directions-car" label="Placa" value={placa} valueColor={COLORS.accentGold} />
              </View>
            </FadeInSection>

            {/* Estado financiero */}
            <FadeInSection delay={240}>
              <Text style={styles.sectionHeading}>Resumen</Text>
              <View style={styles.tileRow}>
                <View style={styles.tile}>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.tileValue}>{saldoStr}</Text>
                  <Text style={styles.tileLabel}>Saldo</Text>
                </View>
                <View style={styles.tile}>
                  <MaterialIcons
                    name={puedesPagar ? "check-circle-outline" : "error-outline"}
                    size={20}
                    color={puedesPagar ? COLORS.success : COLORS.accentGold}
                  />
                  <Text style={styles.tileValue}>{puedesPagar ? "Al día" : "Revisar"}</Text>
                  <Text style={styles.tileLabel}>Estado de pagos</Text>
                </View>
              </View>
            </FadeInSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  spinner: {
    marginTop: SPACING.xl,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },

  accountCard: {
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  decorLine: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.045)",
    top: -140,
    right: -80,
  },
  accountCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountCardKicker: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: "700",
  },
  accountNumber: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: SPACING.lg,
  },
  accountCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: SPACING.lg,
  },
  accountCardBottomRight: {
    alignItems: "flex-end",
    maxWidth: "55%",
  },
  accountCardMicroLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 3,
  },
  accountBalance: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
  },
  accountHolder: {
    color: "rgba(255,255,255,0.9)",
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },

  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textLight,
    letterSpacing: 0.3,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
  },
  infoIcon: {
    width: 20,
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    width: 66,
  },
  infoValue: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  tileRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    alignItems: "center",
    gap: 4,
    ...SHADOWS.card,
  },
  tileValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
    color: COLORS.text,
  },
  tileLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
});

export default AccountScreen;