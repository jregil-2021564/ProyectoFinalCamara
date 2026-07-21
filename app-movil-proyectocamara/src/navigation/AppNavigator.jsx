// src/navigation/AppNavigator.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { authStore } from "../shared/store/authStore";
import LoadingScreen from "../shared/components/common/LoadingScreen";
import AuthStack from "./AuthStack";
import ClientStack from "./ClientStack";

// Permite abrir la app desde el link del correo de verificación/recuperación.
// En web (puerto 8081) responde a http://localhost:8081/verify-email?token=...
// En nativo responde al scheme appmovilproyectocamara://verify-email?token=...
// (definido en app.json). El backend debe apuntar sus correos a esta URL,
// no a la del otro frontend (5173).
const linking = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Landing: "",
      About: "about",
      Location: "ubicacion",
      News: "noticias",
      NewsMap: "noticias-mapa",
      Directory: "directorio",
      Login: "login",
      Register: "register",
      CheckEmail: "check-email",
      VerifyEmail: "verify-email",
      ForgotPassword: "forgot-password",
      ResetPassword: "reset-password",
      ResendVerification: "resend-verification",
    },
  },
};

const AppNavigator = () => {
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  // Muestra la pantalla de carga animada cada vez que isAuthenticated
  // cambia (tanto al iniciar sesión como al cerrarla).
  const [showAuthTransition, setShowAuthTransition] = useState(false);
  const prevAuthRef = useRef(isAuthenticated);
  const transitionMessage = isAuthenticated ? "Iniciando sesión..." : "Cerrando sesión...";

  useEffect(() => {
    if (prevAuthRef.current !== isAuthenticated) {
      prevAuthRef.current = isAuthenticated;
      setShowAuthTransition(true);
      const timer = setTimeout(() => setShowAuthTransition(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  if (!hasHydrated) {
    return <LoadingScreen message="Cargando..." />;
  }

  if (showAuthTransition) {
    return <LoadingScreen message={transitionMessage} />;
  }

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <ClientStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
