import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Paperclip,
    Send,
    ShieldBan,
    Video,
} from "lucide-react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import { Colors } from "../../constants/Colors";
import { useCall } from "../../context/CallContext";
import {
    blockChat,
    getAuthToken,
    getChatMessages,
    getMyProfile,
    getSocketBaseUrl,
    markChatSeen,
    sendChatMessage,
    uploadFile,
} from "../../services/api";

type ChatMessage = {
  _id: string;
  chatId: string;
  senderId?: { _id?: string; name?: string; image?: string; role?: string };
  receiverId?: { _id?: string; name?: string; image?: string; role?: string };
  type?: "text" | "image";
  message?: string;
  fileUrl?: string;
  isSeen?: boolean;
  createdAt?: string;
};

type Props = {
  chatId: string;
  peerName: string;
  peerImage?: string;
  peerId?: string;
  currentRole: "patient" | "doctor";
  initialBlocked?: boolean;
  initialBlockedBy?: string | null;
};

type ChatParticipants = {
  doctorId: string;
  patientId: string;
};

function getEntityId(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value || "");
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RealtimeChatScreen({
  chatId,
  peerName,
  peerImage,
  peerId,
  currentRole,
  initialBlocked = false,
  initialBlockedBy = null,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { initiateVideoCall } = useCall();
  const scrollRef = useRef<ScrollView | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState("");
  const [peerOnline, setPeerOnline] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(Boolean(initialBlocked));
  const [blockedBy, setBlockedBy] = useState<string | null>(initialBlockedBy);
  const [participants, setParticipants] = useState<ChatParticipants | null>(
    null,
  );

  const canSend =
    !isBlocked || (blockedBy ? String(blockedBy) === String(myId) : true);

  const effectivePeerId = useMemo(() => {
    if (!myId) return "";

    const doctorFromChat = getEntityId(participants?.doctorId);
    const patientFromChat = getEntityId(participants?.patientId);
    if (doctorFromChat && patientFromChat) {
      if (String(doctorFromChat) === String(myId))
        return String(patientFromChat);
      if (String(patientFromChat) === String(myId))
        return String(doctorFromChat);
    }

    const direct = String(peerId || "");
    if (direct && direct !== myId) return direct;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const item = messages[i];
      const sender = getEntityId(item.senderId);
      const receiver = getEntityId(item.receiverId);

      if (sender === myId && receiver) return receiver;
      if (receiver === myId && sender) return sender;
    }

    return "";
  }, [messages, myId, peerId, participants]);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    const response = await getChatMessages(chatId, { page: 1, limit: 100 });
    const chat = response.data?.chat || null;
    if (chat) {
      setParticipants({
        doctorId: getEntityId(chat.doctorId),
        patientId: getEntityId(chat.patientId),
      });
    }
    if (response.data?.items) {
      setMessages(response.data.items);
      await markChatSeen(chatId);
    }
    setLoading(false);
  }, [chatId]);

  useEffect(() => {
    const loadMe = async () => {
      const profile = await getMyProfile();
      const id = String(
        profile.data?.user?._id ||
          profile.data?.user?.id ||
          profile.data?._id ||
          profile.data?.id ||
          "",
      );
      setMyId(id);
    };
    loadMe();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const connect = async () => {
      const token = await getAuthToken();
      if (!token || !chatId) return;

      const socket = io(getSocketBaseUrl(), {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join_chat", chatId);
      });

      socket.on("receive_message", (payload: any) => {
        const message = payload?.message || payload;
        if (String(message?.chatId || "") !== String(chatId)) return;
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(message._id)))
            return prev;
          return [...prev, message];
        });
      });

      socket.on("typing", (payload: any) => {
        if (String(payload?.chatId) !== String(chatId)) return;
        if (String(payload?.userId || "") === String(myId)) return;
        setIsPeerTyping(Boolean(payload?.isTyping));
      });

      socket.on("messages_seen", (payload: any) => {
        if (String(payload?.chatId) !== String(chatId)) return;
        setMessages((prev) =>
          prev.map((msg) =>
            getEntityId(msg.senderId) === String(myId)
              ? { ...msg, isSeen: true }
              : msg,
          ),
        );
      });

      socket.on("chat_blocked", (payload: any) => {
        if (String(payload?.chatId) !== String(chatId)) return;
        setIsBlocked(Boolean(payload?.isBlocked));
        setBlockedBy(payload?.blockedBy ? String(payload.blockedBy) : null);
      });

      socket.on("user_status", (payload: any) => {
        if (!effectivePeerId) return;
        if (String(payload?.userId || "") !== String(effectivePeerId)) return;
        setPeerOnline(Boolean(payload?.online));
      });
    };

    connect();
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.emit("leave_chat", chatId);
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, [chatId, myId, effectivePeerId]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 25);
  }, [messages, isPeerTyping]);

  const emitTyping = (isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("typing", {
      chatId,
      isTyping,
    });
  };

  const onChangeInput = (value: string) => {
    setInput(value);

    emitTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 700);
  };

  const pushMessage = (message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => String(m._id) === String(message._id))) return prev;
      return [...prev, message];
    });
  };

  const sendPayload = async (payload: {
    type?: "text" | "image";
    message?: string;
    fileUrl?: string;
  }) => {
    if (!chatId || sending || !canSend) return;

    setSending(true);
    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("send_message", { chatId, ...payload }, (ack: any) => {
        setSending(false);
        if (ack?.ok && ack?.message) {
          pushMessage(ack.message);
        }
      });
      return;
    }

    const response = await sendChatMessage(chatId, payload);
    setSending(false);
    if (response.data) pushMessage(response.data as ChatMessage);
  };

  const onSendText = async () => {
    const value = input.trim();
    if (!value) return;
    setInput("");
    emitTyping(false);
    await sendPayload({ type: "text", message: value });
  };

  const onSendImage = async () => {
    if (!canSend) return;

    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (picker.canceled || !picker.assets?.length) return;
    const asset = picker.assets[0];
    if (!asset.uri) return;

    const uploadRes = await uploadFile(
      {
        uri: asset.uri,
        name: asset.fileName || `chat-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      },
      "nividoc/chat",
      false,
    );

    if (!uploadRes.data?.url) {
      Alert.alert("Upload failed", uploadRes.error || "Unable to upload image");
      return;
    }

    await sendPayload({ type: "image", fileUrl: uploadRes.data.url });
  };

  const onToggleBlock = async () => {
    const nextBlock = !isBlocked;

    const response = await blockChat(chatId, nextBlock);
    if (!response.data) {
      Alert.alert("Error", response.error || "Unable to update block status");
      return;
    }

    setIsBlocked(Boolean(response.data.isBlocked));
    setBlockedBy(
      response.data.blockedBy ? String(response.data.blockedBy) : null,
    );
  };

  const onVideoCallPress = () => {
    if (!myId) {
      Alert.alert("Video Call", "Please wait a moment and try again.");
      return;
    }

    if (!effectivePeerId || String(effectivePeerId) === String(myId)) {
      Alert.alert("Video Call", "User id not found for this chat.");
      return;
    }

    initiateVideoCall({
      receiverId: String(effectivePeerId),
      peerName: peerName || "User",
    }).then((result) => {
      if (!result) {
        Alert.alert("Video Call", "Unable to start call.");
      }
    });
  };

  const renderedMessages = useMemo(() => messages, [messages]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={20} />
        </TouchableOpacity>
        <Image source={{ uri: peerImage || "" }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.peerName}>{peerName || "Chat"}</Text>
          <Text style={styles.onlineText}>
            {peerOnline ? "Online" : "Offline"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onVideoCallPress}>
            <Video color={Colors.textSecondary} size={21} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onToggleBlock}>
            <ShieldBan
              color={isBlocked ? Colors.error : Colors.textSecondary}
              size={21}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isBlocked && !canSend ? (
        <View style={styles.blockBanner}>
          <Text style={styles.blockText}>
            You are blocked. You cannot send messages.
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : null}

          {renderedMessages.map((msg) => {
            const isMine = getEntityId(msg.senderId) === String(myId);
            return (
              <View
                key={String(msg._id)}
                style={[
                  styles.messageRow,
                  isMine ? styles.rowRight : styles.rowLeft,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.mineBubble : styles.theirBubble,
                  ]}
                >
                  {msg.type !== "image" && msg.message ? (
                    <Text style={[styles.msgText, isMine && styles.mineText]}>
                      {msg.message}
                    </Text>
                  ) : null}
                  {msg.fileUrl ? (
                    <Image
                      source={{ uri: msg.fileUrl }}
                      style={styles.msgImage}
                    />
                  ) : null}
                </View>
                <Text style={styles.timeText}>
                  {formatTime(msg.createdAt)}{" "}
                  {isMine ? (msg.isSeen ? "✓✓" : "✓") : ""}
                </Text>
              </View>
            );
          })}

          {isPeerTyping ? (
            <View style={styles.typingWrap}>
              <Text style={styles.typingText}>{peerName} is typing...</Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.inputRow,
            {
              paddingBottom: isKeyboardVisible
                ? 8
                : Math.max(insets.bottom, 10),
            },
          ]}
        >
          <TouchableOpacity style={styles.attachBtn} onPress={onSendImage}>
            <Paperclip color={Colors.textSecondary} size={19} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={onChangeInput}
            placeholder={canSend ? "Type a message..." : "You are blocked"}
            placeholderTextColor={Colors.textSecondary}
            multiline
            editable={canSend}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              input.trim() && canSend ? styles.sendActive : null,
            ]}
            onPress={onSendText}
            disabled={!input.trim() || sending || !canSend}
          >
            <Send
              color={
                input.trim() && canSend ? Colors.surface : Colors.textSecondary
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
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: { padding: 8 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 8,
  },
  headerInfo: { flex: 1 },
  peerName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  onlineText: { fontSize: 12, color: "#16A34A", marginTop: 2 },
  blockBanner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  blockText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    textAlign: "center",
  },
  chatArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  loadingWrap: { alignItems: "center", gap: 8, marginTop: 10 },
  loadingText: { fontSize: 12, color: Colors.textSecondary },
  messageRow: { marginBottom: 14, maxWidth: "82%" },
  rowLeft: { alignSelf: "flex-start" },
  rowRight: { alignSelf: "flex-end" },
  bubble: { borderRadius: 18, padding: 12 },
  mineBubble: {
    backgroundColor: "#0B5FFF",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#E9EDF3",
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 14, color: "#0F172A", lineHeight: 20 },
  mineText: { color: "#FFFFFF" },
  msgImage: {
    width: 190,
    height: 170,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 5,
    marginHorizontal: 4,
  },
  typingWrap: { alignSelf: "flex-start", marginTop: 2, marginBottom: 8 },
  typingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 10,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2F7",
  },
  sendActive: { backgroundColor: "#2563EB" },
});
