// src/features/client/components/RechargeDetailModal.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { formatMoney } from "../../../shared/utils/formatMoney";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// NOTA: no tenemos confirmado el shape exacto de cada elemento de
// /saldo/historial, así que probamos varios nombres de campo posibles para
// la tarjeta usada, hora y referencia.
const RechargeDetailModal = ({ visible, item, onClose }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  if (!item) return null;

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const tarjeta = item.tarjeta || item.alias || item.numeroTarjeta || item.numero || "—";
  const fechaObj = item.fecha ? new Date(item.fecha) : null;
  const fecha = fechaObj ? fechaObj.toLocaleDateString("es-GT") : "—";
  const hora = fechaObj
    ? fechaObj.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const referencia = item.referencia || item.id || item._id || "—";
  const numeroCuenta = item.numeroCuenta || "—";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY }] }]}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <LinearGradient
              colors={["#1E336C", "#08316D", "#0a1f47"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <MaterialIcons name="add-card" size={36} color={COLORS.surface} />
              <Text style={styles.heroAmount}>{formatMoney(item.monto)}</Text>
              <Text style={styles.heroSub}>Recarga realizada</Text>
            </LinearGradient>

            <View style={styles.detailBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Tarjeta usada</Text>
                <Text style={styles.value}>{tarjeta}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha</Text>
                <Text style={styles.value}>{fecha}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Hora</Text>
                <Text style={styles.value}>{hora}</Text>
              </View>
              {numeroCuenta !== "—" ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Número de cuenta</Text>
                  <Text style={styles.value}>{numeroCuenta}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.label}>Referencia</Text>
                <Text style={styles.value}>{referencia}</Text>
              </View>
            </View>

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
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    marginTop: 2,
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
  closeLink: {
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  closeLinkText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
});

export default RechargeDetailModal;
