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
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getLabTests } from "../../services/api";

const CATEGORIES = [
  "All",
  "Blood Tests",
  "Hormones",
  "Diabetes",
  "Lipid",
  "Full Body",
];

export default function LabsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (activeCategory === "All") return labTests;
    return labTests.filter((item) =>
      String(item.category || "")
        .toLowerCase()
        .includes(activeCategory.toLowerCase()),
    );
  }, [labTests, activeCategory]);

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
        <Text style={styles.headerTitle}>Lab Tests</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredTests}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            {loading ? (
              <>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.emptyText}>Loading lab tests...</Text>
              </>
            ) : (
              <Text style={styles.emptyText}>
                {error || "No lab tests found for the selected category."}
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
              {filteredTests.length} tests available
            </Text>
          </>
        )}
        keyExtractor={(t) => String(t.id || t._id)}
        renderItem={({ item }) => {
          const originalPrice = Number(item.originalPrice || item.price || 0);
          const offerPrice = Number(item.price || 0);
          const disc =
            originalPrice > 0
              ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
              : 0;
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
                <View style={{ flex: 1 }}>
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
              <View style={styles.testRight}>
                {item.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                <Text style={styles.testPrice}>₹{offerPrice}</Text>
                {originalPrice > offerPrice ? (
                  <>
                    <Text style={styles.testOriginal}>₹{originalPrice}</Text>
                    <View style={styles.offBadge}>
                      <Text style={styles.offText}>{disc}% OFF</Text>
                    </View>
                  </>
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
  listContent: { paddingBottom: 40 },
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
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E6EDF7",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  testLeft: { flex: 1, flexDirection: "row", marginRight: 12, gap: 12 },
  testThumbImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.border,
  },
  testThumbFallback: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#E0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  testName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
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
    marginBottom: 4,
  },
  timeText: { fontSize: 11, color: Colors.textSecondary },
  homeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  homeText: { fontSize: 11, color: Colors.primary, fontWeight: "500" },
  testRight: { alignItems: "flex-end", minWidth: 86 },
  popularBadge: {
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  popularText: { fontSize: 9, fontWeight: "700", color: "#B45309" },
  testPrice: { fontSize: 19, fontWeight: "800", color: Colors.text },
  testOriginal: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  offBadge: {
    backgroundColor: "#E8F7EE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 10,
  },
  offText: { fontSize: 10, fontWeight: "700", color: "#15803D" },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  addBtnText: { color: Colors.surface, fontSize: 12, fontWeight: "700" },
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
});
