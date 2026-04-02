import { LinearGradient } from "expo-linear-gradient";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import FadeInSection from "../../components/FadeInSection";
import SectionHeader from "../../components/SectionHeader";
import StatCard from "../../components/StatCard";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import { createChat, getDoctorAppointments } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const QUICK_ACTIONS = [
  {
    label: "Manage Slots",
    hint: "Set availability",
    icon: Zap,
    route: "/(doctor)/availability" as const,
  },
  {
    label: "Appointments",
    hint: "View today queue",
    icon: Briefcase,
    route: "/(doctor)/appointments" as const,
  },
  {
    label: "Start Consult",
    hint: "Open patient chats",
    icon: ArrowRight,
    route: "/(doctor)/chat" as const,
  },
];

export default function DoctorDashboardScreen() {
  const insets = useSafeAreaInsets();
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
  const todayLabel = new Date().toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topHeaderBg, { height: insets.top + 105 }]}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 4 },
        ]}
      >
        {/* ── HERO HEADER ── */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrap}>
                <Image source={headerAvatar} style={styles.avatar} />
                <View
                  style={[
                    styles.avatarStatusDot,
                    {
                      backgroundColor: isOnline
                        ? Colors.success
                        : Colors.textDisabled,
                    },
                  ]}
                />
              </View>
              <View>
                <Text style={styles.headerGreeting}>{greeting()}</Text>
                <Text style={styles.headerName}>{user?.name ?? "Doctor"}</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.onlineBadge, !isOnline && styles.offlineBadge]}
                onPress={() => setIsOnline((v) => !v)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: isOnline ? "#22C55E" : "#94A3B8" },
                  ]}
                />
                <Text
                  style={[styles.onlineText, !isOnline && styles.offlineText]}
                >
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.notifBtn}>
                <Bell color={Colors.textInverse} size={20} strokeWidth={1.8} />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{todayLabel}</Text>
            </View>
            <Text style={styles.heroMetaText}>
              {todayAppointments.length} appointments scheduled today
            </Text>
          </View>
        </LinearGradient>

        {/* ── STATS ROW ── */}
        <FadeInSection delay={0}>
          <Text style={styles.sectionEyebrow}>Dashboard Overview</Text>
          <View style={styles.statsRow}>
            <StatCard
              icon={<Users color={Colors.primary} size={20} strokeWidth={2} />}
              value={String(todayAppointments.length)}
              label="Today's Appts"
              iconBg={Colors.primaryLight}
              delay={0}
            />
            <StatCard
              icon={
                <DollarSign
                  color={Colors.primaryHover}
                  size={20}
                  strokeWidth={2}
                />
              }
              value={`₹${estimatedEarnings}`}
              label="Earnings"
              iconBg={Colors.primaryLight}
              delay={80}
            />
            <StatCard
              icon={
                <Activity
                  color={Colors.primaryPressed}
                  size={20}
                  strokeWidth={2}
                />
              }
              value={String(pendingAppointments.length)}
              label="Pending"
              iconBg={Colors.primaryUltraLight}
              delay={160}
            />
          </View>
        </FadeInSection>

        {/* ── QUICK ACTIONS ── */}
        <FadeInSection delay={100}>
          <Text style={styles.sectionEyebrow}>Quick Actions</Text>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickCard}
                onPress={() => router.push(a.route)}
                activeOpacity={0.82}
              >
                <View style={styles.quickIconWrap}>
                  <a.icon
                    color={Colors.textInverse}
                    size={20}
                    strokeWidth={1.9}
                  />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
                <Text style={styles.quickHint}>{a.hint}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeInSection>

        {/* ── TODAY'S SCHEDULE ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Today's Schedule"
            onPressSeeAll={() => router.push("/(doctor)/appointments")}
          />
          {scheduleItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Briefcase
                  size={24}
                  color={Colors.textDisabled}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.emptyText}>
                No appointments scheduled for today.
              </Text>
            </View>
          ) : (
            scheduleItems.map((item) => (
              <TouchableOpacity
                key={String(item._id || item.id)}
                style={styles.scheduleCard}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: "/(doctor)/appointment/[id]",
                    params: { id: String(item._id || item.id) },
                  })
                }
              >
                {/* Left accent bar */}
                <View style={styles.scheduleAccent} />

                <View style={styles.scheduleMain}>
                  <View style={styles.scheduleTopRow}>
                    <View style={styles.timePill}>
                      <Text style={styles.timePillText}>
                        {item.time || "-"}
                      </Text>
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
                  <ArrowRight
                    size={13}
                    color={Colors.textInverse}
                    strokeWidth={2.5}
                  />
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
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 48 },

  topHeaderBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  heroCard: {
    marginHorizontal: Spacing.screenH,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs + 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatarStatusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
  },
  headerGreeting: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.82)",
    marginBottom: 2,
  },
  headerName: {
    ...Typography.subheading,
    fontWeight: "800",
    color: Colors.textInverse,
  },

  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  offlineBadge: {
    backgroundColor: "rgba(15,23,42,0.22)",
    borderColor: "rgba(255,255,255,0.25)",
  },
  pulseDot: { width: 7, height: 7, borderRadius: Radius.full },
  onlineText: {
    ...Typography.buttonSm,
    fontSize: 12,
    color: Colors.textInverse,
  },
  offlineText: { color: "rgba(255,255,255,0.8)" },

  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  notifBadge: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: 0,
  },
  heroPill: {
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  heroMetaText: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.86)",
  },

  // Stats
  sectionEyebrow: {
    paddingHorizontal: Spacing.screenH,
    paddingVertical: 6,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.screenH,
    gap: Spacing.sm,
    marginBottom: Spacing.md + 2,
  },

  // Quick Actions
  quickRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.screenH,
    gap: Spacing.sm,
    marginBottom: Spacing.section,
  },
  quickCard: {
    flex: 1,
    borderRadius: Radius.lg,
    minHeight: 108,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(30,58,138,0.08)",
    ...Shadows.card,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryPressed,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    ...Typography.buttonSm,
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
    textAlign: "center",
  },
  quickHint: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Section
  section: { paddingHorizontal: Spacing.screenH },

  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { ...Typography.body2, color: Colors.textTertiary },

  // Schedule Card
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadows.card,
  },
  scheduleAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: Colors.primary,
  },
  scheduleMain: { flex: 1, padding: Spacing.sm + 4, gap: Spacing.sm + 2 },
  scheduleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timePill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  timePillText: { fontSize: 11, fontWeight: "800", color: Colors.primary },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  modeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primaryPressed,
    textTransform: "capitalize",
  },
  patientRow: { flexDirection: "row", alignItems: "center" },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    backgroundColor: Colors.border,
  },
  patientInfo: { flex: 1 },
  patientName: { ...Typography.label, fontWeight: "800", color: Colors.text },
  patientHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: "500",
  },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm + 5,
    paddingVertical: Spacing.sm + 1,
    borderRadius: Radius.md,
    gap: 4,
    marginRight: Spacing.sm + 4,
    ...Shadows.button,
  },
  startBtnText: { color: Colors.textInverse, fontSize: 12, fontWeight: "800" },
});
