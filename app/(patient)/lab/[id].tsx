import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    Clock,
    FlaskConical,
    Home,
    ShieldCheck,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Image,
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
import { bookLab, getLabTestById } from "../../../services/api";
import { processEntityPayment } from "../../../services/payment";

const TEST_INFO: Record<
  string,
  { overview: string; prepSteps: string[]; includes: string[] }
> = {
  l1: {
    overview:
      "A Complete Blood Count (CBC) measures the cells that make up your blood — red cells, white cells, and platelets. It is one of the most commonly ordered tests and helps detect infections, anemia, and other disorders.",
    prepSteps: [
      "Fast for 8–12 hours before the test",
      "Drink water — stay hydrated",
      "Avoid heavy exercise 24 hours prior",
      "Inform your doctor of any medications",
    ],
    includes: [
      "Hemoglobin (Hb)",
      "Hematocrit (HCT)",
      "White Blood Cell (WBC) Count",
      "Platelet Count",
      "Red Blood Cell (RBC) Count",
      "Mean Corpuscular Volume (MCV)",
    ],
  },
  l5: {
    overview:
      "The Full Body Checkup is a comprehensive preventive health screening that covers 80+ parameters across vital organs. Designed for adults 25+ for proactive health management.",
    prepSteps: [
      "12-hour fasting required",
      "Drink water normally",
      "Avoid alcohol 48 hours before",
      "Come with a valid ID for home collection",
    ],
    includes: [
      "Liver Function Test",
      "Kidney Function Test",
      "Thyroid Profile",
      "Lipid Profile",
      "Blood Sugar (Fasting)",
      "Complete Blood Count",
      "Urine Analysis",
      "Vitamin D & B12",
    ],
  },
};

const getInfo = (id: string) => TEST_INFO[id] ?? TEST_INFO.l1;

export default function LabTestDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [test, setTest] = useState<any | null>(null);
  const discount = useMemo(() => {
    if (!test) return 0;
    return Math.round(
      ((test.originalPrice - test.price) / test.originalPrice) * 100,
    );
  }, [test]);
  const info = getInfo(String(test?.id || test?._id || "l1"));
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Unable to complete booking");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const response = await getLabTestById(id);
      if (response.data) setTest(response.data);
    };
    load();
  }, [id]);

  const handleBook = async () => {
    setLoading(true);
    if (!test) {
      setLoading(false);
      return;
    }

    const booking = await bookLab(String(test.id || test._id), new Date().toISOString());
    if (booking.status !== "success" || !booking.data) {
      setLoading(false);
      if (
        (booking.error || "")
          .toLowerCase()
          .includes("complete your profile")
      ) {
        router.push("/(patient)/profile");
        return;
      }
      setErrorMessage(booking.error || "Unable to create lab booking");
      setErrorModal(true);
      return;
    }

    const bookingId = String((booking.data as any)._id || (booking.data as any).id);
    const payment = await processEntityPayment("lab", bookingId);
    setLoading(false);

    if (payment.status === "success") {
      setBooked(true);
      return;
    }

    router.push({
      pathname: "/(patient)/payment-result",
      params: {
        success: "false",
        amount: String(test.price || 0),
        doctorName: test.name,
        context: "Lab Test",
        retryPath: `/(patient)/lab/${id}`,
        reason: payment.error || "Payment verification failed",
      },
    });
  };

  if (!test) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ActionModal
        visible={booked}
        type="success"
        title="Test Booked!"
        message="A phlebotomist will visit your home within the scheduled window. Results will be shared digitally."
        confirmLabel="Go to Records"
        onConfirm={() => {
          setBooked(false);
          router.push("/(patient)/records");
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          {test.image ? (
            <Image source={{ uri: test.image }} style={styles.testImage} />
          ) : (
            <View style={styles.testIconBg}>
              <FlaskConical color={Colors.primary} size={40} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.testName}>{test.name}</Text>
            {test.turnaround && (
              <View style={styles.turnaroundRow}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.turnaroundText}>
                  Results in {test.turnaround}
                </Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{test.price}</Text>
              <Text style={styles.originalPrice}>₹{test.originalPrice}</Text>
              <View style={styles.discBadge}>
                <Text style={styles.discText}>{discount}% OFF</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Home Collection Banner */}
        <View style={styles.collectionBanner}>
          <Home color={Colors.primary} size={20} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.collectionTitle}>
              Free Home Sample Collection
            </Text>
            <Text style={styles.collectionSub}>
              Available 7 AM – 9 PM on all days
            </Text>
          </View>
          <ShieldCheck color="#16A34A" size={20} />
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overviewText}>{info.overview}</Text>
        </View>

        {/* Preparation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Preparation</Text>
          {info.prepSteps.map((step, i) => (
            <View key={i} style={styles.prepRow}>
              <View style={styles.prepIcon}>
                <Text style={styles.prepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.prepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Parameters */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>
            Parameters Included ({info.includes.length})
          </Text>
          <View style={styles.paramsGrid}>
            {info.includes.map((param, i) => (
              <View key={i} style={styles.paramChip}>
                <Check size={12} color={Colors.primary} />
                <Text style={styles.paramText}>{param}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalPrice}>₹{test.price}</Text>
        </View>
        <ButtonPrimary
          title={loading ? "Booking…" : "Book Home Collection"}
          onPress={handleBook}
          loading={loading}
          style={{ flex: 1, marginLeft: 20, paddingVertical: 18 }}
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
  scroll: { padding: 20, paddingBottom: 120 },
  heroCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  testIconBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  testImage: { width: 72, height: 72, borderRadius: 16, marginRight: 16 },
  testName: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 6,
  },
  turnaroundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  turnaroundText: { fontSize: 12, color: Colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  price: { fontSize: 22, fontWeight: "800", color: Colors.text },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  discBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discText: { fontSize: 10, fontWeight: "700", color: "#16A34A" },
  collectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 24,
  },
  collectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  collectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  overviewText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  prepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  prepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  prepNum: { fontSize: 12, fontWeight: "700", color: Colors.surface },
  prepText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },
  paramsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  paramChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  paramText: { fontSize: 12, fontWeight: "500", color: Colors.text },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
  },
  totalLabel: { fontSize: 12, color: Colors.textSecondary },
  totalPrice: { fontSize: 22, fontWeight: "800", color: Colors.primary },
});
