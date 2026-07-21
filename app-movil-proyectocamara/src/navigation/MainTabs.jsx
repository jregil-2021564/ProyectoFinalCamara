// src/navigation/MainTabs.jsx
import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import HomeScreen from "../features/client/screens/HomeScreen";
import AccountScreen from "../features/client/screens/AccountScreen";
import CardsScreen from "../features/client/screens/CardsScreen";
import BalanceScreen from "../features/client/screens/BalanceScreen";
import ClientMenu from "../features/client/components/ClientMenu";
import CustomTabBar from "./CustomTabBar";

const Tab = createBottomTabNavigator();

// Pantalla vacía: la ruta "More" nunca llega a mostrarse porque su
// tabPress la intercepta y abre el menú en su lugar.
const EmptyScreen = () => null;

const MainTabs = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
        <Tab.Screen name="Cards" component={CardsScreen} />
        <Tab.Screen name="Balance" component={BalanceScreen} />
        <Tab.Screen
          name="More"
          component={EmptyScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setMenuVisible(true);
            },
          }}
        />
      </Tab.Navigator>

      <ClientMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </>
  );
};

export default MainTabs;
