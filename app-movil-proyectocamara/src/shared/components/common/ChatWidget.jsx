// src/shared/components/common/ChatWidget.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getBotReply, WELCOME_HOURS } from "../../utils/faqBot";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../constants/theme";

const TypingDots = () => {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      );
    const l1 = loop(d1, 0);
    const l2 = loop(d2, 150);
    const l3 = loop(d3, 300);
    l1.start();
    l2.start();
    l3.start();
    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [d1, d2, d3]);

  return (
    <View style={styles.typingRow}>
      <Animated.View style={[styles.typingDot, { opacity: d1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: d2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: d3 }]} />
    </View>
  );
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: "¡Hola! Soy el asistente de MuniKinal. Pregúntame por horarios, agencias o ubicación.",
    },
  ]);
  const [typing, setTyping] = useState(false);

  const panelAnim = useRef(new Animated.Value(0)).current;
  const fabPulse = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fabPulse]);

  useEffect(() => {
    Animated.spring(panelAnim, {
      toValue: open ? 1 : 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [open, panelAnim]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, from: "bot", text: getBotReply(text) },
      ]);
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, 900);
  };

  return (
    <>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.panel,
          {
            opacity: panelAnim,
            transform: [
              { scale: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              { translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            ],
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.flexFull}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderIcon}>
              <MaterialIcons name="forum" size={22} color={COLORS.surface} />
            </View>
            <View style={styles.flexFull}>
              <Text style={styles.panelHeaderTitle}>Le damos la bienvenida</Text>
              <Text style={styles.panelHeaderSubtitle}>{WELCOME_HOURS}</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={COLORS.surface} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.bubble, msg.from === "user" ? styles.bubbleUser : styles.bubbleBot]}
              >
                <Text style={msg.from === "user" ? styles.bubbleUserText : styles.bubbleBotText}>
                  {msg.text}
                </Text>
              </View>
            ))}
            {typing ? (
              <View style={[styles.bubble, styles.bubbleBot]}>
                <TypingDots />
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor={COLORS.textLight}
              style={styles.input}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <Pressable style={styles.sendButton} onPress={sendMessage}>
              <MaterialIcons name="send" size={20} color={COLORS.surface} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabPulse }] }]}>
        <Pressable style={styles.fab} onPress={() => setOpen((v) => !v)}>
          <MaterialIcons name={open ? "close" : "chat"} size={26} color={COLORS.surface} />
        </Pressable>
      </Animated.View>
    </>
  );
};

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 420;

const styles = StyleSheet.create({
  flexFull: { flex: 1 },
  fabWrapper: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg,
    zIndex: 20,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accentGold,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
  panel: {
    position: "absolute",
    right: SPACING.lg,
    bottom: 90,
    width: PANEL_WIDTH,
    maxWidth: "90%",
    height: PANEL_HEIGHT,
    maxHeight: "70%",
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
    zIndex: 20,
    ...SHADOWS.card,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.accentGold,
    padding: SPACING.md,
  },
  panelHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  panelHeaderTitle: {
    color: COLORS.surface,
    fontWeight: "800",
    fontSize: FONT_SIZE.sm,
  },
  panelHeaderSubtitle: {
    color: COLORS.surface,
    fontSize: 11,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesContent: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 14,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },
  bubbleBotText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
  },
  bubbleUserText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.sm,
  },
  typingRow: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textLight,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ChatWidget;
