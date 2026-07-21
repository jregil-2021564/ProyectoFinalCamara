// src/shared/components/common/DropdownMenu.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(300, SCREEN_WIDTH * 0.82);

const DEFAULT_COLORS = [COLORS.primary, COLORS.accentOrange, COLORS.accentGold, COLORS.success];

// items: [{ key, icon, label, color? }]
const DropdownMenu = ({ visible, onClose, onSelect, items }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(items.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      itemAnims.forEach((a) => a.setValue(0));
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
      Animated.stagger(
        50,
        itemAnims.map((a) => Animated.timing(a, { toValue: 1, duration: 260, useNativeDriver: true }))
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [PANEL_WIDTH, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Menú</Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
                <MaterialIcons name="close" size={22} color={COLORS.text} />
              </Pressable>
            </View>

            {items.map((item, index) => {
              const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
              const anim = itemAnims[index];
              return (
                <Animated.View
                  key={item.key}
                  style={{
                    opacity: anim,
                    transform: [
                      {
                        translateX: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [24, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Pressable style={styles.item} onPress={() => onSelect(item.key)}>
                    <View style={[styles.iconChip, { backgroundColor: `${color}22` }]}>
                      <MaterialIcons name={item.icon} size={22} color={color} />
                    </View>
                    <Text style={styles.itemText}>{item.label}</Text>
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  panel: {
    width: PANEL_WIDTH,
    height: "100%",
    backgroundColor: COLORS.surface,
    paddingTop: 56,
    paddingHorizontal: SPACING.md,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    ...SHADOWS.card,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  panelTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    color: COLORS.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
});

export default DropdownMenu;
