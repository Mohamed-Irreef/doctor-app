import { useRouter } from "expo-router";
import { ArrowLeft, Send, Sparkles } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

type ChatItem = {
  id: string;
  role: "user" | "ai";
  text: string;
};

const ROLE_USER = "user" as const;
const ROLE_AI = "ai" as const;

function createAiReply(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("fever") || lower.includes("cold")) {
    return "I understand your symptoms. Please stay hydrated, monitor temperature, and consult a doctor if symptoms persist beyond 2 days.";
  }
  if (lower.includes("headache") || lower.includes("migraine")) {
    return "For headache symptoms, track duration, hydration, and sleep. If severe or recurring, book a neurologist consultation.";
  }
  return "Thanks for sharing. I can help you with symptom guidance and suggest which specialist to consult based on your symptoms.";
}

export default function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi, I am Nivi AI. Tell me your symptoms and I will guide you.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView | null>(null);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const onSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatItem = {
      id: `u-${Date.now()}`,
      role: ROLE_USER,
      text,
    };
    const aiMessage: ChatItem = {
      id: `a-${Date.now()}-${Math.random()}`,
      role: ROLE_AI,
      text: createAiReply(text),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40);
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.text} size={20} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nivi AI Chat</Text>
          <Text style={styles.headerSub}>Symptom Checker</Text>
        </View>
        <View style={styles.aiDotWrap}>
          <Sparkles color={Colors.primary} size={16} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesWrap}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => {
            const isUser = item.role === ROLE_USER;
            return (
              <View
                key={item.id}
                style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      isUser ? styles.userText : styles.aiText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your symptoms..."
            placeholderTextColor={Colors.textSecondary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, canSend && styles.sendBtnActive]}
            onPress={onSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <Send
              color={canSend ? Colors.textInverse : Colors.textSecondary}
              size={18}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  aiDotWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  chatArea: { flex: 1 },
  messagesWrap: { padding: 14, paddingBottom: 24, gap: 10 },
  row: { maxWidth: "85%" },
  rowLeft: { alignSelf: "flex-start" },
  rowRight: { alignSelf: "flex-end" },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  aiBubble: {
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  aiText: { color: Colors.text },
  userText: { color: Colors.textInverse },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 20,
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  sendBtnActive: { backgroundColor: Colors.primary },
});
