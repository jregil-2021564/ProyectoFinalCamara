// src/shared/components/common/ContactFooter.jsx
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";

// Ajusta estos enlaces a tus redes reales.
const SOCIALS = [
  { key: "facebook", icon: "logo-facebook", url: "https://facebook.com" },
  { key: "tiktok", icon: "logo-tiktok", url: "https://tiktok.com" },
  { key: "twitter", icon: "logo-twitter", url: "https://twitter.com" },
  { key: "instagram", icon: "logo-instagram", url: "https://instagram.com" },
  { key: "youtube", icon: "logo-youtube", url: "https://youtube.com" },
];

const ContactFooter = () => {
  const openUrl = (url) => Linking.openURL(url).catch(() => {});
  const callNumber = (number) => Linking.openURL(`tel:${number}`).catch(() => {});

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.title}>C O N T Á C T A N O S</Text>
      <View style={styles.line} />

      <View style={styles.socialsRow}>
        {SOCIALS.map((item) => (
          <Pressable
            key={item.key}
            style={styles.socialButton}
            onPress={() => openUrl(item.url)}
          >
            <Ionicons name={item.icon} size={28} color={COLORS.primary} />
          </Pressable>
        ))}
      </View>

      <View style={styles.phonesRow}>
        <Pressable style={styles.phoneItem} onPress={() => callNumber("1551")}>
          <MaterialCommunityIcons name="headset" size={30} color={COLORS.primary} />
          <Text style={styles.phoneLabel}>1551 call center</Text>
        </Pressable>
        <Pressable style={styles.phoneItem} onPress={() => callNumber("123")}>
          <MaterialCommunityIcons name="fire-truck" size={30} color={COLORS.primary} />
          <Text style={styles.phoneLabel}>123 Bomberos</Text>
        </Pressable>
      </View>

      <View style={styles.line} />

      <Text style={styles.address}>
        21 Calle 6-77 Zona 1, Centro Cívico, Palacio Municipal. Ciudad de Guatemala, Guatemala,
        Centroamérica.
      </Text>
      <Text style={styles.pbxRow}>
        PBX 2285 8000 <Text style={styles.separator}>|</Text>{" "}
        <Text style={styles.link}>Términos de Uso</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
  },
  line: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accentGold,
    marginVertical: SPACING.md,
  },
  title: {
    textAlign: "center",
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  socialsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  socialButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  phonesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.xxl,
  },
  phoneItem: {
    alignItems: "center",
  },
  phoneLabel: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  address: {
    textAlign: "center",
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  pbxRow: {
    textAlign: "center",
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  separator: {
    color: COLORS.textLight,
  },
  link: {
    textDecorationLine: "underline",
  },
});

export default ContactFooter;