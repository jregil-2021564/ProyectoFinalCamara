// src/features/landing/components/GoogleMapEmbed.web.jsx
// Versión web: Metro/Expo eligen automáticamente este archivo cuando se
// compila para navegador (por el sufijo .web.jsx). Usamos un <iframe> real
// con el embed de Google Maps, así que es tan interactivo como la propia
// página de Google Maps (arrastrar, hacer scroll para zoom, etc.).
import React from "react";

const GoogleMapEmbed = ({ embedUrl, style }) => (
  <iframe
    src={embedUrl}
    style={{ border: 0, width: "100%", height: "100%", ...style }}
    loading="lazy"
    allowFullScreen
    referrerPolicy="no-referrer-when-downgrade"
  />
);

export default GoogleMapEmbed;