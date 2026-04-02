import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart } from "lucide-react-native";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import DoctorCard from "../../components/DoctorCard";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { useFavoritesStore } from "../../store/favoritesStore";

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useFavoritesStore();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.textInverse} size={24} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>My Favorites</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Heart color="#CBD5E1" size={48} />
          </View>
          <Text
            style={[
              Typography.h3,
              { color: Colors.textSecondary, marginBottom: 8 },
            ]}
          >
            No favorites yet
          </Text>
          <Text
            style={[
              Typography.body2,
              { textAlign: "center", color: Colors.textSecondary },
            ]}
          >
            Tap the heart icon on a doctor's card to save them here.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push("/(patient)/search")}
          >
            <Text style={{ color: Colors.surface, fontWeight: "700" }}>
              Browse Doctors
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              style={{ width: "48%", marginRight: 0 }}
              onPress={() =>
                router.push({
                  pathname: "/(patient)/doctor/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
          keyExtractor={(d) => d.id}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: Colors.textInverse,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  listContent: { padding: 20, paddingBottom: 40 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  browseBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
});
