// src/features/auth/components/AuthLayout.jsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";

const HERO_HEIGHT = 220;

// backLabel/onBack son opcionales: por defecto la flecha solo hace goBack().
// LoginScreen le pasa backLabel="Regresar a la principal" + onBack a Landing.
const AuthLayout = ({ title, subtitle, backLabel, onBack, children }) => {
  const navigation = useNavigation();
  const handleBack = onBack || (() => navigation.goBack());

  const cardAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
    Animated.spring(logoAnim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../../../assets/logobanner.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      <Animated.ScrollView
        style={[
          styles.card,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
        contentContainerStyle={styles.cardContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={26} color={COLORS.text} />
          </Pressable>
          {backLabel ? (
            <Pressable onPress={handleBack}>
              <Text style={styles.backLabel}>{backLabel}</Text>
            </Pressable>
          ) : null}
        </View>

        <Animated.Image
          source={require("../../../../assets/logoappkinal.png")}
          style={[
            styles.logo,
            {
              transform: [
                { scale: logoAnim },
                {
                  rotate: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["-15deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
          resizeMode="contain"
        />

        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {children}
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.primary },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: COLORS.primary,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
  },
  cardContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.accentOrange,
  },
  logo: {
    width: 72,
    height: 72,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
});

export default AuthLayout;
