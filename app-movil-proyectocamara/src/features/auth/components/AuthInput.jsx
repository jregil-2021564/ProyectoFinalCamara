// src/features/auth/components/AuthInput.jsx
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Controller } from "react-hook-form";
import { MaterialIcons } from "@expo/vector-icons";
import Input from "../../../shared/components/common/Input";
import { COLORS, SPACING } from "../../../shared/constants/theme";

// isPassword agrega el ícono de ojito para mostrar/ocultar, como en el
// diseño de referencia. El resto de props se pasan tal cual al Input.
const AuthInput = ({
  control,
  name,
  rules,
  isPassword,
  secureTextEntry,
  style,
  ...inputProps
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.wrapper}>
          <Input
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            secureTextEntry={isPassword ? !visible : secureTextEntry}
            style={[styles.pillInput, style]}
            {...inputProps}
          />
          {isPassword ? (
            <Pressable style={styles.eyeButton} onPress={() => setVisible((v) => !v)}>
              <MaterialIcons
                name={visible ? "visibility-off" : "visibility"}
                size={20}
                color={COLORS.textLight}
              />
            </Pressable>
          ) : null}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  pillInput: {
    backgroundColor: COLORS.background,
    borderWidth: 0,
    borderRadius: 14,
  },
  eyeButton: {
    position: "absolute",
    right: SPACING.md,
    top: 36,
  },
});

export default AuthInput;
