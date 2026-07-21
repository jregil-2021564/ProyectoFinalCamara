// src/features/client/components/CardVisual.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatMoney } from "../../../shared/utils/formatMoney";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// Colores del gradiente según el tipo de tarjeta (campo real: "tipo").
const GRADIENTS = {
  CREDITO: ["#1E336C", "#08316D", "#0a1f47"],
  DEBITO: ["#F18E30", "#C0A731", "#8a6a1f"],
};

const CardVisual = ({ card, onDelete, onPress, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  // Nombres reales de campo (confirmados en Postman): numero ya viene
  // enmascarado ("**** **** **** 4444"), titular, vencimiento, marca, tipo,
  // saldoDisponible/limiteCredito/totalRecargado.
  const numeroMostrado = card.numero || `•••• •••• •••• ${String(card.numeroTarjeta || "0000").slice(-4)}`;
  const titular = card.titular || card.nombreTitular || card.nombre || "—";
  const vencimiento = card.vencimiento || card.fechaVencimiento || card.expiracion || "--/--";
  const gradient = GRADIENTS[card.tipo || card.tipoTarjeta] || GRADIENTS.CREDITO;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { scale: Animated.multiply(anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }), pressScale) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.decorCircleBig} />
          <View style={styles.decorCircleSmall} />

          <View style={styles.topRow}>
            <MaterialCommunityIcons name="integrated-circuit-chip" size={30} color="rgba(255,255,255,0.9)" />
            <View style={styles.topRightIcons}>
              {card.marca ? <Text style={styles.brandText}>{card.marca}</Text> : null}
              {onDelete ? (
                <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
                  <MaterialIcons name="delete-outline" size={18} color="rgba(255,255,255,0.85)" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text style={styles.numberText}>{numeroMostrado}</Text>

          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.smallLabel}>TITULAR</Text>
              <Text style={styles.titularText} numberOfLines={1}>
                {titular.toUpperCase()}
              </Text>
            </View>
            <View style={styles.expiryWrap}>
              <Text style={styles.smallLabel}>VENCE</Text>
              <Text style={styles.titularText}>{vencimiento}</Text>
            </View>
          </View>

          {card.saldoDisponible !== undefined ? (
            <View style={styles.availableBadge}>
              <MaterialIcons name="account-balance-wallet" size={12} color={COLORS.surface} />
              <Text style={styles.availableText}>
                Disponible: {formatMoney(card.saldoDisponible)}
              </Text>
            </View>
          ) : null}

          {card.alias ? (
            <View style={styles.aliasBadge}>
              <Text style={styles.aliasText}>{card.alias}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
    borderRadius: 18,
    ...SHADOWS.card,
  },
  card: {
    borderRadius: 18,
    padding: SPACING.md,
    minHeight: 185,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  decorCircleBig: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -70,
    right: -50,
  },
  decorCircleSmall: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  brandText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    letterSpacing: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  expiryWrap: {
    alignItems: "flex-end",
  },
  smallLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 2,
  },
  titularText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    maxWidth: 180,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    marginTop: SPACING.xs,
  },
  availableText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: "700",
  },
  aliasBadge: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md + 38,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  aliasText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: "700",
  },
});

export default CardVisual;