// src/features/auth/screens/ResendVerificationScreen.jsx
import React from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";
import { useAuth } from "../hooks/useAuth";

const ResendVerificationScreen = () => {
  const navigation = useNavigation();
  const { handleResendVerification, loading, error } = useAuth();
  const { control, handleSubmit } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    const result = await handleResendVerification({ email });
    if (result.success) {
      Alert.alert(
        "Correo reenviado",
        "Si el correo existe en nuestro sistema, te enviamos un nuevo código de verificación.",
        [
          { text: "Ingresar código", onPress: () => navigation.navigate("VerifyEmail") },
          { text: "Entendido", style: "cancel" },
        ]
      );
    }
  };

  return (
    <AuthLayout title="Reenviar verificación" subtitle="Ingresa tu correo y te enviaremos un nuevo código de verificación.">
      <AuthInput
        control={control} name="email" label="Correo electrónico" placeholder="tucorreo@ejemplo.com"
        autoCapitalize="none" keyboardType="email-address"
        rules={{ required: "El correo es obligatorio", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido" } }}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AuthButton title="Reenviar código" onPress={handleSubmit(onSubmit)} loading={loading} />

      <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkContainer}>
        <Text style={styles.linkText}><Text style={styles.linkTextBold}>Volver</Text> a iniciar sesión</Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm, textAlign: "center", marginBottom: SPACING.md },
  linkContainer: { marginTop: SPACING.lg, alignItems: "center" },
  linkText: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  linkTextBold: { color: COLORS.primary, fontWeight: "700" },
});

export default ResendVerificationScreen;