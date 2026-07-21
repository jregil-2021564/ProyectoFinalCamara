// src/features/landing/components/GoogleMapEmbed.jsx
// Versión nativa (Android/iOS): usa WebView para cargar el embed de
// Google Maps, que ya es completamente interactivo (arrastrar, pellizcar
// para zoom, tocar el pin, etc.) igual que en la app o el navegador.
import React from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const GoogleMapEmbed = ({ embedUrl, style }) => (
  <WebView
    source={{ uri: embedUrl }}
    style={[styles.webview, style]}
    javaScriptEnabled
    domStorageEnabled
    startInLoadingState
  />
);

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});

export default GoogleMapEmbed;