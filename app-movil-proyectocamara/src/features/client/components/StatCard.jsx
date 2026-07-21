// src/features/client/components/StatCard.jsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const StatCard = ({ icon, value, label, sublabel, accentColor, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          { backgroundColor: `${accentColor}22`, transform: [{ scale: iconPulse }] },
        ]}
      >
        <MaterialIcons name={icon} size={22} color={accentColor} />
      </Animated.View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={[styles.sublabel, { color: accentColor }]}>{sublabel}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.text,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sublabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    marginTop: SPACING.xs,
  },
});

export default StatCard;
