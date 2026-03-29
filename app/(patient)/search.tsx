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
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { getDoctors } from "../../services/api";
import { useFavoritesStore } from "../../store/favoritesStore";
import type { Doctor } from "../../types";

const SORT_OPTIONS = [
  "Relevance",
  "Rating",
  "Experience",
  "Fee: Low",
  "Fee: High",
];

function DoctorRow({
  item,
  onPress,
  onFav,
  faved,
}: {
  item: Doctor;
  onPress: () => void;
  onFav: () => void;
  faved: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.docRow}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.docImage} />
      <View style={styles.docInfo}>
        <Text style={styles.docName}>{item.name}</Text>
        <Text style={styles.docSpec}>{item.specialization}</Text>
        <View style={styles.docMeta}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.docRating}>
            {item.rating} ({item.reviews})
          </Text>
          <View style={styles.dot} />
          <Text style={styles.docExp}>{item.experience}</Text>
        </View>
        <Text style={styles.docHospital} numberOfLines={1}>
          {item.hospital ?? "Multi-specialty Hospital"}
        </Text>
        <View style={styles.docFooter}>
          <Text style={styles.docFee}>
            ₹{item.fee}{" "}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "400",
                color: Colors.textSecondary,
              }}
            >
              / visit
            </Text>
          </Text>
          <View style={styles.availBadge}>
            <View style={styles.availDot} />
            <Text style={styles.availText}>Available Today</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={onFav}
        style={styles.favBtn}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Heart
          size={18}
          color={faved ? Colors.error : Colors.textSecondary}
          fill={faved ? Colors.error : "none"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SearchDoctorScreen() {
  const router = useRouter();
  const { specialty } = useLocalSearchParams<{ specialty?: string }>();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const [query, setQuery] = useState("");
  const [activeSpec, setActiveSpec] = useState(specialty ?? "All");
  const [activeSort, setActiveSort] = useState("Relevance");
  const [showSort, setShowSort] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await getDoctors();
      if (response.data) {
        setDoctors(response.data as Doctor[]);
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Your Doctor</Text>
        <TouchableOpacity
          onPress={() => setShowSort((s) => !s)}
          style={styles.sortBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <SlidersHorizontal size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View style={styles.sortPanel}>
          <Text
            style={[Typography.body2, { fontWeight: "700", marginBottom: 10 }]}
          >
            Sort By
          </Text>
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
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Search
          color={Colors.textSecondary}
          size={18}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or specialty..."
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <X color={Colors.textSecondary} size={18} />
          </TouchableOpacity>
        )}
      </View>

      {/* Specialty Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {specialtyFilters.map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[styles.chip, activeSpec === spec && styles.chipActive]}
            onPress={() => setActiveSpec(spec)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                activeSpec === spec && styles.chipTextActive,
              ]}
            >
              {spec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result Count */}
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>
          {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found
        </Text>
        {activeSort !== "Relevance" && (
          <TouchableOpacity
            onPress={() => setActiveSort("Relevance")}
            style={styles.clearSort}
          >
            <Text style={styles.clearSortText}>Sort: {activeSort} ×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Doctor List */}
      <FlatList
        data={filtered}
        keyExtractor={(d) => String((d as any).id || (d as any)._id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
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
              <Text style={{ color: Colors.surface, fontWeight: "700" }}>
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
            onFav={() => toggleFavorite(item)}
            faved={isFavorite((item as any).id || (item as any)._id)}
          />
        )}
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
  sortBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sortPanel: {
    position: "absolute",
    top: 64,
    right: 16,
    zIndex: 99,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  sortOptionActive: { backgroundColor: "#EFF6FF" },
  sortText: { fontSize: 14, color: Colors.textSecondary, fontWeight: "500" },
  sortTextActive: { color: Colors.primary, fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, height: 24 },
  chipRow: { marginTop: 12, marginBottom: 12, flexGrow: 0, maxHeight: 44 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    height: 36,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  chipTextActive: { color: Colors.surface },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  clearSort: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  clearSortText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  docRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  docImage: { width: 110, height: 130, resizeMode: "cover" },
  docInfo: { flex: 1, padding: 12 },
  docName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  docSpec: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 6,
  },
  docMeta: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  docRating: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  docExp: { fontSize: 12, color: Colors.textSecondary },
  docHospital: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  docFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  docFee: { fontSize: 15, fontWeight: "800", color: Colors.text },
  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 4,
  },
  availText: { fontSize: 10, fontWeight: "600", color: "#16A34A" },
  favBtn: { padding: 12, justifyContent: "flex-start" },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  emptySub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  clearBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
});
