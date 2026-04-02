import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Clock,
    Heart,
    MapPin,
    Star,
    Users,
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import ButtonPrimary from "../../../components/ButtonPrimary";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";
import {
    getDoctorById,
    getDoctorReviews,
    getMyDoctorLikes,
    toggleDoctorLike,
} from "../../../services/api";
import { useFavoritesStore } from "../../../store/favoritesStore";
import type { Doctor } from "../../../types";

function formatDisplayDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function DoctorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [liking, setLiking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");
  const { isFavorite, setFavorite } = useFavoritesStore();

  const loadDoctorData = React.useCallback(async () => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [res, reviewsRes, likesRes] = await Promise.all([
        getDoctorById(id ?? ""),
        getDoctorReviews(id ?? ""),
        getMyDoctorLikes([id]),
      ]);
      if (res.data) setDoctor(res.data);
      if (Array.isArray(reviewsRes.data)) setReviews(reviewsRes.data);
      if (Array.isArray(likesRes.data)) {
        const likedOnServer = likesRes.data.includes(String(id));
        if (likedOnServer && res.data) {
          setFavorite(res.data as Doctor, true);
        }
      }
      setLoading(false);
    })();
  }, [id, setFavorite]);

  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  useFocusEffect(
    React.useCallback(() => {
      loadDoctorData();
    }, [loadDoctorData]),
  );

  if (!doctor && loading) {
    return <SafeAreaView style={styles.container} edges={["top"]} />;
  }

  if (!doctor && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorState}>
          <Text style={Typography.h3}>Doctor not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: Colors.primary, marginTop: 12 }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = [
    {
      icon: Star,
      value: String(doctor.rating),
      label: `${doctor.reviews || 0} Reviews`,
    },
    {
      icon: Clock,
      value: String(doctor.experience)
        .replace(/\s*years?/i, "")
        .trim(),
      label: "Experience",
    },
    {
      icon: Users,
      value: "1000+",
      label: "Patients",
    },
  ];
  const tabs: ("about" | "reviews")[] = ["about", "reviews"];
  const doctorId = String(doctor?.id ?? id ?? "");
  const liked = Boolean(doctorId && isFavorite(doctorId));

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 170 + Math.max(insets.bottom, 8) },
        ]}
      >
        {/* Header Banner */}
        <View style={styles.bannerContainer}>
          <SafeAreaView edges={["top"]} style={styles.headerOverlayBtns}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft color={Colors.text} size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (liking) return;
                setLiking(true);
                const response = await toggleDoctorLike(doctor.id);
                setLiking(false);
                if (response.data) {
                  setFavorite(doctor, Boolean(response.data.liked));
                  setDoctor((prev) =>
                    prev
                      ? {
                          ...prev,
                          likes: Number(response.data.likesCount || 0),
                        }
                      : prev,
                  );
                }
              }}
              style={styles.iconBtn}
            >
              <Heart
                size={20}
                color={liked ? Colors.error : Colors.text}
                fill={liked ? Colors.error : "none"}
              />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Info Container */}
        <View style={styles.infoContainer}>
          <View style={styles.profileAvatarWrap}>
            <Image
              source={{ uri: doctor.image }}
              style={styles.profileAvatar}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialization}>
            {doctor.specialization}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <View
                key={i}
                style={[
                  styles.statItem,
                  i < stats.length - 1 && styles.statItemWithDivider,
                ]}
              >
                <View style={styles.statIcon}>
                  <stat.icon
                    color={Colors.textInverse}
                    size={18}
                    fill={i === 0 ? Colors.textInverse : "none"}
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MapPin color={Colors.textSecondary} size={16} />
            <Text
              style={[Typography.body2, { marginLeft: 8 }]}
              numberOfLines={1}
            >
              {doctor.hospital ?? "Apollo Hospital, Chennai"}
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  activeTab === tab && styles.tabBtnActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab === "about" ? "About" : `Reviews (${doctor.reviews})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "about" ? (
            <>
              <Text
                style={[Typography.body2, { lineHeight: 24, marginBottom: 28 }]}
              >
                {doctor.about || "No bio added yet."}
              </Text>
            </>
          ) : (
            <>
              {reviews.map((review) => (
                <View key={String(review._id)} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.patient?.image || "" }}
                      style={styles.reviewAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.body1, { fontWeight: "600" }]}>
                        {review.patient?.name || "Patient"}
                      </Text>
                      <Text style={Typography.caption}>
                        {formatDisplayDate(review.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <Star
                        size={12}
                        color={Colors.warningPressed}
                        fill={Colors.warningPressed}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          marginLeft: 4,
                          color: Colors.warningPressed,
                        }}
                      >
                        {Number(review.rating || 0)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[Typography.body2, { lineHeight: 22, marginTop: 8 }]}
                  >
                    {review.comment || ""}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(patient)/review",
                    params: { doctorId: doctor.id },
                  })
                }
              >
                <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                  + Write a Review
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: 16 + Math.max(insets.bottom, 8) },
        ]}
      >
        <Text style={styles.bottomFeeLabel}>Consultation Fee</Text>
        <Text style={styles.bottomFeeValue}>₹{doctor.fee}</Text>
        <ButtonPrimary
          title="Book Appointment"
          onPress={() =>
            router.push({
              pathname: "/(patient)/booking/[id]",
              params: { id: doctor.id },
            })
          }
          style={styles.bookButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 180 },
  errorState: { flex: 1, alignItems: "center", justifyContent: "center" },
  bannerContainer: {
    width: "100%",
    height: 210,
    position: "relative",
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerOverlayBtns: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  infoContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginTop: -34,
    marginHorizontal: 0,
    paddingHorizontal: 20,
    paddingTop: 66,
    paddingBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  profileAvatarWrap: {
    position: "absolute",
    top: -62,
    alignSelf: "center",
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 4,
    borderColor: Colors.surface,
    overflow: "hidden",
    backgroundColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 7,
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
  },
  doctorName: {
    ...Typography.h2,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "800",
    textAlign: "center",
    color: Colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  doctorSpecialization: {
    ...Typography.body1,
    color: Colors.primary,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statItemWithDivider: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingBottom: 12,
    paddingTop: 4,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  reviewCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center" },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  writeReviewBtn: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    marginBottom: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "stretch",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomFeeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  bottomFeeValue: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: 12,
  },
  bookButton: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
});
