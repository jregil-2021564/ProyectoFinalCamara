// src/features/auth/screens/LoginScreen.jsx
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";
import { useAuth } from "../hooks/useAuth";

const LoginScreen = () => {
  const navigation = useNavigation();
  const { handleLogin, loading, error } = useAuth();

  const { control, handleSubmit } = useForm({
    defaultValues: { emailOrUsername: "", password: "" },
  });

  const onSubmit = async (values) => {
    await handleLogin(values);
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para continuar"
      backLabel="Regresar a la principal"
      onBack={() => navigation.navigate("Landing")}
    >
      <AuthInput
        control={control}
        name="emailOrUsername"
        label="Correo o usuario"
        placeholder="tucorreo@ejemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        rules={{ required: "El correo o usuario es obligatorio" }}
      />

      <AuthInput
        control={control}
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        isPassword
        rules={{ required: "La contraseña es obligatoria" }}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        onPress={() => navigation.navigate("ForgotPassword")}
        style={styles.forgotContainer}
      >
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
      </Pressable>

      <AuthButton title="Iniciar sesión" onPress={handleSubmit(onSubmit)} loading={loading} />

      <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkContainer}>
        <Text style={styles.linkText}>
          ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text>
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("ResendVerification")}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>
          ¿No verificaste tu correo?{" "}
          <Text style={styles.linkTextBold}>Reenviar verificación</Text>
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
  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: SPACING.xs,
  },
  linkContainer: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  linkText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default LoginScreen;
