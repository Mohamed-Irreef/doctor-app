import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, MessageSquare, Video } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { createChat, getPatientAppointments } from "../../services/api";

type AppointmentItem = {
  _id?: string;
  id?: string;
  status?: string;
  type?: string;
  doctor?: { _id?: string; id?: string; name?: string; image?: string; specialization?: string };
  date?: string;
  time?: string;
};

export default function PatientVideoConsultListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getPatientAppointments();
    if (Array.isArray(response.data)) {
      setAppointments(response.data as AppointmentItem[]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const bookedVideoAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      const type = String(item.type || "").toLowerCase();
      const isBooked = status === "upcoming" || status === "pending";
      return isBooked && type === "video";
    });
  }, [appointments]);

  const openDoctorChat = useCallback(
    async (item: AppointmentItem) => {
      const doctorId = String(item?.doctor?._id || item?.doctor?.id || "");
      if (!doctorId) return;

      const response = await createChat({ doctorId });
      if (!response.data?._id) return;

      router.push({
        pathname: "/(patient)/chat/[chatId]",
        params: {
          chatId: String(response.data._id),
          doctorId,
          doctorName: item?.doctor?.name || "Doctor",
          doctorImage: item?.doctor?.image || "",
          isBlocked: String(Boolean(response.data.isBlocked)),
          blockedBy: response.data.blockedBy ? String(response.data.blockedBy) : "",
        },
      });
    },
    [router],
  );

  const openVideoConsult = (item: AppointmentItem) => {
    const id = String(item._id || item.id || "");
    if (!id) return;
    router.push({ pathname: "/(patient)/appointment/video/[id]", params: { id } });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Consult</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookedVideoAppointments}
          keyExtractor={(item) => String(item._id || item.id || Math.random())}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No Appointments Booked for Video consult</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <Image
                  source={{ uri: item.doctor?.image || "" }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.doctor?.name || "Doctor"}</Text>
                  <Text style={styles.spec}>
                    {item.doctor?.specialization || "Specialist"}
                  </Text>
                  <Text style={styles.timeText}>
                    {item.date ? new Date(item.date).toLocaleDateString() : ""} {item.time || ""}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.msgBtn]}
                  onPress={() => openDoctorChat(item)}
                  activeOpacity={0.8}
                >
                  <MessageSquare color={Colors.primary} size={16} />
                  <Text style={[styles.actionText, { color: Colors.primary }]}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.videoBtn]}
                  onPress={() => openVideoConsult(item)}
                  activeOpacity={0.8}
                >
                  <Video color={Colors.textInverse} size={16} />
                  <Text style={[styles.actionText, { color: Colors.textInverse }]}>Video Consult</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.text },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 14, gap: 12, paddingBottom: 28 },
  emptyWrap: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: Colors.textSecondary, textAlign: "center" },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.lightGray,
  },
  name: { fontSize: 15, fontWeight: "800", color: Colors.text },
  spec: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  timeText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  msgBtn: {
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  videoBtn: {
    backgroundColor: Colors.primary,
  },
  actionText: { fontSize: 13, fontWeight: "700" },
});
