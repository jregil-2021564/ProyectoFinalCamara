// src/features/client/components/ClientHeader.jsx
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import NotificationsPanel from "./NotificationsPanel";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";

// title: texto del header. onMenuPress: opcional, si se pasa muestra el
// botón de menú hamburguesa (solo lo usa la pantalla de Inicio).
const ClientHeader = ({ title, onMenuPress }) => {
  const bellAnim = useRef(new Animated.Value(0)).current;
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bellAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.delay(2600),
      ])
    ).start();
  }, [bellAnim]);

  const rotate = bellAnim.interpolate({ inputRange: [-1, 1], outputRange: ["-18deg", "18deg"] });

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Image
          source={require("../../../../assets/logoappkinal.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.right}>
        <Pressable onPress={() => setNotificationsVisible(true)} hitSlop={8}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialIcons name="notifications" size={22} color={COLORS.surface} />
          </Animated.View>
        </Pressable>

        {onMenuPress ? (
          <Pressable style={styles.menuButton} onPress={onMenuPress}>
            <MaterialIcons name="menu" size={22} color={COLORS.surface} />
          </Pressable>
        ) : null}
      </View>

      <NotificationsPanel
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ClientHeader;
