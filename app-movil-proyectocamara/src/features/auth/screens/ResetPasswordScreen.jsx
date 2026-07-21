// src/features/auth/screens/ResetPasswordScreen.jsx
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

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { handleResetPassword, loading, error } = useAuth();
  const [formError, setFormError] = useState(null);
  const [done, setDone] = useState(false);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      token: route.params?.token || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onValid = async ({ token, newPassword: password }) => {
    setFormError(null);
    const result = await handleResetPassword({ token, newPassword: password });
    if (result.success) {
      setDone(true);
    }
  };

  const onInvalid = () => {
    setFormError("Falta completar algún campo obligatorio.");
  };

  const displayError = formError || error;

  if (done) {
    return (
      <AuthLayout title="¡Contraseña actualizada!" subtitle="Ya puedes iniciar sesión con tu nueva contraseña.">
        <View style={styles.iconContainer}>
          <MaterialIcons name="check-circle" size={56} color={COLORS.success} />
        </View>

        <AuthButton title="Iniciar sesión" onPress={() => navigation.navigate("Login")} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Pega el código que recibiste por correo y define tu nueva contraseña."
    >
      {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

      <AuthInput
        control={control}
        name="token"
        label="Código de recuperación"
        placeholder="Pega aquí el token del correo"
        autoCapitalize="none"
        rules={{ required: "El código es obligatorio" }}
      />
      <AuthInput
        control={control}
        name="newPassword"
        label="Nueva contraseña"
        placeholder="••••••••"
        secureTextEntry
        rules={{
          required: "La nueva contraseña es obligatoria",
          minLength: { value: 8, message: "Debe tener al menos 8 caracteres" },
        }}
      />
      <AuthInput
        control={control}
        name="confirmPassword"
        label="Confirmar contraseña"
        placeholder="••••••••"
        secureTextEntry
        rules={{
          required: "Confirma tu nueva contraseña",
          validate: (value) => value === newPassword || "Las contraseñas no coinciden",
        }}
      />

      <AuthButton
        title="Restablecer contraseña"
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

export default ResetPasswordScreen;