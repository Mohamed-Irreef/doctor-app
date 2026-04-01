import { useFocusEffect, useRouter } from "expo-router";
import {
    Activity,
    ArrowRight,
    Bell,
    Briefcase,
    DollarSign,
    Users,
    Zap,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SectionHeader from "../../components/SectionHeader";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { createChat, getDoctorAppointments } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const QUICK_ACTIONS = [
  {
    label: "Manage Slots",
    icon: Zap,
    route: "/(doctor)/availability" as const,
    bg: "#EFF6FF",
    fg: Colors.primary,
  },
  {
    label: "Appointments",
    icon: Briefcase,
    route: "/(doctor)/appointments" as const,
    bg: "#F0FDF4",
    fg: "#16A34A",
  },
  {
    label: "Start Consult",
    icon: ArrowRight,
    route: "/(doctor)/chat" as const,
    bg: "#FDF4FF",
    fg: "#9333EA",
  },
];

export default function DoctorDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  const openPatientChat = useCallback(
    async (item: any) => {
      const patientId = String(item?.patient?._id || item?.patient?.id || "");
      if (!patientId) {
        router.push("/(doctor)/chat");
        return;
      }

      const response = await createChat({ patientId });
      if (!response.data?._id) {
        router.push("/(doctor)/chat");
        return;
      }

      router.push({
        pathname: "/(doctor)/chat/[chatId]",
        params: {
          chatId: String(response.data._id),
          patientId,
          patientName: item?.patient?.name || "Patient",
          patientImage: item?.patient?.image || "",
          isBlocked: String(Boolean(response.data.isBlocked)),
          blockedBy: response.data.blockedBy
            ? String(response.data.blockedBy)
            : "",
        },
      });
    },
    [router],
  );

  const loadAppointments = useCallback(async () => {
    const response = await getDoctorAppointments();
    if (response.status === "success" && Array.isArray(response.data)) {
      setAppointments(response.data);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayAppointments = useMemo(
    () =>
      appointments.filter(
        (item) => String(item?.date).slice(0, 10) === todayIso,
      ),
    [appointments, todayIso],
  );

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (item) => String(item?.status || "").toLowerCase() === "upcoming",
      ),
    [appointments],
  );

  const pendingAppointments = useMemo(
    () =>
      appointments.filter(
        (item) => String(item?.status || "").toLowerCase() === "pending",
      ),
    [appointments],
  );

  const estimatedEarnings = useMemo(
    () =>
      upcomingAppointments.reduce(
        (sum, item) => sum + Number(item?.fee || 0),
        0,
      ),
    [upcomingAppointments],
  );

  const scheduleItems = useMemo(
    () => todayAppointments.slice(0, 4),
    [todayAppointments],
  );

  const headerAvatar = user?.image
    ? { uri: user.image }
    : require("../../assets/images/profile.png");

  const stats = [
    {
      label: "Today's Appts",
      value: String(todayAppointments.length),
      icon: Users,
      color: Colors.primary,
      bg: "#DBEAFE",
    },
    {
      label: "Earnings",
      value: `₹${estimatedEarnings}`,
      icon: DollarSign,
      color: "#16A34A",
      bg: "#DCFCE7",
    },
    {
      label: "Pending",
      value: String(pendingAppointments.length),
      icon: Activity,
      color: "#9333EA",
      bg: "#F3E8FF",
    },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={headerAvatar} style={styles.avatar} />
            <View>
              <Text style={styles.headerGreeting}>{greeting()},</Text>
              <Text style={styles.headerName}>{user?.name ?? "Doctor"}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Availability Toggle */}
            <TouchableOpacity
              style={[styles.onlineBadge, !isOnline && styles.offlineBadge]}
              onPress={() => setIsOnline((v) => !v)}
              activeOpacity={0.8}
            >
              <View
                style={[styles.onlineDot, !isOnline && styles.offlineDot]}
              />
              <Text
                style={[styles.onlineText, !isOnline && styles.offlineText]}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifBtn}>
              <Bell color={Colors.text} size={22} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <s.icon color={s.color} size={20} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={[Typography.caption, { textAlign: "center" }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickCard, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.route)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickIconWrap,
                  { backgroundColor: Colors.surface },
                ]}
              >
                <a.icon color={a.fg} size={20} />
              </View>
              <Text style={[styles.quickLabel, { color: a.fg }]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <SectionHeader
            title="Today's Schedule"
            onPressSeeAll={() => router.push("/(doctor)/appointments")}
          />
          {scheduleItems.length === 0 ? (
            <View style={styles.emptyScheduleCard}>
              <Text style={styles.emptyScheduleText}>
                No appointments scheduled for today.
              </Text>
            </View>
          ) : (
            scheduleItems.map((item) => (
              <TouchableOpacity
                key={String(item._id || item.id)}
                style={styles.scheduleCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/(doctor)/appointment/[id]",
                    params: { id: String(item._id || item.id) },
                  })
                }
              >
                <View style={styles.scheduleAccent} />
                <View style={styles.scheduleMain}>
                  <View style={styles.scheduleTopRow}>
                    <View style={styles.timePillWrap}>
                      <Text style={styles.timePill}>{item.time || "-"}</Text>
                    </View>
                    <View style={styles.modeBadge}>
                      <View style={styles.modeDot} />
                      <Text style={styles.modeText}>
                        {String(item.type || "video")} consult
                      </Text>
                    </View>
                  </View>
                  <View style={styles.patientRow}>
                    <Image
                      source={{
                        uri:
                          item.patient?.image ||
                          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
                      }}
                      style={styles.patientAvatar}
                    />
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName} numberOfLines={1}>
                        {item.patient?.name || "Patient"}
                      </Text>
                      <Text style={styles.patientHint}>
                        Ready for consultation
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => {
                    if (String(item.type || "").toLowerCase() !== "video") {
                      openPatientChat(item);
                      return;
                    }
                    router.push({
                      pathname: "/(doctor)/appointment/video/[id]",
                      params: { id: String(item._id || item.id) },
                    });
                  }}
                >
                  <Text style={styles.startBtnText}>Start</Text>
                  <ArrowRight size={14} color={Colors.surface} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  scrollContent: { paddingTop: 16, paddingBottom: 42 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: "#E9EEF9",
  },
  headerGreeting: {
    ...Typography.body2,
    color: "#6B7280",
    marginBottom: 2,
  },
  headerName: {
    ...Typography.h3,
    color: "#0F172A",
    fontWeight: "800",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  offlineBadge: { backgroundColor: "#F1F5F9", borderColor: Colors.border },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  offlineDot: { backgroundColor: Colors.textSecondary },
  onlineText: { fontSize: 12, fontWeight: "700", color: "#16A34A" },
  offlineText: { color: Colors.textSecondary },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6EBF3",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 22,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EBF3",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  quickRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  quickCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E6EBF3",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  quickIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6EBF3",
  },
  quickLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  section: { paddingHorizontal: 20 },
  emptyScheduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EBF3",
    padding: 16,
    marginBottom: 12,
  },
  emptyScheduleText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6EBF3",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  scheduleAccent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    marginRight: 10,
  },
  scheduleMain: { flex: 1, gap: 10 },
  scheduleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timePillWrap: { alignItems: "center" },
  timePill: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
    backgroundColor: "#EAF1FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4F46E5",
  },
  modeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4338CA",
    textTransform: "capitalize",
  },
  patientRow: { flexDirection: "row", alignItems: "center" },
  patientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: Colors.border,
  },
  patientInfo: { flex: 1 },
  patientName: {
    ...Typography.body1,
    color: "#0F172A",
    fontWeight: "800",
  },
  patientHint: {
    ...Typography.caption,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  startBtnText: { color: Colors.surface, fontSize: 12, fontWeight: "800" },
});
