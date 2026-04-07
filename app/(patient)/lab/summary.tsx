import { LinearGradient } from "expo-linear-gradient";
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
import { bookLab, getLabTestById } from "../../../services/api";
import { processEntityPayment } from "../../../services/payment";
const COLLECTION_HOME = "home" as const;
const COLLECTION_LAB = "lab" as const;

export default function LabBookingSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      params.collectionType === COLLECTION_HOME
        ? {
            flatHouse: params.addressFlatHouse || "",
            streetArea: params.addressStreetArea || "",
            landmark: params.addressLandmark || "",
            city: params.addressCity || "",
            pincode: params.addressPincode || "",
            contactNumber: params.addressContact || "",
          }
        : undefined;

    const runBooking = async () =>
      bookLab(String(test.id || test._id), bookingDate, {
        collectionType: params.collectionType,
        scheduledDate: params.date
          ? new Date(params.date).toISOString()
          : undefined,
        collectionTimeSlot: params.time,
        holdId: params.holdId,
        homeCollectionAddress: homeAddress,
      });

    let booking = await runBooking();
    const bookingError = String(booking.error || "");
    if (
      booking.status !== "success" &&
      (bookingError.toLowerCase().includes("network error") ||
        bookingError.toLowerCase().includes("request failed"))
    ) {
      // One quick retry for transient connectivity glitches.
      await new Promise((r) => setTimeout(r, 800));
      booking = await runBooking();
    }

    if (booking.status !== "success" || !booking.data) {
      setLoading(false);
      const msg = String(booking.error || "").toLowerCase();
      if (
        msg.includes("complete your profile") ||
        msg.includes("patient location")
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
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <ActionModal
        visible={errorModal}
        type="error"
        title="Booking Error"
        message={errorMessage}
        confirmLabel="OK"
        onConfirm={() => setErrorModal(false)}
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
          <Text style={styles.headerTitle}>Booking Summary</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 220 + insets.bottom },
        ]}
      >
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
                  {params.collectionType === COLLECTION_HOME
                    ? "Home Collection"
                    : "Visit Lab"}
                </Text>
              </View>
              {params.collectionType === COLLECTION_HOME ? (
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
              {params.collectionType === COLLECTION_LAB ? (
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
                  {params.collectionType === COLLECTION_LAB
                    ? Number(test.price || 0) + Number(params.deliveryCost || 0)
                    : test.price}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <BottomActionBar
        contentStyle={{ flexDirection: "row", alignItems: "center" }}
      >
        <View>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalPrice}>
            ₹
            {params.collectionType === COLLECTION_LAB
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
      </BottomActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20 },
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
    flex: 1,
    textAlign: "left",
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textInverse,
  },

  scroll: { padding: 20, gap: 16 },
  loadingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

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

  totalLabel: { fontSize: 12, color: Colors.textSecondary },
  totalPrice: { fontSize: 22, fontWeight: "800", color: Colors.primary },
});
