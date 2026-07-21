// src/features/auth/screens/CheckEmailScreen.jsx
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";
import { useAuth } from "../hooks/useAuth";

const CheckEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email;
  const { handleVerifyEmail, loading, error } = useAuth();
  const [verified, setVerified] = useState(false);

  const { control, handleSubmit } = useForm({ defaultValues: { token: "" } });

  const onSubmit = async ({ token }) => {
    const result = await handleVerifyEmail({ token });
    if (result.success) {
      setVerified(true);
    }
  };

  if (verified) {
    return (
      <AuthLayout title="¡Correo verificado!" subtitle="Tu cuenta ya está activa.">
        <View style={styles.iconContainer}>
          <MaterialIcons name="check-circle" size={56} color={COLORS.success} />
        </View>

        <AuthButton title="Iniciar sesión" onPress={() => navigation.navigate("Login")} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Revisa tu correo" subtitle="Estás a un paso de activar tu cuenta">
      <View style={styles.iconContainer}>
        <MaterialIcons name="mark-email-unread" size={56} color={COLORS.primary} />
      </View>

      <Text style={styles.description}>
        Te enviamos un correo{email ? ` a ${email}` : ""} con un código de verificación.
        Pégalo aquí abajo para activar tu cuenta.
      </Text>

      <AuthInput
        control={control}
        name="token"
        label="Código de verificación"
        placeholder="Pega aquí el token del correo"
        autoCapitalize="none"
        rules={{ required: "El código es obligatorio" }}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AuthButton title="Verificar correo" onPress={handleSubmit(onSubmit)} loading={loading} />

      <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkContainer}>
        <Text style={styles.linkText}>
          Ya verifiqué mi correo, <Text style={styles.linkTextBold}>ir a iniciar sesión</Text>
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("ResendVerification")}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>
          ¿No te llegó el correo? <Text style={styles.linkTextBold}>Reenviar verificación</Text>
        </Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  iconContainer: { alignItems: "center", marginBottom: SPACING.lg },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
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

export default CheckEmailScreen;