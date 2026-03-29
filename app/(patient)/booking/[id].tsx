import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionModal from "../../../components/ActionModal";
import ButtonPrimary from "../../../components/ButtonPrimary";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";
import {
    bookAppointment,
    getDoctorById,
    getDoctorSlots,
} from "../../../services/api";
import { processEntityPayment } from "../../../services/payment";

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doctor, setDoctor] = useState<any | null>(null);
  const [slots, setSlots] = useState<any[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Payment failed");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [doctorRes, slotsRes] = await Promise.all([
        getDoctorById(id),
        getDoctorSlots(id),
      ]);
      if (doctorRes.data) setDoctor(doctorRes.data);
      if (slotsRes.data) {
        const available = slotsRes.data.filter(
          (s: any) => s.status === "available",
        );
        setSlots(available);
        if (available.length) {
          const firstDate = String(available[0].date).slice(0, 10);
          setSelectedDate(firstDate);
        }
      }
    };
    load();
  }, [id]);

  const dates = useMemo(() => {
    const unique = Array.from(
      new Set(slots.map((s: any) => String(s.date).slice(0, 10))),
    );
    return unique.map((iso, index) => {
      const d = new Date(iso);
      return {
        id: String(index),
        iso,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toLocaleDateString("en-US", { day: "2-digit" }),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        available: true,
      };
    });
  }, [slots]);

  const dateSlots = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter(
      (s: any) => String(s.date).slice(0, 10) === selectedDate,
    );
  }, [slots, selectedDate]);

  const selectedSlotObj = dateSlots.find(
    (s: any) => String(s._id || s.id) === selectedSlot,
  );

  const handleBooking = async () => {
    if (!selectedSlot || !doctor) return;
    setConfirmModal(false);
    setLoading(true);
    const res = await bookAppointment(
      String(doctor.id || doctor._id),
      String(selectedDate),
      selectedSlot,
    );
    if (res.status !== "success" || !res.data) {
      setLoading(false);
      if ((res.error || "").toLowerCase().includes("complete your profile")) {
        router.push("/(patient)/profile");
        return;
      }
      setErrorMessage(res.error || "Unable to create appointment");
      setErrorModal(true);
      return;
    }

    const appointmentId = String((res.data as any)._id || (res.data as any).id);
    const payment = await processEntityPayment("appointment", appointmentId);
    setLoading(false);

    if (payment.status === "success") {
      setSuccessModal(true);
      return;
    }

    router.push({
      pathname: "/(patient)/payment-result",
      params: {
        success: "false",
        amount: String(doctor.fee || 0),
        doctorName: doctor.name,
        context: "Appointment",
        retryPath: `/(patient)/booking/${id}`,
        reason: payment.error || "Payment verification failed",
      },
    });
  };

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft color={Colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[Typography.h3, { flex: 1, textAlign: "center" }]}>
            Book Appointment
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: Colors.textSecondary }}>
            Loading doctor details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Confirmation Modal */}
      <ActionModal
        visible={confirmModal}
        type="confirm"
        title="Confirm Booking"
        message={`Book ${doctor.name} on ${selectedDate} at ${selectedSlotObj?.startTime || selectedSlot}?`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleBooking}
        onCancel={() => setConfirmModal(false)}
      />

      {/* Success Modal */}
      <ActionModal
        visible={successModal}
        type="success"
        title="Appointment Booked!"
        message={`Your appointment with ${doctor.name} has been confirmed. We'll send you a reminder.`}
        confirmLabel="View Appointments"
        onConfirm={() => {
          setSuccessModal(false);
          router.replace("/(patient)/appointments");
        }}
      />

      <ActionModal
        visible={errorModal}
        type="error"
        title="Booking Error"
        message={errorMessage}
        confirmLabel="OK"
        onConfirm={() => setErrorModal(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { flex: 1, textAlign: "center" }]}>
          Book Appointment
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Summary */}
        <View style={styles.doctorCard}>
          <View>
            <Text style={Typography.h3}>{doctor.name}</Text>
            <Text
              style={[
                Typography.body2,
                { color: Colors.primary, marginBottom: 8, fontWeight: "500" },
              ]}
            >
              {doctor.specialization}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MapPin color={Colors.textSecondary} size={14} />
              <Text
                style={{
                  marginLeft: 6,
                  color: Colors.textSecondary,
                  fontSize: 13,
                }}
              >
                {doctor.hospital || "Clinic"}
              </Text>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={[Typography.h3, { marginBottom: 16 }]}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dateCard,
                  selectedDate === item.iso && styles.dateCardActive,
                  !item.available && styles.dateCardDisabled,
                ]}
                onPress={() => item.available && setSelectedDate(item.iso)}
                disabled={!item.available}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDate === item.iso && styles.textActive,
                    !item.available && styles.textDisabled,
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    selectedDate === item.iso && styles.textActive,
                    !item.available && styles.textDisabled,
                  ]}
                >
                  {item.date}
                </Text>
                {!item.available && (
                  <Text style={styles.bookedLabel}>Full</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={[Typography.h3, { marginBottom: 16 }]}>Select Time</Text>
          <View style={styles.slotGrid}>
            {dateSlots.map((slot: any) => (
              <TouchableOpacity
                key={String(slot._id || slot.id)}
                style={[
                  styles.slotBtn,
                  selectedSlot === String(slot._id || slot.id) &&
                    styles.slotBtnActive,
                ]}
                onPress={() => setSelectedSlot(String(slot._id || slot.id))}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.slotText,
                    selectedSlot === String(slot._id || slot.id) &&
                      styles.slotTextActive,
                  ]}
                >
                  {slot.startTime}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Card */}
        {selectedSlot && (
          <View style={styles.summaryCard}>
            <Text style={[Typography.h3, { marginBottom: 16 }]}>
              Booking Summary
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Calendar color={Colors.primary} size={18} />
              </View>
              <View>
                <Text style={Typography.caption}>Date</Text>
                <Text style={[Typography.body1, { fontWeight: "600" }]}>
                  {selectedDate || "-"}
                </Text>
              </View>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <View style={styles.summaryIcon}>
                <Clock color={Colors.primary} size={18} />
              </View>
              <View>
                <Text style={Typography.caption}>Time</Text>
                <Text style={[Typography.body1, { fontWeight: "600" }]}>
                  {selectedSlotObj?.startTime || "-"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={Typography.body2}>Total</Text>
          <Text style={[Typography.h2, { color: Colors.primary }]}>
            ₹{doctor.fee || 0}
          </Text>
        </View>
        <ButtonPrimary
          title="Confirm Booking"
          onPress={() => setConfirmModal(true)}
          loading={loading}
          style={{ flex: 1, marginLeft: 24, paddingVertical: 18 }}
          disabled={!selectedSlot}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollContent: { padding: 20, paddingBottom: 120 },
  doctorCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
  },
  section: { marginBottom: 28 },
  dateCard: {
    width: 64,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 12,
  },
  dateCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateCardDisabled: { backgroundColor: Colors.lightGray },
  dayText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  dateText: { fontSize: 22, fontWeight: "700", color: Colors.text },
  bookedLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  textActive: { color: Colors.surface },
  textDisabled: { color: "#CBD5E1" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  slotBtn: {
    width: "30%",
    margin: "1.5%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  slotBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: { fontWeight: "600", color: Colors.text },
  slotTextActive: { color: Colors.surface },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
});
