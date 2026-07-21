// src/features/directory/screens/DirectoryScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

// Datos según el directorio oficial. Ajusta/agrega según necesites.
const SECTIONS = [
  {
    key: "bomberos",
    title: "Bomberos Municipales",
    entries: [{ name: "Central Bomberos Municipales", number: "123" }],
  },
  {
    key: "emetra",
    title: "EMETRA",
    entries: [
      { name: "Planta EMETRA", number: "2285 8400" },
      { name: "PMT", number: "2380 1000" },
    ],
  },
  {
    key: "empagua",
    title: "EMPAGUA",
    entries: [{ name: "Planta EMPAGUA", number: "2285 8700" }],
  },
  {
    key: "minimunis",
    title: "MiniMunis",
    entries: [
      { name: "Zona 7 - Galerías Primma", number: "2485 7540" },
      { name: "Zona 9 - Plaza España", number: "2285 8905" },
      { name: "Zona 11 - Galerías del Sur", number: "2285 8912" },
      { name: "Zona 12 - Plaza Atanazio Tzul", number: "2383 4640" },
      { name: "Zona 18 - Los Álamos Regencia Norte", number: "2258 2626" },
    ],
  },
  {
    key: "municipalidad",
    title: "Municipalidad de Guatemala",
    entries: [
      { name: "Planta Municipalidad", number: "2285 8000" },
      { name: "Oficina Central de IUSI", number: "2388 5800" },
      { name: "Planta Catastro", number: "2285 8600" },
      { name: "Planta Secretaría de Asuntos Sociales", number: "2220 3394" },
      { name: "Planta Centro Histórico", number: "2285 8950" },
      { name: "Planta Ventanilla Única", number: "2285 8500" },
      { name: "Plaza El Amate", number: "2220 7200" },
    ],
  },
  {
    key: "alcaldias",
    title: "Alcaldías Auxiliares",
    entries: [
      { name: "Zona 1", number: "2285 0003" },
      { name: "Zona 2", number: "2253 0359" },
      { name: "Zona 3", number: "2251 6134" },
      { name: "Zona 4", number: "5691 3943" },
      { name: "Zona 5", number: "2339 3044" },
      { name: "Zona 6", number: "2288 5279" },
      { name: 'Zona 7 "A"', number: "2440 3454" },
      { name: 'Zona 7 "B"', number: "2431 6462" },
      { name: "Zona 8", number: "2440 7851" },
      { name: "Zona 9", number: "2361 7694" },
      { name: "Zona 10", number: "2385 8915" },
      { name: "Zona 11", number: "2474 5294" },
      { name: "Zona 12", number: "2485 0485" },
      { name: "Zona 13", number: "2385 8914" },
    ],
  },
];

const AccordionSection = ({ section, index, isOpen, onToggle }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <Text style={[styles.sectionTitle, isOpen && styles.sectionTitleOpen]}>
          {section.title}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialIcons
            name="expand-more"
            size={24}
            color={isOpen ? COLORS.primary : COLORS.textLight}
          />
        </Animated.View>
      </Pressable>

      {isOpen ? (
        <View style={styles.entries}>
          {section.entries.map((entry) => (
            <Pressable
              key={entry.name}
              style={styles.entryRow}
              onPress={() => Linking.openURL(`tel:${entry.number.replace(/\s/g, "")}`)}
            >
              <MaterialCommunityIcons name="phone-forward" size={20} color={COLORS.accentGold} />
              <Text style={styles.entryName}>{entry.name}</Text>
              <Text style={styles.entryNumber}>{entry.number}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
};

const DirectoryScreen = () => {
  const navigation = useNavigation();
  const [openKey, setOpenKey] = useState(null);

  const goToLanding = () =>
    navigation.navigate("LoadingTransition", {
      to: "Landing",
      message: "Regresando a la página principal...",
    });

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={goToLanding} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Directorio Telefónico</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section, index) => (
          <AccordionSection
            key={section.key}
            section={section}
            index={index}
            isOpen={openKey === section.key}
            onToggle={() => setOpenKey(openKey === section.key ? null : section.key)}
          />
        ))}
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
  headerButton: {
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
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: SPACING.sm,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontStyle: "italic",
    color: COLORS.text,
  },
  sectionTitleOpen: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  entries: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  entryName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontStyle: "italic",
    color: COLORS.accentGold,
  },
  entryNumber: {
    fontSize: FONT_SIZE.sm,
    fontStyle: "italic",
    color: COLORS.text,
  },
});

export default DirectoryScreen;