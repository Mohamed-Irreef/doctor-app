import { useRouter } from "expo-router";
import { ArrowLeft, Send, Sparkles } from "lucide-react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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

type MockCategory =
  | "greeting"
  | "emergency"
  | "fever"
  | "cold"
  | "stomach"
  | "headache"
  | "skin"
  | "dental"
  | "general";

function classifySymptom(text: string): MockCategory {
  const t = String(text || "").toLowerCase();

  if (
    /\b(hi|hello|hey|hii|good morning|good afternoon|good evening)\b/.test(t)
  ) {
    return "greeting";
  }

  // Red flags / emergency symptoms.
  if (
    t.includes("chest pain") ||
    t.includes("pressure in chest") ||
    t.includes("difficulty breathing") ||
    t.includes("shortness of breath") ||
    t.includes("can't breathe") ||
    t.includes("cannot breathe") ||
    t.includes("faint") ||
    t.includes("passed out") ||
    t.includes("seizure") ||
    t.includes("stroke") ||
    t.includes("weakness one side") ||
    t.includes("slurred speech") ||
    t.includes("suicid")
  ) {
    return "emergency";
  }

  if (
    t.includes("fever") ||
    t.includes("temperature") ||
    t.includes("chills")
  ) {
    return "fever";
  }

  if (
    t.includes("cough") ||
    t.includes("cold") ||
    t.includes("runny") ||
    t.includes("sore throat") ||
    t.includes("throat") ||
    t.includes("flu")
  ) {
    return "cold";
  }

  if (
    t.includes("stomach") ||
    t.includes("abdominal") ||
    t.includes("vomit") ||
    t.includes("nausea") ||
    t.includes("diarr") ||
    t.includes("loose motion") ||
    t.includes("acidity")
  ) {
    return "stomach";
  }

  if (
    t.includes("headache") ||
    t.includes("migraine") ||
    t.includes("dizzy") ||
    t.includes("vertigo")
  ) {
    return "headache";
  }

  if (
    t.includes("rash") ||
    t.includes("itch") ||
    t.includes("acne") ||
    t.includes("eczema") ||
    t.includes("skin")
  ) {
    return "skin";
  }

  if (
    t.includes("tooth") ||
    t.includes("gum") ||
    t.includes("dental") ||
    t.includes("mouth")
  ) {
    return "dental";
  }

  return "general";
}

function getMockReply(userText: string) {
  const category = classifySymptom(userText);

  switch (category) {
    case "greeting":
      return "Hi — I’m Nivi Bot. Tell me your main symptom (and since when), plus your age and whether you have any medical conditions.";

    case "emergency":
      return "These symptoms can be serious. Please seek urgent medical help now (local emergency number / nearest ER). If you’re alone, call someone to stay with you.\n\nIf you can, tell me: your age, your exact symptom, and when it started.";

    case "fever":
      return "Thanks — with fever, I need a few details to guide you safely:\n1) Temperature (°C/°F) and how many days?\n2) Any cough/sore throat, body aches, or headache?\n3) Any red flags: breathing difficulty, chest pain, confusion, stiff neck, dehydration?\n\nGeneral care: rest, fluids, light meals. If fever is high/persistent or you have red flags, consult a doctor promptly.";

    case "cold":
      return "For cough/cold symptoms, please share:\n1) How many days?\n2) Fever present?\n3) Any wheeze, shortness of breath, chest pain, or blood in sputum?\n\nGeneral care: warm fluids, steam inhalation, rest. If symptoms worsen, last >7 days, or you have breathing trouble, book a doctor consultation.";

    case "stomach":
      return "For stomach issues, please tell me:\n1) Where is the pain (upper/center/right/left)?\n2) Vomiting/diarrhea? Any blood?\n3) Fever or severe dehydration?\n\nGeneral care: oral rehydration, small bland meals. If severe pain, blood, persistent vomiting, or dehydration, see a doctor urgently.";

    case "headache":
      return "For headache, a few checks:\n1) When did it start and how severe (0–10)?\n2) Any fever, neck stiffness, weakness, vision changes, or head injury?\n3) Nausea/vomiting, light sensitivity?\n\nIf it’s sudden/severe or with neurological symptoms, please seek urgent care.";

    case "skin":
      return "For skin symptoms, please share:\n1) What you see (rash/itching/pimples) and where?\n2) Any new soap/medicine/food exposure?\n3) Fever, swelling of lips/face, or breathing difficulty?\n\nIf there’s facial swelling or breathing issues, seek urgent care. Otherwise, a dermatologist consult is best.";

    case "dental":
      return "For dental pain, please tell me:\n1) Tooth pain vs gum swelling?\n2) Any fever, facial swelling, or difficulty opening mouth/swallowing?\n\nIf facial swelling or fever is present, see a dentist/doctor urgently. Otherwise, book a dental consult soon.";

    case "general":
    default:
      return "I can help. Please describe:\n- Your main symptom\n- Since when\n- Your age\n- Any medical conditions/medications\n- Any red flags (breathing trouble, chest pain, fainting, severe weakness)";
  }
}

type ChatItem = {
  id: string;
  role: "user" | "ai";
  text: string;
};

const ROLE_USER = "user" as const;
const ROLE_AI = "ai" as const;

const TYPING_ID = "typing";

export default function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi, I’m Nivi Bot. Tell me your symptoms and I’ll guide you safely.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const canSend = useMemo(
    () => !loading && input.trim().length > 0,
    [input, loading],
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (loading) return;

    const userMessage: ChatItem = {
      id: `u-${Date.now()}`,
      role: ROLE_USER,
      text,
    };

    const nextMessages = [
      ...messages.filter((m) => m.id !== TYPING_ID),
      userMessage,
    ];
    setMessages([
      ...nextMessages,
      {
        id: TYPING_ID,
        role: ROLE_AI,
        text: "Typing…",
      },
    ]);
    setInput("");
    setLoading(true);

    try {
      // Temporary local (switch/case) responder; replace with Gemini later.
      await new Promise((resolve) => setTimeout(resolve, 550));
      const reply = getMockReply(text);

      const aiMessage: ChatItem = {
        id: `a-${Date.now()}-${Math.random()}`,
        role: ROLE_AI,
        text: reply,
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== TYPING_ID),
        aiMessage,
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== TYPING_ID),
        {
          id: `aerr-${Date.now()}`,
          role: ROLE_AI,
          text:
            error?.message ||
            "Sorry — I couldn’t respond right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
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
