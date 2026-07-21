// src/features/landing/components/HamburgerMenu.jsx
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const MENU_ITEMS = [
  { key: "login", icon: "login", label: "Ir a iniciar sesión" },
  { key: "about", icon: "info-outline", label: "Acerca de nosotros" },
  { key: "location", icon: "place", label: "Dónde estamos ubicados" },
];

const HamburgerMenu = ({ visible, onClose, onSelect }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.panel} onPress={(e) => e.stopPropagation?.()}>
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.key}
            style={[styles.item, index === MENU_ITEMS.length - 1 && styles.itemLast]}
            onPress={() => onSelect(item.key)}
          >
            <MaterialIcons name={item.icon} size={22} color={COLORS.primary} />
            <Text style={styles.itemText}>{item.label}</Text>
          </Pressable>
        ))}
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "flex-end",
  },
  panel: {
    marginTop: 64,
    marginRight: SPACING.md,
    width: 260,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: SPACING.xs,
    ...SHADOWS.card,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
  },
});

export default HamburgerMenu;