import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    ShieldCheck,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

export default function LabBookingSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    date: string;
    time: string;
    collectionType: "home" | "lab";
    holdId?: string;
    addressFlatHouse?: string;
    addressStreetArea?: string;
    addressLandmark?: string;
    addressCity?: string;
    addressPincode?: string;
    addressContact?: string;
    distanceKm?: string;
    deliveryCost?: string;
    labName?: string;
    labAddress?: string;
  }>();

  const [test, setTest] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "Unable to complete booking",
  );

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;
      const response = await getLabTestById(params.id);
      if (response.data) setTest(response.data);
    };
    load();
  }, [params.id]);

  const handlePayment = async () => {
    if (!test) return;

    setLoading(true);
    const bookingDate = new Date().toISOString();
    const homeAddress =
      params.collectionType === "home"
        ? {
            flatHouse: params.addressFlatHouse || "",
            streetArea: params.addressStreetArea || "",
            landmark: params.addressLandmark || "",
            city: params.addressCity || "",
            pincode: params.addressPincode || "",
            contactNumber: params.addressContact || "",
          }
        : undefined;

    const booking = await bookLab(String(test.id || test._id), bookingDate, {
      collectionType: params.collectionType,
      scheduledDate: params.date
        ? new Date(params.date).toISOString()
        : undefined,
      collectionTimeSlot: params.time,
      holdId: params.holdId,
      homeCollectionAddress: homeAddress,
    });

    if (booking.status !== "success" || !booking.data) {
      setLoading(false);
      if (
        (booking.error || "").toLowerCase().includes("complete your profile")
      ) {
        router.push("/(patient)/profile");
        return;
      }
      setErrorMessage(booking.error || "Unable to create lab booking");
      setErrorModal(true);
      return;
    }

    const bookingId = String(
      (booking.data as any)._id || (booking.data as any).id,
    );
    const bookingData = booking.data as any;
    const payment = await processEntityPayment("lab", bookingId);
    setLoading(false);

    if (payment.status === "success") {
      router.push({
        pathname: "/(patient)/lab/confirmation",
        params: {
          bookingId,
          testName: test.name,
          date: params.date || "",
          time: params.time || "",
          collectionType: params.collectionType,
          addressFlatHouse: params.addressFlatHouse || "",
          addressStreetArea: params.addressStreetArea || "",
          addressLandmark: params.addressLandmark || "",
          addressCity: params.addressCity || "",
          addressPincode: params.addressPincode || "",
          addressContact: params.addressContact || "",
          labName: params.labName || bookingData?.labName || "",
          labAddress: params.labAddress || "",
          distanceKm: String(
            bookingData?.distanceKm || params.distanceKm || "",
          ),
          deliveryCost: String(
            bookingData?.deliveryCost || params.deliveryCost || "",
          ),
        },
      });
      return;
    }

    router.push({
      pathname: "/(patient)/payment-result",
      params: {
        success: "false",
        amount: String(bookingData?.amount || test.price || 0),
        doctorName: test.name,
        context: "Lab Test",
        retryPath: `/(patient)/lab/${params.id}`,
        reason: payment.error || "Payment verification failed",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ActionModal
        visible={errorModal}
        type="error"
        title="Booking Error"
        message={errorMessage}
        confirmLabel="OK"
        onConfirm={() => setErrorModal(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!test ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Preparing your summary...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.testName}>{test.name}</Text>
              {test.reportTime || test.turnaround ? (
                <Text style={styles.subText}>
                  {test.reportTime || test.turnaround}
                </Text>
              ) : null}
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{test.price}</Text>
                {test.originalPrice ? (
                  <Text style={styles.originalPrice}>
                    ₹{test.originalPrice}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.infoCard}>
              {params.date ? (
                <View style={styles.infoRow}>
                  <Calendar size={16} color={Colors.primary} />
                  <Text style={styles.infoText}>{params.date}</Text>
                </View>
              ) : null}
              {params.time ? (
                <View style={styles.infoRow}>
                  <Clock size={16} color={Colors.primary} />
                  <Text style={styles.infoText}>{params.time}</Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <ShieldCheck size={16} color={Colors.primary} />
                <Text style={styles.infoText}>
                  {params.collectionType === "home"
                    ? "Home Collection"
                    : "Visit Lab"}
                </Text>
              </View>
              {params.collectionType === "home" ? (
                <View style={styles.infoRow}>
                  <MapPin size={16} color={Colors.primary} />
                  <Text style={styles.infoText}>
                    {[
                      params.addressFlatHouse,
                      params.addressStreetArea,
                      params.addressLandmark,
                      params.addressCity,
                      params.addressPincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <MapPin size={16} color={Colors.primary} />
                  <Text style={styles.infoText}>{params.labName}</Text>
                </View>
              )}
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Price Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Test Price</Text>
                <Text style={styles.breakdownValue}>₹{test.price}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>GST</Text>
                <Text style={styles.breakdownValue}>Included</Text>
              </View>
              {params.collectionType === "lab" ? (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Delivery Cost</Text>
                  <Text style={styles.breakdownValue}>
                    ₹{params.deliveryCost || 0}
                  </Text>
                </View>
              ) : null}
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Total</Text>
                <Text style={styles.breakdownValue}>
                  ₹
                  {params.collectionType === "lab"
                    ? Number(test.price || 0) + Number(params.deliveryCost || 0)
                    : test.price}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalPrice}>
            ₹
            {params.collectionType === "lab"
              ? Number(test?.price || 0) + Number(params.deliveryCost || 0)
              : test?.price || 0}
          </Text>
        </View>
        <ButtonPrimary
          title={loading ? "Processing..." : "Proceed to Payment"}
          onPress={handlePayment}
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
  loadingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  loadingText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
  },
  testName: { fontSize: 17, fontWeight: "800", color: Colors.text },
  subText: { marginTop: 4, fontSize: 12, color: Colors.textSecondary },
  priceRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: { fontSize: 20, fontWeight: "800", color: Colors.text },
  originalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  infoCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    gap: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontSize: 13, fontWeight: "600", color: Colors.text },
  breakdownCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
  },
  breakdownTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  breakdownRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownLabel: { fontSize: 12, color: Colors.textSecondary },
  breakdownValue: { fontSize: 12, fontWeight: "700", color: Colors.text },
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
