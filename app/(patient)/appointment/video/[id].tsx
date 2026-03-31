import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, Video } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../../constants/Colors";
import {
    getPatientAppointments,
    getVideoConsultationAccess,
} from "../../../../services/api";

type AccessResponse = {
  roomId: string;
  meetingUrl: string;
  startsAt: string;
  endsAt: string;
};

function parseTimeToMinutes(label: string) {
  const [timePart, period] = String(label).trim().split(" ");
  const [rawHour, minute] = timePart.split(":").map(Number);
  let hour = rawHour;
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function getAppointmentWindow(
  date: string,
  startTime: string,
  endTime: string,
) {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  const start = new Date(base);
  const end = new Date(base);
  start.setMinutes(parseTimeToMinutes(startTime));
  end.setMinutes(parseTimeToMinutes(endTime));
  return { start, end };
}

export default function PatientVideoConsultationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessResponse | null>(null);
  const [windowStart, setWindowStart] = useState<Date | null>(null);
  const [windowEnd, setWindowEnd] = useState<Date | null>(null);

  useEffect(() => {
    const loadAccess = async () => {
      if (!id) {
        setError("Appointment not found");
        setLoading(false);
        return;
      }

      const patientAppointments = await getPatientAppointments();
      if (
        patientAppointments.status === "success" &&
        Array.isArray(patientAppointments.data)
      ) {
        const appointment = patientAppointments.data.find(
          (item: any) => String(item?._id) === String(id),
        );
        const slot = appointment?.slot;
        if (appointment?.date && slot?.startTime && slot?.endTime) {
          const localWindow = getAppointmentWindow(
            String(appointment.date),
            String(slot.startTime),
            String(slot.endTime),
          );
          setWindowStart(localWindow.start);
          setWindowEnd(localWindow.end);
        }
      }

      setLoading(true);
      const response = await getVideoConsultationAccess(String(id));
      if (response.status !== "success" || !response.data) {
        setError(response.error || "Consultation is not available right now.");
        setLoading(false);
        return;
      }

      const accessData = response.data as AccessResponse;
      setAccess(accessData);
      setWindowStart((prev) => prev || new Date(accessData.startsAt));
      setWindowEnd((prev) => prev || new Date(accessData.endsAt));
      setError(null);
      setLoading(false);
    };

    loadAccess();
  }, [id]);

  const canJoinNow = useMemo(() => {
    if (!windowStart || !windowEnd) return false;
    const now = new Date();
    return now >= windowStart && now <= windowEnd;
  }, [windowEnd, windowStart]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Consultation</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.metaText}>
            Preparing secure consultation room...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Video color={Colors.textSecondary} size={34} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.metaText}>
            Call available only during appointment time
          </Text>
          <TouchableOpacity
            style={[styles.joinBtn, styles.joinBtnDisabled]}
            disabled
          >
            <Text style={styles.joinBtnText}>Join Video Consultation</Text>
          </TouchableOpacity>
        </View>
      ) : access ? (
        <View style={styles.centerState}>
          <Video color={Colors.primary} size={36} />
          <Text style={styles.metaText}>
            Your secure consultation room is ready.
          </Text>
          {!canJoinNow && (
            <Text style={styles.windowHint}>
              Call available only during appointment time
            </Text>
          )}
          <TouchableOpacity
            style={[styles.joinBtn, !canJoinNow && styles.joinBtnDisabled]}
            disabled={!canJoinNow}
            onPress={() => WebBrowser.openBrowserAsync(access.meetingUrl)}
          >
            <Text style={styles.joinBtnText}>Join Video Consultation</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  metaText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    marginTop: 10,
    color: Colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  windowHint: {
    marginTop: 8,
    color: Colors.error,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  joinBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  joinBtnDisabled: {
    opacity: 0.55,
  },
  joinBtnText: {
    color: Colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
});
