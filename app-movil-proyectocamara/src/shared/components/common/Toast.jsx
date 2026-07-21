// src/shared/components/common/Toast.jsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../constants/theme";

const ICONS = {
  success: "check-circle",
  error: "error",
  info: "info",
};

const COLORS_BY_TYPE = {
  success: "#22c55e",
  error: "#ef4444",
  info: "#08316D",
};

// Uso: const toast = useToast(); toast.show("¡Recarga exitosa!", "success");
// y en el render: <Toast {...toast.props} />
export const useToast = () => {
  const [state, setState] = React.useState({ visible: false, message: "", type: "success" });

  const show = (message, type = "success") => {
    setState({ visible: true, message, type });
  };

  const hide = () => setState((s) => ({ ...s, visible: false }));

  return { show, props: { ...state, onHide: hide } };
};

const Toast = ({ visible, message, type = "success", onHide, duration = 2600 }) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    let hideTimer;
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
      ]).start();

      hideTimer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide?.());
      }, duration);
    } else {
      translateY.setValue(-120);
      scale.setValue(0.9);
    }

    return () => clearTimeout(hideTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const color = COLORS_BY_TYPE[type] || COLORS_BY_TYPE.info;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { borderLeftColor: color, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
        <MaterialIcons name={ICONS[type] || ICONS.info} size={22} color={color} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    zIndex: 999,
    ...SHADOWS.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
});

export default Toast;