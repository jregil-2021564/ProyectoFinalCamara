// src/features/client/screens/HomeScreen.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import ClientHeader from "../components/ClientHeader";
import { authStore } from "../../../shared/store/authStore";
import { useClientApi } from "../hooks/useClientApi";
import { pickArray } from "../../../shared/utils/pickArray";
import { formatMoney } from "../../../shared/utils/formatMoney";
import { getFineAmount, getFineDescription } from "../utils/fineAmount";
import {
  getNumeroCuenta,
  getPlaca,
  getPuedesPagar,
  getSaldoStr,
  getTitular,
} from "../utils/accountFormat";
import { FONT_SIZE, SPACING } from "../../../shared/constants/theme";

// ─── Paleta local "Apple-like" — solo para esta pantalla ───────────────────
const P = {
  bg: "#F5F5F7",
  card: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.055)",
  textPrimary: "#1D1D1F",
  textSecondary: "#86868B",
  green: "#2FAE5C",
  greenTint: "rgba(47,174,92,0.12)",
  gold: "#B6901E",
  goldTint: "rgba(182,144,30,0.12)",
  orange: "#D97A22",
  orangeTint: "rgba(217,122,34,0.12)",
  blueGray: "#5D6B84",
  blueGrayTint: "rgba(93,107,132,0.10)",
  divider: "rgba(0,0,0,0.06)",
};

const SHADOW_SOFT = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
};

// ─── Entrada animada, estilo "ease-out" spring suave ────────────────────────
const RiseIn = ({ children, delay = 0, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      friction: 9,
      tension: 60,
      useNativeDriver: true,
    }).start();
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

// ─── Tile con feedback táctil (escala) ──────────────────────────────────────
const PressableScale = ({ onPress, style, children, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.96, friction: 6, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start()
        }
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const StatTile = ({ icon, iconColor, iconTint, value, label, sublabel, sublabelColor, delay, onPress }) => (
  <RiseIn delay={delay} style={styles.statTileWrap}>
    <PressableScale onPress={onPress} disabled={!onPress}>
      <View style={styles.statTile}>
        <View style={[styles.statIconWrap, { backgroundColor: iconTint }]}>
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.statSublabel, sublabelColor ? { color: sublabelColor } : null]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  </RiseIn>
);

const ListRow = ({ icon, iconColor, iconTint, title, subtitle, trailing, isLast }) => (
  <View style={[styles.listRow, isLast && { borderBottomWidth: 0 }]}>
    <View style={[styles.listRowIcon, { backgroundColor: iconTint }]}>
      <MaterialIcons name={icon} size={16} color={iconColor} />
    </View>
    <View style={styles.listRowText}>
      <Text style={styles.listRowTitle} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.listRowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {trailing ? <Text style={styles.listRowTrailing}>{trailing}</Text> : null}
  </View>
);

const SectionCardHeader = ({ title, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onAction ? (
      <Pressable onPress={onAction} hitSlop={8} style={styles.sectionAction}>
        <Text style={styles.sectionActionText}>{actionLabel}</Text>
        <MaterialIcons name="chevron-right" size={16} color={P.textSecondary} />
      </Pressable>
    ) : null}
  </View>
);

