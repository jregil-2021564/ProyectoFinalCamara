// src/shared/components/common/Button.jsx
import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../constants/theme";

const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? COLORS.surface : COLORS.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.textPrimary : styles.textSecondary,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    ...SHADOWS.button,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  textPrimary: {
    color: COLORS.surface,
  },
  textSecondary: {
    color: COLORS.primary,
  },
});

export default Button;
