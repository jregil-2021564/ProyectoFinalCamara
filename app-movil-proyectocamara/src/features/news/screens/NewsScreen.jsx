// src/features/news/screens/NewsScreen.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import DropdownMenu from "../../../shared/components/common/DropdownMenu";
import ContactFooter from "../../../shared/components/common/ContactFooter";
import ChatWidget from "../../../shared/components/common/ChatWidget";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const NEWS_MENU_ITEMS = [
  { key: "landing", icon: "home", label: "Regresar a la página principal", color: COLORS.primary },
  { key: "login", icon: "login", label: "Ir al login", color: COLORS.accentOrange },
  { key: "map", icon: "map", label: "Ver mapa", color: COLORS.success },
];

const IMAGES = {
  "news-1": require("../../../../assets/landing/news-1.png"),
  "news-2": require("../../../../assets/landing/news-2.jpg"),
  "news-3": require("../../../../assets/landing/news-3.jpg"),
  "news-4": require("../../../../assets/landing/news-4.jpg"),
  "news-5": require("../../../../assets/landing/news-5.jpg"),
  "news-6": require("../../../../assets/landing/news-6.jpg"),
  "news-7": require("../../../../assets/landing/news-7.jpg"),
  "news-8": require("../../../../assets/landing/news-8.jpg"),
  "news-9": require("../../../../assets/landing/news-9.jpg"),
  "news-10": require("../../../../assets/landing/news-10.jpg"),
};

const NEWS = [
  {
    key: "news-1",
    date: "3 de julio, 2026",
    title: "Agenda mensual de la ciudad",
    summary: "Conoce las actividades culturales y deportivas programadas para este mes.",
    more: "La agenda incluye ferias, exposiciones de arte, presentaciones musicales y actividades familiares gratuitas en distintos puntos de la ciudad durante todo el mes.",
  },
  {
    key: "news-2",
    date: "1 de julio, 2026",
    title: "Mantenimiento de calles y avenidas",
    summary: "Inicia el plan de bacheo en las principales rutas de acceso a la ciudad.",
    more: "Cuadrillas municipales trabajarán en horario nocturno para minimizar el impacto en el tránsito. Se estima concluir los trabajos en seis semanas.",
  },
  {
    key: "news-3",
    date: "28 de junio, 2026",
    title: "Nueva ciclovía inaugurada",
    summary: "Un nuevo tramo conecta el centro con la zona norte de forma segura.",
    more: "La ciclovía cuenta con señalización, iluminación led y estaciones de descanso cada dos kilómetros, beneficiando a miles de ciclistas diarios.",
  },
  {
    key: "news-4",
    date: "25 de junio, 2026",
    title: "Feria de emprendimiento local",
    summary: "Más de 80 emprendedores locales mostrarán sus productos este fin de semana.",
    more: "La feria contará con zona de comida, talleres gratuitos de emprendimiento y actividades para toda la familia en la plaza central.",
  },
  {
    key: "news-5",
    date: "20 de junio, 2026",
    title: "Campaña de reciclaje municipal",
    summary: "Nuevos puntos de acopio para reciclaje disponibles en toda la ciudad.",
    more: "Podrás depositar papel, plástico y vidrio en los nuevos contenedores diferenciados. La campaña busca reducir en un 30% los desechos enviados al relleno sanitario.",
  },
  {
    key: "news-6",
    date: "15 de junio, 2026",
    title: "Mejoras en el sistema de alumbrado público",
    summary: "Se instalarán luminarias LED en más de 40 colonias.",
    more: "El proyecto busca reducir el consumo energético en un 40% y mejorar la seguridad vial y peatonal durante las noches.",
  },
  {
    key: "news-7",
    date: "10 de junio, 2026",
    title: "Jornada de vacunación gratuita",
    summary: "Este sábado habrá jornada de vacunación en el Centro Cívico.",
    more: "La jornada incluye vacunas para toda la familia. Se recomienda llevar el carnet de vacunación y documento de identificación.",
  },
  {
    key: "news-8",
    date: "5 de junio, 2026",
    title: "Torneo deportivo comunitario",
    summary: "Inscripciones abiertas para el torneo de fútbol y básquetbol vecinal.",
    more: "Los equipos pueden inscribirse en las oficinas municipales hasta agotar cupos. Habrá premios para los tres primeros lugares de cada categoría.",
  },
  {
    key: "news-9",
    date: "1 de junio, 2026",
    title: "Concierto en el parque central",
    summary: "Orquesta sinfónica municipal se presentará gratuitamente este viernes.",
    more: "El concierto es gratuito y abierto para toda la familia. Se recomienda llegar con anticipación ya que el aforo es limitado.",
  },
  {
    key: "news-10",
    date: "28 de mayo, 2026",
    title: "Programa de becas municipales",
    summary: "Abierta la convocatoria de becas para estudiantes destacados.",
    more: "El programa cubre útiles escolares y transporte para estudiantes de escasos recursos con buen rendimiento académico. Convocatoria abierta hasta fin de mes.",
  },
];

const NewsScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [query, setQuery] = useState("");

  const heroAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(NEWS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(heroAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 400,
      delay: 150,
      useNativeDriver: true,
    }).start();
    Animated.stagger(
      90,
      cardAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: true })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNews = useMemo(() => {
    if (!query.trim()) return NEWS;
    const q = query.trim().toLowerCase();
    return NEWS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q)
    );
  }, [query]);

  const handleMenuSelect = (key) => {
    setMenuVisible(false);
    if (key === "landing") {
      navigation.navigate("LoadingTransition", {
        to: "Landing",
        message: "Regresando a la página principal...",
      });
    } else if (key === "login") {
      navigation.navigate("LoadingTransition", {
        to: "Login",
        message: "Preparando el inicio de sesión...",
      });
    } else if (key === "map") {
      navigation.navigate("LoadingTransition", { to: "NewsMap", message: "Cargando mapa..." });
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            navigation.navigate("LoadingTransition", {
              to: "Landing",
              message: "Regresando a la página principal...",
            })
          }
          style={styles.headerButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Noticias MuniKinal</Text>
        <Pressable onPress={() => setMenuVisible(true)} style={styles.headerButton}>
          <MaterialIcons name="menu" size={24} color={COLORS.surface} />
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require("../../../../assets/logobanner.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <Text style={styles.heroTitle}>MUNIKINAL</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.searchWrapper,
            {
              opacity: searchAnim,
              transform: [
                {
                  translateY: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialIcons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar noticias..."
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
          />
        </Animated.View>

        {filteredNews.map((item) => {
          const originalIndex = NEWS.findIndex((n) => n.key === item.key);
          const anim = cardAnims[originalIndex];
          const expanded = expandedKey === item.key;
          return (
            <Animated.View
              key={item.key}
              style={[
                styles.card,
                {
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image source={IMAGES[item.key]} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardBody}>
                <Text style={styles.cardDate}>{item.date}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSummary}>{item.summary}</Text>
                {expanded ? <Text style={styles.cardMore}>{item.more}</Text> : null}

                <Pressable
                  style={styles.verMasButton}
                  onPress={() => setExpandedKey(expanded ? null : item.key)}
                >
                  <Text style={styles.verMasText}>{expanded ? "Ver menos" : "Ver más"}</Text>
                  <MaterialIcons
                    name={expanded ? "expand-less" : "chevron-right"}
                    size={18}
                    color={COLORS.surface}
                  />
                </Pressable>
              </View>
            </Animated.View>
          );
        })}

        {filteredNews.length === 0 ? (
          <Text style={styles.noResults}>No se encontraron noticias con "{query}".</Text>
        ) : null}

        <ContactFooter />
      </Animated.ScrollView>

      <DropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelect={handleMenuSelect}
        items={NEWS_MENU_ITEMS}
      />

      <ChatWidget />
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
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  hero: {
    height: 160,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 51, 108, 0.5)",
  },
  heroTitle: {
    position: "absolute",
    bottom: SPACING.lg,
    left: SPACING.lg,
    color: COLORS.surface,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    letterSpacing: 2,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    ...SHADOWS.card,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  cardImage: {
    width: "100%",
    height: 150,
  },
  cardBody: {
    padding: SPACING.md,
  },
  cardDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accentGold,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardSummary: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  cardMore: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  verMasButton: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
  },
  verMasText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
  },
  noResults: {
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.lg,
  },
});

export default NewsScreen;
