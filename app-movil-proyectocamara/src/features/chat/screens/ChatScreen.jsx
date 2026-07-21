// src/features/chat/screens/ChatScreen.jsx
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { getBotReply, WELCOME_HOURS } from "../../../shared/utils/faqBot";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";

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

const MessageBubble = ({ message }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.bubble,
        message.from === "user" ? styles.bubbleUser : styles.bubbleBot,
        {
          opacity: anim,
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
          ],
        },
      ]}
    >
      <Text style={message.from === "user" ? styles.bubbleUserText : styles.bubbleBotText}>
        {message.text}
      </Text>
    </Animated.View>
  );
};

const ChatScreen = () => {
  const navigation = useNavigation();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: "¡Hola! Soy el asistente de MuniKinal. Pregúntame por horarios, agencias o ubicación.",
    },
  ]);
  const scrollRef = useRef(null);

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
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialIcons name="menu" size={22} color={COLORS.surface} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Asistente MuniKinal</Text>
            <Text style={styles.headerSubtitle}>{WELCOME_HOURS}</Text>
          </View>

          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialIcons name="close" size={22} color={COLORS.surface} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {typing ? (
            <View style={[styles.bubble, styles.bubbleBot]}>
              <TypingDots />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <Pressable style={styles.attachButton} hitSlop={8}>
            <MaterialIcons name="attach-file" size={20} color={COLORS.textLight} />
          </Pressable>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    marginTop: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
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
  attachButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentOrange,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ChatScreen;