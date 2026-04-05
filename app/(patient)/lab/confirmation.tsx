import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, Download, Home, MapPin } from "lucide-react-native";
import React from "react";
import {
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
import ButtonPrimary from "../../../components/ButtonPrimary";
import { Colors } from "../../../constants/Colors";

const COLLECTION_HOME = "home" as const;
const COLLECTION_LAB = "lab" as const;

export default function LabBookingConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bookingId?: string;
    testName?: string;
    date?: string;
    time?: string;
    collectionType?: "home" | "lab";
    addressFlatHouse?: string;
    addressStreetArea?: string;
    addressLandmark?: string;
    addressCity?: string;
    addressPincode?: string;
    addressContact?: string;
    labName?: string;
    labAddress?: string;
    distanceKm?: string;
    deliveryCost?: string;
  }>();

  const statusLabel =
    params.collectionType === COLLECTION_LAB
      ? "Awaiting Visit"
      : "Collection Pending";

  const addressText = [
    params.addressFlatHouse,
    params.addressStreetArea,
    params.addressLandmark,
    params.addressCity,
    params.addressPincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.card}>
        <CheckCircle2 size={56} color={Colors.successPressed} />
        <Text style={styles.title}>Booking Confirmed</Text>
        <Text style={styles.subtitle}>{statusLabel}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Booking ID</Text>
          <Text style={styles.infoValue}>{params.bookingId || "-"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Test</Text>
          <Text style={styles.detailValue}>{params.testName}</Text>
        </View>
        {params.date || params.time ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {params.date} {params.time ? `• ${params.time}` : ""}
            </Text>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Collection</Text>
          <View style={styles.detailInline}>
            {params.collectionType === COLLECTION_HOME ? (
              <Home size={14} color={Colors.primary} />
            ) : (
              <MapPin size={14} color={Colors.primary} />
            )}
            <Text style={styles.detailValue}>
              {params.collectionType === COLLECTION_HOME
                ? addressText
                : params.labName}
            </Text>
          </View>
        </View>
        {params.collectionType === COLLECTION_LAB && params.labAddress ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lab Address</Text>
            <Text style={styles.detailValue}>{params.labAddress}</Text>
          </View>
        ) : null}
        {params.collectionType === COLLECTION_LAB && params.distanceKm ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{params.distanceKm} km</Text>
          </View>
        ) : null}
        {params.collectionType === COLLECTION_LAB && params.deliveryCost ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Cost</Text>
            <Text style={styles.detailValue}>₹{params.deliveryCost}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.invoiceBtn} activeOpacity={0.8}>
          <Download size={16} color={Colors.primary} />
          <Text style={styles.invoiceText}>Download Invoice</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: 16 + Math.max(insets.bottom, 8) },
        ]}
      >
        <ButtonPrimary
          title="Go to Bookings"
          onPress={() => router.push("/(patient)/bookings")}
          style={{ flex: 1, paddingVertical: 18 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  infoCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  infoLabel: { fontSize: 11, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: "700", color: Colors.text },
  detailRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  detailLabel: { fontSize: 12, color: Colors.textSecondary },
  detailValue: { fontSize: 12, fontWeight: "600", color: Colors.text },
  detailInline: { flexDirection: "row", alignItems: "center", gap: 6 },
  invoiceBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primaryLight,
  },
  invoiceText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  bottomBar: {
    marginTop: "auto",
    padding: 20,
  },
});
