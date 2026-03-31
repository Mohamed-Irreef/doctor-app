import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    MessageSquare,
    Pill,
    Video,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ButtonPrimary from "../../../components/ButtonPrimary";
import { Colors } from "../../../constants/Colors";
import {
    getDoctorAppointments,
    submitAppointmentPrescription,
    uploadFile,
} from "../../../services/api";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Upcoming: { bg: "#DBEAFE", text: Colors.primary },
  Pending: { bg: "#FEF3C7", text: "#D97706" },
  Completed: { bg: "#DCFCE7", text: "#16A34A" },
};

export default function DoctorAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liveAppointment, setLiveAppointment] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const response = await getDoctorAppointments();
      if (response.status === "success" && Array.isArray(response.data)) {
        const appointment = response.data.find(
          (item: any) => String(item?._id) === String(id),
        );
        if (appointment) {
          setLiveAppointment(appointment);
          setNotes(
            String(
              appointment?.prescriptionDetails?.text ||
                appointment?.notes ||
                "",
            ),
          );
          setPdfUrl(String(appointment?.prescriptionDetails?.pdfUrl || ""));
        }
      }

      setLoading(false);
    };

    load();
  }, [id]);

  const patient = useMemo(() => {
    if (liveAppointment) {
      const appointmentType = String(liveAppointment?.type || "video");
      const prettyType =
        appointmentType === "in-person"
          ? "In-person"
          : `${appointmentType.charAt(0).toUpperCase()}${appointmentType.slice(1)}`;

      return {
        name: liveAppointment?.patient?.name || "Patient",
        age: liveAppointment?.patient?.age || "--",
        phone: liveAppointment?.patient?.phone || "-",
        type: `${prettyType} Consult`,
        date: liveAppointment?.date
          ? new Date(liveAppointment.date).toLocaleDateString()
          : "-",
        time: liveAppointment?.time || "-",
        status: `${String(liveAppointment?.status || "upcoming")
          .charAt(0)
          .toUpperCase()}${String(liveAppointment?.status || "upcoming").slice(1)}`,
        image:
          liveAppointment?.patient?.image ||
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80",
      };
    }

    return null;
  }, [id, liveAppointment]);

  const reports = useMemo(() => {
    const medicalFiles = liveAppointment?.medicalDetails?.reportFiles;
    if (!Array.isArray(medicalFiles) || !medicalFiles.length) {
      return [];
    }

    return medicalFiles.map((file: any, index: number) => ({
      id: String(index),
      name: String(file?.name || `Report ${index + 1}`),
      size: file?.mimeType || "Uploaded File",
      date: liveAppointment?.createdAt
        ? new Date(liveAppointment.createdAt).toLocaleDateString()
        : "-",
    }));
  }, [liveAppointment]);

  const badge = STATUS_CONFIG(patient?.status);

  function STATUS_CONFIG(status?: string) {
    return STATUS_COLORS[String(status || "").trim()] ?? STATUS_COLORS.Upcoming;
  }

  const uploadPrescriptionWithRetry = async (file: {
    uri: string;
    name: string;
    type: string;
  }) => {
    let lastError = "Unable to upload prescription PDF.";
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const uploaded = await uploadFile(file, "nividoc/prescriptions");
      if (uploaded.status === "success" && uploaded.data?.url) {
        return uploaded;
      }
      lastError = uploaded.error || lastError;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }

    return { status: "error" as const, error: lastError, data: null };
  };

  const pickPrescriptionPdf = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.length) return;

    const file = picked.assets[0];
    const uploaded = await uploadPrescriptionWithRetry({
      uri: file.uri,
      name: file.name || `prescription-${Date.now()}.pdf`,
      type: file.mimeType || "application/pdf",
    });

    if (uploaded.status !== "success" || !uploaded.data?.url) {
      Alert.alert(
        "Upload Failed",
        uploaded.error || "Unable to upload prescription PDF.",
      );
      return;
    }

    setPdfUrl(String(uploaded.data.url));
  };

  const handleSubmitPrescription = async () => {
    if (!id || !liveAppointment) {
      Alert.alert(
        "Demo Appointment",
        "Prescription submit is only available for real appointments.",
      );
      return;
    }

    if (!notes.trim()) {
      Alert.alert(
        "Missing Notes",
        "Please add prescription notes before submitting.",
      );
      return;
    }
    if (!pdfUrl.trim()) {
      Alert.alert(
        "Missing PDF",
        "Please upload a prescription PDF before submitting.",
      );
      return;
    }

    setSubmitting(true);
    const response = await submitAppointmentPrescription(String(id), {
      text: notes.trim(),
      pdfUrl: pdfUrl.trim(),
    });
    setSubmitting(false);

    if (response.status !== "success") {
      Alert.alert(
        "Submission Failed",
        response.error || "Unable to submit prescription.",
      );
      return;
    }

    Alert.alert(
      "Success",
      "Prescription submitted to patient and admin successfully.",
    );
    setLiveAppointment((prev: any) =>
      prev
        ? {
            ...prev,
            status: "completed",
            prescriptionDetails: {
              ...(prev.prescriptionDetails || {}),
              text: notes.trim(),
              pdfUrl: pdfUrl.trim(),
            },
          }
        : prev,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading appointment...</Text>
        </View>
      ) : !patient ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Appointment not found.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Patient Info Card */}
          <View style={styles.patientCard}>
            <Image source={{ uri: patient.image }} style={styles.avatar} />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientMeta}>Age: {patient.age}</Text>
              <Text style={styles.patientMeta}>{patient.phone}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusText, { color: badge.text }]}>
                {patient.status}
              </Text>
            </View>
          </View>

          {/* Appointment Meta */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Appointment Info</Text>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <View style={[styles.metaIcon, { backgroundColor: "#EFF6FF" }]}>
                  <Calendar size={18} color={Colors.primary} />
                </View>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{patient.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <View style={[styles.metaIcon, { backgroundColor: "#F0FDF4" }]}>
                  <Clock size={18} color="#16A34A" />
                </View>
                <Text style={styles.metaLabel}>Time</Text>
                <Text style={styles.metaValue}>{patient.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <View style={[styles.metaIcon, { backgroundColor: "#FDF4FF" }]}>
                  <Video size={18} color="#9333EA" />
                </View>
                <Text style={styles.metaLabel}>Type</Text>
                <Text style={styles.metaValue}>{patient.type}</Text>
              </View>
            </View>
          </View>

          {/* Uploaded Reports */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Uploaded Reports</Text>
            {reports.length === 0 ? (
              <Text style={styles.reportMeta}>No uploaded reports</Text>
            ) : (
              reports.map((report) => (
                <View key={report.id} style={styles.reportRow}>
                  <View style={styles.reportIcon}>
                    <FileText size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportName}>{report.name}</Text>
                    <Text style={styles.reportMeta}>
                      {report.size} · {report.date}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.viewBtn}>
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Doctor Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add consultation notes..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity
              style={styles.uploadPdfBtn}
              onPress={pickPrescriptionPdf}
            >
              <Text style={styles.uploadPdfText}>
                {pdfUrl ? "Change Prescription PDF" : "Upload Prescription PDF"}
              </Text>
            </TouchableOpacity>
            {!!pdfUrl && (
              <Text style={styles.pdfMetaText}>PDF ready for submission</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => router.push("/(doctor)/consultation")}
            >
              <MessageSquare color={Colors.primary} size={18} />
              <Text style={[styles.actionText, { color: Colors.primary }]}>
                Start Chat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => {
                if (!liveAppointment?._id) return;
                router.push({
                  pathname: "/(doctor)/appointment/video/[id]",
                  params: { id: String(liveAppointment._id) },
                });
              }}
            >
              <Video color="#9333EA" size={18} />
              <Text style={[styles.actionText, { color: "#9333EA" }]}>
                Video Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={handleSubmitPrescription}
            >
              <Pill color="#16A34A" size={18} />
              <Text style={[styles.actionText, { color: "#16A34A" }]}>
                Prescribe
              </Text>
            </TouchableOpacity>
          </View>

          <ButtonPrimary
            title={submitting ? "Submitting..." : "Submit Prescription"}
            onPress={handleSubmitPrescription}
            disabled={submitting}
            style={{ marginHorizontal: 20, marginBottom: 8 }}
          />
        </ScrollView>
      )}
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
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 13 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: Colors.lightGray,
  },
  patientInfo: { flex: 1 },
  patientName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  patientMeta: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "700" },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },
  metaGrid: { flexDirection: "row", justifyContent: "space-around" },
  metaItem: { alignItems: "center", gap: 6 },
  metaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: "500" },
  metaValue: { fontSize: 13, fontWeight: "700", color: Colors.text },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  reportName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  reportMeta: { fontSize: 11, color: Colors.textSecondary },
  viewBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewBtnText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadPdfBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
  },
  uploadPdfText: { color: Colors.primary, fontSize: 13, fontWeight: "700" },
  pdfMetaText: { marginTop: 8, color: Colors.textSecondary, fontSize: 12 },
  actionsSection: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
});
