import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Paperclip, Phone, Send, Video } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import { Colors } from "../../constants/Colors";
import {
    getAppointmentChatMessages,
    getAuthToken,
    getSocketBaseUrl,
    sendAppointmentChatMessage,
    uploadFile,
} from "../../services/api";

type ChatMessage = {
  _id: string;
  appointment: string;
  sender?: { _id?: string; name?: string; image?: string; role?: string };
  receiver?: { _id?: string; name?: string; image?: string; role?: string };
  text?: string;
  imageUrl?: string;
  createdAt?: string;
};

const ROLE_PATIENT = "patient";

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConsultationChatScreen() {
  const router = useRouter();
  const { appointmentId, doctorName, doctorImage } = useLocalSearchParams<{
    appointmentId: string;
    doctorName?: string;
    doctorImage?: string;
  }>();

  const scrollRef = useRef<ScrollView | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const normalizedAppointmentId = String(appointmentId || "");

  const loadMessages = async () => {
    if (!normalizedAppointmentId) return;
    setLoading(true);
    const response = await getAppointmentChatMessages(normalizedAppointmentId, {
      limit: 100,
    });
    if (Array.isArray(response.data)) {
      setMessages(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [normalizedAppointmentId]);

  useEffect(() => {
    const initSocket = async () => {
      if (!normalizedAppointmentId) return;
      const token = await getAuthToken();
      if (!token) return;

      const socket = io(getSocketBaseUrl(), {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("chat:join", { appointmentId: normalizedAppointmentId });
      });

      socket.on("chat:message:new", (message: ChatMessage) => {
        if (String(message.appointment) !== normalizedAppointmentId) return;
        setMessages((prev) => {
          if (prev.some((item) => String(item._id) === String(message._id))) {
            return prev;
          }
          return [...prev, message];
        });
      });
    };

    initSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("chat:leave", {
          appointmentId: normalizedAppointmentId,
        });
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, [normalizedAppointmentId]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 30);
  }, [messages]);

  const sendMessage = async (payload: { text?: string; imageUrl?: string }) => {
    if (!normalizedAppointmentId) return;
    if (!payload.text && !payload.imageUrl) return;

    setSending(true);
    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit(
        "chat:send",
        {
          appointmentId: normalizedAppointmentId,
          text: payload.text,
          imageUrl: payload.imageUrl,
        },
        (ack: any) => {
          setSending(false);
          if (ack?.ok && ack?.message) {
            setMessages((prev) => {
              if (
                prev.some(
                  (item) => String(item._id) === String(ack.message._id),
                )
              ) {
                return prev;
              }
              return [...prev, ack.message];
            });
          }
        },
      );
      return;
    }

    const fallback = await sendAppointmentChatMessage(
      normalizedAppointmentId,
      payload,
    );
    setSending(false);
    if (fallback.data) {
      setMessages((prev) => [...prev, fallback.data as ChatMessage]);
    }
  };

  const onSendText = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await sendMessage({ text });
  };

  const onPickImage = async () => {
    if (sending) return;

    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (picker.canceled || !picker.assets?.length) return;

    const asset = picker.assets[0];
    if (!asset.uri) return;

    const upload = await uploadFile(
      {
        uri: asset.uri,
        name: asset.fileName || `chat-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      },
      "nividoc/chat",
      false,
    );
    const url = upload.data?.url;
    if (!url) return;

    await sendMessage({ imageUrl: url });
  };

  const renderedMessages = useMemo(() => messages, [messages]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Image
          source={{ uri: String(doctorImage || "") }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.docName} numberOfLines={1}>
            {String(doctorName || "Doctor")}
          </Text>
          <Text style={styles.statusText}>Online</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Phone color={Colors.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Video color={Colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dateHeader}>Today</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Loading chat...</Text>
            </View>
          ) : null}
          {renderedMessages.map((msg) => {
            const isMe = msg.sender?.role === ROLE_PATIENT;
            return (
              <View
                key={String(msg._id)}
                style={[
                  styles.messageBubbleWrap,
                  isMe ? styles.messageRight : styles.messageLeft,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  {msg.text ? (
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.textRight : styles.textLeft,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  ) : null}
                  {msg.imageUrl ? (
                    <Image
                      source={{ uri: msg.imageUrl }}
                      style={styles.messageImage}
                    />
                  ) : null}
                </View>
                <Text style={styles.timeText}>{formatTime(msg.createdAt)}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachBtn}
            activeOpacity={0.7}
            onPress={onPickImage}
          >
            <Paperclip color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              input.trim().length > 0 && styles.sendBtnActive,
            ]}
            onPress={onSendText}
            disabled={input.trim().length === 0 || sending}
            activeOpacity={0.7}
          >
            <Send
              color={
                input.trim().length > 0 ? Colors.surface : Colors.textSecondary
              }
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: { padding: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    marginRight: 12,
    backgroundColor: Colors.lightGray,
  },
  headerInfo: { flex: 1 },
  docName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  statusText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "500",
    marginTop: 2,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  chatArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  dateHeader: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 24,
  },

  messageBubbleWrap: { marginBottom: 20, maxWidth: "80%" },
  messageLeft: { alignSelf: "flex-start" },
  messageRight: { alignSelf: "flex-end" },
  messageBubble: { padding: 14, borderRadius: 20 },
  bubbleLeft: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleRight: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  textLeft: { color: Colors.text },
  textRight: { color: Colors.surface },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
    marginHorizontal: 4,
  },
  messageImage: {
    width: 190,
    height: 170,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: Colors.lightGray,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  attachBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: Colors.text,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: { backgroundColor: Colors.primary },
});
