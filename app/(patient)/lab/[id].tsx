import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, FlaskConical } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Image,
    ScrollView,
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
import BottomActionBar from "../../../components/common/BottomActionBar";
import { Colors } from "../../../constants/Colors";
import { getLabTestById, getLabTestReviews } from "../../../services/api";

const INSTRUCTION_TABS = [
  { key: "preparation", label: "Preparation" },
  { key: "before", label: "Before Test" },
  { key: "after", label: "After Test" },
  { key: "collection", label: "Collection" },
] as const;

type InstructionTabKey = (typeof INSTRUCTION_TABS)[number]["key"];

function formatDisplayDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function LabTestDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [test, setTest] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [selectedFlow, setSelectedFlow] = useState<"home" | "lab">("home");
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");
  const [activeInstructionTab, setActiveInstructionTab] =
    useState<InstructionTabKey>("preparation");
  const discount = useMemo(() => {
    if (!test) return 0;
    if (!test.originalPrice) return 0;
    return Math.round(
      ((test.originalPrice - test.price) / test.originalPrice) * 100,
    );
  }, [test]);

  const loadLabDetails = React.useCallback(async () => {
    if (!id) return;
    const [response, reviewResponse] = await Promise.all([
      getLabTestById(id),
      getLabTestReviews(id, { page: 1, limit: 20, sortBy: "latest" }),
    ]);
    if (response.data) setTest(response.data);
    if (reviewResponse.data) {
      setReviews(reviewResponse.data.items || []);
      setReviewSummary(
        reviewResponse.data.summary || { averageRating: 0, totalReviews: 0 },
      );
    }
  }, [id]);

  useEffect(() => {
    loadLabDetails();
  }, [loadLabDetails]);

  useEffect(() => {
    if (!test) return;
    const firstAvailable = [
      test.preparationInstructions ? "preparation" : null,
      test.beforeTestInstructions ? "before" : null,
      test.afterTestInstructions ? "after" : null,
      test.collectionInstructions ? "collection" : null,
    ].filter(Boolean)[0] as InstructionTabKey | null | undefined as
      | InstructionTabKey
      | undefined;

    if (firstAvailable) setActiveInstructionTab(firstAvailable);
  }, [test]);

  useFocusEffect(
    React.useCallback(() => {
      loadLabDetails();
    }, [loadLabDetails]),
  );

  const handleFlow = (flow: "home" | "lab") => {
    if (!test) return;
    setSelectedFlow(flow);
    router.push({
      pathname:
        flow === "home"
          ? "/(patient)/lab/home-booking"
          : "/(patient)/lab/visit-booking",
      params: { id: String(test.id || test._id) },
    });
  };

  if (!test) return null;

  const imageUrl =
    test.testImage || test.imageUrl || test.testImageUrl || test.image || "";
  const isAboutTab = activeTab === "about";
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
          <ArrowLeft color={Colors.textInverse} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Details</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 220 + insets.bottom },
        ]}
      >
        <View style={styles.heroCard}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroImageFallback}>
              <FlaskConical color={Colors.primary} size={44} />
            </View>
          )}
          <View style={styles.heroBody}>
            <Text style={styles.testName}>{test.name}</Text>
            {test.shortDescription ? (
              <Text style={styles.shortDesc}>{test.shortDescription}</Text>
            ) : null}
            {(test.reportTime || test.turnaround) && (
              <View style={styles.turnaroundRow}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.turnaroundText}>
                  Results in {test.reportTime || test.turnaround}
                </Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{test.price}</Text>
              {test.originalPrice ? (
                <Text style={styles.originalPrice}>₹{test.originalPrice}</Text>
              ) : null}
              {discount > 0 ? (
                <View style={styles.discBadge}>
                  <Text style={styles.discText}>{discount}% OFF</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "about" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("about")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "about" && styles.tabTextActive,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "reviews" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("reviews")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "reviews" && styles.tabTextActive,
              ]}
            >
              Reviews ({reviewSummary.totalReviews || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {isAboutTab ? (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Overview</Text>
              </View>
              {test.fullDescription ? (
                <Text style={styles.overviewText}>{test.fullDescription}</Text>
              ) : null}
              <View style={styles.metaRow}>
                {test.category ? (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>{test.category}</Text>
                  </View>
                ) : null}
                {test.subcategory ? (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>{test.subcategory}</Text>
                  </View>
                ) : null}
              </View>
              {Array.isArray(test.tags) && test.tags.length ? (
                <View style={styles.tagRow}>
                  {test.tags.map((tag: string) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {Array.isArray(test.parameters) && test.parameters.length ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Parameters</Text>
                </View>
                <View style={styles.tableWrap}>
                  {test.parameters.map((item: any, index: number) => (
                    <View key={`${item.name}-${index}`} style={styles.tableRow}>
                      <Text style={styles.tableCellPrimary}>{item.name}</Text>
                      <Text style={styles.tableCell}>
                        {item.normalRange || ""}
                      </Text>
                      <Text style={styles.tableCell}>{item.unit || ""}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sample</Text>
              </View>
              <View style={styles.infoStack}>
                {test.sampleType ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Sample Type</Text>
                    <Text style={styles.infoValue}>{test.sampleType}</Text>
                  </View>
                ) : null}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fasting Required</Text>
                  <Text style={styles.infoValue}>
                    {test.fastingRequired ? "Yes" : "No"}
                  </Text>
                </View>
                {test.fastingRequired && test.fastingHours ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fasting Hours</Text>
                    <Text style={styles.infoValue}>{test.fastingHours}</Text>
                  </View>
                ) : null}
                {test.reportSampleUrl ? (
                  <TouchableOpacity
                    style={styles.linkCard}
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/lab/sample-report",
                        params: {
                          url: encodeURIComponent(test.reportSampleUrl),
                          title: test.name,
                        },
                      })
                    }
                  >
                    <Text style={styles.linkTitle}>Sample Report</Text>
                    <Text style={styles.linkSub}>Tap to view PDF</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {test.method || test.department ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Medical</Text>
                </View>
                <View style={styles.infoStack}>
                  {test.method ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Method</Text>
                      <Text style={styles.infoValue}>{test.method}</Text>
                    </View>
                  ) : null}
                  {test.department ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Department</Text>
                      <Text style={styles.infoValue}>{test.department}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {test.preparationInstructions ||
            test.beforeTestInstructions ||
            test.afterTestInstructions ||
            test.collectionInstructions ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                </View>

                <View style={styles.instructionTabsRow}>
                  {INSTRUCTION_TABS.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        styles.instructionTabBtn,
                        activeInstructionTab === t.key &&
                          styles.instructionTabBtnActive,
                      ]}
                      onPress={() => setActiveInstructionTab(t.key)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.instructionTabText,
                          activeInstructionTab === t.key &&
                            styles.instructionTabTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.blockCard}>
                  <Text style={styles.blockTitle}>
                    {activeInstructionTab === "preparation"
                      ? "Preparation"
                      : activeInstructionTab === "before"
                        ? "Before Test"
                        : activeInstructionTab === "after"
                          ? "After Test"
                          : "Collection"}
                  </Text>
                  <Text style={styles.blockText}>
                    {(activeInstructionTab === "preparation"
                      ? test.preparationInstructions
                      : activeInstructionTab === "before"
                        ? test.beforeTestInstructions
                        : activeInstructionTab === "after"
                          ? test.afterTestInstructions
                          : test.collectionInstructions) ||
                      "No instructions available."}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {reviews.map((review) => (
              <View key={String(review._id)} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={{ uri: review.user?.image || "" }}
                    style={styles.reviewAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUser}>
                      {review.user?.name || "Patient"}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {formatDisplayDate(review.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.reviewRating}>
                    <Text style={styles.reviewStar}>★</Text>
                    <Text style={styles.reviewRatingText}>
                      {Number(review.rating || 0)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.writeReviewBtn}
              onPress={() =>
                router.push({
                  pathname: "/(patient)/review",
                  params: {
                    reviewType: "lab",
                    entityId: String(test.id || test._id),
                    entityName: test.name || "Lab Test",
                    entitySubtitle: test.category || "Lab Test",
                    entityImage: imageUrl || "",
                  },
                })
              }
            >
              <Text style={styles.writeReviewText}>+ Write a Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <BottomActionBar
        contentStyle={{ flexDirection: "row", alignItems: "center", gap: 12 }}
      >
        <TouchableOpacity
          style={[
            styles.actionBtn,
            selectedFlow === "home" && styles.actionBtnActive,
          ]}
          onPress={() => handleFlow("home")}
        >
          <Text
            style={[
              styles.actionText,
              selectedFlow === "home" && styles.actionTextActive,
            ]}
          >
            Collect From Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            selectedFlow === "lab" && styles.actionBtnActive,
          ]}
          onPress={() => handleFlow("lab")}
        >
          <Text
            style={[
              styles.actionText,
              selectedFlow === "lab" && styles.actionTextActive,
            ]}
          >
            Visit Lab
          </Text>
        </TouchableOpacity>
      </BottomActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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
  scroll: { padding: 20, paddingBottom: 120 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroImage: { width: "100%", height: 170, backgroundColor: Colors.border },
  heroImageFallback: {
    width: "100%",
    height: 170,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: { padding: 16 },
  testName: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 6,
  },
  shortDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  turnaroundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  turnaroundText: { fontSize: 12, color: Colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  price: { fontSize: 22, fontWeight: "800", color: Colors.text },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  discBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discText: { fontSize: 10, fontWeight: "700", color: Colors.successPressed },
  tabs: {
    marginTop: 16,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },
  tabContent: { marginTop: 0 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionAccent: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  overviewText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  metaChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tagChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  tagText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  tableWrap: { gap: 8 },
  tableRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableCellPrimary: { flex: 1.2, fontSize: 13, color: Colors.text },
  tableCell: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  infoStack: { gap: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  infoValue: { fontSize: 13, color: Colors.text, fontWeight: "600" },

  instructionTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  instructionTabBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  instructionTabBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryUltraLight,
  },
  instructionTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  instructionTabTextActive: { color: Colors.primary },

  blockCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.primaryUltraLight,
  },
  blockTitle: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
  blockText: { fontSize: 13, color: Colors.text, marginTop: 6 },
  linkCard: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.primaryLight,
  },
  linkTitle: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  linkSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  reviewCard: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  reviewUser: { fontSize: 15, fontWeight: "700", color: Colors.text },
  reviewDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewStar: { fontSize: 12, color: Colors.warningPressed, marginRight: 4 },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.warningPressed,
  },
  reviewComment: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  writeReviewBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  actionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  actionText: { fontSize: 13, fontWeight: "700", color: Colors.text },
  actionTextActive: { color: Colors.surface },
});
