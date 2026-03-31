import { useFocusEffect, useRouter } from "expo-router";
import {
    Calendar,
    Check,
    Clock,
    MessageSquare,
    Video,
    X,
} from "lucide-react-native";
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
import { Typography } from "../../constants/Typography";
import { getDoctorAppointments } from "../../services/api";

type AppointmentItem = {
  _id: string;
  id?: string;
  patient?: { name?: string; image?: string; age?: number };
  time?: string;
  date?: string;
  type?: "video" | "chat" | "in-person" | string;
  status?: string;
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Upcoming: { bg: "#DBEAFE", text: Colors.primary },
  Pending: { bg: "#FEF3C7", text: "#D97706" },
  Completed: { bg: "#DCFCE7", text: "#16A34A" },
};

const TABS = ["Upcoming", "Pending", "Completed"] as const;
type Tab = (typeof TABS)[number];

export default function DoctorAppointmentsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("Upcoming");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const response = await getDoctorAppointments();
    if (response.status === "success" && Array.isArray(response.data)) {
      setAppointments(response.data as AppointmentItem[]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  const data = useMemo(
    () =>
      appointments.filter((item) => {
        const status = String(item.status || "").toLowerCase();
        if (activeTab === "Upcoming") return status === "upcoming";
        if (activeTab === "Pending") return status === "pending";
        if (activeTab === "Completed") return status === "completed";
        return false;
      }),
    [activeTab, appointments],
  );

  const prettyType = (rawType?: string) => {
    const normalized = String(rawType || "video");
    if (normalized === "in-person") return "In-person Consult";
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} Consult`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={Typography.h2}>Appointments</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item._id || item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : (
            <Text style={styles.empty}>No appointments found.</Text>
          )
        }
        renderItem={({ item }) => {
          const normalizedStatus = `${String(item.status || "")
            .charAt(0)
            .toUpperCase()}${String(item.status || "").slice(1)}`;
          const badge = BADGE_COLORS[normalizedStatus] || BADGE_COLORS.Upcoming;
          const appointmentId = String(item._id || item.id);
          const isVideo = String(item.type || "").toLowerCase() === "video";
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/(doctor)/appointment/[id]",
                  params: { id: appointmentId },
                })
              }
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Image
                  source={{ uri: item.patient?.image }}
                  style={styles.avatar}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {item.patient?.name || "Patient"}
                  </Text>
                  <Text
                    style={[
                      Typography.caption,
                      { color: Colors.primary, marginBottom: 4 },
                    ]}
                  >
                    {prettyType(item.type)}
                  </Text>
                  <View style={styles.metaRow}>
                    <Calendar size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : "-"}
                    </Text>
                    <Clock size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{item.time || "-"}</Text>
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {normalizedStatus}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardFooter}>
                {activeTab === "Pending" && (
                  <>
                    <TouchableOpacity style={styles.rejectBtn}>
                      <X color={Colors.error} size={16} />
                      <Text
                        style={[styles.actionText, { color: Colors.error }]}
                      >
                        Decline
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn}>
                      <Check color={Colors.surface} size={16} />
                      <Text
                        style={[styles.actionText, { color: Colors.surface }]}
                      >
                        Accept
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {activeTab === "Upcoming" && (
                  <>
                    <TouchableOpacity style={styles.outlineBtn}>
                      <Text
                        style={[styles.actionText, { color: Colors.primary }]}
                      >
                        Reschedule
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => {
                        if (!isVideo) {
                          router.push("/(doctor)/consultation");
                          return;
                        }
                        router.push({
                          pathname: "/(doctor)/appointment/video/[id]",
                          params: { id: appointmentId },
                        });
                      }}
                    >
                      <Video color={Colors.surface} size={16} />
                      <Text
                        style={[styles.actionText, { color: Colors.surface }]}
                      >
                        Start Consult
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {activeTab === "Completed" && (
                  <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]}>
                    <MessageSquare color={Colors.primary} size={16} />
                    <Text
                      style={[styles.actionText, { color: Colors.primary }]}
                    >
                      View Summary
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontWeight: "600", fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  empty: { textAlign: "center", marginTop: 40, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: Colors.lightGray,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardFooter: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  actionText: { fontSize: 13, fontWeight: "700" },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 13 },
});
