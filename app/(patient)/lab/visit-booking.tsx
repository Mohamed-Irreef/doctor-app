import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Navigation } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
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
import { Colors } from "../../../constants/Colors";
import { getLabTestById, getLabVisitQuote } from "../../../services/api";

export default function LabVisitBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [test, setTest] = useState<any | null>(null);
  const [quote, setQuote] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const response = await getLabTestById(id);
      if (response.data) setTest(response.data);
    };
    load();
  }, [id]);

  useEffect(() => {
    const loadQuote = async () => {
      if (!id) return;
      setLoading(true);
      const response = await getLabVisitQuote(id);
      if (response.status === "success") {
        setQuote(response.data);
      } else {
        // Fallback: allow lab visit flow even when patient location is missing.
        setQuote({
          distanceKm: 0,
          deliveryCost: 0,
          lab: {
            name: test?.lab?.name || "Lab",
            address: test?.lab?.address || "",
          },
        });
      }
      setLoading(false);
    };
    loadQuote();
  }, [id, test?.lab?.address, test?.lab?.name]);

  const handleContinue = () => {
    if (!id || !quote) return;
    router.push({
      pathname: "/(patient)/lab/summary",
      params: {
        id,
        collectionType: "lab",
        distanceKm: String(quote.distanceKm || 0),
        deliveryCost: String(quote.deliveryCost || 0),
        labName: quote.lab?.name || "",
        labAddress: quote.lab?.address || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ActionModal
        visible={errorModal}
        type="error"
        title="Pricing Error"
        message="Unable to continue"
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.textInverse} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Lab</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Lab Details</Text>
          </View>
          <Text style={styles.labName}>
            {quote?.lab?.name || test?.lab?.name}
          </Text>
          {quote?.lab?.address || test?.lab?.address ? (
            <Text style={styles.labAddress}>
              {quote?.lab?.address || test?.lab?.address}
            </Text>
          ) : null}
          {quote?.distanceKm ? (
            <View style={styles.badge}>
              <Navigation size={12} color={Colors.primary} />
              <Text style={styles.badgeText}>
                {quote.distanceKm} km from you
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Calculating distance...</Text>
            </View>
          ) : (
            <>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Test Price</Text>
                <Text style={styles.breakdownValue}>₹{test?.price || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Delivery Cost</Text>
                <Text style={styles.breakdownValue}>
                  ₹{quote?.deliveryCost || 0}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotal}>Total</Text>
                <Text style={styles.breakdownTotal}>
                  ₹{(test?.price || 0) + (quote?.deliveryCost || 0)}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <ButtonPrimary
          title="Continue"
          onPress={handleContinue}
          style={{ flex: 1, paddingVertical: 16 }}
          disabled={!quote || loading}
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
    backgroundColor: Colors.primary,
  },
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
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  scroll: { padding: 20, paddingBottom: 120, gap: 16 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  labName: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 12,
  },
  labAddress: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: { fontSize: 12, color: Colors.textSecondary },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  breakdownLabel: { fontSize: 13, color: Colors.textSecondary },
  breakdownValue: { fontSize: 13, fontWeight: "700", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: 12 },
  breakdownTotal: { fontSize: 15, fontWeight: "800", color: Colors.text },
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
  },
});
