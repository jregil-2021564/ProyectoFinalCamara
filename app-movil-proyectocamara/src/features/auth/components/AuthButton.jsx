// src/features/auth/components/AuthButton.jsx
import React from "react";
import { StyleSheet } from "react-native";
import Button from "../../../shared/components/common/Button";
import { COLORS, SPACING } from "../../../shared/constants/theme";

const AuthButton = ({ style, textStyle, ...props }) => (
  <Button
    style={[styles.button, style]}
    textStyle={[styles.buttonText, textStyle]}
    {...props}
  />
);

const styles = StyleSheet.create({
  button: {
    marginTop: SPACING.sm,
    borderRadius: 28,
    backgroundColor: COLORS.accentOrange,
  },
  buttonText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});

export default AuthButton;
