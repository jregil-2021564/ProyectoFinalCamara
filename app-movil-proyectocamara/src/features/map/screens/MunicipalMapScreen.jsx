// src/features/map/screens/MunicipalMapScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import GoogleMapEmbed from "../../landing/components/GoogleMapEmbed";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const BASE_QUERY = "Ciudad de Guatemala, Guatemala";

// NOTA: el mapa es el Google Maps real embebido (iframe en web / WebView en
// nativo) sin API de JavaScript, así que no se pueden dibujar pines propios
// encima. En su lugar, cada ubicación de la lista re-centra el mapa al
// tocarla (actualiza el query del embed) y usa nuestro logo como ícono.
const MINIMUNIS = [
  { key: "z7", label: "Zona 7 - Galerías Primma", query: "Galerías Primma, Zona 7, Guatemala" },
  { key: "z9", label: "Zona 9 - Plaza España", query: "Plaza España, Zona 9, Guatemala" },
  { key: "z11", label: "Zona 11 - Galerías del Sur", query: "Galerías del Sur, Zona 11, Guatemala" },
  {
    key: "z12",
    label: "Zona 12 - Plaza Atanazio Tzul",
    query: "Plaza Atanazio Tzul, Zona 12, Guatemala",
  },
  { key: "z18", label: "Zona 18 - Los Álamos Regencia Norte", query: "Los Álamos, Zona 18, Guatemala" },
];

const ALCALDIAS = Array.from({ length: 13 }, (_, i) => ({
  key: `alc-${i + 1}`,
  label: `Zona ${i + 1}`,
  query: `Zona ${i + 1}, Ciudad de Guatemala, Guatemala`,
}));

// Esta pantalla se registra en dos stacks con nombres distintos:
// "NewsMap" (público, dentro de AuthStack) y "Map" (portal del cliente,
// dentro de ClientStack). Según cuál sea, sabemos a dónde regresar.
const MunicipalMapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [mode, setMode] = useState("minimunis");
  const [activeQuery, setActiveQuery] = useState(BASE_QUERY);
  const listAnim = useRef(new Animated.Value(1)).current;

  const list = mode === "minimunis" ? MINIMUNIS : ALCALDIAS;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(activeQuery)}&z=13&output=embed`;

  useEffect(() => {
    listAnim.setValue(0);
    Animated.timing(listAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [mode, listAnim]);

  const handleBack = () => {
    if (route.name === "NewsMap") {
      navigation.navigate("LoadingTransition", {
        to: "News",
        message: "Regresando a Noticias MuniKinal...",
      });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.flex}>
      <GoogleMapEmbed embedUrl={embedUrl} style={styles.map} />

      <SafeAreaView style={styles.overlay} edges={["top"]} pointerEvents="box-none">
        <Pressable style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={20} color={COLORS.surface} />
          <Text style={styles.backButtonText}>Regresar</Text>
        </Pressable>

        <View style={styles.toggleColumn}>
          <Pressable
            style={[
              styles.toggleButton,
              styles.toggleGreen,
              mode === "minimunis" && styles.toggleActive,
            ]}
            onPress={() => setMode("minimunis")}
          >
            <MaterialIcons name="apartment" size={18} color={COLORS.surface} />
            <Text style={styles.toggleText}>MiniMunis</Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              styles.toggleBlue,
              mode === "alcaldias" && styles.toggleActive,
            ]}
            onPress={() => setMode("alcaldias")}
          >
            <MaterialIcons name="home" size={18} color={COLORS.surface} />
            <Text style={styles.toggleText}>Alcal. Aux.</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Animated.View
        style={[
          styles.listPanel,
          {
            opacity: listAnim,
            transform: [
              { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            ],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {list.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.locationChip, activeQuery === item.query && styles.locationChipActive]}
              onPress={() => setActiveQuery(item.query)}
            >
              <Image
                source={require("../../../../assets/logoappkinal.png")}
                style={styles.locationLogo}
                resizeMode="contain"
              />
              <Text style={styles.locationLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.card,
  },
  backButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
  toggleColumn: {
    gap: SPACING.xs,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 24,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    opacity: 0.85,
    ...SHADOWS.card,
  },
  toggleActive: {
    opacity: 1,
  },
  toggleGreen: {
    backgroundColor: COLORS.success,
  },
  toggleBlue: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
  },
  listPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: SPACING.lg,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  locationChip: {
    width: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.sm,
    marginRight: SPACING.sm,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...SHADOWS.card,
  },
  locationChipActive: {
    borderColor: COLORS.accentOrange,
  },
  locationLogo: {
    width: 32,
    height: 32,
    marginBottom: SPACING.xs,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
});

export default MunicipalMapScreen;
