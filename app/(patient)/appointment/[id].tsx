import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    MessageCircle,
    Phone,
    Star,
    Video,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Image,
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
import ActionModal from "../../../components/ActionModal";
import ButtonPrimary from "../../../components/ButtonPrimary";
import BottomActionBar from "../../../components/common/BottomActionBar";
import { Colors } from "../../../constants/Colors";
import {
    getPatientAppointments,
    updateAppointmentStatus,
} from "../../../services/api";

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appt, setAppt] = useState<any | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelledModal, setCancelledModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getPatientAppointments();
      if (!response.data) return;
      const selected =
        response.data.find((a: any) => String(a.id || a._id) === String(id)) ||
        response.data[0] ||
        null;
      setAppt(selected);
    };
    load();
  }, [id]);

  const status = useMemo(() => {
    if (!appt?.status) return "Pending";
    return (
      String(appt.status).charAt(0).toUpperCase() + String(appt.status).slice(1)
    );
  }, [appt?.status]);

  const type = useMemo(() => {
    if (!appt?.type) return "In-person";
    const t = String(appt.type).toLowerCase();
    if (t === "in-person") return "In-person";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }, [appt?.type]);

  const doctorId = appt?.doctor?.id || appt?.doctor?._id || appt?.doctor;

  if (!appt) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={Colors.textInverse} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: Colors.textSecondary }}>
            Appointment not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUpcoming =
    String(appt.status).toLowerCase() === "upcoming" ||
    String(appt.status).toLowerCase() === "pending";
  const isCompleted = String(appt.status).toLowerCase() === "completed";
  const isVideoType = String(type).toLowerCase() === "video";

  const typeColor =
    type === "Video" ? "#0EA5E9" : type === "Chat" ? "#7C3AED" : "#16A34A";
  const typeBg =
    type === "Video" ? "#E0F2FE" : type === "Chat" ? "#F3E8FF" : "#DCFCE7";

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      {/* Cancel Confirmation */}
      <ActionModal
        visible={cancelModal}
        type="confirm"
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment? Cancellations within 2 hours may not be refunded."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep It"
        onConfirm={async () => {
          setCancelModal(false);
          await updateAppointmentStatus(String(appt.id || appt._id), {
            status: "cancelled",
          });
          setAppt({ ...appt, status: "cancelled" });
          setCancelledModal(true);
        }}
        onCancel={() => setCancelModal(false)}
      />
      {/* Cancelled Success */}
      <ActionModal
        visible={cancelledModal}
        type="error"
        title="Appointment Cancelled"
        message="Your appointment has been cancelled. Refund will be processed in 5–7 business days."
        confirmLabel="Back to Appointments"
        onConfirm={() => {
          setCancelledModal(false);
          router.back();
        }}
      />

      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.textInverse} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 220 + insets.bottom },
        ]}
      >
        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isUpcoming
                ? "#EFF6FF"
                : isCompleted
                  ? "#F0FDF4"
                  : "#FFFBEB",
              borderColor: isUpcoming
                ? "#BFDBFE"
                : isCompleted
                  ? "#BBF7D0"
                  : "#FDE68A",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isUpcoming
                  ? Colors.primary
                  : isCompleted
                    ? "#16A34A"
                    : "#D97706",
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: isUpcoming
                  ? Colors.primary
                  : isCompleted
                    ? "#16A34A"
                    : "#D97706",
              },
            ]}
          >
            {status}
          </Text>
        </View>

        {/* Doctor Card */}
        <View style={styles.docCard}>
          <Image
            source={{ uri: appt.doctor?.image }}
            style={styles.docAvatar}
          />
          <View style={styles.docInfo}>
            <Text style={styles.docName}>{appt.doctor?.name}</Text>
            <Text style={styles.docSpec}>
              {appt.doctor?.specialization || "Doctor"}
            </Text>
            <View style={styles.ratingRow}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>
                {appt.doctor?.rating || 0} · {appt.doctor?.reviews || 0} reviews
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() =>
              router.push({
                pathname: "/(patient)/doctor/[id]",
                params: { id: doctorId },
              })
            }
          >
            <Text style={styles.profileBtnText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Appointment Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar color={Colors.primary} size={18} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{appt.date}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Clock color={Colors.primary} size={18} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{appt.time}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: typeBg }]}>
              {isVideoType ? (
                <Video color={typeColor} size={18} />
              ) : (
                <MapPin color={typeColor} size={18} />
              )}
            </View>
            <View>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={[styles.infoValue, { color: typeColor }]}>
                {type}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons for Upcoming */}
        {isUpcoming && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryAction}>
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>Call Clinic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <MessageCircle size={18} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>Directions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review prompt for Completed */}
        {isCompleted && (
          <TouchableOpacity
            style={styles.reviewPrompt}
            onPress={() =>
              router.push({
                pathname: "/(patient)/review",
                params: { doctorId, appointmentId: appt.id || appt._id },
              })
            }
            activeOpacity={0.85}
          >
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.reviewPromptTitle}>
                How was your experience?
              </Text>
              <Text style={styles.reviewPromptSub}>
                Rate & review your doctor
              </Text>
            </View>
            <ArrowLeft
              color={Colors.primary}
              size={18}
              style={{ transform: [{ rotateY: "180deg" }] }}
            />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <BottomActionBar contentStyle={{ flexDirection: "row" }}>
        {isUpcoming ? (
          <>
            <ButtonPrimary
              title="Join Consultation"
              onPress={() =>
                router.push({
                  pathname: "/(patient)/appointment/video/[id]",
                  params: { id: String(appt.id || appt._id) },
                })
              }
              style={{ flex: 1, marginRight: 10, paddingVertical: 18 }}
            />
            <ButtonPrimary
              title="Cancel"
              type="outline"
              onPress={() => setCancelModal(true)}
              style={{ paddingHorizontal: 20, paddingVertical: 18 }}
              textStyle={{ color: Colors.error }}
            />
          </>
        ) : isCompleted ? (
          <ButtonPrimary
            title="Book Again"
            onPress={() =>
              router.push({
                pathname: "/(patient)/booking/[id]",
                params: { id: doctorId },
              })
            }
            style={{ flex: 1, paddingVertical: 18 }}
          />
        ) : null}
      </BottomActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  scroll: { padding: 20, paddingBottom: 126 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { fontSize: 14, fontWeight: "700" },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  docAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  docInfo: { flex: 1 },
  docName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  docSpec: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 11, color: Colors.textSecondary },
  profileBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  profileBtnText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600", color: Colors.text },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  secondaryAction: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 6,
  },
  reviewPrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  reviewPromptTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  reviewPromptSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
