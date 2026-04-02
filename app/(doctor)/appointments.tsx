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
import Badge, { getStatusVariant } from "../../components/Badge";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Spacing, Radius } from "../../constants/Spacing";
import { Shadows } from "../../constants/Shadows";
import { createChat, getDoctorAppointments } from "../../services/api";

type AppointmentItem = {
  _id: string;
  id?: string;
  patient?: { _id?: string; id?: string; name?: string; image?: string; age?: number };
  time?: string;
  date?: string;
  type?: "video" | "chat" | "in-person" | string;
  status?: string;
};

const TABS = ["Upcoming", "Pending", "Completed"] as const;
type Tab = (typeof TABS)[number];

export default function DoctorAppointmentsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("Upcoming");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const openPatientChat = useCallback(async (item: AppointmentItem) => {
    const patientId = String(item.patient?._id || item.patient?.id || "");
    if (!patientId) { router.push("/(doctor)/chat"); return; }
    const response = await createChat({ patientId });
    if (!response.data?._id) { router.push("/(doctor)/chat"); return; }
    router.push({
      pathname: "/(doctor)/chat/[chatId]",
      params: {
        chatId: String(response.data._id),
        patientId,
        patientName: item.patient?.name || "Patient",
        patientImage: item.patient?.image || "",
        isBlocked: String(Boolean(response.data.isBlocked)),
        blockedBy: response.data.blockedBy ? String(response.data.blockedBy) : "",
      },
    });
  }, [router]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const response = await getDoctorAppointments();
    if (response.status === "success" && Array.isArray(response.data)) {
      setAppointments(response.data as AppointmentItem[]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadAppointments(); }, [loadAppointments]));

  const data = useMemo(() => appointments.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    if (activeTab === "Upcoming") return status === "upcoming";
    if (activeTab === "Pending") return status === "pending";
    if (activeTab === "Completed") return status === "completed";
    return false;
  }), [activeTab, appointments]);

  const prettyType = (rawType?: string) => {
    const normalized = String(rawType || "video");
    if (normalized === "in-person") return "In-person Consult";
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} Consult`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item._id || item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Loading appointments…</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Calendar size={32} color={Colors.textDisabled} />
              </View>
              <Text style={styles.emptyTitle}>No {activeTab} appointments</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const normalizedStatus = `${String(item.status || "").charAt(0).toUpperCase()}${String(item.status || "").slice(1)}`;
          const appointmentId = String(item._id || item.id);
          const isVideo = String(item.type || "").toLowerCase() === "video";

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: "/(doctor)/appointment/[id]", params: { id: appointmentId } })}
            >
              {/* Left accent bar */}
              <View style={[styles.accentBar, {
                backgroundColor: activeTab === "Pending" ? Colors.warning :
                  activeTab === "Completed" ? Colors.success : Colors.primary
              }]} />

              <View style={styles.cardInner}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <Image source={{ uri: item.patient?.image }} style={styles.avatar} />
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.patient?.name || "Patient"}</Text>
                    <Text style={styles.consultType}>{prettyType(item.type)}</Text>
                    <View style={styles.metaRow}>
                      <Calendar size={12} color={Colors.textTertiary} />
                      <Text style={styles.metaText}>{item.date ? new Date(item.date).toLocaleDateString() : "-"}</Text>
                      <Clock size={12} color={Colors.textTertiary} />
                      <Text style={styles.metaText}>{item.time || "-"}</Text>
                    </View>
                  </View>
                  <Badge label={normalizedStatus} variant={getStatusVariant(item.status)} size="sm" dot />
                </View>

                {/* Actions */}
                <View style={styles.cardFooter}>
                  {activeTab === "Pending" && (
                    <>
                      <TouchableOpacity style={styles.rejectBtn}>
                        <X color={Colors.error} size={14} />
                        <Text style={[styles.actionText, { color: Colors.error }]}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.acceptBtn}>
                        <Check color={Colors.textInverse} size={14} />
                        <Text style={[styles.actionText, { color: Colors.textInverse }]}>Accept</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {activeTab === "Upcoming" && (
                    <>
                      <TouchableOpacity style={styles.outlineBtn}>
                        <Text style={[styles.actionText, { color: Colors.primary }]}>Reschedule</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.outlineBtn} onPress={() => openPatientChat(item)}>
                        <MessageSquare color={Colors.primary} size={14} />
                        <Text style={[styles.actionText, { color: Colors.primary }]}>Message</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => {
                          if (!isVideo) { openPatientChat(item); return; }
                          router.push({ pathname: "/(doctor)/appointment/video/[id]", params: { id: appointmentId } });
                        }}
                      >
                        <Video color={Colors.textInverse} size={14} />
                        <Text style={[styles.actionText, { color: Colors.textInverse }]}>Start Consult</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {activeTab === "Completed" && (
                    <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]}>
                      <MessageSquare color={Colors.primary} size={14} />
                      <Text style={[styles.actionText, { color: Colors.primary }]}>View Summary</Text>
                    </TouchableOpacity>
                  )}
                </View>
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

  header: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { ...Typography.h3, fontSize: 20, color: Colors.text },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    alignItems: "center",
    position: "relative",
  },
  tabBtnActive: {},
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 2.5,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabText: { ...Typography.label, fontSize: 13, color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary },

  listContent: { paddingHorizontal: Spacing.screenH, paddingTop: 4, paddingBottom: 40 },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadows.card,
  },
  accentBar: { width: 4 },
  cardInner: { flex: 1, padding: Spacing.md },

  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: Spacing.md },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    marginRight: Spacing.sm + 4,
    backgroundColor: Colors.lightGray,
  },
  info: { flex: 1 },
  name: { ...Typography.label, fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 2 },
  consultType: { ...Typography.caption, color: Colors.primary, fontWeight: "600", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...Typography.caption, color: Colors.textTertiary, marginRight: 6 },

  cardFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm + 4,
  },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: "#FECACA",
  },
  acceptBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  outlineBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    backgroundColor: Colors.primaryUltraLight, borderWidth: 1, borderColor: Colors.primaryLight,
  },
  actionText: { ...Typography.buttonSm, fontSize: 12 },

  loadingState: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: Spacing.sm },
  loadingText: { ...Typography.caption, color: Colors.textTertiary },
  emptyState: { alignItems: "center", paddingVertical: 56 },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: { ...Typography.body2, color: Colors.textTertiary, fontWeight: "600" },
});
