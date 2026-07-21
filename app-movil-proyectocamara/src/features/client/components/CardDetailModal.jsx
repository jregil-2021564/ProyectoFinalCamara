// src/features/client/components/CardDetailModal.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "../../../shared/components/common/Button";
import { formatMoney } from "../../../shared/utils/formatMoney";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const CardDetailModal = ({ visible, card, onClose, onDelete }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  if (!card) return null;

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const numeroMostrado = card.numero || "•••• •••• •••• ????";
  const titular = card.titular || card.nombreTitular || "—";
  const vencimiento = card.vencimiento || card.fechaVencimiento || "--/--";
  const fechaAgregada = card.agregadaEl
    ? new Date(card.agregadaEl).toLocaleDateString("es-GT")
    : "—";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY }] }]}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <LinearGradient
              colors={
                (card.tipo || card.tipoTarjeta) === "DEBITO"
                  ? ["#F18E30", "#C0A731", "#8a6a1f"]
                  : ["#1E336C", "#08316D", "#0a1f47"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <MaterialIcons name="credit-card" size={36} color={COLORS.surface} />
              <Text style={styles.heroNumber}>{numeroMostrado}</Text>
              <Text style={styles.heroTitular}>{titular.toUpperCase()}</Text>
              {card.verificada ? (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color={COLORS.surface} />
                  <Text style={styles.verifiedText}>Verificada</Text>
                </View>
              ) : null}
            </LinearGradient>

            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>SALDO DISPONIBLE</Text>
              <Text style={styles.balanceValue}>{formatMoney(card.saldoDisponible)}</Text>
              <View style={styles.balanceMiniRow}>
                <Text style={styles.balanceMini}>
                  Límite: {formatMoney(card.limiteCredito)}
                </Text>
                <Text style={styles.balanceMini}>
                  Usado: {formatMoney(card.totalRecargado)}
                </Text>
              </View>
            </View>

            <View style={styles.detailBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Alias</Text>
                <Text style={styles.value}>{card.alias || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Marca</Text>
                <Text style={styles.value}>{card.marca || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tipo</Text>
                <Text style={styles.value}>{card.tipo || card.tipoTarjeta || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Vence</Text>
                <Text style={styles.value}>{vencimiento}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Agregada el</Text>
                <Text style={styles.value}>{fechaAgregada}</Text>
              </View>
            </View>

            {onDelete ? (
              <Button
                title="Eliminar tarjeta"
                variant="secondary"
                onPress={onDelete}
                style={styles.deleteButtonFull}
              />
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
  heroNumber: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: SPACING.sm,
  },
  heroTitular: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
  },
  verifiedText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: "800",
  },
  balanceBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.success,
    marginTop: 2,
  },
  balanceMiniRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  balanceMini: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
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
  },
  deleteButtonFull: {
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

export default CardDetailModal;