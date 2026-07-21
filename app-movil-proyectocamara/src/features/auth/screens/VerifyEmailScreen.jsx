// src/features/auth/screens/VerifyEmailScreen.jsx
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { LoadingSpinner } from "../../../shared/components/common/Common";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";
import { useAuth } from "../hooks/useAuth";

const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const tokenFromLink = route.params?.token;
  const { handleVerifyEmail, loading, error } = useAuth();
  const [verified, setVerified] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  const { control, handleSubmit } = useForm({
    defaultValues: { token: tokenFromLink || "" },
  });

  // Si llegamos aquí desde el link del correo (?token=...), verificamos
  // automáticamente sin mostrar el formulario manual.
  useEffect(() => {
    if (!tokenFromLink) return;

    (async () => {
      const result = await handleVerifyEmail({ token: tokenFromLink });
      setAutoChecked(true);
      if (result.success) setVerified(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromLink]);

  const onSubmit = async ({ token }) => {
    const result = await handleVerifyEmail({ token });
    if (result.success) setVerified(true);
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

  // Verificación automática en curso (vinimos del link del correo)
  if (tokenFromLink && !autoChecked) {
    return (
      <AuthLayout title="Verificando tu correo..." subtitle="Un momento por favor.">
        <LoadingSpinner />
      </AuthLayout>
    );
  }

  // Formulario manual: solo se ve si no vinimos del link, o si el link
  // vino con un token inválido/expirado y la verificación automática falló.
  return (
    <AuthLayout
      title="Verifica tu correo"
      subtitle="Pega el código de verificación que te enviamos por correo."
    >
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AuthInput
        control={control}
        name="token"
        label="Código de verificación"
        placeholder="Pega aquí el token del correo"
        autoCapitalize="none"
        rules={{ required: "El código es obligatorio" }}
      />

      <AuthButton title="Verificar correo" onPress={handleSubmit(onSubmit)} loading={loading} />

      <Pressable
        onPress={() => navigation.navigate("ResendVerification")}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>
          ¿No te llegó el código? <Text style={styles.linkTextBold}>Reenviar verificación</Text>
        </Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkContainer}>
        <Text style={styles.linkText}>
          <Text style={styles.linkTextBold}>Volver</Text> a iniciar sesión
        </Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  iconContainer: { alignItems: "center", marginBottom: SPACING.lg },
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

export default VerifyEmailScreen;