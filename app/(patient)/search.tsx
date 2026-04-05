import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Heart,
    Search,
    SlidersHorizontal,
    Star,
    X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
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
import ChipFilter from "../../components/ChipFilter";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import {
    getDoctors,
    getMyDoctorLikes,
    toggleDoctorLike,
} from "../../services/api";
import type { Doctor } from "../../types";

const SORT_OPTIONS = [
  "Relevance",
  "Rating",
  "Experience",
  "Fee: Low",
  "Fee: High",
];

const DEFAULT_SORT = "Relevance";

function DoctorRow({
  item,
  onPress,
  onBook,
  onFav,
  faved,
}: {
  item: Doctor;
  onPress: () => void;
  onBook: () => void;
  onFav: () => void;
  faved: boolean;
}) {
  const cardWidth =
    (Dimensions.get("window").width - Spacing.screenH * 2 - Spacing.sm) / 2;

  return (
    <TouchableOpacity
      style={[styles.docCard, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <Image source={{ uri: item.image }} style={styles.docCardImage} />

      <TouchableOpacity
        onPress={onFav}
        style={styles.favBtn}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Heart
          size={18}
          color={faved ? Colors.error : Colors.textDisabled}
          fill={faved ? Colors.error : "none"}
        />
      </TouchableOpacity>

      <View style={styles.docCardBody}>
        <Text style={styles.docName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.docSpec} numberOfLines={1}>
          {item.specialization}
        </Text>

        <View style={styles.docMeta}>
          <Star size={11} color={Colors.ratingGold} fill={Colors.ratingGold} />
          <Text style={styles.docRating}>
            {item.rating} ({item.reviews})
          </Text>
          {item.experience ? (
            <>
              <View style={styles.metaDot} />
              <Text style={styles.docExp} numberOfLines={1}>
                {item.experience}
              </Text>
            </>
          ) : null}
        </View>

        <Text style={styles.docFee}>
          ₹{item.fee}
          <Text style={styles.docFeeUnit}> / visit</Text>
        </Text>

        <TouchableOpacity
          style={styles.docBookBtn}
          onPress={onBook}
          activeOpacity={0.9}
        >
          <Text style={styles.docBookText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchDoctorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { specialty } = useLocalSearchParams<{ specialty?: string }>();

  const [query, setQuery] = useState("");
  const [activeSpec, setActiveSpec] = useState(specialty ?? "All");
  const [activeSort, setActiveSort] = useState(DEFAULT_SORT);
  const [showSort, setShowSort] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [likedDoctorIds, setLikedDoctorIds] = useState<string[]>([]);

  const isDefaultSort = activeSort === DEFAULT_SORT;

  useEffect(() => {
    const load = async () => {
      const response = await getDoctors();
      if (response.data) {
        const list = response.data as Doctor[];
        setDoctors(list);
        const likes = await getMyDoctorLikes(
          list.map((doctor) =>
            String((doctor as any).id || (doctor as any)._id),
          ),
        );
        if (Array.isArray(likes.data)) {
          setLikedDoctorIds(likes.data);
        }
      }
    };
    load();
  }, []);

  const specialtyFilters = useMemo(() => {
    const unique = [
      ...new Set(doctors.map((d) => d.specialization).filter(Boolean)),
    ];
    return ["All", ...unique];
  }, [doctors]);

  const filtered = useMemo(() => {
    let list = [...doctors];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q),
      );
    }
    if (activeSpec !== "All") {
      list = list.filter((d) => d.specialization === activeSpec);
    }
    switch (activeSort) {
      case "Rating":
        return list.sort((a, b) => b.rating - a.rating);
      case "Experience":
        return list.sort(
          (a, b) => parseInt(b.experience) - parseInt(a.experience),
        );
      case "Fee: Low":
        return list.sort((a, b) => a.fee - b.fee);
      case "Fee: High":
        return list.sort((a, b) => b.fee - a.fee);
      default:
        return list;
    }
  }, [query, activeSpec, activeSort, doctors]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      {/* Header */}
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
          <ArrowLeft color={Colors.textInverse} size={21} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Your Doctor</Text>
        <TouchableOpacity
          onPress={() => setShowSort(true)}
          style={[styles.sortBtn, !isDefaultSort && styles.sortBtnActive]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <SlidersHorizontal
            size={18}
            color={!isDefaultSort ? Colors.primary : Colors.textInverse}
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Search
          color={Colors.textTertiary}
          size={17}
          style={{ marginRight: Spacing.sm + 2 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors or specialties"
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          autoFocus={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <X color={Colors.textTertiary} size={17} />
          </TouchableOpacity>
        )}
      </View>

      {/* Specialty Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenH,
          paddingVertical: 8,
          alignItems: "center",
        }}
      >
        {specialtyFilters.map((spec) => (
          <ChipFilter
            key={spec}
            label={spec}
            active={activeSpec === spec}
            onPress={() => setActiveSpec(spec)}
          />
        ))}
      </ScrollView>

      {/* Result Count + Active Sort */}
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>
          {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found
        </Text>
        {!isDefaultSort && (
          <TouchableOpacity
            onPress={() => setActiveSort(DEFAULT_SORT)}
            style={styles.clearSort}
          >
            <Text style={styles.clearSortText}>Sort: {activeSort}</Text>
            <X size={11} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Doctor List */}
      <FlatList
        data={filtered}
        key={"grid"}
        numColumns={2}
        keyExtractor={(d) => String((d as any).id || (d as any)._id)}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Search size={32} color={Colors.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>No doctors found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search or filters
            </Text>
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setActiveSpec("All");
              }}
              style={styles.clearBtn}
            >
              <Text style={{ color: Colors.textInverse, fontWeight: "700" }}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <DoctorRow
            item={item}
            onPress={() =>
              router.push({
                pathname: "/(patient)/doctor/[id]",
                params: { id: (item as any).id || (item as any)._id },
              })
            }
            onBook={() =>
              router.push({
                pathname: "/(patient)/booking/[id]",
                params: { id: (item as any).id || (item as any)._id },
              })
            }
            onFav={async () => {
              const doctorId = String((item as any).id || (item as any)._id);
              const response = await toggleDoctorLike(doctorId);
              if (!response.data) return;
              setLikedDoctorIds((prev) => {
                const set = new Set(prev);
                if (response.data.liked) set.add(doctorId);
                else set.delete(doctorId);
                return Array.from(set);
              });
            }}
            faved={likedDoctorIds.includes(
              String((item as any).id || (item as any)._id),
            )}
          />
        )}
      />

      {/* Sort Modal */}
      <Modal
        visible={showSort}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSort(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSort(false)}
        >
          <View style={styles.sortModal}>
            <Text style={styles.sortTitle}>Sort By</Text>
            {SORT_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sortOption,
                  activeSort === s && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setActiveSort(s);
                  setShowSort(false);
                }}
              >
                <Text
                  style={[
                    styles.sortText,
                    activeSort === s && styles.sortTextActive,
                  ]}
                >
                  {s}
                </Text>
                {activeSort === s && <View style={styles.sortCheck} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenH,
    backgroundColor: Colors.primary,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginRight: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    ...Typography.subheading,
    color: Colors.textInverse,
    textAlign: "left",
  },
  sortBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  sortBtnActive: { backgroundColor: Colors.surface },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginHorizontal: Spacing.screenH,
    marginTop: Spacing.md,
    ...Shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  // Chips
  chipRow: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    flexGrow: 0,
  },

  // Results
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.sm,
  },
  resultCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  clearSort: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryUltraLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  clearSortText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Doctor Grid
  gridContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 40,
    paddingTop: 4,
  },
  gridRow: {
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  docCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadows.card,
  },
  docCardImage: { width: "100%", height: 120, resizeMode: "cover" },
  docCardBody: { padding: Spacing.sm + 4 },
  docName: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  docSpec: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 5,
  },
  docMeta: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  docRating: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.warningPressed,
    marginLeft: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 5,
  },
  docExp: { ...Typography.caption, color: Colors.textTertiary },
  docFee: { fontSize: 14, fontWeight: "900", color: Colors.text },
  docFeeUnit: { fontSize: 11, fontWeight: "400", color: Colors.textSecondary },
  docBookBtn: {
    marginTop: Spacing.sm + 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 9,
    alignItems: "center",
  },
  docBookText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textInverse,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  // Empty
  emptyState: { alignItems: "center", paddingTop: 56 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading,
    fontSize: 17,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    ...Typography.body2,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  clearBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 13,
    borderRadius: Radius.md,
    ...Shadows.button,
  },

  // Sort Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sortModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sortTitle: {
    ...Typography.subheading,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  sortOptionActive: { backgroundColor: Colors.primaryUltraLight },
  sortText: {
    ...Typography.body2,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  sortTextActive: { color: Colors.primary, fontWeight: "700" },
  sortCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
});
