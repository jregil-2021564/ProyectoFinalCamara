// src/features/auth/screens/RegisterScreen.jsx
import React, { useState } from "react";
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";
import { useAuth } from "../hooks/useAuth";
import { authStore } from "../../../shared/store/authStore";

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { handleRegister, loading, error } = useAuth();
  const [profilePicture, setProfilePicture] = useState(null);
  const [formError, setFormError] = useState(null);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "",
      surname: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      placa: "",
    },
  });

  const password = watch("password");

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tus fotos para elegir una imagen de perfil."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfilePicture(result.assets[0]);
    }
  };

  // confirmPassword solo se usa para validar en el cliente, no se envía al backend
  const onValid = async ({ confirmPassword, ...values }) => {
    setFormError(null);
    const result = await handleRegister({ ...values, profilePicture });
    if (result.success) {
      // Convertimos la foto a data URI base64: en web, el "uri" que da el
      // selector es un blob: que se pierde al recargar la página. Un data
      // URI base64 sí sobrevive guardado en el storage local.
      const photoDataUri = profilePicture?.base64
        ? `data:${profilePicture.mimeType || "image/jpeg"};base64,${profilePicture.base64}`
        : null;

      // Guardamos localmente lo que la persona escribió (nombre, apellido,
      // correo, teléfono, placa, foto) porque /login no lo devuelve todavía.
      // (No tocamos authStore.user aquí: todavía no ha iniciado sesión —
      // eso lo hace login más adelante y lo pisaría de todos modos.)
      authStore.getState().saveRegisteredProfile(values.username, {
        name: values.name,
        surname: values.surname,
        email: values.email,
        phone: values.phone,
        placa: values.placa,
        profilePicture: photoDataUri,
      });

      navigation.navigate("CheckEmail", { email: values.email });
    }
  };

  // Se dispara si react-hook-form bloquea el envío por campos obligatorios
  // vacíos (ej. Teléfono o Placa, que quedan fuera del scroll visible).
  const onInvalid = () => {
    setFormError("Falta completar algún campo obligatorio. Revisa el formulario completo (baja con scroll).");
  };

  const displayError = formError || error;

  return (
    <AuthLayout title="Crear cuenta" subtitle="Completa tus datos para registrarte">
      {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

      <Pressable style={styles.avatarPicker} onPress={pickImage}>
        {profilePicture ? (
          <Image source={{ uri: profilePicture.uri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="add-a-photo" size={28} color={COLORS.textLight} />
          </View>
        )}
        <Text style={styles.avatarLabel}>Foto de perfil (opcional)</Text>
      </Pressable>

      <AuthInput
        control={control}
        name="name"
        label="Nombre"
        placeholder="Joab"
        rules={{ required: "El nombre es obligatorio" }}
      />
      <AuthInput
        control={control}
        name="surname"
        label="Apellido"
        placeholder="Selvi"
        rules={{ required: "El apellido es obligatorio" }}
      />
      <AuthInput
        control={control}
        name="username"
        label="Usuario"
        placeholder="Joab_Selvi"
        autoCapitalize="none"
        rules={{ required: "El usuario es obligatorio" }}
      />
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
      <AuthInput
        control={control}
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        isPassword
        rules={{
          required: "La contraseña es obligatoria",
          minLength: { value: 8, message: "Debe tener al menos 8 caracteres" },
        }}
      />
      <AuthInput
        control={control}
        name="confirmPassword"
        label="Confirmar contraseña"
        placeholder="••••••••"
        isPassword
        rules={{
          required: "Confirma tu contraseña",
          validate: (value) => value === password || "Las contraseñas no coinciden",
        }}
      />
      <AuthInput
        control={control}
        name="phone"
        label="Teléfono"
        placeholder="42653798"
        keyboardType="phone-pad"
        rules={{ required: "El teléfono es obligatorio" }}
      />
      <AuthInput
        control={control}
        name="placa"
        label="Placa del vehículo"
        placeholder="P-123ABC"
        autoCapitalize="characters"
        rules={{ required: "La placa es obligatoria" }}
      />

      <AuthButton
        title="Registrarme"
        onPress={handleSubmit(onValid, onInvalid)}
        loading={loading}
      />

      <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkContainer}>
        <Text style={styles.linkText}>
          ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión</Text>
        </Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  avatarPicker: { alignItems: "center", marginBottom: SPACING.lg },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarLabel: { marginTop: SPACING.xs, fontSize: FONT_SIZE.xs, color: COLORS.textLight },
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

export default RegisterScreen;
