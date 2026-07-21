// src/navigation/LoadingTransitionScreen.jsx
import React, { useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import LoadingScreen from "../shared/components/common/LoadingScreen";

// Pantalla "puente": se navega aquí con { to, params, message } y, tras un
// breve instante, reemplaza la pantalla actual por la de destino. Se usa
// para mostrar el loading animado antes de Login/About/Location.
const LoadingTransitionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { to, params, message } = route.params || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(to || "Login", params);
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LoadingScreen message={message} />;
};

export default LoadingTransitionScreen;
