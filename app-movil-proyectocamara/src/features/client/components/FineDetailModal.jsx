// src/features/client/components/FineDetailModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Button from "../../../shared/components/common/Button";
import { formatMoney } from "../../../shared/utils/formatMoney";
import { getFineAmount, getFineDescription } from "../utils/fineAmount";
import { buildFineVoucherHtml } from "../utils/fineVoucherHtml";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const FineDetailModal = ({ visible, fine, isPaid, numeroCuenta, placa, onClose, onPay }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!fine) return null;

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const amount = getFineAmount(fine);
  const fecha = fine.fecha ? new Date(fine.fecha).toLocaleDateString("es-GT") : "—";

  const downloadVoucher = async () => {
    setDownloading(true);
    try {
      const html = buildFineVoucherHtml({
        descripcion: getFineDescription(fine),
        monto: amount,
        fecha,
        estado: isPaid ? "Pagada" : "Pendiente",
        numeroCuenta,
        placa,
      });
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Voucher de multa" });
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY }] }]}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <LinearGradient
              colors={isPaid ? ["#22c55e", "#16a34a"] : ["#1E336C", "#08316D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <MaterialIcons
                name={isPaid ? "check-circle" : "warning"}
                size={40}
                color={COLORS.surface}
              />
              <Text style={styles.heroAmount}>{formatMoney(amount)}</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{isPaid ? "PAGADA" : "PENDIENTE"}</Text>
              </View>
            </LinearGradient>

            <View style={styles.detailBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Descripción</Text>
                <Text style={styles.value}>{getFineDescription(fine)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha</Text>
                <Text style={styles.value}>{fecha}</Text>
              </View>
              {fine.velocidad !== undefined ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Velocidad</Text>
                  <Text style={styles.value}>{fine.velocidad} km/h</Text>
                </View>
              ) : null}
              {fine.pasoRojo !== undefined ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Semáforo en rojo</Text>
                  <Text style={styles.value}>{fine.pasoRojo ? "Sí" : "No"}</Text>
                </View>
              ) : null}
              {fine.modeloDetectado || fine.colorDetectado ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Vehículo detectado</Text>
                  <Text style={styles.value}>
                    {[fine.colorDetectado, fine.modeloDetectado].filter(Boolean).join(" ")}
                  </Text>
                </View>
              ) : null}
              {numeroCuenta ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Número de cuenta</Text>
                  <Text style={styles.value}>{numeroCuenta}</Text>
                </View>
              ) : null}
              {placa ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Placa</Text>
                  <Text style={[styles.value, { color: COLORS.accentGold }]}>{placa}</Text>
                </View>
              ) : null}
            </View>

            <Button
              title="Ver / descargar voucher"
              variant="secondary"
              onPress={downloadVoucher}
              loading={downloading}
              style={styles.voucherButton}
            />

            {!isPaid ? (
              <Button title="Pagar esta multa" onPress={onPay} style={styles.payButton} />
            ) : null}

            <Pressable onPress={onClose} style={styles.closeLink}>
              <Text style={styles.closeLinkText}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  sheetWrapper: {},
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  hero: {
    borderRadius: 18,
    alignItems: "center",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroAmount: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  heroBadge: {
    marginTop: SPACING.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
  },
  heroBadgeText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    letterSpacing: 1,
  },
  detailBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  value: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
    textAlign: "right",
  },
  voucherButton: {
    marginBottom: SPACING.sm,
  },
  payButton: {
    marginBottom: SPACING.sm,
  },
  closeLink: {
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  closeLinkText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
});

export default FineDetailModal;
