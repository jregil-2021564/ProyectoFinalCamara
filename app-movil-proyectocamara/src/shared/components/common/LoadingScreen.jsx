// src/shared/components/common/LoadingScreen.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";

const RING_SIZE = 140;

const LoadingScreen = ({ message = "Cargando..." }) => {
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const makeDotLoop = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(400),
        ])
      );

    const dot1Loop = makeDotLoop(dot1, 0);
    const dot2Loop = makeDotLoop(dot2, 200);
    const dot3Loop = makeDotLoop(dot3, 400);

    rotateLoop.start();
    scaleLoop.start();
    dot1Loop.start();
    dot2Loop.start();
    dot3Loop.start();

    return () => {
      rotateLoop.stop();
      scaleLoop.stop();
      dot1Loop.stop();
      dot2Loop.stop();
      dot3Loop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />
        <Animated.Image
          source={require("../../../../assets/logoappkinal.png")}
          style={[styles.logo, { transform: [{ scale }] }]}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  ring: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.15)",
    borderTopColor: COLORS.accentOrange,
    borderRightColor: COLORS.accentGold,
  },
  logo: {
    width: 84,
    height: 84,
  },
  message: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentOrange,
  },
});

export default LoadingScreen;
