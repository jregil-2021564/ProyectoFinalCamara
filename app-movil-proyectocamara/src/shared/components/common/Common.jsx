// src/shared/components/common/Common.jsx
import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../constants/theme";

export const LoadingSpinner = ({ size = "large", color = COLORS.primary, fullScreen = false }) => (
  <View style={[styles.spinnerContainer, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

export const EmptyState = ({ icon = "inbox", title = "Sin datos", message }) => (
  <View style={styles.emptyContainer}>
    <MaterialIcons name={icon} size={48} color={COLORS.textLight} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
  </View>
);

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  fullScreen: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyMessage: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
});
