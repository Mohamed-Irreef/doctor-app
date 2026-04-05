import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Package, Search } from "lucide-react-native";
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import AnimatedCard from "../../components/AnimatedCard";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import { getApprovedPackages } from "../../services/api";

const SIDE_PADDING = 16;
const SECTION_SPACING = 14;
const TABS_BOTTOM_GAP = 22;
const GRID_COLUMN_GAP = 12;
const GRID_ROW_GAP = 14;
const CARD_MIN_HEIGHT = 292;

const CATEGORY_ALL = "All";

const categoryTabs = [
  { id: CATEGORY_ALL, label: "All" },
  { id: "General", label: "General" },
  { id: "Women", label: "Women" },
  { id: "Senior", label: "Senior" },
  { id: "Executive", label: "Executive" },
  { id: "Cardiac", label: "Cardiac" },
  { id: "Diabetes", label: "Diabetes" },
  { id: "Full Body", label: "Full Body" },
];

type PackageItem = {
  _id?: string;
  id?: string;
  name?: string;
  image?: string;
  testCount?: number;
  ageRange?: { min?: number; max?: number };
  shortDescription?: string;
  category?: string;
  price?: {
    offer?: number;
    original?: number;
    discount?: number;
  };
};

const PackageCard = memo(
  ({
    item,
    width,
    onPress,
  }: {
    item: PackageItem;
    width: number;
    onPress: (id: string) => void;
  }) => {
    const id = String(item._id || item.id || "");
    const offerPrice = Number(item.price?.offer || 0);
    const originalPrice = Number(item.price?.original || 0);
    const discount = Number(item.price?.discount || 0);

    return (
      <AnimatedCard
        style={[styles.card, { width }]}
        onPress={() => onPress(id)}
      >
        <View style={styles.imageWrap}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imageFallback} />
          )}
          {discount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{discount}% off</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name || "Health Package"}
          </Text>

          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.testCount || 0} tests • {item.ageRange?.min ?? "Any"}-
            {item.ageRange?.max ?? "100"} yrs
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.offerPrice}>₹{offerPrice}</Text>
            {originalPrice > offerPrice ? (
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => onPress(id)}
            activeOpacity={0.86}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>
    );
  },
);

PackageCard.displayName = "PackageCard";

function PackagesPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<PackageItem>>(null);

  const [allPackages, setAllPackages] = useState<PackageItem[]>([]);
  const [visiblePackages, setVisiblePackages] = useState<PackageItem[]>([]);
  const [activeTab, setActiveTab] = useState(CATEGORY_ALL);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardWidth = useMemo(
    () => (width - SIDE_PADDING * 2 - GRID_COLUMN_GAP) / 2,
    [width],
  );

  const runFilters = useCallback(
    (items: PackageItem[], tab: string, searchTerm: string) => {
      let next = items;

      if (tab !== CATEGORY_ALL) {
        next = next.filter((pkg) => pkg.category === tab);
      }

      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (normalizedSearch.length > 0) {
        next = next.filter((pkg) => {
          const name = (pkg.name || "").toLowerCase();
          const desc = (pkg.shortDescription || "").toLowerCase();
          return (
            name.includes(normalizedSearch) || desc.includes(normalizedSearch)
          );
        });
      }

      setVisiblePackages(next);
    },
    [],
  );

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getApprovedPackages({ limit: 100 });
      if (response.status === "success") {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.packages || [];
        setAllPackages(data);
        runFilters(data, activeTab, query);
      }
    } catch (error) {
      console.error("Failed to fetch packages", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, query, runFilters]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [activeTab, query, visiblePackages.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPackages();
    setRefreshing(false);
  }, [fetchPackages]);

  const onChangeTab = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      runFilters(allPackages, tab, query);
    },
    [allPackages, query, runFilters],
  );

  const onSearch = useCallback(
    (text: string) => {
      setQuery(text);
      runFilters(allPackages, activeTab, text);
    },
    [allPackages, activeTab, runFilters],
  );

  const openPackage = useCallback(
    (id: string) => {
      if (!id) return;
      router.push({ pathname: "/(patient)/packages/[id]", params: { id } });
    },
    [router],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />

      <View style={styles.screen}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryPressed]}
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backIconButton}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={20} color={Colors.textInverse} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Health Packages</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </LinearGradient>

        <View style={styles.searchSection}>
          <View style={styles.searchField}>
            <Search size={18} color={Colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={onSearch}
              placeholder="Search packages..."
              placeholderTextColor={Colors.textTertiary}
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.tabsSection}>
          <FlatList
            horizontal
            data={categoryTabs}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsListContent}
            ItemSeparatorComponent={() => <View style={styles.tabGap} />}
            renderItem={({ item }) => {
              const selected = item.id === activeTab;
              return (
                <TouchableOpacity
                  style={[styles.tabPill, selected && styles.tabPillActive]}
                  onPress={() => onChangeTab(item.id)}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[styles.tabLabel, selected && styles.tabLabelActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {loading ? (
          <FlatList
            data={Array.from({ length: 6 }, (_, idx) => `sk-${idx}`)}
            numColumns={2}
            keyExtractor={(item) => item}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.md) },
            ]}
            renderItem={({ index }) => (
              <View
                style={[
                  styles.skeletonCard,
                  { width: cardWidth },
                  index % 2 === 0 ? styles.leftCell : styles.rightCell,
                ]}
              />
            )}
          />
        ) : visiblePackages.length > 0 ? (
          <FlatList
            ref={listRef}
            data={visiblePackages}
            numColumns={2}
            keyExtractor={(item) => String(item._id || item.id)}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.md) },
            ]}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.cardCell,
                  { width: cardWidth },
                  index % 2 === 0 ? styles.leftCell : styles.rightCell,
                ]}
              >
                <PackageCard
                  item={item}
                  width={cardWidth}
                  onPress={openPackage}
                />
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconArea}>
              <Package size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No packages found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different tab or keyword.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingHorizontal: SIDE_PADDING,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h3,
    flex: 1,
    color: Colors.textInverse,
    textAlign: "left",
    marginLeft: 2,
  },
  headerRightPlaceholder: {
    width: 38,
  },

  searchSection: {
    paddingHorizontal: SIDE_PADDING,
    marginTop: SECTION_SPACING,
    marginBottom: SECTION_SPACING,
  },
  searchField: {
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body2,
    color: Colors.text,
  },

  tabsSection: {
    marginBottom: TABS_BOTTOM_GAP,
  },
  tabsListContent: {
    paddingHorizontal: SIDE_PADDING,
  },
  tabGap: {
    width: 8,
  },
  tabPill: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tabPillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    ...Typography.label,
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: Colors.textInverse,
  },

  gridContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 4,
    paddingBottom: Spacing.lg,
  },
  gridRow: {
    justifyContent: "flex-start",
  },
  cardCell: {
    marginBottom: GRID_ROW_GAP,
  },
  leftCell: {
    marginRight: GRID_COLUMN_GAP,
  },
  rightCell: {
    marginRight: 0,
  },

  card: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: "hidden",
    ...Shadows.card,
  },
  imageWrap: {
    width: "100%",
    height: 122,
    backgroundColor: Colors.border,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    backgroundColor: Colors.border,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.success,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: "800",
  },

  cardBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cardTitle: {
    ...Typography.subheading,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 42,
  },
  cardMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  offerPrice: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  originalPrice: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  bookButton: {
    marginTop: "auto",
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: "700",
  },

  skeletonCard: {
    height: CARD_MIN_HEIGHT,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: GRID_ROW_GAP,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIDE_PADDING,
  },
  emptyIconArea: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: 10,
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});

export default PackagesPage;
