// src/features/client/screens/BalanceScreen.jsx
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
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import ClientHeader from "../components/ClientHeader";
import RechargeDetailModal from "../components/RechargeDetailModal";
import { EmptyState } from "../../../shared/components/common/Common";
import Toast, { useToast } from "../../../shared/components/common/Toast";
import Input from "../../../shared/components/common/Input";
import Button from "../../../shared/components/common/Button";
import { useClientApi } from "../hooks/useClientApi";
import { pickArray } from "../../../shared/utils/pickArray";
import { formatMoney, parseMoneyNumber } from "../../../shared/utils/formatMoney";
import { buildRechargeVoucherHtml } from "../utils/voucherHtml";
import { authStore } from "../../../shared/store/authStore";
import { getEmail, getPlaca } from "../utils/accountFormat";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// ─── Sección animada (fade + slide, escalonada) ─────────────────────────────
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

// ─── Fila de historial con animación + tocable para ver detalle ────────────
const HistoryRow = ({ item, delay, onPress }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 360, delay, useNativeDriver: true }).start();
  }, [anim, delay]);

  const tarjeta = item.tarjeta || item.alias || item.numeroTarjeta || "";

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          { scale: pressScale },
        ],
      }}
    >
      <Pressable
        style={styles.historyRow}
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <View style={styles.historyIcon}>
          <MaterialIcons name="add-card" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyDate}>
            {item.fecha
              ? new Date(item.fecha).toLocaleDateString("es-GT", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recarga"}
          </Text>
          {tarjeta ? <Text style={styles.historySubtitle}>{tarjeta}</Text> : null}
        </View>
        <Text style={styles.historyAmount}>{formatMoney(item.monto)}</Text>
        <MaterialIcons name="chevron-right" size={18} color={COLORS.textLight} />
      </Pressable>
    </Animated.View>
  );
};

const BalanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isPushedScreen = route.name === "Recargas";

  const user = authStore((state) => state.user);
  const getRegisteredProfile = authStore((state) => state.getRegisteredProfile);
  const registeredProfile = getRegisteredProfile(user?.username) || {};

  const { getAccount, getBalance, getRechargeHistory, getCards, recharge, loading, error } =
    useClientApi();
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [cards, setCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const toast = useToast();

  const form = useForm({ defaultValues: { tarjetaId: "", monto: "" } });

  const load = useCallback(async () => {
    const [accRes, balRes, histRes, cardsRes] = await Promise.all([
      getAccount(),
      getBalance(),
      getRechargeHistory(),
      getCards(),
    ]);
    if (accRes.success) setAccount(accRes.data?.cuenta || accRes.data?.data || accRes.data);
    if (balRes.success) setBalance(balRes.data?.cuenta || balRes.data?.data || balRes.data);
    if (histRes.success) setHistory(pickArray(histRes.data));
    if (cardsRes.success) setCards(pickArray(cardsRes.data));
  }, [getAccount, getBalance, getRechargeHistory, getCards]);

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

  const onSubmit = async (values) => {
    setFormError(null);
    if (!values.tarjetaId) {
      setFormError("Selecciona una tarjeta.");
      return;
    }

    const selectedCardForCheck = cards.find((c) => (c.id || c._id) === values.tarjetaId);
    const disponible = parseMoneyNumber(selectedCardForCheck?.saldoDisponible);
    const montoSolicitado = parseMoneyNumber(values.monto);

    if (disponible <= 0) {
      toast.show("Esta tarjeta no tiene fondos disponibles.", "error");
      return;
    }
    if (montoSolicitado > disponible) {
      toast.show(`Fondos insuficientes: disponible ${formatMoney(disponible)}.`, "error");
      return;
    }

    const result = await recharge(values);
    if (result.success) {
      const selectedCard = cards.find((c) => (c.id || c._id) === values.tarjetaId);
      setVoucher({
        monto: values.monto,
        numeroCuenta: balance?.numeroCuenta || account?.numeroCuenta || "—",
        titular: account?.titular || user?.username || "—",
        email: getEmail(account) !== "—" ? getEmail(account) : registeredProfile.email || "—",
        placa: getPlaca(account, balance, registeredProfile.placa),
        tarjeta: selectedCard ? selectedCard.numero || selectedCard.alias : "—",
        fecha: new Date().toLocaleString("es-GT"),
        referencia: result.data?.referencia || result.data?.data?.referencia || "—",
      });
      form.reset();
      setShowForm(false);
      toast.show("¡Recarga realizada con éxito!", "success");
      load();
    } else {
      setFormError(result.message);
      toast.show(result.message || "No se pudo realizar la recarga.", "error");
    }
  };

  const downloadVoucher = async () => {
    if (!voucher) return;
    setDownloading(true);
    try {
      const html = buildRechargeVoucherHtml(voucher);
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Comprobante de recarga",
        });
      }
    } catch (err) {
      toast.show("No se pudo generar el voucher.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const availableBalance = balance?.saldoActual || formatMoney(balance?.saldoNumerico ?? 0);
  const selectedCardId = form.watch("tarjetaId");
  const totalHistorial = history.reduce((sum, h) => sum + parseMoneyNumber(h.monto), 0);

  // ─── Vista del voucher (tras recargar) ──────────────────────────────────
  if (voucher) {
    return (
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <Toast {...toast.props} />
        <View style={styles.header}>
          <Pressable onPress={() => setVoucher(null)} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
          </Pressable>
          <Text style={styles.headerTitle}>Saldo</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.voucherContent}>
          <FadeInSection delay={0}>
            <LinearGradient
              colors={["#1E336C", "#08316D", "#0a1f47"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.voucherHero}
            >
              <View style={styles.voucherDecorCircle} />
              <MaterialIcons name="check-circle" size={56} color={COLORS.surface} />
              <Text style={styles.voucherHeroTitle}>¡Recarga realizada!</Text>
              <Text style={styles.voucherHeroAmount}>{formatMoney(voucher.monto)}</Text>
            </LinearGradient>
          </FadeInSection>

          <FadeInSection delay={120}>
            <View style={styles.voucherBox}>
              <Text style={styles.voucherSectionLabel}>DATOS DE LA CUENTA</Text>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherLabel}>Titular</Text>
                <Text style={styles.voucherValue}>{voucher.titular}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherLabel}>Número de cuenta</Text>
                <Text style={styles.voucherValue}>{voucher.numeroCuenta}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherLabel}>Correo</Text>
                <Text style={styles.voucherValue}>{voucher.email}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherLabel}>Placa</Text>
                <Text style={[styles.voucherValue, { color: COLORS.accentGold }]}>
                  {voucher.placa}
                </Text>
              </View>
            </View>
          </FadeInSection>

          <FadeInSection delay={220}>
            <View style={styles.voucherBox}>
              <Text style={styles.voucherSectionLabel}>DETALLE DE LA RECARGA</Text>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherLabel}>Tarjeta</Text>
                <Text style={styles.voucherValue}>{voucher.tarjeta}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherLabel}>Fecha</Text>
                <Text style={styles.voucherValue}>{voucher.fecha}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherLabel}>Referencia</Text>
                <Text style={styles.voucherValue}>{voucher.referencia}</Text>
              </View>
            </View>
          </FadeInSection>

          <FadeInSection delay={320}>
            <Button
              title="Descargar voucher"
              onPress={downloadVoucher}
              loading={downloading}
              style={styles.downloadButton}
            />
            <Pressable onPress={() => setVoucher(null)} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Volver a Saldo</Text>
            </Pressable>
          </FadeInSection>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Vista principal ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <Toast {...toast.props} />
      {isPushedScreen ? (
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
          </Pressable>
          <Text style={styles.headerTitle}>Saldo</Text>
          <View style={styles.headerButton} />
        </View>
      ) : (
        <ClientHeader title="Saldo" />
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <FadeInSection delay={0}>
          <LinearGradient
            colors={["#1E336C", "#08316D", "#0a1f47"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceHero}
          >
            <View style={styles.heroDecorCircle} />
            <View style={styles.heroDecorCircleSmall} />
            <MaterialIcons name="account-balance-wallet" size={30} color="rgba(255,255,255,0.9)" />
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceValue}>{availableBalance}</Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{history.length}</Text>
                <Text style={styles.heroStatLabel}>Recargas</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{formatMoney(totalHistorial)}</Text>
                <Text style={styles.heroStatLabel}>Total recargado</Text>
              </View>
            </View>
          </LinearGradient>
        </FadeInSection>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!showForm ? (
          <FadeInSection delay={100}>
            <Pressable style={styles.newRechargeButton} onPress={() => setShowForm(true)}>
              <MaterialIcons name="add-circle" size={22} color={COLORS.surface} />
              <Text style={styles.newRechargeText}>Nueva recarga</Text>
            </Pressable>
          </FadeInSection>
        ) : (
          <FadeInSection delay={0}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <MaterialIcons name="add-card" size={20} color={COLORS.primary} />
                <Text style={styles.formTitle}>Nueva recarga</Text>
              </View>

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              {cards.length === 0 ? (
                <Text style={styles.helperText}>
                  Necesitas al menos una tarjeta verificada. Ve a la pestaña Tarjetas para agregar
                  una.
                </Text>
              ) : (
                <View style={styles.cardsPicker}>
                  {cards.map((card) => {
                    const id = card.id || card._id;
                    const selected = selectedCardId === id;
                    const disponible = parseMoneyNumber(card.saldoDisponible);
                    const sinFondos = disponible <= 0;
                    return (
                      <Pressable
                        key={id}
                        style={[
                          styles.cardChip,
                          selected && styles.cardChipSelected,
                          sinFondos && styles.cardChipDisabled,
                        ]}
                        onPress={() => {
                          if (sinFondos) {
                            toast.show("Esta tarjeta no tiene fondos disponibles.", "error");
                            return;
                          }
                          form.setValue("tarjetaId", id);
                        }}
                      >
                        <MaterialIcons
                          name="credit-card"
                          size={16}
                          color={
                            sinFondos ? COLORS.textLight : selected ? COLORS.surface : COLORS.primary
                          }
                        />
                        <View>
                          <Text
                            style={[
                              styles.cardChipText,
                              selected && styles.cardChipTextSelected,
                              sinFondos && styles.cardChipTextDisabled,
                            ]}
                          >
                            {card.alias || card.numero}
                          </Text>
                          <Text
                            style={[styles.cardChipSubtext, selected && styles.cardChipTextSelected]}
                          >
                            {sinFondos ? "Sin fondos" : `Disp. ${formatMoney(card.saldoDisponible)}`}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Input
                label="Monto (Q)"
                placeholder="200.00"
                keyboardType="decimal-pad"
                value={form.watch("monto")}
                onChangeText={(v) => form.setValue("monto", v)}
                style={styles.input}
              />

              <Button
                title="Confirmar recarga"
                onPress={form.handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitButton}
              />
              <Pressable onPress={() => setShowForm(false)} style={styles.cancelLink}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </FadeInSection>
        )}

        <FadeInSection delay={180} style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Historial de Recargas</Text>
        </FadeInSection>

        {loading && history.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
        ) : history.length === 0 ? (
          <FadeInSection delay={220}>
            <EmptyState icon="receipt-long" title="Sin recargas registradas" />
          </FadeInSection>
        ) : (
          history.map((item, index) => (
            <HistoryRow
              key={item._id || item.id || index}
              item={item}
              delay={220 + index * 70}
              onPress={() => setSelectedHistoryItem({ ...item, numeroCuenta: balance?.numeroCuenta })}
            />
          ))
        )}
      </ScrollView>

      <RechargeDetailModal
        visible={!!selectedHistoryItem}
        item={selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
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
  headerButton: {
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
  balanceHero: {
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
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  balanceValue: {
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
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  heroStat: {
    alignItems: "center",
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
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
  newRechargeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.accentOrange,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  newRechargeText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  formTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
    color: COLORS.text,
  },
  spinner: {
    marginVertical: SPACING.lg,
  },
  cardsPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
  },
  cardChipSelected: {
    backgroundColor: COLORS.primary,
  },
  cardChipDisabled: {
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  cardChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cardChipSubtext: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 1,
  },
  cardChipTextDisabled: {
    color: COLORS.textLight,
  },
  cardChipTextSelected: {
    color: COLORS.surface,
  },
  input: {
    marginBottom: 0,
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  formError: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  cancelLink: {
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  cancelText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
  historyHeader: {
    marginBottom: SPACING.sm,
  },
  historyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
    color: COLORS.text,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${COLORS.primary}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
  historySubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.success,
    marginRight: 4,
  },
  voucherContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  voucherHero: {
    borderRadius: 20,
    alignItems: "center",
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  voucherDecorCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -80,
    right: -60,
  },
  voucherHeroTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    marginTop: SPACING.sm,
  },
  voucherHeroAmount: {
    color: COLORS.accentGold,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  voucherBox: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  voucherSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accentOrange,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  voucherRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  voucherLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  voucherValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
  downloadButton: {
    width: "100%",
    marginTop: SPACING.sm,
  },
});

export default BalanceScreen;
