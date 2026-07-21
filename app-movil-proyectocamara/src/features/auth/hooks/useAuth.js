// src/features/auth/hooks/useAuth.js
import { useCallback, useState } from "react";
import authClient from "../../../shared/api/authClient";
import { authStore } from "../../../shared/store/authStore";

const extractErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Ocurrió un error inesperado. Intenta de nuevo.";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const storeLogin = authStore((state) => state.login);
  const storeLogout = authStore((state) => state.logout);

  const runRequest = useCallback(async (requestFn) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await requestFn();
      return { success: true, data };
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /login -> { accessToken, refreshToken, userDetails }
  // Se tolera también { token, user } por si el backend cambia el shape.
  const handleLogin = useCallback(
    async ({ emailOrUsername, password }) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await authClient.post("/login", {
          emailOrUsername,
          password,
        });

        const accessToken = data?.accessToken || data?.token;
        const refreshToken = data?.refreshToken;
        let userDetails = data?.userDetails || data?.user || null;

        if (!accessToken) {
          throw new Error("La respuesta del servidor no incluyó un token válido.");
        }

        // Si el backend no devuelve foto de perfil, usamos la que se guardó
        // localmente al registrarse en este dispositivo (si existe).
        if (userDetails && !userDetails.profilePicture) {
          const registeredProfile = authStore.getState().getRegisteredProfile(userDetails.username);
          if (registeredProfile?.profilePicture) {
            userDetails = { ...userDetails, profilePicture: registeredProfile.profilePicture };
          }
        }

        await storeLogin(accessToken, userDetails, refreshToken);
        return { success: true };
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [storeLogin]
  );

  // POST /register -> multipart/form-data (así lo espera el backend, ver Postman)
  // Campos: name, surname, username, email, password, phone, placa, profilePicture (opcional)
  const handleRegister = useCallback(
    async ({ profilePicture, ...formValues }) => {
      return runRequest(() => {
        const formData = new FormData();

        Object.entries(formValues).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
          }
        });

        if (profilePicture) {
          if (profilePicture.file) {
            // Web: expo-image-picker entrega un File nativo del navegador
            formData.append(
              "profilePicture",
              profilePicture.file,
              profilePicture.fileName || "profile.jpg"
            );
          } else if (profilePicture.uri) {
            // Nativo (Android/iOS): descriptor de archivo estilo RN
            formData.append("profilePicture", {
              uri: profilePicture.uri,
              name: profilePicture.fileName || "profile.jpg",
              type: profilePicture.mimeType || "image/jpeg",
            });
          }
        }

        // No se fija Content-Type a mano: el runtime (browser o RN)
        // agrega el boundary correcto automáticamente para FormData.
        return authClient.post("/register", formData);
      });
    },
    [runRequest]
  );

  // POST /verify-email -> { token }
  const handleVerifyEmail = useCallback(
    async ({ token }) => runRequest(() => authClient.post("/verify-email", { token: token?.trim() })),
    [runRequest]
  );

  // POST /resend-verification -> { email }
  const handleResendVerification = useCallback(
    async ({ email }) =>
      runRequest(() => authClient.post("/resend-verification", { email })),
    [runRequest]
  );

  // POST /forgot-password -> { email }
  const handleForgotPassword = useCallback(
    async ({ email }) =>
      runRequest(() => authClient.post("/forgot-password", { email })),
    [runRequest]
  );

  // POST /reset-password -> { token, newPassword }
  const handleResetPassword = useCallback(
    async ({ token, newPassword }) =>
      runRequest(() =>
        authClient.post("/reset-password", {
          token: token?.trim(),
          newPassword,
        })
      ),
    [runRequest]
  );

  // PUT /profile -> multipart/form-data { profilePicture }
  // NOTA: este endpoint no estaba en el Postman de auth; el nombre de ruta y
  // el método (PUT) están basados en la convención habitual de "editar mi
  // perfil". Si tu backend usa otra ruta/método, es el único lugar a ajustar.
  const updateProfilePicture = useCallback(
    (profilePicture) =>
      runRequest(() => {
        const formData = new FormData();
        if (profilePicture.file) {
          // Web: expo-image-picker entrega un File nativo del navegador
          formData.append(
            "profilePicture",
            profilePicture.file,
            profilePicture.fileName || "profile.jpg"
          );
        } else if (profilePicture.uri) {
          // Nativo (Android/iOS): descriptor de archivo estilo RN
          formData.append("profilePicture", {
            uri: profilePicture.uri,
            name: profilePicture.fileName || "profile.jpg",
            type: profilePicture.mimeType || "image/jpeg",
          });
        }
        return authClient.put("/profile", formData);
      }),
    [runRequest]
  );

  const logout = useCallback(async () => {
    await storeLogout();
  }, [storeLogout]);

  return {
    handleLogin,
    handleRegister,
    handleVerifyEmail,
    handleResendVerification,
    handleForgotPassword,
    handleResetPassword,
    updateProfilePicture,
    loading,
    error,
    logout,
  };
};

