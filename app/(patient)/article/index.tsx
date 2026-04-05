import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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
import ArticleCard from "../../../components/articles/ArticleCard";
import { Colors } from "../../../constants/Colors";
import { getArticles } from "../../../services/api";

export default function ArticlesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const load = useCallback(
    async (page = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await getArticles({
        page,
        limit: 10,
        q: query || undefined,
        sortBy: "latest",
      });

      if (res.data) {
        const nextItems = res.data.items || [];
        setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
        setPagination({
          page: res.data.pagination?.page || page,
          pages: res.data.pagination?.pages || 1,
        });
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [query],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

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
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={Colors.textInverse} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Articles</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <Search size={16} color={Colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(1, false)}
          placeholder="Search health topics..."
          placeholderTextColor={Colors.textSecondary}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id || item.slug}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12 }}>
              <ArticleCard
                item={item}
                onPress={(slug: string) =>
                  router.push({
                    pathname: "/(patient)/article/[id]",
                    params: { id: slug },
                  })
                }
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No articles found.</Text>
          }
          ListFooterComponent={
            pagination.page < pagination.pages ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => load(pagination.page + 1, true)}
                disabled={loadingMore}
              >
                <Text style={styles.loadMoreText}>
                  {loadingMore ? "Loading..." : "Load More"}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
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
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textInverse,
    marginLeft: 12,
  },
  searchWrap: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Colors.text,
  },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 24,
    fontSize: 14,
  },
  loadMoreBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  loadMoreText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
});
