import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
import { getMedicineById } from "../../../services/api";
import { useCartStore } from "../../../store/cartStore";

export default function MedicineDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [med, setMed] = useState<any | null>(null);
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const response = await getMedicineById(id);
      if (response.data) setMed(response.data);
    };
    load();
  }, [id]);

  if (!med) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={Colors.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medicine Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: Colors.textSecondary }}>
            Loading medicine...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const medicineId = String(med.id || med._id);

  const handleAdd = () => {
    for (let i = 0; i < qty; i += 1) {
      addItem({
        id: medicineId,
        name: med.name,
        price: med.price,
        image: med.image || "",
        category: med.category,
        prescriptionRequired: med.prescriptionRequired,
        mrp: med.mrp,
        deliveryEtaHours: med.deliveryEtaHours,
      });
    }
    setAdded(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ActionModal
        visible={added}
        type="success"
        title="Added to Cart!"
        message={`${qty}x ${med.name} added successfully.`}
        confirmLabel="View Cart"
        cancelLabel="Continue Shopping"
        onConfirm={() => {
          setAdded(false);
          router.push("/(patient)/cart");
        }}
        onCancel={() => setAdded(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Product Image */}
        <View style={styles.imageBg}>
          <Image
            source={{ uri: med.image }}
            style={styles.medImage}
            resizeMode="contain"
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.medName}>{med.name}</Text>
            {med.inStock !== false ? (
              <View style={styles.inStockBadge}>
                <Text style={styles.inStockText}>In Stock</Text>
              </View>
            ) : (
              <View style={styles.outStockBadge}>
                <Text style={styles.outStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
          <Text style={styles.category}>
            {med.brand
              ? `${med.brand} · ${med.category ?? "General Medicine"}`
              : (med.category ?? "General Medicine")}
          </Text>

          {med.prescriptionRequired ? (
            <View style={styles.rxNotice}>
              <AlertTriangle size={14} color="#92400E" />
              <Text style={styles.rxNoticeText}>
                Prescription required at checkout
              </Text>
            </View>
          ) : null}

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                color="#F59E0B"
                fill={s <= 4 ? "#F59E0B" : "none"}
              />
            ))}
            <Text style={styles.ratingText}>4.2 (128 reviews)</Text>
          </View>

          <Text style={styles.price}>
            Rs {Number(med.price || 0).toFixed(2)}
          </Text>
          {med.mrp && Number(med.mrp) > Number(med.price) ? (
            <Text style={styles.mrp}>MRP Rs {Number(med.mrp).toFixed(2)}</Text>
          ) : null}
          <Text style={styles.perUnit}>
            {med.packSize || "Per unit"} · MRP inclusive of all taxes
          </Text>

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                style={styles.qBtn}
              >
                <Minus size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity
                onPress={() => setQty((q) => q + 1)}
                style={styles.qBtn}
              >
                <Plus size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Highlights */}
          <View style={styles.highlights}>
            <View style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <Truck size={16} color={Colors.primary} />
              </View>
              <Text style={styles.highlightText}>
                Estimated delivery in {med.deliveryEtaHours || 24} hours
              </Text>
            </View>
            <View style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <ShieldCheck size={16} color={Colors.primary} />
              </View>
              <Text style={styles.highlightText}>100% authentic medicines</Text>
            </View>
            <View style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <RefreshCcw size={16} color={Colors.primary} />
              </View>
              <Text style={styles.highlightText}>Easy 7-day returns</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>About this Medicine</Text>
            <Text style={styles.descText}>
              {med.description ||
                `${med.name} is commonly used for ${med.category?.toLowerCase() ?? "general care"}. Please use only under medical advice.`}
            </Text>

            <View style={styles.metaList}>
              {!!med.composition && (
                <Text style={styles.metaItem}>
                  Composition: {med.composition}
                </Text>
              )}
              {!!med.strength && (
                <Text style={styles.metaItem}>Strength: {med.strength}</Text>
              )}
              {!!med.dosageForm && (
                <Text style={styles.metaItem}>Form: {med.dosageForm}</Text>
              )}
              {!!med.manufacturer && (
                <Text style={styles.metaItem}>
                  Manufacturer: {med.manufacturer}
                </Text>
              )}
              {!!med.usageInstructions && (
                <Text style={styles.metaItem}>
                  Usage: {med.usageInstructions}
                </Text>
              )}
              {!!med.storageInstructions && (
                <Text style={styles.metaItem}>
                  Storage: {med.storageInstructions}
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
            Total
          </Text>
          <Text
            style={{ fontSize: 20, fontWeight: "800", color: Colors.primary }}
          >
            Rs {(Number(med.price || 0) * qty).toFixed(2)}
          </Text>
        </View>
        <ButtonPrimary
          title="Add to Cart"
          onPress={handleAdd}
          disabled={med.inStock === false}
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
  scroll: { paddingBottom: 120 },
  imageBg: {
    backgroundColor: Colors.surface,
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  medImage: { width: 180, height: 180 },
  infoCard: { padding: 20 },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  medName: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginRight: 10,
  },
  inStockBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inStockText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  outStockBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  outStockText: { fontSize: 11, fontWeight: "700", color: Colors.error },
  category: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 10,
  },
  rxNotice: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    marginBottom: 10,
  },
  rxNoticeText: {
    marginLeft: 6,
    fontSize: 11,
    color: "#92400E",
    fontWeight: "700",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  ratingText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 6 },
  price: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 4,
  },
  perUnit: { fontSize: 12, color: Colors.textSecondary, marginBottom: 20 },
  mrp: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  qtyLabel: { fontSize: 15, fontWeight: "600", color: Colors.text },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 24,
    padding: 4,
  },
  qBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    width: 36,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  highlights: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  highlightText: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  descSection: {},
  descTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  metaList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: { fontSize: 12, color: Colors.text, marginBottom: 6 },
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
});
