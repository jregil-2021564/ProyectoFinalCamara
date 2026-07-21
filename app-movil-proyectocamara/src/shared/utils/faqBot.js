// src/shared/utils/faqBot.js
export const WELCOME_HOURS = "Lunes a sábado de 06:00 a 21:00 y domingo de 06:00 a 18:00";

const FAQ = [
  {
    match: /(horario|hora|abren|cierran|atienden)/i,
    reply: `Nuestro horario de atención es: ${WELCOME_HOURS}.`,
  },
  {
    match: /(agencia|sucursal|oficina|donde estan|dónde están|ubicaci[oó]n)/i,
    reply:
      "Puedes ver nuestra ubicación exacta en el mapa: toca el menú ☰ arriba y elige 'Ver mapa'.",
  },
  {
    match: /(contacto|correo|email|tel[eé]fono|llamar)/i,
    reply: "Puedes escribirnos a proyectocamara.g3@gmail.com y con gusto te atendemos.",
  },
  {
    match: /(gracias|thank)/i,
    reply: "¡Con gusto! Si tienes otra pregunta, aquí estoy.",
  },
  {
    match: /(hola|buenas|buenos dias|buenos días|buenas tardes|buenas noches)/i,
    reply:
      "¡Hola! ¿En qué puedo ayudarte? Puedo darte información sobre horarios, agencias o ubicación.",
  },
];

export const getBotReply = (text) => {
  const found = FAQ.find((item) => item.match.test(text));
  if (found) return found.reply;
  return "No tengo una respuesta exacta para eso, pero puedo ayudarte con horarios, agencias y ubicación. ¿Sobre cuál te gustaría saber?";
};
