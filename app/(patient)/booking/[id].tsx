import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    MapPin,
    Upload,
    X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    getMyProfile,
    uploadFile,
} from "../../../services/api";
import { processEntityPayment } from "../../../services/payment";

const DATE_WINDOW_DAYS = 7;
const SLOT_COLUMNS = 3;
const SLOT_ROWS_PER_PAGE = 4;
const SLOTS_PER_PAGE = SLOT_COLUMNS * SLOT_ROWS_PER_PAGE;
const BOOKED_STATUS = "booked";

const DURATION_OPTIONS = ["1 day", "3 days", "1 week", "1 month"];
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"];
const COMMON_SYMPTOMS = [
  "Fever",
  "Cough",
  "Headache",
  "Chest Pain",
  "Cold",
  "Fatigue",
];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MEDICAL_HISTORY_OPTIONS = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "None",
];

function toISODateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseCommaSeparatedList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTimeToMinutes(time: string) {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const [clock, period] = time.trim().split(" ");
  if (!clock || !period) return Number.MAX_SAFE_INTEGER;
  const [rawHour, rawMin] = clock.split(":").map(Number);
  let hour = rawHour;
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + (rawMin || 0);
}

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
  const [uploadingReport, setUploadingReport] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState({
    disease: "",
    durationOfIssue: "",
    severityLevel: "",
    symptomsInput: "",
    symptomsSelected: [] as string[],
    currentMedicines: "",
    allergies: "",
    heightCm: "",
    weightKg: "",
    bloodGroup: "",
    medicalHistory: [] as string[],
    additionalNotes: "",
  });
  const [slotPage, setSlotPage] = useState(1);
  const [reportFiles, setReportFiles] = useState<
    { url: string; name?: string; mimeType?: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [doctorRes, slotsRes, profileRes] = await Promise.all([
        getDoctorById(id),
        getDoctorSlots(id),
        getMyProfile(),
      ]);
      if (doctorRes.data) setDoctor(doctorRes.data);
      if (slotsRes.data) {
        const activeSlots = slotsRes.data.filter(
          (s: any) => s.status === "available" || s.status === "booked",
        );
        setSlots(activeSlots);
      }

      if (profileRes.status === "success" && profileRes.data) {
        const profile = (profileRes.data as any).profile || {};
        setMedicalDetails((prev) => ({
          ...prev,
          bloodGroup: prev.bloodGroup || profile.bloodGroup || "",
          heightCm:
            prev.heightCm ||
            (profile.heightCm !== undefined && profile.heightCm !== null
              ? String(profile.heightCm)
              : ""),
          weightKg:
            prev.weightKg ||
            (profile.weightKg !== undefined && profile.weightKg !== null
              ? String(profile.weightKg)
              : ""),
          allergies:
            prev.allergies ||
            (Array.isArray(profile.allergies)
              ? profile.allergies.join(", ")
              : ""),
          medicalHistory:
            prev.medicalHistory.length > 0
              ? prev.medicalHistory
              : Array.isArray(profile.medicalConditions)
                ? profile.medicalConditions
                : [],
        }));
      }

      setSelectedDate(toISODateOnly(new Date()));
    };
    load();
  }, [id]);

  const dates = useMemo(() => {
    const now = new Date();
    return Array.from({ length: DATE_WINDOW_DAYS }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + index);
      const iso = toISODateOnly(date);
      const d = new Date(iso);
      return {
        id: String(index),
        iso,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toLocaleDateString("en-US", { day: "2-digit" }),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        year: d.toLocaleDateString("en-US", { year: "numeric" }),
      };
    });
  }, []);

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    slots.forEach((slot: any) => {
      const iso = String(slot.date).slice(0, 10);
      if (!grouped[iso]) grouped[iso] = [];
      grouped[iso].push(slot);
    });

    Object.keys(grouped).forEach((iso) => {
      grouped[iso] = grouped[iso].sort(
        (a, b) =>
          parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
      );
    });

    return grouped;
  }, [slots]);

  const dateSlots = useMemo(() => {
    if (!selectedDate) return [];
    return slotsByDate[selectedDate] || [];
  }, [slotsByDate, selectedDate]);

  const visibleSlots = useMemo(
    () => dateSlots.slice(0, slotPage * SLOTS_PER_PAGE),
    [dateSlots, slotPage],
  );

  const hasMoreSlots = visibleSlots.length < dateSlots.length;

  const selectedSymptoms = useMemo(
    () => Array.from(new Set(medicalDetails.symptomsSelected)),
    [medicalDetails.symptomsSelected],
  );

  const allSymptoms = useMemo(() => {
    const typedSymptoms = parseCommaSeparatedList(medicalDetails.symptomsInput);
    return Array.from(new Set([...selectedSymptoms, ...typedSymptoms]));
  }, [medicalDetails.symptomsInput, selectedSymptoms]);

  const requiredMedicalValid =
    !!medicalDetails.disease.trim() &&
    !!medicalDetails.durationOfIssue.trim() &&
    !!medicalDetails.severityLevel.trim() &&
    allSymptoms.length > 0 &&
    !!medicalDetails.heightCm.trim() &&
    !!medicalDetails.weightKg.trim() &&
    !!medicalDetails.bloodGroup.trim();

  const selectedSlotObj = dateSlots.find(
    (s: any) => String(s._id || s.id) === selectedSlot,
  );

  useEffect(() => {
    setSelectedSlot(null);
    setSlotPage(1);
  }, [selectedDate]);

  const handleBooking = async () => {
    if (!selectedSlot || !doctor) return;
    if (
      !medicalDetails.disease.trim() ||
      !medicalDetails.durationOfIssue.trim() ||
      !medicalDetails.severityLevel.trim() ||
      allSymptoms.length === 0 ||
      !medicalDetails.heightCm.trim() ||
      !medicalDetails.weightKg.trim() ||
      !medicalDetails.bloodGroup.trim()
    ) {
      setErrorMessage(
        "Please fill all required medical details before payment.",
      );
      setErrorModal(true);
      return;
    }

    setConfirmModal(false);
    setLoading(true);
    const res = await bookAppointment(
      String(doctor.id || doctor._id),
      String(selectedDate),
      selectedSlot,
      "video",
      {
        disease: medicalDetails.disease.trim(),
        durationOfIssue: medicalDetails.durationOfIssue.trim(),
        severityLevel: medicalDetails.severityLevel.trim(),
        symptoms: allSymptoms,
        currentMedicines: parseCommaSeparatedList(
          medicalDetails.currentMedicines,
        ),
        allergies: parseCommaSeparatedList(medicalDetails.allergies),
        heightCm: Number(medicalDetails.heightCm),
        weightKg: Number(medicalDetails.weightKg),
        bloodGroup: medicalDetails.bloodGroup.trim(),
        medicalHistory: medicalDetails.medicalHistory,
        additionalNotes: medicalDetails.additionalNotes.trim(),
        reportFiles,
      },
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

  const handleUploadReport = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (picked.canceled || !picked.assets?.length) return;
    setUploadingReport(true);
    try {
      const uploads = [] as { url: string; name?: string; mimeType?: string }[];
      for (const asset of picked.assets) {
        const result = await uploadFile(
          {
            uri: asset.uri,
            name: asset.name || `report-${Date.now()}`,
            type: asset.mimeType || "application/octet-stream",
          },
          "nividoc/reports",
        );
        if (result.status === "success" && result.data?.url) {
          uploads.push({
            url: String(result.data.url),
            name: asset.name,
            mimeType: asset.mimeType || undefined,
          });
        }
      }
      if (uploads.length) setReportFiles((prev) => [...prev, ...uploads]);
    } finally {
      setUploadingReport(false);
    }
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
                ]}
                onPress={() => setSelectedDate(item.iso)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDate === item.iso && styles.textActive,
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    selectedDate === item.iso && styles.textActive,
                  ]}
                >
                  {item.date}
                </Text>
                <Text
                  style={[
                    styles.dateMetaText,
                    selectedDate === item.iso && styles.textActive,
                  ]}
                >
                  {item.month}
                </Text>
                <Text
                  style={[
                    styles.dateMetaText,
                    selectedDate === item.iso && styles.textActive,
                  ]}
                >
                  {item.year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={[Typography.h3, { marginBottom: 16 }]}>Select Time</Text>
          {dateSlots.length === 0 ? (
            <View style={styles.noSlotsCard}>
              <Text style={styles.noSlotsText}>Slot is not open yet.</Text>
              <Text style={styles.noSlotsSubText}>
                This doctor has not created slots for this date.
              </Text>
            </View>
          ) : (
            <View style={styles.slotGrid}>
              {visibleSlots.map((slot: any) => {
                const slotId = String(slot._id || slot.id);
                const isBooked = slot.status === BOOKED_STATUS;
                const isSelected = selectedSlot === slotId;
                return (
                  <TouchableOpacity
                    key={slotId}
                    style={[
                      styles.slotBtn,
                      isSelected && styles.slotBtnActive,
                      isBooked && styles.slotBtnBooked,
                    ]}
                    onPress={() => !isBooked && setSelectedSlot(slotId)}
                    disabled={isBooked}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        isSelected && styles.slotTextActive,
                        isBooked && styles.slotTextBooked,
                      ]}
                    >
                      {slot.startTime}
                    </Text>
                    {isBooked && (
                      <Text style={styles.bookedByLabel}>
                        Booked by someone
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {hasMoreSlots && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() => setSlotPage((prev) => prev + 1)}
            >
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          )}
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

        <View style={styles.section}>
          <Text style={[Typography.h3, { marginBottom: 16 }]}>
            Medical Details
          </Text>
          <View style={styles.formCard}>
            <Text style={styles.groupHeading}>Health Issue</Text>
            <TextInput
              value={medicalDetails.disease}
              onChangeText={(value) =>
                setMedicalDetails((prev) => ({ ...prev, disease: value }))
              }
              placeholder="Chief Complaint (Disease / Illness) *"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Duration of Issue *</Text>
            <View style={styles.chipWrap}>
              {DURATION_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.chip,
                    medicalDetails.durationOfIssue === option &&
                      styles.chipActive,
                  ]}
                  onPress={() =>
                    setMedicalDetails((prev) => ({
                      ...prev,
                      durationOfIssue: option,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      medicalDetails.durationOfIssue === option &&
                        styles.chipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Severity Level *</Text>
            <View style={styles.chipWrap}>
              {SEVERITY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.chip,
                    medicalDetails.severityLevel === option &&
                      styles.chipActive,
                  ]}
                  onPress={() =>
                    setMedicalDetails((prev) => ({
                      ...prev,
                      severityLevel: option,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      medicalDetails.severityLevel === option &&
                        styles.chipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Symptoms *</Text>
            <View style={styles.chipWrap}>
              {COMMON_SYMPTOMS.map((symptom) => {
                const selected =
                  medicalDetails.symptomsSelected.includes(symptom);
                return (
                  <Pressable
                    key={symptom}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() =>
                      setMedicalDetails((prev) => ({
                        ...prev,
                        symptomsSelected: selected
                          ? prev.symptomsSelected.filter(
                              (item) => item !== symptom,
                            )
                          : [...prev.symptomsSelected, symptom],
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextActive,
                      ]}
                    >
                      {symptom}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={medicalDetails.symptomsInput}
              onChangeText={(value) =>
                setMedicalDetails((prev) => ({ ...prev, symptomsInput: value }))
              }
              placeholder="Other symptoms (comma separated)"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />

            <Text style={styles.groupHeading}>Medications & Allergies</Text>
            <TextInput
              value={medicalDetails.currentMedicines}
              onChangeText={(value) =>
                setMedicalDetails((prev) => ({
                  ...prev,
                  currentMedicines: value,
                }))
              }
              placeholder="Current medicines (comma separated)"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={medicalDetails.allergies}
              onChangeText={(value) =>
                setMedicalDetails((prev) => ({ ...prev, allergies: value }))
              }
              placeholder="Allergies (e.g. Penicillin, Dust, Food)"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />

            <Text style={styles.groupHeading}>Basic Info</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={medicalDetails.heightCm}
                onChangeText={(value) =>
                  setMedicalDetails((prev) => ({ ...prev, heightCm: value }))
                }
                placeholder="Height cm *"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
              />
              <TextInput
                value={medicalDetails.weightKg}
                onChangeText={(value) =>
                  setMedicalDetails((prev) => ({ ...prev, weightKg: value }))
                }
                placeholder="Weight kg *"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.fieldLabel}>Blood Group *</Text>
            <View style={styles.chipWrap}>
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <Pressable
                  key={group}
                  style={[
                    styles.chip,
                    medicalDetails.bloodGroup === group && styles.chipActive,
                  ]}
                  onPress={() =>
                    setMedicalDetails((prev) => ({
                      ...prev,
                      bloodGroup: group,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      medicalDetails.bloodGroup === group &&
                        styles.chipTextActive,
                    ]}
                  >
                    {group}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupHeading}>Medical History</Text>
            <View style={styles.chipWrap}>
              {MEDICAL_HISTORY_OPTIONS.map((option) => {
                const selected = medicalDetails.medicalHistory.includes(option);
                return (
                  <Pressable
                    key={option}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() =>
                      setMedicalDetails((prev) => {
                        if (option === "None") {
                          return {
                            ...prev,
                            medicalHistory: selected ? [] : ["None"],
                          };
                        }

                        const withoutNone = prev.medicalHistory.filter(
                          (item) => item !== "None",
                        );
                        return {
                          ...prev,
                          medicalHistory: selected
                            ? withoutNone.filter((item) => item !== option)
                            : [...withoutNone, option],
                        };
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.groupHeading}>Reports</Text>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handleUploadReport}
              disabled={uploadingReport}
            >
              <Upload color={Colors.primary} size={16} />
              <Text style={styles.uploadBtnText}>
                {uploadingReport
                  ? "Uploading..."
                  : "Upload Reports (PDF/Images)"}
              </Text>
            </TouchableOpacity>
            {!!reportFiles.length && (
              <View style={styles.reportList}>
                {reportFiles.map((file, index) => (
                  <View key={`${file.url}-${index}`} style={styles.reportItem}>
                    <FileText color={Colors.primary} size={14} />
                    <Text style={styles.reportName} numberOfLines={1}>
                      {file.name || `Report ${index + 1}`}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setReportFiles((prev) =>
                          prev.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                    >
                      <X color={Colors.textSecondary} size={14} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.groupHeading}>Notes</Text>
            <TextInput
              value={medicalDetails.additionalNotes}
              onChangeText={(value) =>
                setMedicalDetails((prev) => ({
                  ...prev,
                  additionalNotes: value,
                }))
              }
              placeholder="Anything else you want the doctor to know"
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, styles.notesInput]}
              multiline
            />

            <Text style={styles.helperText}>
              Required: chief complaint, duration, severity, symptoms, height,
              weight, and blood group.
            </Text>
          </View>
        </View>
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
          disabled={!selectedSlot || !requiredMedicalValid}
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
    width: 76,
    height: 118,
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
  dayText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  dateText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 26,
  },
  dateMetaText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
    fontWeight: "500",
  },
  textActive: { color: Colors.surface },

  noSlotsCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  noSlotsText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  noSlotsSubText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  slotGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  slotBtn: {
    width: "30%",
    margin: "1.5%",
    paddingVertical: 10,
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  slotBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotBtnBooked: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
  },
  slotText: { fontWeight: "600", color: Colors.text },
  slotTextActive: { color: Colors.surface },
  slotTextBooked: { color: Colors.textSecondary },
  bookedByLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
  },
  loadMoreText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  groupHeading: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: Colors.primary,
  },
  uploadBtn: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  uploadBtnText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  reportList: {
    marginTop: 8,
    gap: 6,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reportName: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  helperText: {
    marginTop: 10,
    fontSize: 11,
    color: Colors.textSecondary,
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
