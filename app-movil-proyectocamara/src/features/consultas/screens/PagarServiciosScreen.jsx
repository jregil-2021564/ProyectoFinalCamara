// src/features/consultas/screens/PagarServiciosScreen.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Button from "../../../shared/components/common/Button";
import Toast, { useToast } from "../../../shared/components/common/Toast";
import { useClientApi } from "../../client/hooks/useClientApi";
import { pickArray } from "../../../shared/utils/pickArray";
import { formatMoney, parseMoneyNumber } from "../../../shared/utils/formatMoney";
import { getTitular, getSaldoStr, getPuedesPagar } from "../../client/utils/accountFormat";
import { authStore } from "../../../shared/store/authStore";
import { SERVICE_TYPES, PACKAGES_BY_SERVICE } from "../data/serviciosData";
import { buildServicioVoucherHtml } from "../utils/servicioVoucherHtml";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// ─── NOTA IMPORTANTE ────────────────────────────────────────────────────────
// No existe ningún endpoint de backend para "pagar servicios" (luz, agua,
// internet, saldo) — no está en el Postman del proyecto. Esta pantalla es
// funcional de principio a fin (valida saldo/tarjeta reales, genera voucher
// real en PDF), pero el "pago" en sí se procesa localmente, sin llamar a
// ningún servidor. El único lugar a tocar cuando exista el endpoint real es
// la función `submitPayment` de abajo.

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
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const ServiceTile = ({ service, selected, onPress, delay }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <RiseIn delay={delay} style={styles.serviceTileWrap}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <Animated.View
          style={[
            styles.serviceTile,
            { transform: [{ scale }] },
            selected && { borderColor: service.color, borderWidth: 2 },
          ]}
        >
          <View style={[styles.serviceIconWrap, { backgroundColor: `${service.color}1A` }]}>
            <MaterialIcons name={service.icon} size={24} color={service.color} />
          </View>
          <Text style={styles.serviceTileLabel}>{service.label}</Text>
        </Animated.View>
      </Pressable>
    </RiseIn>
  );
};

const PackageCard = ({ pkg, selected, color, onPress, delay }) => (
  <RiseIn delay={delay} style={styles.packageWrap}>
    <Pressable onPress={onPress}>
      <View style={[styles.packageCard, selected && { borderColor: color, borderWidth: 2 }]}>
        <View style={[styles.packageHeader, { backgroundColor: color }]}>
          <Text style={styles.packageHeaderText} numberOfLines={2}>
            {pkg.title}
          </Text>
        </View>
        <View style={styles.packageBody}>
          <Text style={styles.packagePrice}>Q{pkg.price}</Text>
          {pkg.days ? <Text style={styles.packageDays}>{pkg.days} día{pkg.days > 1 ? "s" : ""}</Text> : null}
        </View>
      </View>
    </Pressable>
  </RiseIn>
);

