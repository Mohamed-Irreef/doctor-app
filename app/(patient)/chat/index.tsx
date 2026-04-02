import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, MessageSquare, Search } from "lucide-react-native";
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import { createChat, getDoctors, getUserChats } from "../../../services/api";

function resolveId(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value || "");
}

export default function PatientChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [doctorsRes, chatsRes] = await Promise.all([
      getDoctors(),
      getUserChats(),
    ]);
    if (Array.isArray(doctorsRes.data)) setDoctors(doctorsRes.data);
    if (Array.isArray(chatsRes.data)) setChats(chatsRes.data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filteredDoctors = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return doctors;
    return doctors.filter((doctor) =>
      `${doctor.name || ""} ${doctor.specialization || ""}`
        .toLowerCase()
        .includes(text),
    );
  }, [doctors, query]);

  const openOrCreateChat = async (doctor: any) => {
    const result = await createChat({ doctorId: doctor.id || doctor._id });
    if (!result.data) return;

    router.push({
      pathname: "/(patient)/chat/[chatId]",
      params: {
        chatId: String(result.data._id),
        doctorId: String(doctor.id || doctor._id),
        doctorName: doctor.name || "Doctor",
        doctorImage: doctor.image || "",
        isBlocked: String(Boolean(result.data.isBlocked)),
        blockedBy: result.data.blockedBy ? String(result.data.blockedBy) : "",
      },
    });
  };

  const openExistingChat = (chat: any) => {
    const doctor = chat.doctorId || {};
    const doctorId = resolveId(doctor) || resolveId(chat.doctorId);
    router.push({
      pathname: "/(patient)/chat/[chatId]",
      params: {
        chatId: String(chat._id),
        doctorId,
        doctorName: doctor.name || "Doctor",
        doctorImage: doctor.image || "",
        isBlocked: String(Boolean(chat.isBlocked)),
        blockedBy: chat.blockedBy ? String(chat.blockedBy) : "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.textInverse} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with Doctor</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <View style={styles.searchRow}>
        <Search size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search doctor"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <Text style={styles.sectionTitle}>Recent Chats</Text>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => String(item._id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No chats yet</Text>
          }
          renderItem={({ item }) => {
            const doctor = item.doctorId || {};
            return (
              <TouchableOpacity
                style={styles.recentCard}
                onPress={() => openExistingChat(item)}
              >
                <Image
                  source={{ uri: doctor.image || "" }}
                  style={styles.avatar}
                />
                <Text style={styles.recentName} numberOfLines={1}>
                  {doctor.name || "Doctor"}
                </Text>
                <Text style={styles.recentLast} numberOfLines={1}>
                  {item.lastMessage || "Start chatting"}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Text style={styles.sectionTitle}>All Doctors</Text>
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => String(item.id || item._id)}
        contentContainerStyle={styles.doctorList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => openOrCreateChat(item)}
          >
            <Image source={{ uri: item.image || "" }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || "Doctor"}</Text>
              <Text style={styles.sub}>
                {item.specialization || "Specialist"}
              </Text>
            </View>
            <MessageSquare size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}
      />
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
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textInverse },
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
  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "700",
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 8,
  },
  loadingWrap: { paddingVertical: 20, alignItems: "center" },
  recentList: { paddingHorizontal: 14, gap: 10, paddingBottom: 4 },
  recentCard: {
    width: 150,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },
  recentName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  recentLast: { marginTop: 4, fontSize: 11, color: Colors.textSecondary },
  emptyText: { color: Colors.textSecondary, fontSize: 12, marginLeft: 4 },
  doctorList: { paddingHorizontal: 14, paddingBottom: 30, gap: 10 },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.lightGray,
  },
  name: { fontSize: 14, fontWeight: "700", color: Colors.text },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
