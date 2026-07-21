// src/features/consultas/screens/ConsultasHubScreen.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const OPTIONS = [
  {
    key: "multas",
    label: "Consulta de\nMultas",
    icon: "receipt-long",
    color: COLORS.primary,
    to: "ConsultaMultas",
  },
  {
    key: "redes",
    label: "Redes\nSociales",
    icon: "public",
    color: COLORS.accentOrange,
    to: "RedesSociales",
  },
  {
    key: "servicios",
    label: "Pagar\nServicios",
    icon: "payments",
    color: COLORS.accentGold,
    to: "PagarServicios",
  },
];

const CircleButton = ({ option, delay, onPress }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 7, tension: 70, delay, useNativeDriver: true }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.circleWrap,
        {
          opacity: anim,
          transform: [
            { scale: Animated.multiply(anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), pressScale) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <View style={[styles.circle, { backgroundColor: option.color }]}>
          <MaterialIcons name={option.icon} size={30} color={COLORS.surface} />
          <Text style={styles.circleLabel}>{option.label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const ConsultasHubScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultas</Text>
      </View>

      <View style={styles.grid}>
        {OPTIONS.map((option, index) => (
          <CircleButton
            key={option.key}
            option={option}
            delay={index * 90}
            onPress={() => navigation.navigate(option.to)}
          />
        ))}
      </View>

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={18} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Volver</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    padding: SPACING.lg,
  },
  circleWrap: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  circle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xs,
    ...SHADOWS.card,
  },
  circleLabel: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
});

export default ConsultasHubScreen;
