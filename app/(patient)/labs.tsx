import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    Clock,
    FlaskConical,
    Home as HomeIcon,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
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
import { Colors } from "../../constants/Colors";
import { getApprovedPackages, getLabTests } from "../../services/api";

const CATEGORIES = [
  "All",
  "Blood Tests",
  "Hormones",
  "Diabetes",
  "Lipid",
  "Full Body",
  "Packages",
];
const ROW_BATCH_SIZE = 4;

export default function LabsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("All");
  const [labTests, setLabTests] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [visibleRows, setVisibleRows] = useState(ROW_BATCH_SIZE);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [packagesError, setPackagesError] = useState("");

  const isPackageMode = activeCategory === "Packages";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const response = await getLabTests();
      if (response.status === "error") {
        setError(response.error || "Unable to load lab tests");
      }
      if (response.data) setLabTests(response.data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredTests = useMemo(() => {
    if (isPackageMode) return [];
    if (activeCategory === "All") return labTests;
    return labTests.filter((item) =>
      String(item.category || "")
        .toLowerCase()
        .includes(activeCategory.toLowerCase()),
    );
  }, [labTests, activeCategory, isPackageMode]);

  const visibleTests = useMemo(
    () => filteredTests.slice(0, visibleRows),
    [filteredTests, visibleRows],
  );

  useEffect(() => {
    setVisibleRows(ROW_BATCH_SIZE);
  }, [activeCategory, labTests.length]);

  useEffect(() => {
    const loadPackages = async () => {
      if (!isPackageMode) return;
      if (packages.length > 0 || packagesLoading) return;

      setPackagesLoading(true);
      setPackagesError("");
      const response = await getApprovedPackages({});
      if (response.status === "error") {
        setPackagesError(response.error || "Unable to load packages");
      }
      if (response.data) {
        const list = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.packages || [];
        setPackages(list);
      }
      setPackagesLoading(false);
    };

    loadPackages();
  }, [isPackageMode, packages.length, packagesLoading]);

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
        <Text style={styles.headerTitle}>Lab Tests</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <FlatList
        key={isPackageMode ? "packages" : "tests"}
        data={isPackageMode ? packages : visibleTests}
        numColumns={isPackageMode ? 2 : 1}
        columnWrapperStyle={
          isPackageMode
            ? {
                gap: 12,
                paddingHorizontal: 16,
              }
            : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            {loading || packagesLoading ? (
              <>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.emptyText}>
                  {isPackageMode
                    ? "Loading packages..."
                    : "Loading lab tests..."}
                </Text>
              </>
            ) : (
              <Text style={styles.emptyText}>
                {isPackageMode
                  ? packagesError || "No packages found."
                  : error || "No lab tests found for the selected category."}
              </Text>
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <>
            {/* Hero Banner */}
            <View style={styles.heroBanner}>
              <View>
                <Text style={styles.heroTitle}>At-Home Lab Tests</Text>
                <Text style={styles.heroSub}>Safe · Fast · Affordable</Text>
                <View style={styles.heroTicks}>
                  {[
                    "NABL Accredited",
                    "Free Collection",
                    "Digital Reports",
                  ].map((t) => (
                    <View key={t} style={styles.heroTick}>
                      <Check size={10} color="#fff" />
                      <Text style={styles.heroTickText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <FlaskConical color="rgba(255,255,255,0.15)" size={80} />
            </View>

            {/* Categories */}
            <View style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    activeCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.catText,
                      activeCategory === cat && styles.catTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.resultCount}>
              {isPackageMode
                ? `${packages.length} package${packages.length !== 1 ? "s" : ""} available`
                : `${filteredTests.length} tests available`}
            </Text>
          </>
        )}
        ListFooterComponent={() =>
          !isPackageMode && visibleRows < filteredTests.length ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() => setVisibleRows((count) => count + ROW_BATCH_SIZE)}
              activeOpacity={0.85}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        keyExtractor={(t) => String((t as any).id || (t as any)._id)}
        renderItem={({ item }) => {
          if (isPackageMode) {
            const originalPrice = Number((item as any)?.price?.original || 0);
            const offerPrice = Number(
              (item as any)?.price?.offer || originalPrice || 0,
            );
            const discount = Number((item as any)?.price?.discount || 0);
            return (
              <View style={styles.packageCard}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(patient)/packages/[id]",
                      params: { id: (item as any).id || (item as any)._id },
                    })
                  }
                  activeOpacity={0.88}
                >
                  {(item as any).image ? (
                    <Image
                      source={{ uri: (item as any).image }}
                      style={styles.packageImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.packageImageFallback} />
                  )}
                  {discount > 0 ? (
                    <View style={styles.packageDiscountBadge}>
                      <Text style={styles.packageDiscountText}>
                        {discount}% OFF
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.packageBody}>
                    <Text style={styles.packageName} numberOfLines={2}>
                      {(item as any).name || "Package"}
                    </Text>
                    <Text style={styles.packageMeta}>
                      Includes {(item as any).testCount || 0} tests
                    </Text>
                    <View style={styles.packagePriceRow}>
                      <Text style={styles.packageOffer}>₹{offerPrice}</Text>
                      {offerPrice !== originalPrice ? (
                        <Text style={styles.packageStrike}>
                          ₹{originalPrice}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.packageBodyBottom}>
                  <TouchableOpacity
                    style={styles.packageBookBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/packages/checkout",
                        params: { id: (item as any).id || (item as any)._id },
                      })
                    }
                    activeOpacity={0.9}
                  >
                    <Text style={styles.packageBookText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          const originalPrice = Number(item.originalPrice || item.price || 0);
          const offerPrice = Number(item.price || 0);
          const disc =
            originalPrice > 0
              ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
              : 0;
          const savings = Math.max(0, originalPrice - offerPrice);
          const imageUrl =
            item.testImage || item.imageUrl || item.testImageUrl || item.image;
          return (
            <TouchableOpacity
              style={styles.testCard}
              onPress={() =>
                router.push({
                  pathname: "/(patient)/lab/[id]",
                  params: { id: item.id || item._id },
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.testLeft}>
                <View style={styles.testTopRow}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.testThumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.testThumbFallback}>
                      <FlaskConical color={Colors.primary} size={22} />
                    </View>
                  )}
                  <View style={styles.testBody}>
                    <Text style={styles.testName}>{item.name}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryText}>
                          {item.category || "General"}
                        </Text>
                      </View>
                      <View style={styles.dot} />
                      <Text style={styles.metaText}>
                        {item.sampleType || "Sample"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.testBottomInfo}>
                  {(item.reportTime || item.turnaround) && (
                    <View style={styles.timeRow}>
                      <Clock size={11} color={Colors.textSecondary} />
                      <Text style={styles.timeText}>
                        Results in {item.reportTime || item.turnaround}
                      </Text>
                    </View>
                  )}
                  <View style={styles.homeRow}>
                    <HomeIcon size={11} color={Colors.primary} />
                    <Text style={styles.homeText}>
                      {item.homeCollectionAvailable === false
                        ? "Center visit required"
                        : "Free home collection"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.testRightPanel}>
                {item.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                <Text style={styles.testPrice}>₹{offerPrice}</Text>
                {originalPrice > offerPrice ? (
                  <View style={styles.strikeWrap}>
                    <Text style={styles.testOriginal}>₹{originalPrice}</Text>
                    <View style={styles.offBadge}>
                      <Text style={styles.offText}>{disc}% OFF</Text>
                    </View>
                  </View>
                ) : null}
                {savings > 0 ? (
                  <Text style={styles.saveText}>Save ₹{savings}</Text>
                ) : null}
                <View style={styles.addBtn}>
                  <Text style={styles.addBtnText}>Add</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  listContent: { paddingBottom: 120 },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 12 },
  heroTicks: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  heroTick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  heroTickText: { fontSize: 10, color: "#fff", fontWeight: "600" },
  catRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  catTextActive: { color: Colors.surface },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  testCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DAE5F3",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  testLeft: {
    flex: 1,
    flexDirection: "column",
    marginRight: 10,
    gap: 8,
    alignItems: "flex-start",
  },
  testTopRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    width: "100%",
  },
  testBody: {
    flex: 1,
    justifyContent: "flex-start",
  },
  testBottomInfo: {
    width: "100%",
    paddingLeft: 2,
    marginTop: 7,
  },
  testThumbImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  testThumbFallback: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  testName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
  },
  categoryChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  metaText: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  timeText: { fontSize: 12, color: Colors.textSecondary },
  homeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  homeText: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
  testRightPanel: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
    alignItems: "center",
    width: 100,
    backgroundColor: "#F3F8FF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 7,
    borderWidth: 1,
    borderColor: "#D6E6FB",
  },
  popularBadge: {
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 3,
  },
  popularText: { fontSize: 8, fontWeight: "700", color: "#B45309" },
  testPrice: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 0,
  },
  strikeWrap: {
    alignItems: "center",
    marginTop: 1,
    marginBottom: 3,
  },
  testOriginal: {
    fontSize: 10,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  offBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 3,
  },
  offText: { fontSize: 8, fontWeight: "800", color: "#15803D" },
  saveText: {
    fontSize: 8,
    color: "#0F766E",
    fontWeight: "700",
    marginBottom: 5,
  },
  addBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  addBtnText: { color: Colors.surface, fontSize: 10, fontWeight: "800" },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  packageCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  packageImage: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.border,
  },
  packageImageFallback: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.border,
  },
  packageDiscountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  packageDiscountText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textInverse,
  },
  packageBody: { padding: 12 },
  packageBodyBottom: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  packageName: { fontSize: 13, fontWeight: "800", color: Colors.text },
  packageMeta: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 4,
  },
  packagePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  packageOffer: { fontSize: 14, fontWeight: "900", color: Colors.primary },
  packageStrike: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  packageBookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
  },
  packageBookText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: "800",
  },
});
