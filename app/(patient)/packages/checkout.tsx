import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
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
import ButtonPrimary from "../../../components/ButtonPrimary";
import { Colors } from "../../../constants/Colors";
import { Radius, Spacing } from "../../../constants/Spacing";
import { Typography } from "../../../constants/Typography";
import { createPackageBooking, getPackageById } from "../../../services/api";
import { processEntityPayment } from "../../../services/payment";

export default function PackageCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pkg, setPkg] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const res = await getPackageById(String(id));
        if (res.data) setPkg(res.data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const amount = useMemo(() => {
    const original = Number(pkg?.price?.original || 0);
    const offer = Number(pkg?.price?.offer || original);
    const final = Number(pkg?.price?.final || 0);
    return final > 0 ? final : offer;
  }, [pkg]);

  const handleConfirm = async () => {
    if (!id || !pkg) return;

    setSubmitting(true);

    const booking = await createPackageBooking(String(id));
    if (booking.status !== "success" || !booking.data) {
      setSubmitting(false);
      if (
        (booking.error || "").toLowerCase().includes("complete your profile")
      ) {
        router.push("/(patient)/profile");
        return;
      }
      router.push({
        pathname: "/(patient)/payment-result",
        params: {
          success: "false",
          amount: String(amount || 0),
          doctorName: pkg?.name || "Package",
          context: "Package Booking",
          retryPath: `/(patient)/packages/checkout?id=${String(id)}`,
          reason: booking.error || "Unable to create booking",
        },
      });
      return;
    }

    const bookingId = String(
      (booking.data as any)._id || (booking.data as any).id,
    );
    const bookingAmount = Number((booking.data as any)?.amount || amount || 0);

    const payment = await processEntityPayment("package", bookingId);
    setSubmitting(false);

    if (payment.status === "success") {
      router.push({
        pathname: "/(patient)/payment-result",
        params: {
          success: "true",
          amount: String(bookingAmount.toFixed(2)),
          doctorName: pkg?.name || "Package",
          context: "Package Booking",
        },
      });
      return;
    }

    router.push({
      pathname: "/(patient)/payment-result",
      params: {
        success: "false",
        amount: String(bookingAmount.toFixed(2)),
        doctorName: pkg?.name || "Package",
        context: "Package Booking",
        retryPath: `/(patient)/packages/checkout?id=${String(id)}`,
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
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading || !pkg ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Preparing your checkout...</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              {pkg.lab?.name ? (
                <Text style={styles.metaText}>{pkg.lab.name}</Text>
              ) : null}
              {pkg.lab?.address ? (
                <View style={styles.addressRow}>
                  <MapPin size={14} color={Colors.textTertiary} />
                  <Text style={styles.addressText}>{pkg.lab.address}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Amount payable</Text>
                <Text style={styles.rowValue}>₹{amount}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) },
        ]}
      >
        <ButtonPrimary
          title={submitting ? "Processing..." : `Confirm & Pay ₹${amount || 0}`}
          onPress={handleConfirm}
          disabled={submitting || loading || !pkg}
          style={{ paddingVertical: 16 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.screenH,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textInverse,
    flex: 1,
    textAlign: "left",
    marginLeft: 12,
  },
  scroll: {
    padding: Spacing.screenH,
    paddingBottom: 24,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: "center",
    gap: 10,
  },
  loadingText: { ...Typography.body2, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  packageName: { ...Typography.h2, color: Colors.text, marginBottom: 4 },
  metaText: { ...Typography.body2, color: Colors.textSecondary },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  addressText: { ...Typography.caption, color: Colors.textTertiary, flex: 1 },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { ...Typography.body2, color: Colors.textSecondary },
  rowValue: { ...Typography.h3, color: Colors.primary, fontWeight: "800" },
  bottomBar: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
