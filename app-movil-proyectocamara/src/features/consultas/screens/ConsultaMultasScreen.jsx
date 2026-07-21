// src/features/consultas/screens/ConsultasScreen.jsx
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
import { MaterialIcons } from "@expo/vector-icons";
import { useClientApi } from "../../client/hooks/useClientApi";
import { formatMoney, parseMoneyNumber } from "../../../shared/utils/formatMoney";
import { getFineAmount, getFineDescription } from "../../client/utils/fineAmount";
import { FONT_SIZE, SPACING } from "../../../shared/constants/theme";

// ─── Paleta local "Apple-like", igual que Mi Portal / Perfil ───────────────
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
  blueGray: "#5D6B84",
  blueGrayTint: "rgba(93,107,132,0.10)",
  accent: "#D97A22",
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

const FineResultCard = ({ fine, delay }) => {
  const isPaid = fine.pagada === true || (fine.estado || fine.status) === "PAGADA";
  const velocidad = fine.velocidad ?? null;

  return (
    <RiseIn delay={delay}>
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={[styles.resultIcon, { backgroundColor: isPaid ? P.greenTint : P.goldTint }]}>
            <MaterialIcons
              name={isPaid ? "check-circle" : "speed"}
              size={18}
              color={isPaid ? P.green : P.gold}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.resultTitle}>{getFineDescription(fine)}</Text>
            <Text style={styles.resultDate}>
              {fine.fecha ? new Date(fine.fecha).toLocaleDateString("es-GT") : ""}
            </Text>
          </View>
          <Text style={styles.resultAmount}>{formatMoney(getFineAmount(fine))}</Text>
        </View>

        {velocidad !== null ? (
          <View style={styles.speedRow}>
            <MaterialIcons name="speed" size={14} color={P.blueGray} />
            <Text style={styles.speedText}>Velocidad registrada: {velocidad} km/h</Text>
          </View>
        ) : null}

        {fine.modeloDetectado || fine.colorDetectado ? (
          <View style={styles.speedRow}>
            <MaterialIcons name="directions-car" size={14} color={P.blueGray} />
            <Text style={styles.speedText}>
              Vehículo: {[fine.colorDetectado, fine.modeloDetectado].filter(Boolean).join(" ")}
            </Text>
          </View>
        ) : null}

        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: isPaid ? P.green : P.gold }]} />
          <Text style={styles.statusText}>{isPaid ? "Pagada" : "Pendiente"}</Text>
        </View>
      </View>
    </RiseIn>
  );
};

const ConsultaMultasScreen = () => {
  const navigation = useNavigation();
  const { getFines, loading, error } = useClientApi();

  const [refreshing, setRefreshing] = useState(false);
  const [placa, setPlaca] = useState(null);
  const [multas, setMultas] = useState([]);
  const [resumen, setResumen] = useState(null);

  // GET /pagos/mis-multas devuelve { success, placa, total, resumen, multas }
  // scoped a la placa registrada de TU propia cuenta — el backend no
  // soporta consultar la placa de otra persona, así que esta pantalla
  // muestra siempre tu propia información.
  const load = useCallback(async () => {
    const res = await getFines();
    if (res.success) {
      setPlaca(res.data?.placa || null);
      setResumen(res.data?.resumen || null);
      setMultas(Array.isArray(res.data?.multas) ? res.data.multas : []);
    }
  }, [getFines]);

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

  const pendingCount = resumen?.multasPendientes ?? multas.filter((f) => !(f.pagada === true || f.estado === "PAGADA")).length;
  const totalPendiente = resumen?.totalPendiente ?? formatMoney(
    multas
      .filter((f) => !(f.pagada === true || f.estado === "PAGADA"))
      .reduce((sum, f) => sum + parseMoneyNumber(getFineAmount(f)), 0)
  );
  const tarjetasParaPagar = resumen?.tarjetasParaPagar || [];

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={26} color={P.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Consultas</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={{ backgroundColor: P.bg }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.textSecondary} />}
      >
        <RiseIn delay={0}>
          <Text style={styles.sectionTitle}>Consulta de multas</Text>
          <Text style={styles.sectionSubtitle}>
            {placa ? `Placa registrada: ${placa}` : "Multas de tránsito asociadas a tu cuenta."}
          </Text>
        </RiseIn>

        {error ? (
          <RiseIn delay={20}>
            <Text style={styles.errorText}>{error}</Text>
          </RiseIn>
        ) : null}

        <RiseIn delay={60}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{pendingCount}</Text>
              <Text style={styles.summaryLabel}>Pendientes</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={[styles.summaryValue, { color: P.gold }]}>{totalPendiente}</Text>
              <Text style={styles.summaryLabel}>Total pendiente</Text>
            </View>
          </View>
        </RiseIn>

        {tarjetasParaPagar.length > 0 ? (
          <RiseIn delay={100}>
            <Text style={styles.groupLabel}>TARJETAS DISPONIBLES PARA PAGAR</Text>
            <View style={styles.card}>
              {tarjetasParaPagar.map((t, i) => (
                <View key={t.tarjetaId || i} style={[styles.cardRow, i === tarjetasParaPagar.length - 1 && { borderBottomWidth: 0 }]}>
                  <MaterialIcons name="credit-card" size={16} color={P.textSecondary} />
                  <Text style={styles.cardRowTitle}>{t.tarjeta}</Text>
                  <Text style={styles.cardRowValue}>{t.creditoDisponible}</Text>
                </View>
              ))}
            </View>
          </RiseIn>
        ) : null}

        <RiseIn delay={140} style={styles.resultsWrap}>
          {loading && multas.length === 0 ? (
            <ActivityIndicator color={P.textSecondary} style={styles.spinner} />
          ) : multas.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="check-circle-outline" size={28} color={P.green} />
              <Text style={styles.emptyTitle}>Sin multas registradas</Text>
              <Text style={styles.emptySubtitle}>No tienes multas de tránsito registradas.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.groupLabel}>
                {multas.length} multa{multas.length > 1 ? "s" : ""} registrada{multas.length > 1 ? "s" : ""}
              </Text>
              {multas.map((fine, index) => (
                <FineResultCard key={fine._id || fine.id || index} fine={fine} delay={index * 70} />
              ))}
            </>
          )}
        </RiseIn>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: P.bg },
  flex1: { flex: 1 },
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
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: P.textPrimary,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: P.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: "#D64545",
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: P.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingVertical: SPACING.md,
    alignItems: "center",
    ...SHADOW_SOFT,
  },
  summaryValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    color: P.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: P.textSecondary,
    marginTop: 2,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: P.textSecondary,
    letterSpacing: 0.3,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: P.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOW_SOFT,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: P.divider,
  },
  cardRowTitle: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: P.textPrimary,
    fontWeight: "600",
  },
  cardRowValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: P.green,
  },
  resultsWrap: {
    marginTop: SPACING.xs,
  },
  spinner: {
    marginTop: SPACING.xl,
  },
  emptyCard: {
    backgroundColor: P.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: SPACING.xl,
    alignItems: "center",
    ...SHADOW_SOFT,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: P.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.xs,
    color: P.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: P.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW_SOFT,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: P.textPrimary,
  },
  resultDate: {
    fontSize: 11,
    color: P.textSecondary,
    marginTop: 1,
  },
  resultAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: P.textPrimary,
  },
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.sm,
    backgroundColor: P.blueGrayTint,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
  },
  speedText: {
    fontSize: 11,
    color: P.blueGray,
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: SPACING.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: P.textSecondary,
  },
});

export default ConsultaMultasScreen;
