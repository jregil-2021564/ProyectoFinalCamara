// src/features/landing/screens/AboutScreen.jsx
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const AboutScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Acerca de nosotros</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <MaterialIcons name="videocam" size={40} color={COLORS.primary} />
          <Text style={styles.cardTitle}>ProyectoCamara</Text>
          <Text style={styles.cardText}>
            ProyectoCamara es una plataforma pensada para conectar a los conductores con el
            sistema de cámaras de tránsito, permitiendo consultar multas, recargar saldo y
            gestionar tu cuenta desde un solo lugar.
          </Text>
        </View>

        <View style={styles.card}>
          <MaterialIcons name="flag" size={32} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Nuestra misión</Text>
          <Text style={styles.cardText}>
            Facilitar el acceso a la información vial de forma transparente, rápida y segura,
            acercando la tecnología a los conductores guatemaltecos.
          </Text>
        </View>

        <View style={styles.card}>
          <MaterialIcons name="groups" size={32} color={COLORS.primary} />
          <Text style={styles.cardTitle}>El equipo</Text>
          <Text style={styles.cardText}>
            Somos un equipo de desarrollo enfocado en construir herramientas útiles para la
            movilidad y la seguridad vial en Guatemala.
          </Text>
        </View>
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});

export default AboutScreen;