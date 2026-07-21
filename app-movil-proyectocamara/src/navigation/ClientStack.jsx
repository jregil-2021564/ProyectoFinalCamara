// src/navigation/ClientStack.jsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import FinesScreen from "../features/client/screens/FinesScreen";
import PayFineScreen from "../features/client/screens/PayFineScreen";
import MunicipalMapScreen from "../features/map/screens/MunicipalMapScreen";
import ChatScreen from "../features/chat/screens/ChatScreen";
import ProfileScreen from "../features/client/screens/ProfileScreen";
import BalanceScreen from "../features/client/screens/BalanceScreen";
import ConsultasHubScreen from "../features/consultas/screens/ConsultasHubScreen";
import ConsultaMultasScreen from "../features/consultas/screens/ConsultaMultasScreen";
import RedesSocialesScreen from "../features/consultas/screens/RedesSocialesScreen";
import PagarServiciosScreen from "../features/consultas/screens/PagarServiciosScreen";

const Stack = createNativeStackNavigator();

const ClientStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="Fines" component={FinesScreen} />
    <Stack.Screen name="PayFine" component={PayFineScreen} />
    <Stack.Screen name="Map" component={MunicipalMapScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Recargas" component={BalanceScreen} />
    <Stack.Screen name="Consultas" component={ConsultasHubScreen} />
    <Stack.Screen name="ConsultaMultas" component={ConsultaMultasScreen} />
    <Stack.Screen name="RedesSociales" component={RedesSocialesScreen} />
    <Stack.Screen name="PagarServicios" component={PagarServiciosScreen} />
  </Stack.Navigator>
);

export default ClientStack;
