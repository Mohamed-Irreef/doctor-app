import { useRouter } from "expo-router";
import {
    ChevronRight,
    Package,
    Search,
} from "lucide-react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedCard from "../../components/AnimatedCard";
import { ListSkeleton } from "../../components/SkeletonLoader";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import { getApprovedPackages } from "../../services/api";

const { width: W } = Dimensions.get("window");
const CARD_WIDTH = (W - Spacing.screenH * 2 - Spacing.md) / 2;

const categories = [
  { id: "All", label: "All" },
  { id: "General", label: "General" },
  { id: "Women", label: "Women" },
  { id: "Senior", label: "Senior" },
  { id: "Executive", label: "Executive" },
  { id: "Cardiac", label: "Cardiac" },
  { id: "Diabetes", label: "Diabetes" },
  { id: "Full Body", label: "Full Body" },
];

const PackageCard = memo(
  ({ item, onPress }: { item: any; onPress: (id: string) => void }) => (
    <AnimatedCard
      style={[styles.packageCard, { width: CARD_WIDTH }]}
      onPress={() => onPress(item._id)}
    >
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.packageImage}
          resizeMode="cover"
        />
      )}

      {item.price?.discount > 0 && (
        <View style={styles.offerBadge}>
          <Text style={styles.offerText}>{item.price.discount}% off</Text>
        </View>
      )}

      <View style={styles.packageInfo}>
        <Text style={styles.packageName} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.packageMeta}>
          {item.testCount} tests • {item.ageRange?.min || "Any"}-{item.ageRange?.max || "100"} yrs
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.offerPrice}>₹{item.price?.offer}</Text>
          {item.price?.original > item.price?.offer && (
            <Text style={styles.originalPrice}>₹{item.price?.original}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => onPress(item._id)}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </AnimatedCard>
  ),
);

PackageCard.displayName = "PackageCard";

function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchText, setSearchText] = useState("");

  const filterPackages = useCallback(
    (items: any[], category: string, search: string) => {
      let filtered: any[] = items;

      if (category !== "All") {
        filtered = filtered.filter((pkg) => pkg.category === category);
      }

      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (pkg) =>
            pkg.name.toLowerCase().includes(searchLower) ||
            pkg.shortDescription?.toLowerCase().includes(searchLower),
        );
      }

      setFilteredPackages(filtered);
    },
    [],
  );

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApprovedPackages({ limit: 100 });
      if (res.status === "success") {
        const data = Array.isArray(res.data) ? res.data : res.data?.packages || [];
        setPackages(data);
        filterPackages(data, selectedCategory, searchText);
      }
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchText, filterPackages]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPackages();
    setRefreshing(false);
  }, [loadPackages]);

  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      filterPackages(packages, category, searchText);
    },
    [packages, searchText, filterPackages],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      filterPackages(packages, selectedCategory, text);
    },
    [packages, selectedCategory, filterPackages],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Packages</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <ChevronRight size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search packages..."
            placeholderTextColor={Colors.textTertiary}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {/* Category Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          contentContainerStyle={styles.categoryList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryChange(item.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Packages Grid */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            <ListSkeleton count={4} type="doctor" />
          </View>
        ) : filteredPackages.length > 0 ? (
          <FlatList
            data={filteredPackages}
            numColumns={2}
            columnWrapperStyle={styles.gridWrapper}
            contentContainerStyle={styles.gridContent}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <PackageCard
                item={item}
                onPress={(id) =>
                  router.push({
                    pathname: "/(patient)/packages/[id]",
                    params: { id },
                  })
                }
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Package size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>No packages found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  title: {
    color: Colors.textInverse,
    fontSize: 24,
    fontWeight: "800",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.screenH,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...Typography.body2,
  },

  categoryList: { paddingHorizontal: Spacing.screenH, paddingVertical: Spacing.sm },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    marginRight: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    ...Typography.label,
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  categoryTextActive: { color: Colors.textInverse },

  gridWrapper: { gap: Spacing.md, paddingHorizontal: Spacing.screenH },
  gridContent: {
    paddingHorizontal: 0,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  packageCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadows.card,
  },
  packageImage: { width: "100%", height: 180, backgroundColor: Colors.border },
  offerBadge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    zIndex: 10,
  },
  offerText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: "800",
  },
  packageInfo: { padding: Spacing.md },
  packageName: {
    ...Typography.subheading,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  packageMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  offerPrice: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  originalPrice: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  bookBtnText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: "700",
  },

  skeletonContainer: { paddingHorizontal: Spacing.screenH, marginTop: Spacing.md },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenH,
  },
  emptyStateText: {
    ...Typography.subheading,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});

export default PackagesPage;
