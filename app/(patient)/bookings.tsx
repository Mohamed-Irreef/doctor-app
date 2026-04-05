import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Download, FlaskConical } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    ScrollView,
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
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { getMyLabBookings } from "../../services/api";

const BOOKING_STEPS = [
  "booked",
  "sample-collected",
  "report-ready",
  "completed",
];
const FILTERS = [
  "all",
  "booked",
  "sample-collected",
  "report-ready",
  "completed",
  "cancelled",
];

type BookingTimelineItem = {
  status?: string;
  at?: string;
};

type LabBooking = {
  _id: string;
  status: string;
  createdAt?: string;
  reportUrl?: string;
  reportUploadedAt?: string;
  scheduledDate?: string;
  labTest?: {
    name?: string;
    category?: string;
  };
  statusTimeline?: BookingTimelineItem[];
};

function normalizeStatus(value?: string) {
  return String(value || "booked")
    .toLowerCase()
    .replace(/_/g, "-");
}

export default function PatientBookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async (nextFilter = statusFilter) => {
    setLoading(true);
    setError("");

    const response = await getMyLabBookings(
      nextFilter === "all" ? undefined : { status: nextFilter },
    );

    if (response.status === "error") {
      setError(response.error || "Unable to load bookings");
      setBookings([]);
      setLoading(false);
      return;
    }

    setBookings((response.data || []) as LabBooking[]);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [bookings],
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={Colors.textInverse} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Lab Bookings</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>
          Track every step from booking to report completion.
        </Text>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              statusFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => {
              setStatusFilter(filter);
              load(filter);
            }}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter.replace(/-/g, " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.helperText}>Loading bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Text style={styles.helperText}>
                {error || "No bookings found."}
              </Text>
            </View>
          }
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const current = normalizeStatus(item.status);
            const currentIndex = BOOKING_STEPS.indexOf(current);
            const hasReport = Boolean(item.reportUrl);

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <FlaskConical color={Colors.primary} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.labTest?.name || "Lab Test"}
                    </Text>
                    <Text style={styles.meta}>
                      {item.labTest?.category || "Diagnostic"} |{" "}
                      {current.replace(/-/g, " ")}
                    </Text>
                    <Text style={styles.meta}>
                      Scheduled:{" "}
                      {item.scheduledDate
                        ? new Date(item.scheduledDate).toLocaleString()
                        : "Pending"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={!hasReport}
                    onPress={() => {
                      if (item.reportUrl) Linking.openURL(item.reportUrl);
                    }}
                    style={[
                      styles.downloadBtn,
                      !hasReport && styles.downloadDisabled,
                    ]}
                  >
                    <Download
                      color={hasReport ? Colors.text : "#CBD5E1"}
                      size={20}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.timelineWrap}>
                  {BOOKING_STEPS.map((step, index) => {
                    const done = currentIndex >= index;
                    const event = (item.statusTimeline || []).find(
                      (entry) => normalizeStatus(entry.status) === step,
                    );

                    return (
                      <View
                        key={step}
                        style={[
                          styles.timelineStep,
                          done && styles.timelineStepDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timelineTitle,
                            done && styles.timelineTitleDone,
                          ]}
                        >
                          {step.replace(/-/g, " ")}
                        </Text>
                        <Text
                          style={[
                            styles.timelineDate,
                            done && styles.timelineDateDone,
                          ]}
                        >
                          {event?.at
                            ? new Date(event.at).toLocaleString()
                            : "Pending"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerTitle: {
    ...Typography.h2,
    flex: 1,
    textAlign: "left",
    marginLeft: 12,
    color: Colors.textInverse,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.82)",
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  filterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#EFF6FF",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  meta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  downloadBtn: {
    padding: 8,
  },
  downloadDisabled: {
    opacity: 0.5,
  },
  timelineWrap: {
    marginTop: 10,
    gap: 8,
  },
  timelineStep: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
  },
  timelineStepDone: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  timelineTitleDone: {
    color: Colors.primary,
  },
  timelineDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timelineDateDone: {
    color: Colors.text,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