const PagarServiciosScreen = () => {
  const navigation = useNavigation();
  const { getCards, getAccount, getBalance, loading } = useClientApi();
  const user = authStore((state) => state.user);
  const getRegisteredProfile = authStore((state) => state.getRegisteredProfile);
  const registeredProfile = getRegisteredProfile(user?.username) || {};

  const [selectedService, setSelectedService] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [reference, setReference] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [payMethod, setPayMethod] = useState("tarjeta");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cards, setCards] = useState([]);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [formError, setFormError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const toast = useToast();

  const loadData = useCallback(async () => {
    const [cardsRes, accRes, balRes] = await Promise.all([getCards(), getAccount(), getBalance()]);
    if (cardsRes.success) setCards(pickArray(cardsRes.data));
    if (accRes.success) setAccount(accRes.data?.cuenta || accRes.data?.data || accRes.data);
    if (balRes.success) setBalance(balRes.data?.cuenta || balRes.data?.data || balRes.data);
  }, [getCards, getAccount, getBalance]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedPackage(null);
    setReference("");
    setCustomAmount("");
    setPayMethod("tarjeta");
    setSelectedCardId(null);
    setFormError(null);
    setReceipt(null);
  };

  const amountToPay = selectedService?.hasPackages
    ? selectedPackage?.price || 0
    : parseMoneyNumber(customAmount);

  const canContinue =
    !!selectedService &&
    reference.trim().length > 0 &&
    (selectedService.hasPackages ? !!selectedPackage : amountToPay > 0);

  // Único lugar a cambiar cuando exista el endpoint real de pago de servicios.
  const submitPayment = async () => {
    setFormError(null);

    if (payMethod === "saldo") {
      const disponible = parseMoneyNumber(balance?.saldoNumerico ?? 0);
      if (!getPuedesPagar(balance) || disponible < amountToPay) {
        toast.show("Saldo insuficiente en tu cuenta.", "error");
        return;
      }
    } else {
      const card = cards.find((c) => (c.id || c._id) === selectedCardId);
      if (!card) {
        setFormError("Selecciona una tarjeta.");
        return;
      }
      const disponible = parseMoneyNumber(card.saldoDisponible);
      if (disponible <= 0) {
        toast.show("Esta tarjeta no tiene fondos disponibles.", "error");
        return;
      }
      if (amountToPay > disponible) {
        toast.show(`Fondos insuficientes: disponible ${formatMoney(disponible)}.`, "error");
        return;
      }
    }

    setProcessing(true);
    // Simulación local del procesamiento (no hay endpoint real todavía).
    await new Promise((resolve) => setTimeout(resolve, 900));
    setProcessing(false);

    const card = cards.find((c) => (c.id || c._id) === selectedCardId);
    setReceipt({
      servicioLabel: selectedService.label,
      concepto: selectedService.hasPackages ? selectedPackage.title : `Pago de ${selectedService.label}`,
      referencia: reference,
      monto: amountToPay,
      metodo: payMethod === "saldo" ? "Saldo de cuenta" : card?.alias || card?.numero || "Tarjeta",
      fecha: new Date().toLocaleString("es-GT"),
      titular: getTitular(account) !== "—" ? getTitular(account) : user?.username || "—",
    });
    toast.show("¡Pago realizado con éxito!", "success");
  };

  const downloadVoucher = async () => {
    if (!receipt) return;
    setDownloading(true);
    try {
      const html = buildServicioVoucherHtml(receipt);
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Voucher de servicio" });
      }
    } catch (err) {
      toast.show("No se pudo generar el voucher.", "error");
    } finally {
      setDownloading(false);
    }
  };

  // ─── Vista: voucher de éxito ─────────────────────────────────────────────
  if (receipt) {
    return (
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <Toast {...toast.props} />
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backIcon}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
          </Pressable>
          <Text style={styles.headerTitle}>Pagar Servicios</Text>
          <View style={styles.backIcon} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <RiseIn delay={0}>
            <LinearGradient
              colors={["#0EA5A5", "#0b7f7f", "#075858"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.voucherHero}
            >
              <View style={styles.heroDecor} />
              <MaterialIcons name="check-circle" size={56} color={COLORS.surface} />
              <Text style={styles.voucherHeroTitle}>¡Pago realizado!</Text>
              <Text style={styles.voucherHeroAmount}>{formatMoney(receipt.monto)}</Text>
            </LinearGradient>
          </RiseIn>

          <RiseIn delay={120}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>DETALLE DEL PAGO</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Servicio</Text>
                <Text style={styles.rowValue}>{receipt.servicioLabel}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Concepto</Text>
                <Text style={styles.rowValue}>{receipt.concepto}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Referencia</Text>
                <Text style={styles.rowValue}>{receipt.referencia}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Método de pago</Text>
                <Text style={styles.rowValue}>{receipt.metodo}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Titular</Text>
                <Text style={styles.rowValue}>{receipt.titular}</Text>
              </View>
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <Text style={styles.rowLabel}>Fecha</Text>
                <Text style={styles.rowValue}>{receipt.fecha}</Text>
              </View>
            </View>
          </RiseIn>

          <RiseIn delay={200}>
            <Button
              title="Descargar voucher"
              onPress={downloadVoucher}
              loading={downloading}
              style={styles.mainButton}
            />
            <Pressable onPress={resetFlow} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Pagar otro servicio</Text>
            </Pressable>
            <Pressable onPress={() => navigation.goBack()} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Volver</Text>
            </Pressable>
          </RiseIn>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Vista: formulario ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <Toast {...toast.props} />
      <View style={styles.header}>
        <Pressable
          onPress={() => (selectedService ? setSelectedService(null) : navigation.goBack())}
          style={styles.backIcon}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Pagar Servicios</Text>
        <View style={styles.backIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <RiseIn delay={0}>
          <Text style={styles.sectionTitle}>Selecciona un servicio</Text>
        </RiseIn>

        <View style={styles.servicesGrid}>
          {SERVICE_TYPES.map((service, index) => (
            <ServiceTile
              key={service.key}
              service={service}
              selected={selectedService?.key === service.key}
              onPress={() => {
                setSelectedService(service);
                setSelectedPackage(null);
                setCustomAmount("");
                setReference("");
              }}
              delay={index * 60}
            />
          ))}
        </View>

        {selectedService ? (
          <>
            <RiseIn delay={80}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{selectedService.inputLabel.toUpperCase()}</Text>
                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  placeholder={selectedService.hasPackages ? "Ej. 5512 3456" : "Ej. 123456789"}
                  placeholderTextColor={COLORS.textLight}
                  keyboardType={selectedService.hasPackages ? "phone-pad" : "default"}
                  style={styles.input}
                />
              </View>
            </RiseIn>

            {selectedService.hasPackages ? (
              <RiseIn delay={140}>
                <Text style={styles.sectionTitle}>Elige un paquete</Text>
                <View style={styles.packagesGrid}>
                  {PACKAGES_BY_SERVICE[selectedService.key].map((pkg, index) => (
                    <PackageCard
                      key={pkg.key}
                      pkg={pkg}
                      color={selectedService.color}
                      selected={selectedPackage?.key === pkg.key}
                      onPress={() => setSelectedPackage(pkg)}
                      delay={index * 60}
                    />
                  ))}
                </View>
              </RiseIn>
            ) : (
              <RiseIn delay={140}>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>MONTO A PAGAR (Q)</Text>
                  <TextInput
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    placeholder="150.00"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>
              </RiseIn>
            )}

            <RiseIn delay={200}>
              <Text style={styles.sectionTitle}>¿Cómo quieres pagar?</Text>
              <View style={styles.methodRow}>
                <Pressable
                  style={[styles.methodChip, payMethod === "tarjeta" && styles.methodChipSelected]}
                  onPress={() => setPayMethod("tarjeta")}
                >
                  <MaterialIcons
                    name="credit-card"
                    size={18}
                    color={payMethod === "tarjeta" ? COLORS.surface : COLORS.primary}
                  />
                  <Text style={[styles.methodChipText, payMethod === "tarjeta" && styles.methodChipTextSelected]}>
                    Con tarjeta
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.methodChip, payMethod === "saldo" && styles.methodChipSelected]}
                  onPress={() => setPayMethod("saldo")}
                >
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={18}
                    color={payMethod === "saldo" ? COLORS.surface : COLORS.primary}
                  />
                  <Text style={[styles.methodChipText, payMethod === "saldo" && styles.methodChipTextSelected]}>
                    Con saldo
                  </Text>
                </Pressable>
              </View>
            </RiseIn>

            {payMethod === "tarjeta" ? (
              <RiseIn delay={240}>
                {cards.length === 0 ? (
                  <Text style={styles.helperText}>
                    Necesitas una tarjeta verificada. Ve a la pestaña Tarjetas para agregar una.
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
                            setSelectedCardId(id);
                          }}
                        >
                          <Text style={[styles.cardChipText, selected && styles.cardChipTextSelected]}>
                            {card.alias || card.numero}
                          </Text>
                          <Text style={[styles.cardChipSubtext, selected && styles.cardChipTextSelected]}>
                            {sinFondos ? "Sin fondos" : `Disp. ${formatMoney(card.saldoDisponible)}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </RiseIn>
            ) : (
              <RiseIn delay={240}>
                <View style={styles.balanceInfoBox}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primary} />
                  <Text style={styles.balanceInfoText}>
                    Saldo disponible: {getSaldoStr(balance, account)}
                  </Text>
                </View>
              </RiseIn>
            )}

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <RiseIn delay={280}>
              <Button
                title={amountToPay > 0 ? `Pagar ${formatMoney(amountToPay)}` : "Pagar"}
                onPress={submitPayment}
                loading={processing || loading}
                disabled={!canContinue}
                style={styles.mainButton}
              />
            </RiseIn>
          </>
        ) : null}
      </ScrollView>
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
  backIcon: {
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
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  serviceTileWrap: {
    width: "22.5%",
  },
  serviceTile: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    ...SHADOWS.card,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  serviceTileLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textLight,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  input: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  packagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  packageWrap: {
    width: "47.5%",
  },
  packageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  packageHeader: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minHeight: 46,
    justifyContent: "center",
  },
  packageHeaderText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  packageBody: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  packagePrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
    color: COLORS.text,
  },
  packageDays: {
    fontSize: 11,
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
  },
  methodChipTextSelected: {
    color: COLORS.surface,
  },
  cardsPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cardChip: {
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
  cardChipTextSelected: {
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
  balanceInfoText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  mainButton: {
    marginTop: SPACING.sm,
  },
  linkButton: {
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  linkButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  voucherHero: {
    borderRadius: 20,
    alignItems: "center",
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  heroDecor: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
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
    color: COLORS.surface,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  rowValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
});

export default PagarServiciosScreen;