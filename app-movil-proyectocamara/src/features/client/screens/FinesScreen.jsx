// src/features/client/screens/FinesScreen.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { EmptyState } from "../../../shared/components/common/Common";
import FineDetailModal from "../components/FineDetailModal";
import { useClientApi } from "../hooks/useClientApi";
import { pickArray } from "../../../shared/utils/pickArray";
import { formatMoney, parseMoneyNumber } from "../../../shared/utils/formatMoney";
import { getFineAmount, getFineDescription } from "../utils/fineAmount";
import { getNumeroCuenta, getPlaca } from "../utils/accountFormat";
import { authStore } from "../../../shared/store/authStore";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const FILTERS = [
  { key: "todas", label: "Todas", icon: "list-alt" },
  { key: "pendientes", label: "Pendientes", icon: "warning" },
  { key: "pagadas", label: "Pagadas", icon: "check-circle" },
];

// ─── Sección animada (fade + slide) ─────────────────────────────────────────
const FadeInSection = ({ children, delay = 0, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ─── Tarjeta de multa con barra de color + animación ───────────────────────
const FineCard = ({ fine, isPaid, delay, onPress }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 8, tension: 60, delay, useNativeDriver: true }).start();
  }, [anim, delay]);

  const accentColor = isPaid ? COLORS.success : COLORS.accentGold;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          { scale: Animated.multiply(anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }), pressScale) },
        ],
      }}
    >
      <Pressable
        style={styles.fineCard}
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <View style={styles.fineCardBody}>
          <View style={[styles.fineIcon, { backgroundColor: `${accentColor}1A` }]}>
            <MaterialIcons name={isPaid ? "check-circle" : "warning"} size={22} color={accentColor} />
          </View>
          <View style={styles.fineInfo}>
            <Text style={styles.fineTitle}>{getFineDescription(fine)}</Text>
            <Text style={styles.fineDate}>
              {fine.fecha ? new Date(fine.fecha).toLocaleDateString("es-GT") : ""}
            </Text>
          </View>
          <View style={styles.fineAmountWrap}>
            <Text style={styles.fineAmount}>{formatMoney(getFineAmount(fine))}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${accentColor}22` }]}>
              <Text style={[styles.statusPillText, { color: accentColor }]}>
                {isPaid ? "Pagada" : "Pendiente"}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const FinesScreen = () => {
  const navigation = useNavigation();
  const { getFines, getAccount, loading, error } = useClientApi();
  const getRegisteredProfile = authStore((state) => state.getRegisteredProfile);
  const user = authStore((state) => state.user);
  const registeredProfile = getRegisteredProfile(user?.username) || {};

  const [fines, setFines] = useState([]);
  const [account, setAccount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [filter, setFilter] = useState("todas");

  const load = useCallback(async () => {
    const [finesRes, accRes] = await Promise.all([getFines(), getAccount()]);
    if (finesRes.success) setFines(pickArray(finesRes.data));
    if (accRes.success) setAccount(accRes.data?.cuenta || accRes.data?.data || accRes.data);
  }, [getFines, getAccount]);

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

  const isFinePaid = (fine) => fine.pagada === true || (fine.estado || fine.status) === "PAGADA";
  const numeroCuenta = getNumeroCuenta(account);
  const placa = getPlaca(account, null, registeredProfile.placa);

  const pendingFines = fines.filter((f) => !isFinePaid(f));
  const paidFines = fines.filter((f) => isFinePaid(f));
  const totalPendiente = pendingFines.reduce((sum, f) => sum + parseMoneyNumber(getFineAmount(f)), 0);

  const visibleFines =
    filter === "pendientes" ? pendingFines : filter === "pagadas" ? paidFines : fines;

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Ver Multas</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <FadeInSection delay={0}>
          <LinearGradient
            colors={
              pendingFines.length === 0
                ? ["#22c55e", "#16a34a", "#0f7a34"]
                : ["#1E336C", "#08316D", "#0a1f47"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroDecorCircle} />
            <View style={styles.heroDecorCircleSmall} />
            <MaterialIcons
              name={pendingFines.length === 0 ? "check-circle" : "warning"}
              size={32}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.heroLabel}>
              {pendingFines.length === 0 ? "Estás al día" : "Total pendiente"}
            </Text>
            <Text style={styles.heroValue}>
              {pendingFines.length === 0 ? "¡Sin multas!" : formatMoney(totalPendiente)}
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{pendingFines.length}</Text>
                <Text style={styles.heroStatLabel}>Pendientes</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{paidFines.length}</Text>
                <Text style={styles.heroStatLabel}>Pagadas</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{fines.length}</Text>
                <Text style={styles.heroStatLabel}>Total</Text>
              </View>
            </View>
          </LinearGradient>
        </FadeInSection>

        <FadeInSection delay={100} style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <MaterialIcons
                  name={f.icon}
                  size={15}
                  color={active ? COLORS.surface : COLORS.primary}
                />
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </FadeInSection>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading && fines.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
        ) : visibleFines.length === 0 ? (
          <FadeInSection delay={160}>
            <EmptyState
              icon={filter === "pagadas" ? "receipt-long" : "check-circle"}
              title={
                fines.length === 0
                  ? "Sin multas registradas"
                  : filter === "pendientes"
                  ? "Sin multas pendientes"
                  : "Sin multas pagadas"
              }
              message={fines.length === 0 ? "Al día ✓" : undefined}
            />
          </FadeInSection>
        ) : (
          visibleFines.map((fine, index) => (
            <FineCard
              key={fine._id || fine.id}
              fine={fine}
              isPaid={isFinePaid(fine)}
              delay={180 + index * 90}
              onPress={() => setSelectedFine(fine)}
            />
          ))
        )}
      </ScrollView>

      <FineDetailModal
        visible={!!selectedFine}
        fine={selectedFine}
        isPaid={selectedFine ? isFinePaid(selectedFine) : false}
        numeroCuenta={numeroCuenta}
        placa={placa}
        onClose={() => setSelectedFine(null)}
        onPay={() => {
          const id = selectedFine?._id || selectedFine?.id;
          setSelectedFine(null);
          navigation.navigate("PayFine", { fineId: id });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  hero: {
    borderRadius: 20,
    alignItems: "center",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: "hidden",
  },
  heroDecorCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -80,
    right: -60,
  },
  heroDecorCircleSmall: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  heroValue: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  heroStat: {
    alignItems: "center",
    minWidth: 60,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  heroStatValue: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  filterChipTextActive: {
    color: COLORS.surface,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
  spinner: {
    marginTop: SPACING.xl,
  },
  fineCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  accentBar: {
    width: 5,
  },
  fineCardBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  fineIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  fineInfo: {
    flex: 1,
  },
  fineTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
  fineDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  fineAmountWrap: {
    alignItems: "flex-end",
    marginRight: SPACING.xs,
  },
  fineAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.text,
  },
  statusPill: {
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
  },
});

export default FinesScreen;
