// src/features/auth/screens/ForgotPasswordScreen.jsx
import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";
import { useAuth } from "../hooks/useAuth";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { handleForgotPassword, loading, error } = useAuth();
  const [formError, setFormError] = useState(null);
  const { control, handleSubmit } = useForm({ defaultValues: { email: "" } });

  const onValid = async ({ email }) => {
    setFormError(null);
    const result = await handleForgotPassword({ email });
    if (result.success) {
      // Vamos directo a la pantalla de token + nueva contraseña,
      // sin pasar por Alert (en web no dispara bien varios botones).
      navigation.navigate("ResetPassword", { email });
    }
  };

  const onInvalid = () => {
    setFormError("Ingresa un correo válido.");
  };

  const displayError = formError || error;

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Ingresa tu correo y te enviaremos instrucciones para recuperarla."
    >
      {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

      <AuthInput
        control={control}
        name="email"
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        rules={{
          required: "El correo es obligatorio",
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido" },
        }}
      />

      <AuthButton
        title="Enviar instrucciones"
        onPress={handleSubmit(onValid, onInvalid)}
        loading={loading}
      />

      <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkContainer}>
        <Text style={styles.linkText}>
          <Text style={styles.linkTextBold}>Volver</Text> a iniciar sesión
        </Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  linkContainer: { marginTop: SPACING.lg, alignItems: "center" },
  linkText: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  linkTextBold: { color: COLORS.primary, fontWeight: "700" },
});

export default ForgotPasswordScreen;