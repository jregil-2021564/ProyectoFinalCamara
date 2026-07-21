// src/features/landing/screens/LandingScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import DropdownMenu from "../../../shared/components/common/DropdownMenu";
import ContactFooter from "../../../shared/components/common/ContactFooter";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const LANDING_MENU_ITEMS = [
  { key: "login", icon: "login", label: "Ir a iniciar sesión", color: COLORS.primary },
  { key: "about", icon: "info-outline", label: "Acerca de nosotros", color: COLORS.accentOrange },
  { key: "location", icon: "place", label: "Dónde estamos ubicados", color: COLORS.accentGold },
];

const HERO_HEIGHT = 320;

// Imágenes locales: colócalas en assets/landing/ con estos nombres exactos.
const IMAGES = {
  antigua: require("../../../../assets/landing/antigua.jpg"),
  tikal: require("../../../../assets/landing/tikal.jpg"),
  atitlan: require("../../../../assets/landing/atitlan.jpg"),
  chichi: require("../../../../assets/landing/chichicastenango.jpg"),
};

const TRADITIONS = [
  {
    key: "antigua",
    title: "Antigua Guatemala",
    tag: "Patrimonio de la Humanidad",
    summary:
      "Ciudad colonial fundada en el siglo XVI, famosa por sus calles empedradas, iglesias barrocas y el Volcán de Agua de fondo.",
    more:
      "Cada Semana Santa, Antigua se llena de procesiones y alfombras de aserrín teñido, flores y elementos naturales que cubren las calles por donde pasan las andas. Es una de las celebraciones religiosas más grandes de Latinoamérica y atrae visitantes de todo el mundo.",
  },
  {
    key: "tikal",
    title: "Tikal",
    tag: "Ciudad maya milenaria",
    summary:
      "En el corazón de la selva del Petén, Tikal fue una de las ciudades más importantes de la civilización maya, con templos que superan los 45 metros de altura.",
    more:
      "El Parque Nacional Tikal es Patrimonio Mixto de la Humanidad por la UNESCO: combina un extraordinario legado arqueológico con una selva tropical llena de fauna, desde monos araña hasta tucanes y jaguares.",
  },
  {
    key: "atitlan",
    title: "Lago de Atitlán",
    tag: "Paisaje volcánico",
    summary:
      "Un lago de origen volcánico rodeado de tres volcanes y pueblos de tradición maya kaqchikel y tz'utujil como Panajachel y Santiago Atitlán.",
    more:
      "Cada pueblo alrededor del lago conserva su propio traje típico (traje indígena), tejido a mano en telar de cintura, con patrones y colores que identifican a cada comunidad.",
  },
  {
    key: "chichi",
    title: "Mercado de Chichicastenango",
    tag: "Tradición y artesanía",
    summary:
      "Uno de los mercados indígenas más grandes de Centroamérica, con puestos de textiles, cerámica, máscaras de madera y flores cada jueves y domingo.",
    more:
      "Frente al mercado está la iglesia de Santo Tomás, donde se mezclan rituales católicos y ceremonias mayas ancestrales, un reflejo del sincretismo religioso que caracteriza a Guatemala.",
  },
];

const LandingScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animación de entrada: el texto del hero y cada tarjeta aparecen con
  // fade + deslizamiento hacia arriba, en cascada.
  const heroTextAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(TRADITIONS.map(() => new Animated.Value(0))).current;
  const newsBannerAnim = useRef(new Animated.Value(0)).current;
  const newsPulse = useRef(new Animated.Value(1)).current;
  const directoryBannerAnim = useRef(new Animated.Value(0)).current;
  const directoryPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(newsPulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(newsPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(directoryPulse, { toValue: 1.03, duration: 950, useNativeDriver: true }),
        Animated.timing(directoryPulse, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.timing(heroTextAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      120,
      [newsBannerAnim, ...cardAnims, directoryBannerAnim].map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.4],
    extrapolate: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT - 80, HERO_HEIGHT - 20],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const handleMenuSelect = (key) => {
    setMenuVisible(false);
    if (key === "login") {
      navigation.navigate("LoadingTransition", {
        to: "Login",
        message: "Preparando el inicio de sesión...",
      });
    } else if (key === "about") {
      navigation.navigate("LoadingTransition", { to: "About", message: "Cargando..." });
    } else if (key === "location") {
      navigation.navigate("LoadingTransition", { to: "Location", message: "Cargando..." });
    }
  };

  const handleNewsPress = () => {
    navigation.navigate("LoadingTransition", {
      to: "News",
      message: "Cargando noticias...",
    });
  };

  const handleDirectoryPress = () => {
    navigation.navigate("LoadingTransition", {
      to: "Directory",
      message: "Cargando directorio telefónico...",
    });
  };

  return (
    <View style={styles.flex}>
      {/* Header fijo que aparece al hacer scroll */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity }]} pointerEvents="none">
        <View style={styles.fixedHeaderBg} />
      </Animated.View>

      <SafeAreaView style={styles.safeHeader} edges={["top"]}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../../../assets/logoappkinal.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>Muni Kinal</Text>
          </View>
          <Pressable style={styles.menuButton} onPress={() => setMenuVisible(true)}>
            <MaterialIcons name="menu" size={24} color={COLORS.surface} />
          </Pressable>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <View style={styles.heroWrapper}>
          <Animated.Image
            source={require("../../../../assets/logobanner.jpg")}
            style={[
              styles.heroImage,
              { transform: [{ translateY: heroTranslateY }, { scale: heroScale }] },
            ]}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <Animated.View
            style={[
              styles.heroTextContainer,
              {
                opacity: heroTextAnim,
                transform: [
                  {
                    translateY: heroTextAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.heroTitle}>Guatemala</Text>
            <Text style={styles.heroSubtitle}>Tradición, cultura e historia viva</Text>
          </Animated.View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introText}>
            Conoce algunos de los lugares y tradiciones que hacen de Guatemala un país lleno de
            historia, color y raíces mayas. Desliza para descubrir más.
          </Text>
        </View>

        <Animated.View
          style={{
            opacity: newsBannerAnim,
            transform: [
              {
                translateY: newsBannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
              { scale: newsPulse },
            ],
          }}
        >
          <Pressable style={styles.newsBanner} onPress={handleNewsPress}>
            <View style={styles.newsBannerIcon}>
              <MaterialIcons name="campaign" size={26} color={COLORS.surface} />
            </View>
            <View style={styles.newsBannerTextWrap}>
              <Text style={styles.newsBannerTitle}>Noticias MuniKinal</Text>
              <Text style={styles.newsBannerSubtitle}>Entérate de lo último en la ciudad</Text>
            </View>
            <MaterialIcons name="chevron-right" size={26} color={COLORS.surface} />
          </Pressable>
        </Animated.View>

        {TRADITIONS.map((item, index) => {
          const expanded = expandedKey === item.key;
          const anim = cardAnims[index];
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
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image source={IMAGES[item.key]} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardBody}>
                <Text style={styles.cardTag}>{item.tag}</Text>
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
                    size={20}
                    color={COLORS.surface}
                  />
                </Pressable>
              </View>
            </Animated.View>
          );
        })}

        <View style={styles.footerCta}>
          <Text style={styles.footerCtaText}>¿Listo para empezar?</Text>
          <Pressable
            style={styles.footerButton}
            onPress={() =>
              navigation.navigate("LoadingTransition", {
                to: "Login",
                message: "Preparando el inicio de sesión...",
              })
            }
          >
            <Text style={styles.footerButtonText}>Iniciar sesión</Text>
          </Pressable>
        </View>

        <Animated.View
          style={{
            opacity: directoryBannerAnim,
            transform: [
              {
                translateY: directoryBannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
              { scale: directoryPulse },
            ],
          }}
        >
          <Pressable style={styles.directoryBanner} onPress={handleDirectoryPress}>
            <View style={styles.directoryBannerIcon}>
              <MaterialIcons name="perm-phone-msg" size={26} color={COLORS.surface} />
            </View>
            <View style={styles.newsBannerTextWrap}>
              <Text style={styles.newsBannerTitle}>Directorio Telefónico</Text>
              <Text style={styles.newsBannerSubtitle}>
                Números importantes de la municipalidad
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={26} color={COLORS.surface} />
          </Pressable>
        </Animated.View>

        <ContactFooter />
      </Animated.ScrollView>

      <DropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelect={handleMenuSelect}
        items={LANDING_MENU_ITEMS}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 5,
  },
  fixedHeaderBg: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  safeHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  brandLogo: {
    width: 48,
    height: 48,
  },
  brand: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 4,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  heroWrapper: {
    height: HERO_HEIGHT,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 49, 109, 0.45)",
  },
  heroTextContainer: {
    position: "absolute",
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  heroTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  intro: {
    padding: SPACING.lg,
  },
  introText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  newsBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 18,
    backgroundColor: COLORS.accentOrange,
    ...SHADOWS.card,
  },
  newsBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  newsBannerTextWrap: {
    flex: 1,
  },
  newsBannerTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
  },
  newsBannerSubtitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  directoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    ...SHADOWS.card,
  },
  directoryBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
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
    height: 160,
  },
  cardBody: {
    padding: SPACING.md,
  },
  cardTag: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
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
  footerCta: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  footerCtaText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    marginBottom: SPACING.md,
  },
  footerButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: 24,
  },
  footerButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default LandingScreen;
