import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import { getMyProfile, getUserChats } from "../../../services/api";

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveId(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value || "");
}

export default function DoctorChatListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [myId, setMyId] = useState("");
  const [chats, setChats] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [profileRes, chatsRes] = await Promise.all([
      getMyProfile(),
      getUserChats(),
    ]);
    const id = String(
      profileRes.data?.user?._id ||
        profileRes.data?.user?.id ||
        profileRes.data?._id ||
        profileRes.data?.id ||
        "",
    );
    setMyId(id);
    if (Array.isArray(chatsRes.data)) setChats(chatsRes.data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => {
      const patient = chat.patientId || {};
      return `${patient.name || ""} ${chat.lastMessage || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [chats, query]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Chats</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search patient"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No chats found.</Text>}
          renderItem={({ item }) => {
            const patient = item.patientId || {};
            const patientId = resolveId(patient) || resolveId(item.patientId);
            const unreadForMe = String(item.unreadFor || "") === String(myId);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: "/(doctor)/chat/[chatId]",
                    params: {
                      chatId: String(item._id),
                      patientId,
                      patientName: patient.name || "Patient",
                      patientImage: patient.image || "",
                      isBlocked: String(Boolean(item.isBlocked)),
                      blockedBy: item.blockedBy ? String(item.blockedBy) : "",
                    },
                  })
                }
              >
                <Image
                  source={{ uri: patient.image || "" }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{patient.name || "Patient"}</Text>
                  <Text style={styles.last} numberOfLines={1}>
                    {item.lastMessage || "No messages yet"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.time}>
                    {formatTime(item.lastMessageTime)}
                  </Text>
                  {unreadForMe && item.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, height: 42, marginLeft: 8, color: Colors.text },
  loadingWrap: { paddingVertical: 24, alignItems: "center" },
  list: { paddingHorizontal: 14, paddingBottom: 24, paddingTop: 10, gap: 10 },
  empty: { textAlign: "center", marginTop: 20, color: Colors.textSecondary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGray,
  },
  name: { fontSize: 14, fontWeight: "700", color: Colors.text },
  last: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  time: { fontSize: 11, color: Colors.textSecondary },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, color: Colors.surface, fontWeight: "700" },
});
