// src/features/client/components/PhotoActionSheet.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const P = {
  overlay: "rgba(0,0,0,0.35)",
  card: "#FFFFFF",
  divider: "rgba(0,0,0,0.08)",
  text: "#1D1D1F",
  textSecondary: "#86868B",
  red: "#E0402C",
  accent: "#D97A22",
};

const Row = ({ icon, label, onPress, danger, isLast }) => (
  <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isLast && styles.rowLast]} onPress={onPress}>
    <MaterialIcons name={icon} size={20} color={danger ? P.red : P.text} style={styles.rowIcon} />
    <Text style={[styles.rowLabel, danger && { color: P.red }]}>{label}</Text>
  </Pressable>
);

// options: { onTakePhoto, onPickPhoto, onRemovePhoto (opcional, si no se
// pasa no se muestra el grupo de eliminar) }
const PhotoActionSheet = ({ visible, onClose, onTakePhoto, onPickPhoto, onRemovePhoto }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [260, 0] });

  const wrap = (fn) => () => {
    onClose();
    fn?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
          <Pressable onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edita la foto del perfil</Text>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={P.text} />
              </Pressable>
            </View>

            <View style={styles.group}>
              <Row icon="photo-camera" label="Tomar foto" onPress={wrap(onTakePhoto)} />
              <View style={styles.divider} />
              <Row icon="image" label="Seleccionar foto" onPress={wrap(onPickPhoto)} isLast />
            </View>

            {onRemovePhoto ? (
              <View style={[styles.group, styles.groupDanger]}>
                <Row icon="delete-outline" label="Eliminar foto" onPress={wrap(onRemovePhoto)} danger isLast />
              </View>
            ) : null}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: P.overlay,
  },
  sheetWrap: {
    padding: 12,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: P.textSecondary,
  },
  closeButton: {
    position: "absolute",
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(120,120,128,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  group: {
    backgroundColor: P.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  groupDanger: {
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  rowLast: {},
  rowIcon: {
    width: 22,
  },
  rowLabel: {
    fontSize: 16,
    color: P.text,
    fontWeight: "400",
  },
  divider: {
    height: 1,
    backgroundColor: P.divider,
    marginLeft: 50,
  },
});

export default PhotoActionSheet;