const HomeScreen = () => {
  const navigation = useNavigation();
  const user = authStore((state) => state.user);
  const getRegisteredProfile = authStore((state) => state.getRegisteredProfile);
  const registeredProfile = getRegisteredProfile(user?.username) || {};
  const { getAccount, getBalance, getCards, getFines, getRechargeHistory } = useClientApi();

  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [cards, setCards] = useState([]);
  const [fines, setFines] = useState([]);
  const [history, setHistory] = useState([]);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    const [accRes, balRes, cardsRes, finesRes, histRes] = await Promise.all([
      getAccount(),
      getBalance(),
      getCards(),
      getFines(),
      getRechargeHistory(),
    ]);

    if (accRes.success) setAccount(accRes.data?.cuenta || accRes.data?.data || accRes.data);
    if (balRes.success) setBalance(balRes.data?.cuenta || balRes.data?.data || balRes.data);
    if (cardsRes.success) setCards(pickArray(cardsRes.data));
    if (finesRes.success) setFines(pickArray(finesRes.data));
    if (histRes.success) setHistory(pickArray(histRes.data));

    if (!accRes.success && !balRes.success && !cardsRes.success && !finesRes.success) {
      setLoadError(accRes.message || "No se pudo cargar tu información. Desliza para reintentar.");
    }
  }, [getAccount, getBalance, getCards, getFines, getRechargeHistory]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const pendingFines = fines.filter(
    (f) => !(f.pagada === true || f.estado === "PAGADA" || f.status === "PAGADA")
  );
  const totalPendiente = pendingFines.reduce((sum, f) => {
    const raw = String(getFineAmount(f) ?? "0").replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    return sum + (Number.isFinite(num) ? num : 0);
  }, 0);

  const accountNumber = getNumeroCuenta(account);
  const plate = getPlaca(account, balance, registeredProfile.placa);
  const status = account?.estado || "Cuenta activa";
  const saldoStr = getSaldoStr(balance, account);
  const puedesPagar = getPuedesPagar(balance);
  const titular = getTitular(account) !== "—" ? getTitular(account) : user?.username || "—";

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ClientHeader title="Mi Portal" />

      <ScrollView
        style={{ backgroundColor: P.bg }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.textSecondary} />}
      >
        <RiseIn delay={0}>
          <Text style={styles.greeting}>Hola, {user?.username || "usuario"}</Text>
          <Text style={styles.subtitle}>Gestiona tu cuenta, tarjetas y multas</Text>
        </RiseIn>

        {loadError ? (
          <RiseIn delay={20}>
            <Text style={styles.errorText}>{loadError}</Text>
          </RiseIn>
        ) : null}

        {/* Grid de indicadores */}
        <View style={styles.statsGrid}>
          <StatTile
            icon="account-balance-wallet"
            iconColor={P.gold}
            iconTint={P.goldTint}
            value={saldoStr}
            label="Saldo disponible"
            sublabel={puedesPagar ? "Disponible" : "Sin saldo"}
            sublabelColor={puedesPagar ? P.green : P.gold}
            delay={40}
            onPress={() => navigation.navigate("Balance")}
          />
          <StatTile
            icon="warning-amber"
            iconColor={P.blueGray}
            iconTint={P.blueGrayTint}
            value={formatMoney(totalPendiente)}
            label="Multas pendientes"
            sublabel={pendingFines.length === 0 ? "Al día ✓" : `${pendingFines.length} pendiente(s)`}
            sublabelColor={pendingFines.length === 0 ? P.green : P.blueGray}
            delay={90}
            onPress={() => navigation.navigate("Fines")}
          />
          <StatTile
            icon="credit-card"
            iconColor={P.orange}
            iconTint={P.orangeTint}
            value={String(cards.length)}
            label="Tarjetas activas"
            sublabel="Verificadas"
            sublabelColor={P.orange}
            delay={140}
            onPress={() => navigation.navigate("Cards")}
          />
          <StatTile
            icon="insights"
            iconColor={P.blueGray}
            iconTint={P.blueGrayTint}
            value={String(fines.length)}
            label="Total multas"
            sublabel={`${fines.length} registradas`}
            delay={190}
            onPress={() => navigation.navigate("Fines")}
          />
        </View>

        {/* Mi Cuenta */}
        <RiseIn delay={240}>
          <View style={styles.card}>
            <SectionCardHeader title="Mi Cuenta" />

            <View style={styles.accountGrid}>
              <View style={styles.accountCell}>
                <Text style={styles.accountCellLabel}>NÚMERO DE CUENTA</Text>
                <Text style={styles.accountCellValue}>{accountNumber}</Text>
              </View>
              <View style={[styles.accountCell, styles.accountCellHighlight]}>
                <Text style={styles.accountCellLabel}>SALDO DISPONIBLE</Text>
                <Text style={[styles.accountCellValue, { color: P.gold }]}>{saldoStr}</Text>
              </View>
              <View style={styles.accountCell}>
                <Text style={styles.accountCellLabel}>PLACA REGISTRADA</Text>
                <Text style={styles.accountCellValue}>{plate}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.identityRow}>
              <View style={styles.identityItem}>
                <Text style={styles.accountCellLabel}>TITULAR</Text>
                <Text style={styles.identityValue}>{titular}</Text>
              </View>
              <View style={styles.identityItem}>
                <Text style={styles.accountCellLabel}>ESTADO</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              </View>
            </View>
          </View>
        </RiseIn>

        {/* Mis Tarjetas */}
        <RiseIn delay={300}>
          <View style={styles.card}>
            <SectionCardHeader
              title="Mis Tarjetas"
              actionLabel="Agregar"
              onAction={() => navigation.navigate("Cards")}
            />
            {cards.length === 0 ? (
              <Text style={styles.emptyText}>Aún no tienes tarjetas registradas.</Text>
            ) : (
              cards.slice(0, 3).map((card, i) => (
                <ListRow
                  key={card.id || card._id}
                  icon="credit-card"
                  iconColor={P.orange}
                  iconTint={P.orangeTint}
                  title={card.alias || card.titular || "Tarjeta"}
                  subtitle={card.numero || ""}
                  trailing={`Disp. ${formatMoney(card.saldoDisponible)}`}
                  isLast={i === Math.min(cards.length, 3) - 1}
                />
              ))
            )}
          </View>
        </RiseIn>

        {/* Mis Multas */}
        <RiseIn delay={340}>
          <View style={styles.card}>
            <SectionCardHeader
              title="Mis Multas"
              actionLabel="Ver todas"
              onAction={() => navigation.navigate("Fines")}
            />
            {fines.length === 0 ? (
              <Text style={styles.emptyText}>Sin multas registradas.</Text>
            ) : (
              fines.slice(0, 3).map((fine, i) => (
                <ListRow
                  key={fine._id || fine.id}
                  icon="warning-amber"
                  iconColor={P.blueGray}
                  iconTint={P.blueGrayTint}
                  title={getFineDescription(fine)}
                  trailing={formatMoney(getFineAmount(fine))}
                  isLast={i === Math.min(fines.length, 3) - 1}
                />
              ))
            )}
          </View>
        </RiseIn>

        {/* Historial de Recargas */}
        <RiseIn delay={380}>
          <View style={styles.card}>
            <SectionCardHeader
              title="Historial de Recargas"
              actionLabel="Ver todo"
              onAction={() => navigation.navigate("Balance")}
            />
            {history.length === 0 ? (
              <Text style={styles.emptyText}>Sin recargas registradas.</Text>
            ) : (
              history.slice(0, 3).map((item, i) => (
                <ListRow
                  key={item._id || item.id || i}
                  icon="add-card"
                  iconColor={P.green}
                  iconTint={P.greenTint}
                  title={
                    item.fecha
                      ? new Date(item.fecha).toLocaleDateString("es-GT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recarga"
                  }
                  subtitle={item.tarjeta || item.alias || ""}
                  trailing={formatMoney(item.monto)}
                  isLast={i === Math.min(history.length, 3) - 1}
                />
              ))
            )}
          </View>
        </RiseIn>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: P.bg },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  greeting: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: P.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: P.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: "#D64545",
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statTileWrap: {
    width: "48.5%",
    marginBottom: SPACING.sm,
  },
  statTile: {
    backgroundColor: P.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: SPACING.md,
    ...SHADOW_SOFT,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: P.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: P.textSecondary,
    marginTop: 2,
  },
  statSublabel: {
    fontSize: 11,
    fontWeight: "700",
    color: P.textSecondary,
    marginTop: 6,
  },

  card: {
    backgroundColor: P.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOW_SOFT,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: P.textPrimary,
    letterSpacing: -0.2,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionActionText: {
    fontSize: 13,
    color: P.textSecondary,
    fontWeight: "600",
  },

  accountGrid: {
    gap: SPACING.sm,
  },
  accountCell: {
    backgroundColor: P.bg,
    borderRadius: 16,
    padding: SPACING.sm,
  },
  accountCellHighlight: {
    backgroundColor: P.goldTint,
  },
  accountCellLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: P.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  accountCellValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: P.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: P.divider,
    marginVertical: SPACING.md,
  },
  identityRow: {
    flexDirection: "row",
    gap: SPACING.lg,
  },
  identityItem: {
    flex: 1,
  },
  identityValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: P.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.green,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: P.green,
  },

  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: P.textSecondary,
    paddingVertical: SPACING.sm,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: P.divider,
  },
  listRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  listRowText: {
    flex: 1,
  },
  listRowTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: P.textPrimary,
  },
  listRowSubtitle: {
    fontSize: 12,
    color: P.textSecondary,
    marginTop: 1,
  },
  listRowTrailing: {
    fontSize: 13,
    fontWeight: "700",
    color: P.textPrimary,
  },
});

export default HomeScreen;
