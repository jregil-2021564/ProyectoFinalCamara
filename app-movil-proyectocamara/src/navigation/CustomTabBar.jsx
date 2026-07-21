// src/navigation/CustomTabBar.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../shared/constants/theme";

const ICONS = {
  Home: "dashboard",
  Account: "account-circle",
  Cards: "credit-card",
  Balance: "account-balance-wallet",
  More: "menu",
};

const TabButton = ({ routeName, focused, onPress }) => {
  const highlight = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const jump = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(highlight, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, highlight]);

  const handlePress = () => {
    jump.setValue(0);
    Animated.sequence([
      Animated.timing(jump, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.spring(jump, { toValue: 0, friction: 3.5, tension: 180, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const iconColor = focused ? COLORS.surface : "rgba(255,255,255,0.65)";
  const translateY = jump.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const scale = jump.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  return (
    <Pressable style={styles.tabButton} onPress={handlePress}>
      <Animated.View style={[styles.iconContainer, { transform: [{ translateY }, { scale }] }]}>
        <Animated.View
          style={[
            styles.pill,
            {
              opacity: highlight,
              transform: [
                {
                  scale: highlight.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                },
              ],
            },
          ]}
        />
        <MaterialIcons name={ICONS[routeName]} size={22} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
};

// Sigue el patrón oficial de React Navigation para tabBar personalizados:
// emite el evento "tabPress" antes de navegar, así los listeners definidos
// en cada Tab.Screen (por ejemplo, el de "More" que abre el menú en vez de
// navegar) sí pueden hacer preventDefault() y cancelar la navegación.
const CustomTabBar = ({ state, navigation }) => (
  <SafeAreaView edges={["bottom"]} style={styles.safe}>
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton key={route.key} routeName={route.name} focused={focused} onPress={onPress} />
        );
      })}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.primary },
  bar: {
    flexDirection: "row",
    height: 58,
    backgroundColor: COLORS.primary,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 42,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    position: "absolute",
    width: 42,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});

export default CustomTabBar;