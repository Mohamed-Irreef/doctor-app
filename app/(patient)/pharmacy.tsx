import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    ClipboardList,
    Search,
    ShoppingCart
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getMedicineCategories, getMedicines } from "../../services/api";
import { useCartStore } from "../../store/cartStore";

export default function PharmacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, addItem } = useCartStore();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [response, categoriesResponse] = await Promise.all([
        getMedicines(),
        getMedicineCategories(),
      ]);
      if (response.data) setMedicines(response.data);
      if (categoriesResponse.data?.length) {
        setCategories(categoriesResponse.data);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [categories, activeCategory]);

  const filtered = useMemo(
    () =>
      medicines.filter((m) => {
        const matchesQ = m.name.toLowerCase().includes(query.toLowerCase());
        const matchesCat =
          activeCategory === "All" || m.category === activeCategory;
        return matchesQ && matchesCat;
      }),
    [medicines, query, activeCategory],
  );

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.textInverse} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicines</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push("/(patient)/cart")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ShoppingCart color={Colors.textInverse} size={22} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push("/(patient)/medicine-orders")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ClipboardList color={Colors.textInverse} size={20} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading pharmacy catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          keyExtractor={(m) => String(m.id || m._id)}
          ListHeaderComponent={() => (
            <>
              {/* Promo Banner */}
              <View style={styles.promoBanner}>
                <Text style={styles.promoTitle}>Up to 30% Off Medicines</Text>
                <Text style={styles.promoSub}>
                  Free delivery on orders above Rs 499 · Use code MEDI30
                </Text>
              </View>

              {/* Search */}
              <View style={styles.searchRow}>
                <Search color={Colors.textSecondary} size={16} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search medicines..."
                  placeholderTextColor={Colors.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                />
              </View>

              {/* Categories */}
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catScroll}
                keyExtractor={(c) => c}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.catChip,
                      activeCategory === item && styles.catChipActive,
                    ]}
                    onPress={() => setActiveCategory(item)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.catText,
                        activeCategory === item && styles.catTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: Colors.textSecondary,
                }}
              >
                No medicines found
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.medCard}
              onPress={() =>
                router.push({
                  pathname: "/(patient)/medicine/[id]",
                  params: { id: item.id || item._id },
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.medImageWrap}>
                <Image source={{ uri: item.image }} style={styles.medImage} />
                <View style={styles.medBadgesRow}>
                  {item.inStock !== false ? (
                    <View style={styles.medStockBadge}>
                      <Text style={styles.medStockBadgeText}>In Stock</Text>
                    </View>
                  ) : (
                    <View style={styles.medOutBadge}>
                      <Text style={styles.medOutBadgeText}>Out of Stock</Text>
                    </View>
                  )}
                  {(Number(item.discountPercent || 0) > 0 ||
                    (Number(item.mrp || 0) > Number(item.price || 0) &&
                      Number(item.price || 0) > 0)) && (
                    <View style={styles.medDiscountBadge}>
                      <Text style={styles.medDiscountBadgeText}>
                        {Number(item.discountPercent || 0) > 0
                          ? `${Math.round(Number(item.discountPercent))}% OFF`
                          : `${Math.round(
                              ((Number(item.mrp || 0) -
                                Number(item.price || 0)) /
                                Number(item.mrp || 1)) *
                                100,
                            )}% OFF`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.medName} numberOfLines={2}>
                {item.name}
              </Text>

              {item.prescriptionRequired ? (
                <View style={styles.rxTag}>
                  <Text style={styles.rxText}>Rx Required</Text>
                </View>
              ) : null}

              {(item.strength || item.dosageForm) && (
                <Text style={styles.medMeta} numberOfLines={1}>
                  {[item.strength, item.dosageForm].filter(Boolean).join(" • ")}
                </Text>
              )}

              <View style={styles.medBottom}>
                <View style={styles.medPriceRow}>
                  <Text style={styles.medPrice}>
                    ₹{Number(item.price || 0).toFixed(2)}
                  </Text>
                  {item.mrp && Number(item.mrp) > Number(item.price) ? (
                    <Text style={styles.mrpText}>
                      ₹{Number(item.mrp).toFixed(2)}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    item.inStock === false && {
                      backgroundColor: Colors.border,
                    },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (item.inStock !== false) {
                      addItem({
                        id: item.id || item._id,
                        name: item.name,
                        price: item.price,
                        image: item.image || "",
                        category: item.category,
                        prescriptionRequired: item.prescriptionRequired,
                        mrp: item.mrp,
                        deliveryEtaHours: item.deliveryEtaHours,
                      });
                    }
                  }}
                  disabled={item.inStock === false}
                  activeOpacity={0.75}
                >
                  <Text style={styles.addBtnText}>
                    {item.inStock !== false ? "Add to Cart" : "Unavailable"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryUltraLight },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    textAlign: "left",
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  listContent: { padding: 16, paddingBottom: 40 },
  promoBanner: {
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  promoTitle: { fontSize: 15, fontWeight: "800", color: Colors.primary },
  promoSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, marginLeft: 8 },
  catScroll: { paddingBottom: 12 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.surface,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  catTextActive: { color: Colors.surface },
  medCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    minHeight: 235,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  medImageWrap: {
    position: "relative",
    marginBottom: 8,
  },
  medImage: {
    width: "100%",
    height: 88,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  medBadgesRow: {
    position: "absolute",
    left: 6,
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  medStockBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  medStockBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  medOutBadge: {
    backgroundColor: "#991B1B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  medOutBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  medDiscountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  medDiscountBadgeText: {
    fontSize: 9,
    color: Colors.surface,
    fontWeight: "800",
  },
  medName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 16,
  },
  rxTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    marginBottom: 4,
  },
  rxText: { fontSize: 10, fontWeight: "700", color: "#92400E" },
  medMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 14,
    fontWeight: "600",
  },
  medBottom: {
    marginTop: "auto",
    gap: 6,
  },
  medPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  medPrice: { fontSize: 14, fontWeight: "800", color: Colors.primary },
  mrpText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  addBtn: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  addBtnText: { color: Colors.surface, fontSize: 12, fontWeight: "700" },
  emptyState: { flex: 1, alignItems: "center", paddingTop: 60 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: Colors.textSecondary, fontSize: 13 },
});
