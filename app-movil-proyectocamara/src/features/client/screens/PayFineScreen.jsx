// src/features/client/screens/PayFineScreen.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { EmptyState } from "../../../shared/components/common/Common";
import Button from "../../../shared/components/common/Button";
import Toast, { useToast } from "../../../shared/components/common/Toast";
import { useClientApi } from "../hooks/useClientApi";
import { pickArray } from "../../../shared/utils/pickArray";
import { formatMoney, parseMoneyNumber } from "../../../shared/utils/formatMoney";
import { getFineAmount, getFineDescription } from "../utils/fineAmount";
import { buildFineVoucherHtml } from "../utils/fineVoucherHtml";
import { getEmail, getNumeroCuenta, getPlaca, getSaldoStr, getTitular } from "../utils/accountFormat";
import { authStore } from "../../../shared/store/authStore";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// ─── Sección animada (fade + slide, escalonado por índice) ─────────────────
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

// ─── Tarjeta de selección (radio con animación de "apachado") ──────────────
const SelectCard = ({ selected, onPress, icon, iconColor, title, subtitle, disabled }) => {
  const pressScale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
        style={[
          styles.selectCard,
          selected && styles.selectCardSelected,
          disabled && styles.selectCardDisabled,
        ]}
      >
        <View style={[styles.selectIconWrap, { backgroundColor: `${iconColor}1A` }]}>
          <MaterialIcons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.selectTextWrap}>
          <Text style={styles.selectTitle}>{title}</Text>
          {subtitle ? <Text style={styles.selectSubtitle}>{subtitle}</Text> : null}
        </View>
        <MaterialIcons
          name={selected ? "radio-button-checked" : "radio-button-unchecked"}
          size={22}
          color={selected ? COLORS.primary : COLORS.textLight}
        />
      </Pressable>
    </Animated.View>
  );
};

const PayFineScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { getFines, getCards, getAccount, getBalance, payFine, payFineWithBalance, loading, error } =
    useClientApi();

  const user = authStore((state) => state.user);
  const getRegisteredProfile = authStore((state) => state.getRegisteredProfile);
  const registeredProfile = getRegisteredProfile(user?.username) || {};

  const [fines, setFines] = useState([]);
  const [cards, setCards] = useState([]);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [selectedFineId, setSelectedFineId] = useState(route.params?.fineId || null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [payMethod, setPayMethod] = useState("tarjeta"); // tarjeta | saldo
  const [receipt, setReceipt] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [formError, setFormError] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const [finesRes, cardsRes, accRes, balRes] = await Promise.all([
      getFines(),
      getCards(),
      getAccount(),
      getBalance(),
    ]);
    if (finesRes.success) {
      const all = pickArray(finesRes.data);
      setFines(
        all.filter((f) => !(f.pagada === true || f.estado === "PAGADA" || f.status === "PAGADA"))
      );
    }
    if (cardsRes.success) setCards(pickArray(cardsRes.data));
    if (accRes.success) setAccount(accRes.data?.cuenta || accRes.data?.data || accRes.data);
    if (balRes.success) setBalance(balRes.data?.cuenta || balRes.data?.data || balRes.data);
  }, [getFines, getCards, getAccount, getBalance]);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const selectedFine = fines.find((f) => (f._id || f.id) === selectedFineId);
  const saldoDisponibleCuenta = getSaldoStr(balance, account);

  const buildReceipt = (metodo) => ({
    descripcion: getFineDescription(selectedFine),
    monto: getFineAmount(selectedFine),
    fecha: new Date().toLocaleString("es-GT"),
    numeroCuenta: getNumeroCuenta(account),
    placa: getPlaca(account, balance, registeredProfile.placa),
    titular: getTitular(account) !== "—" ? getTitular(account) : user?.username || "—",
    email: getEmail(account) !== "—" ? getEmail(account) : registeredProfile.email || "—",
    metodo,
  });

  const onPay = async () => {
    setFormError(null);
    if (!selectedFineId) {
      setFormError("Selecciona una multa.");
      return;
    }

    if (payMethod === "saldo") {
      const result = await payFineWithBalance(selectedFineId);
      if (result.success) {
        setReceipt(buildReceipt("Saldo de cuenta"));
        toast.show("¡Multa pagada con tu saldo!", "success");
      } else {
        setFormError(result.message);
        toast.show(result.message || "No se pudo pagar la multa.", "error");
      }
      return;
    }

    if (!selectedCardId) {
      setFormError("Selecciona una tarjeta.");
      return;
    }

    const selectedCardForCheck = cards.find((c) => (c.id || c._id) === selectedCardId);
    const disponible = parseMoneyNumber(selectedCardForCheck?.saldoDisponible);
    const montoMulta = parseMoneyNumber(getFineAmount(selectedFine));
    if (disponible <= 0) {
      toast.show("Esta tarjeta no tiene fondos disponibles.", "error");
      return;
    }
    if (montoMulta > disponible) {
      toast.show(`Fondos insuficientes: disponible ${formatMoney(disponible)}.`, "error");
      return;
    }

    const result = await payFine({ multaId: selectedFineId, tarjetaId: selectedCardId });
    if (result.success) {
      setReceipt(buildReceipt(selectedCardForCheck?.alias || selectedCardForCheck?.numero || "Tarjeta"));
      toast.show("¡Multa pagada con éxito!", "success");
    } else {
      setFormError(result.message);
      toast.show(result.message || "No se pudo pagar la multa.", "error");
    }
  };

  const downloadVoucher = async () => {
    if (!receipt) return;
    setDownloading(true);
    try {
      const html = buildFineVoucherHtml({
        descripcion: receipt.descripcion,
        monto: receipt.monto,
        fecha: receipt.fecha,
        estado: "Pagada",
        numeroCuenta: receipt.numeroCuenta,
        placa: receipt.placa,
      });
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Voucher de multa" });
      }
    } catch (err) {
      toast.show("No se pudo generar el voucher.", "error");
    } finally {
      setDownloading(false);
    }
  };

  // ─── Vista de éxito ──────────────────────────────────────────────────────
  if (receipt) {
    return (
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <Toast {...toast.props} />
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
          </Pressable>
          <Text style={styles.headerTitle}>Pagar Multa</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.receiptContent}>
          <FadeInSection delay={0}>
            <LinearGradient
              colors={["#22c55e", "#16a34a", "#0f7a34"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.receiptHero}
            >
              <View style={styles.receiptDecorCircle} />
              <MaterialIcons name="check-circle" size={56} color={COLORS.surface} />
              <Text style={styles.receiptHeroTitle}>¡Multa pagada!</Text>
              <Text style={styles.receiptHeroAmount}>{formatMoney(receipt.monto)}</Text>
              <Text style={styles.receiptHeroSub}>{receipt.fecha}</Text>
            </LinearGradient>
          </FadeInSection>

          <FadeInSection delay={120}>
            <View style={styles.receiptBox}>
              <Text style={styles.receiptSectionLabel}>DATOS DEL USUARIO</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Titular</Text>
                <Text style={styles.receiptValue}>{receipt.titular}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Correo</Text>
                <Text style={styles.receiptValue}>{receipt.email}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Número de cuenta</Text>
                <Text style={styles.receiptValue}>{receipt.numeroCuenta}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Placa</Text>
                <Text style={[styles.receiptValue, { color: COLORS.accentGold }]}>
                  {receipt.placa}
                </Text>
              </View>
            </View>
          </FadeInSection>

          <FadeInSection delay={220}>
            <View style={styles.receiptBox}>
              <Text style={styles.receiptSectionLabel}>DETALLE DEL PAGO</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Multa</Text>
                <Text style={styles.receiptValue}>{receipt.descripcion}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Método de pago</Text>
                <Text style={styles.receiptValue}>{receipt.metodo}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Fecha y hora</Text>
                <Text style={styles.receiptValue}>{receipt.fecha}</Text>
              </View>
            </View>
          </FadeInSection>

          <FadeInSection delay={320}>
            <Button
              title="Descargar voucher de multa"
              onPress={downloadVoucher}
              loading={downloading}
              style={styles.downloadButton}
            />
            <Pressable onPress={() => navigation.goBack()} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Volver</Text>
            </Pressable>
          </FadeInSection>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Vista del formulario ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <Toast {...toast.props} />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Pagar Multa</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && fines.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
        ) : fines.length === 0 ? (
          <EmptyState
            icon="payments"
            title="No tienes multas pendientes"
            message="Cuando tengas una multa pendiente, podrás pagarla desde aquí."
          />
        ) : (
          <>
            <FadeInSection delay={0}>
              <Text style={styles.sectionLabel}>1. Elige la multa</Text>
              {fines.map((fine) => (
                <SelectCard
                  key={fine._id || fine.id}
                  selected={selectedFineId === (fine._id || fine.id)}
                  onPress={() => setSelectedFineId(fine._id || fine.id)}
                  icon="warning"
                  iconColor={COLORS.accentGold}
                  title={getFineDescription(fine)}
                  subtitle={formatMoney(getFineAmount(fine))}
                />
              ))}
            </FadeInSection>

            <FadeInSection delay={100}>
              <Text style={styles.sectionLabel}>2. ¿Cómo quieres pagar?</Text>
              <View style={styles.methodRow}>
                <Pressable
                  style={[styles.methodChip, payMethod === "tarjeta" && styles.methodChipSelected]}
                  onPress={() => setPayMethod("tarjeta")}
                >
                  <MaterialIcons
                    name="credit-card"
                    size={20}
                    color={payMethod === "tarjeta" ? COLORS.surface : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.methodChipText,
                      payMethod === "tarjeta" && styles.methodChipTextSelected,
                    ]}
                  >
                    Con tarjeta
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.methodChip, payMethod === "saldo" && styles.methodChipSelected]}
                  onPress={() => setPayMethod("saldo")}
                >
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color={payMethod === "saldo" ? COLORS.surface : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.methodChipText,
                      payMethod === "saldo" && styles.methodChipTextSelected,
                    ]}
                  >
                    Con saldo de mi cuenta
                  </Text>
                </Pressable>
              </View>
            </FadeInSection>

            {payMethod === "tarjeta" ? (
              <FadeInSection delay={180}>
                <Text style={styles.sectionLabel}>3. Elige la tarjeta</Text>
                {cards.length === 0 ? (
                  <Text style={styles.helperText}>
                    Necesitas una tarjeta verificada. Ve a la pestaña Tarjetas para agregar una.
                  </Text>
                ) : (
                  cards.map((card) => (
                    <SelectCard
                      key={card.id || card._id}
                      selected={selectedCardId === (card.id || card._id)}
                      onPress={() => setSelectedCardId(card.id || card._id)}
                      icon="credit-card"
                      iconColor={COLORS.primary}
                      title={card.alias || card.nombreTitular || "Tarjeta"}
                      subtitle={`${card.numero || ""} · Disp. ${formatMoney(card.saldoDisponible)}`}
                      disabled={parseMoneyNumber(card.saldoDisponible) <= 0}
                    />
                  ))
                )}
              </FadeInSection>
            ) : (
              <FadeInSection delay={180}>
                <View style={styles.balanceInfoBox}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primary} />
                  <View style={styles.flex1}>
                    <Text style={styles.balanceInfoLabel}>Saldo disponible en tu cuenta</Text>
                    <Text style={styles.balanceInfoValue}>{saldoDisponibleCuenta}</Text>
                  </View>
                </View>
              </FadeInSection>
            )}

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <FadeInSection delay={260}>
              <Button
                title={selectedFine ? `Pagar ${formatMoney(getFineAmount(selectedFine))}` : "Pagar"}
                onPress={onPay}
                loading={loading}
                style={styles.payButton}
              />
            </FadeInSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  flex1: { flex: 1 },
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
  spinner: {
    marginTop: SPACING.xl,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  selectCardSelected: {
    borderColor: COLORS.primary,
  },
  selectCardDisabled: {
    opacity: 0.5,
  },
  selectIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  selectTextWrap: {
    flex: 1,
  },
  selectTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
  selectSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  methodRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  methodChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  methodChipSelected: {
    backgroundColor: COLORS.primary,
  },
  methodChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  methodChipTextSelected: {
    color: COLORS.surface,
  },
  balanceInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: `${COLORS.primary}0F`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}33`,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  balanceInfoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  balanceInfoValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 2,
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
  },
  payButton: {
    marginTop: SPACING.lg,
  },
  receiptContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  receiptHero: {
    borderRadius: 20,
    alignItems: "center",
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  receiptDecorCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -80,
    right: -60,
  },
  receiptHeroTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    marginTop: SPACING.sm,
  },
  receiptHeroAmount: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  receiptHeroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
  receiptBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  receiptSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accentOrange,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  receiptValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
    textAlign: "right",
  },
  downloadButton: {
    marginTop: SPACING.sm,
  },
  cancelLink: {
    alignItems: "center",
    marginTop: SPACING.md,
  },
  cancelText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
});

export default PayFineScreen;
