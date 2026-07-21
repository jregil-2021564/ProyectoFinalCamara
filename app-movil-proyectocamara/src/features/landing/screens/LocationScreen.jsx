// src/features/landing/screens/LocationScreen.jsx
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import GoogleMapEmbed from "../components/GoogleMapEmbed";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// Ajusta estos datos a la ubicación real de tu proyecto/oficina.
const ADDRESS = "Ciudad de Guatemala, Guatemala";
const MAPS_QUERY = encodeURIComponent(ADDRESS);
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;
// Embed interactivo (sin necesidad de API key): permite arrastrar, hacer
// zoom con scroll/pellizco, cambiar a satélite, etc., igual que en
// Google Maps normal.
const MAPS_EMBED_URL = `https://www.google.com/maps?q=${MAPS_QUERY}&z=15&output=embed`;

const LocationScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Dónde estamos ubicados</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapContainer}>
          <GoogleMapEmbed embedUrl={MAPS_EMBED_URL} style={styles.map} />
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialIcons name="place" size={22} color={COLORS.primary} />
            <Text style={styles.rowText}>{ADDRESS}</Text>
          </View>
          <View style={styles.row}>
            <MaterialIcons name="schedule" size={22} color={COLORS.primary} />
            <Text style={styles.rowText}>Lunes a viernes, 8:00 a.m. – 5:00 p.m.</Text>
          </View>
          <View style={styles.row}>
            <MaterialIcons name="email" size={22} color={COLORS.primary} />
            <Text style={styles.rowText}>proyectocamara.g3@gmail.com</Text>
          </View>
        </View>

        <Pressable style={styles.mapsButton} onPress={() => Linking.openURL(MAPS_URL)}>
          <MaterialIcons name="map" size={20} color={COLORS.surface} />
          <Text style={styles.mapsButtonText}>Abrir en Google Maps</Text>
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  content: {
    padding: SPACING.lg,
  },
  mapContainer: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  map: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rowText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    flexShrink: 1,
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: SPACING.md,
  },
  mapsButtonText: {
    color: COLORS.surface,
    fontWeight: "700",
    fontSize: FONT_SIZE.sm,
  },
});

export default LocationScreen;