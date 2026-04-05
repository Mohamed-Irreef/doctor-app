import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
    Calendar,
    Clock,
    MessageSquare,
    Video,
    XCircle,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Badge, { getStatusVariant } from "../../components/Badge";
import { ListSkeleton } from "../../components/SkeletonLoader";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import { useCall } from "../../context/CallContext";
import { createChat, getPatientAppointments } from "../../services/api";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Upcoming");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { initiateVideoCall } = useCall();

  const startVideoCall = useCallback(
    async (item: any) => {
      const doctorId = String(item?.doctor?._id || item?.doctor?.id || "");
      const appointmentId = String(item?._id || item?.id || "");
      if (!doctorId || !appointmentId) return;
      const ok = await initiateVideoCall({
        receiverId: doctorId,
        peerName: item?.doctor?.name || "Doctor",
        appointmentId,
      });
      if (!ok) return;
    },
    [initiateVideoCall],
  );

  const openDoctorChat = useCallback(
    async (item: any) => {
      const doctorId = String(item?.doctor?._id || item?.doctor?.id || "");
      if (!doctorId) {
        router.push("/(patient)/chat");
        return;
      }
      const response = await createChat({ doctorId });
      if (!response.data?._id) {
        router.push("/(patient)/chat");
        return;
      }
      router.push({
        pathname: "/(patient)/chat/[chatId]",
        params: {
          chatId: String(response.data._id),
          doctorId,
          doctorName: item?.doctor?.name || "Doctor",
          doctorImage: item?.doctor?.image || "",
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
    setLoading(true);
    const response = await getPatientAppointments();
    if (response.data) setAppointments(response.data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  const data = appointments.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    if (activeTab === "Upcoming") return s === "upcoming" || s === "pending";
    if (activeTab === "Completed") return s === "completed";
    if (activeTab === "Cancelled") return s === "cancelled" || s === "rejected";
    return false;
  });

  const renderCard = ({ item }: { item: any }) => {
    const status = String(item.status || "");
    return (
      <View style={styles.card}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: Colors.primary }]} />

        <View style={styles.cardInner}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Image source={{ uri: item.doctor?.image }} style={styles.avatar} />
            <View style={styles.docInfo}>
              <Text style={styles.docName}>{item.doctor?.name}</Text>
              <Text style={styles.docSpec}>{item.type}</Text>
            </View>
            <Badge
              label={status || "Upcoming"}
              variant={getStatusVariant(item.status)}
              size="sm"
              dot
            />
          </View>

          <View style={styles.divider} />

          {/* Details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Calendar size={14} color={Colors.textTertiary} />
              <Text style={styles.detailText}>
                {item.date
                  ? new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "-"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Clock size={14} color={Colors.textTertiary} />
              <Text style={styles.detailText}>{item.time || "-"}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn]}
              activeOpacity={0.8}
              onPress={() => startVideoCall(item)}
            >
              <Video size={14} color={Colors.textInverse} />
              <Text
                style={[styles.actionBtnText, { color: Colors.textInverse }]}
              >
                Start Video Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.outlineBtn]}
              activeOpacity={0.8}
            >
              <Calendar size={14} color={Colors.primary} />
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>
                Reschedule
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.outlineBtn]}
              activeOpacity={0.8}
              onPress={() => openDoctorChat(item)}
            >
              <MessageSquare size={14} color={Colors.primary} />
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>
                Message
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.dangerBtn]}
              activeOpacity={0.8}
            >
              <XCircle size={14} color={Colors.error} />
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 8) + 8,
            paddingBottom: Spacing.md,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Appointments</Text>
      </LinearGradient>

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
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ListSkeleton count={3} type="appointment" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id || item._id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Calendar size={36} color={Colors.textDisabled} />
              </View>
              <Text style={styles.emptyTitle}>No {activeTab} Appointments</Text>
              <Text style={styles.emptySub}>
                You do not have any {activeTab.toLowerCase()} appointments yet.
              </Text>
            </View>
          }
          renderItem={renderCard}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0,
  },
  headerTitle: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.textInverse,
    textAlign: "left",
  },

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

  loadingContainer: { padding: Spacing.screenH },
  listContent: { padding: Spacing.screenH, paddingBottom: 40 },

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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    marginRight: Spacing.sm + 4,
    backgroundColor: Colors.lightGray,
  },
  docInfo: { flex: 1 },
  docName: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  docSpec: { ...Typography.caption, color: Colors.primary, fontWeight: "600" },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },

  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  actionBtn: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    gap: 6,
  },
  primaryBtn: { backgroundColor: Colors.primary },
  outlineBtn: {
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  dangerBtn: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  actionBtnText: { ...Typography.buttonSm, fontSize: 12 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading,
    fontSize: 17,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    ...Typography.body2,
    color: Colors.textTertiary,
    textAlign: "center",
  },
});
