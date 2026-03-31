import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CircleCheck,
  PackageCheck,
  Truck,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getOrders } from "../../services/api";

const STATUS_STEPS = ["placed", "confirmed", "packed", "shipped", "delivered"];

function getStatusIndex(status: string) {
  return Math.max(0, STATUS_STEPS.indexOf(String(status || "").toLowerCase()));
}

export default function MedicineOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getOrders();
      setOrders((response.data || []) as any[]);
      setLoading(false);
    };

    load();
  }, []);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !["delivered", "cancelled"].includes(
            String(order.status).toLowerCase(),
          ),
      ),
    [orders],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.helper}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          data={activeOrders.length ? activeOrders : orders}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => String(item._id || item.id)}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Text style={styles.helper}>No medicine orders found yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const step = getStatusIndex(item.status);
            const isCancelled =
              String(item.status).toLowerCase() === "cancelled";
            const prescriptionUrl =
              item.prescriptionUrl || item.prescription?.url;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>
                      Order #{String(item._id || item.id).slice(-8)}
                    </Text>
                    <Text style={styles.metaText}>
                      {new Date(item.createdAt || item.date).toLocaleString()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.badge, isCancelled && styles.badgeCancelled]}
                  >
                    {String(item.status).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.amount}>
                  Rs {Number(item.amount || 0).toFixed(2)}
                </Text>
                <Text style={styles.metaText} numberOfLines={2}>
                  Delivery:{" "}
                  {item.deliveryAddress ||
                    "Address will be confirmed by pharmacy"}
                </Text>

                <View style={styles.timelineRow}>
                  {STATUS_STEPS.map((status, index) => {
                    const done = index <= step;
                    return (
                      <View key={status} style={styles.stepWrap}>
                        <View style={[styles.dot, done && styles.dotDone]} />
                        <Text
                          style={[
                            styles.stepLabel,
                            done && styles.stepLabelDone,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.iconsRow}>
                  <PackageCheck size={15} color={Colors.primary} />
                  <Truck size={15} color={Colors.primary} />
                  <CircleCheck size={15} color={Colors.primary} />
                  <Text style={styles.metaText}>
                    Tracking ID: {item.trackingId || "Pending"}
                  </Text>
                </View>

                {prescriptionUrl ? (
                  <View style={styles.prescriptionWrap}>
                    <Text style={styles.prescriptionLabel}>
                      Prescription attached
                    </Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(String(prescriptionUrl))}
                    >
                      <Text style={styles.prescriptionLink}>
                        Open prescription
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
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
  listContent: { padding: 16, gap: 12, paddingBottom: 30 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { fontSize: 14, fontWeight: "800", color: Colors.text },
  amount: { fontSize: 18, fontWeight: "800", color: Colors.primary },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  badge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F766E",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeCancelled: {
    color: "#B91C1C",
    backgroundColor: "#FEE2E2",
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  stepWrap: { alignItems: "center", width: "20%" },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.border,
    marginBottom: 6,
  },
  dotDone: { backgroundColor: Colors.primary },
  stepLabel: { fontSize: 9, color: Colors.textSecondary },
  stepLabelDone: { color: Colors.text, fontWeight: "700" },
  iconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  prescriptionWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  prescriptionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  prescriptionLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
  },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  helper: { marginTop: 8, color: Colors.textSecondary },
});
