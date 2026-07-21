// src/features/consultas/screens/RedesSocialesScreen.jsx
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// NOTA: no tenemos las cuentas oficiales reales de la municipalidad, así
// que estos enlaces van al sitio general de cada red. Cuando tengas los
// perfiles/handles reales, solo hay que cambiar la "url" de cada item.
const NETWORKS = [
  { key: "facebook", label: "Facebook", icon: "facebook", lib: "MaterialCommunityIcons", color: "#1877F2", url: "https://facebook.com" },
  { key: "x", label: "X (Twitter)", icon: "twitter", lib: "MaterialCommunityIcons", color: "#000000", url: "https://twitter.com" },
  { key: "instagram", label: "Instagram", icon: "instagram", lib: "MaterialCommunityIcons", color: "#E4405F", url: "https://instagram.com" },
  { key: "youtube", label: "YouTube", icon: "youtube", lib: "MaterialCommunityIcons", color: "#FF0000", url: "https://youtube.com" },
];

const NetworkRow = ({ network }) => {
  const Icon = network.lib === "MaterialCommunityIcons" ? MaterialCommunityIcons : MaterialIcons;
  return (
    <Pressable style={styles.row} onPress={() => Linking.openURL(network.url)}>
      <View style={[styles.iconWrap, { backgroundColor: `${network.color}1A` }]}>
        <Icon name={network.icon} size={22} color={network.color} />
      </View>
      <Text style={styles.rowLabel}>{network.label}</Text>
      <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
    </Pressable>
  );
};

const RedesSocialesScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backIcon}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Redes Sociales</Text>
        <View style={styles.backIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Síguenos y mantente informado</Text>
        <View style={styles.card}>
          {NETWORKS.map((network, index) => (
            <React.Fragment key={network.key}>
              <NetworkRow network={network} />
              {index < NETWORKS.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  backIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
});

export default RedesSocialesScreen;
