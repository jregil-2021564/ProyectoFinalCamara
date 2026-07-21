// src/features/client/components/SectionCard.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// actions: [{ label, icon, onPress }]
const SectionCard = ({ icon, title, actions = [], children, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon ? <MaterialIcons name={icon} size={20} color={COLORS.primary} /> : null}
          <Text style={styles.title}>{title}</Text>
        </View>

        {actions.length > 0 ? (
          <View style={styles.actionsRow}>
            {actions.map((action) => (
              <Pressable key={action.label} style={styles.actionButton} onPress={action.onPress}>
                {action.icon ? (
                  <MaterialIcons name={action.icon} size={16} color={COLORS.primary} />
                ) : null}
                <Text style={styles.actionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
  },
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default SectionCard;
