import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    ChevronDown,
    FileText,
    Heart,
    MapPin,
    Phone,
    Share2,
    Star,
    Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    Share,
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
import BottomActionBar from "../../../components/common/BottomActionBar";
import { Colors } from "../../../constants/Colors";
import { Shadows } from "../../../constants/Shadows";
import { Radius, Spacing } from "../../../constants/Spacing";
import { Typography } from "../../../constants/Typography";
import {
    addPackageReview,
    getPackageById,
    getPackageReviews,
} from "../../../services/api";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: {
    height: 250,
    position: "relative",
    backgroundColor: Colors.border,
  },
  headerImage: { width: "100%", height: "100%" },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  headerTop: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.soft,
  },
  offerBadgeHeader: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  offerBadgeText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: "700",
  },
  content: { flex: 1, paddingBottom: Spacing.xl * 2 },
  section: {
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  packageName: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  packageMeta: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  offerPrice: { ...Typography.h1, color: Colors.primary, fontWeight: "800" },
  originalPrice: {
    ...Typography.body1,
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  discountBadgeText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: "700",
  },
  brochureBtn: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  brochureBtnText: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: "600",
  },
  callCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  callCardImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  callCardContent: { flex: 1 },
  callCardLabel: { ...Typography.caption, color: Colors.textTertiary },
  callCardTitle: {
    ...Typography.body2,
    color: Colors.text,
    fontWeight: "600",
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  callBtnText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: "600",
  },
  description: {
    ...Typography.body2,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  testItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  testItemLast: { borderBottomWidth: 0 },
  testCategory: {
    ...Typography.subheading,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  testCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  testList: {
    paddingLeft: Spacing.md,
    marginTop: Spacing.xs,
  },
  testName: {
    ...Typography.body2,
    color: Colors.text,
    marginBottom: 4,
  },
  stepItem: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: "700",
  },
  stepContent: { flex: 1 },
  stepTitle: {
    ...Typography.subheading,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDesc: { ...Typography.body2, color: Colors.textSecondary },
  bookBtn: {
    paddingVertical: 0,
  },
  bookBtnGradient: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    borderRadius: Radius.lg,
    alignItems: "center",
    width: "100%",
  },
  bookBtnText: {
    ...Typography.button,
  },
  expandable: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  expandableHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primaryLight,
  },
  expandableTitle: {
    ...Typography.subheading,
    color: Colors.primary,
    fontWeight: "600",
  },
  expandableContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },

  accordion: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  accordionRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
  },
  accordionRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  accordionTitle: {
    ...Typography.subheading,
    color: Colors.text,
    fontWeight: "600",
  },
  accordionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accordionChevron: {
    color: Colors.textTertiary,
  },
  accordionItems: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  accordionItemText: {
    ...Typography.body2,
    color: Colors.text,
    paddingVertical: 4,
  },
  accordionContentText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  reviewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  reviewSummary: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  reviewInputWrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  starRow: { flexDirection: "row", gap: 6, marginBottom: Spacing.sm },
  commentInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    textAlignVertical: "top",
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: {
    ...Typography.body2,
    color: Colors.textInverse,
    fontWeight: "700",
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  reviewCardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewUser: { ...Typography.body2, color: Colors.text, fontWeight: "600" },
  reviewDate: { ...Typography.caption, color: Colors.textTertiary },
  reviewStars: { ...Typography.caption, color: Colors.ratingGold },
  reviewComment: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: 6,
  },
});

export default function PackageDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");

  const loadPackage = useCallback(async () => {
    try {
      if (!id) return;
      const res = await getPackageById(id);
      if (res.data) {
        setPkg(res.data);
      }
    } catch (err) {
      console.error("Failed to load package:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  const loadReviews = useCallback(async () => {
    try {
      if (!id) return;
      setLoadingReviews(true);
      const res = await getPackageReviews(String(id));
      if (Array.isArray(res.data)) setReviews(res.data);
    } finally {
      setLoadingReviews(false);
    }
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatDisplayDate = (value: any) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return "";
    }
  };

  if (loading || !pkg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header} />
        </View>
      </SafeAreaView>
    );
  }

  const originalPrice = pkg.price?.original || 0;
  const offerPrice = pkg.price?.offer || originalPrice;
  const discount = pkg.price?.discount || 0;
  const brochureHref = pkg.brochureUrl || pkg.brochure;
  const includedTestsCount =
    pkg.testCount ||
    (Array.isArray(pkg.tests)
      ? pkg.tests.reduce(
          (sum: number, group: any) =>
            sum + (Array.isArray(group?.tests) ? group.tests.length : 0),
          0,
        )
      : 0);

  const instructionSections = [
    {
      key: "instr-before",
      title: "Before Test",
      content: pkg.instructions?.before,
    },
    {
      key: "instr-collection",
      title: "Collection Instructions",
      content: pkg.instructions?.collection,
    },
    {
      key: "instr-after",
      title: "After Test",
      content: pkg.instructions?.after,
    },
  ].filter((s) => Boolean((s.content || "").trim()));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <View style={styles.container}>
        {/* ── HEADER WITH IMAGE ── */}
        <View style={styles.header}>
          {pkg.image && (
            <Image
              source={{ uri: pkg.image }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.headerOverlay} />

          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.back()}
            >
              <ArrowLeft color={Colors.primary} size={20} />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() =>
                  Share.share({
                    message: `Check this package: ${pkg.name}`,
                    title: pkg.name,
                  })
                }
              >
                <Share2 color={Colors.primary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn}>
                <Heart color={Colors.primary} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {discount > 0 && (
            <View style={styles.offerBadgeHeader}>
              <Text style={styles.offerBadgeText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 220 + insets.bottom }}
        >
          {/* ── PACKAGE INFO ── */}
          <View style={styles.section}>
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packageMeta}>
              Age: {pkg.ageRange?.min || "Any"} - {pkg.ageRange?.max || "100"}{" "}
              years
            </Text>
            <Text style={styles.packageMeta}>
              {pkg.testCount || 0} Tests Included
            </Text>

            <View style={styles.priceSection}>
              <Text style={styles.offerPrice}>₹{offerPrice}</Text>
              {originalPrice > offerPrice && (
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              )}
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discount}% off</Text>
                </View>
              )}
            </View>
          </View>

          {(pkg.fullDescription || pkg.shortDescription) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this package</Text>
              <View style={styles.card}>
                <Text style={styles.description}>
                  {pkg.fullDescription || pkg.shortDescription}
                </Text>
              </View>
            </View>
          )}

          {/* ── BROCHURE ── */}
          {brochureHref && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.brochureBtn}
                onPress={async () => {
                  try {
                    const canOpen = await Linking.canOpenURL(
                      String(brochureHref),
                    );
                    if (!canOpen) {
                      Alert.alert(
                        "Unable to open brochure",
                        "Please try again later.",
                      );
                      return;
                    }
                    await Linking.openURL(String(brochureHref));
                  } catch {
                    Alert.alert(
                      "Unable to open brochure",
                      "Please try again later.",
                    );
                  }
                }}
              >
                <FileText color={Colors.primary} size={16} />
                <Text style={styles.brochureBtnText}>View Brochure</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── CALL TO BOOK ── */}
          <View style={styles.section}>
            <View style={styles.callCard}>
              {pkg.lab?.logo && (
                <Image
                  source={{ uri: pkg.lab.logo }}
                  style={styles.callCardImage}
                />
              )}
              <View style={styles.callCardContent}>
                <Text style={styles.callCardLabel}>Talk to Nivi expert</Text>
                <Text style={styles.callCardTitle}>to book your test</Text>
              </View>
              <TouchableOpacity style={styles.callBtn}>
                <Phone color={Colors.textInverse} size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── WHO SHOULD BOOK ── */}
          {pkg.details?.whoShouldBook && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Who should book?</Text>
              <View style={styles.card}>
                <Text style={styles.description}>
                  {pkg.details.whoShouldBook}
                </Text>
              </View>
            </View>
          )}

          {/* ── PROVIDED BY ── */}
          {pkg.lab && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Provided by</Text>
              <View style={styles.card}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.md,
                  }}
                >
                  {pkg.lab.logo && (
                    <Image
                      source={{ uri: pkg.lab.logo }}
                      style={{ width: 50, height: 50, borderRadius: Radius.md }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Typography.subheading,
                        color: Colors.text,
                        fontWeight: "600",
                      }}
                    >
                      {pkg.lab.name}
                    </Text>
                    {pkg.lab.address && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <MapPin size={12} color={Colors.textTertiary} />
                        <Text
                          style={{
                            ...Typography.caption,
                            color: Colors.textTertiary,
                          }}
                        >
                          {pkg.lab.address}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── WHY BOOK WITH US ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why book with us?</Text>
            <View style={styles.card}>
              <View style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: "row", gap: Spacing.md }}>
                  <FileText color={Colors.primary} size={18} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Typography.subheading,
                        color: Colors.text,
                        fontWeight: "600",
                      }}
                    >
                      Get digital report
                    </Text>
                    <Text
                      style={{
                        ...Typography.caption,
                        color: Colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      within 3 days
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: Spacing.md }}>
                  <Users color={Colors.primary} size={18} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Typography.subheading,
                        color: Colors.text,
                        fontWeight: "600",
                      }}
                    >
                      Expert consultation
                    </Text>
                    <Text
                      style={{
                        ...Typography.caption,
                        color: Colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      Book online consultation with doctor
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── RECOMMENDED FOR ── */}
          {pkg.suitableFor && pkg.suitableFor.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suitable for</Text>
              <View style={styles.card}>
                {pkg.suitableFor.map((item: string, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.testItem,
                      idx === pkg.suitableFor.length - 1 && styles.testItemLast,
                    ]}
                  >
                    <Text style={styles.testName}>• {item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {pkg.details?.highlyRecommendedFor &&
            pkg.details.highlyRecommendedFor.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Highly recommended for</Text>
                <View style={styles.card}>
                  {pkg.details.highlyRecommendedFor.map(
                    (item: string, idx: number) => (
                      <View
                        key={idx}
                        style={[
                          styles.testItem,
                          idx === pkg.details.highlyRecommendedFor.length - 1 &&
                            styles.testItemLast,
                        ]}
                      >
                        <Text style={styles.testName}>• {item}</Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}

          {/* ── TESTS INCLUDED ── */}
          {pkg.tests && pkg.tests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Included {includedTestsCount} tests
              </Text>
              <View style={styles.accordion}>
                {pkg.tests.map((group: any, idx: number) => {
                  const key = `test-${idx}`;
                  const isOpen = Boolean(expandedSections[key]);

                  return (
                    <View key={key}>
                      <TouchableOpacity
                        style={styles.accordionRow}
                        onPress={() => toggleSection(key)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1, paddingRight: Spacing.md }}>
                          <Text style={styles.accordionTitle}>
                            {group.category}
                          </Text>
                          <Text style={styles.accordionSubtitle}>
                            {group.tests?.length || 0} tests
                          </Text>
                        </View>
                        <ChevronDown
                          size={18}
                          style={{
                            transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                          }}
                          color={styles.accordionChevron.color}
                        />
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={styles.accordionItems}>
                          {(group.tests || []).map(
                            (test: string, testIdx: number) => (
                              <Text
                                key={`${key}-item-${testIdx}`}
                                style={styles.accordionItemText}
                              >
                                {test}
                              </Text>
                            ),
                          )}
                        </View>
                      )}

                      {idx < pkg.tests.length - 1 && (
                        <View style={styles.accordionRowDivider} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── PREPARATION ── */}
          {pkg.details?.preparation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preparation Needed</Text>
              <View style={styles.card}>
                <Text style={styles.description}>
                  {pkg.details.preparation}
                </Text>
              </View>
            </View>
          )}

          {/* ── HOW IT WORKS ── */}
          {pkg.details?.howItWorks && pkg.details.howItWorks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How it works</Text>
              <View style={styles.card}>
                {pkg.details.howItWorks.map((step: any, idx: number) => (
                  <View key={idx} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{step.step}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── INSTRUCTIONS ── */}
          {pkg.instructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>

              <View style={styles.accordion}>
                {instructionSections.map((section, idx) => {
                  const isOpen = Boolean(expandedSections[section.key]);
                  return (
                    <View key={section.key}>
                      <TouchableOpacity
                        style={styles.accordionRow}
                        onPress={() => toggleSection(section.key)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1, paddingRight: Spacing.md }}>
                          <Text style={styles.accordionTitle}>
                            {section.title}
                          </Text>
                        </View>
                        <ChevronDown
                          size={18}
                          style={{
                            transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                          }}
                          color={styles.accordionChevron.color}
                        />
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={styles.accordionItems}>
                          <Text style={styles.accordionContentText}>
                            {section.content}
                          </Text>
                        </View>
                      )}

                      {idx < instructionSections.length - 1 && (
                        <View style={styles.accordionRowDivider} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── FEEDBACK ── */}
          <View style={styles.section}>
            <View style={styles.reviewHead}>
              <Text style={styles.sectionTitle}>Feedback</Text>
              <Text style={styles.reviewSummary}>
                {Number(pkg.rating || 0).toFixed(1)} / 5 (
                {pkg.reviewsCount || 0})
              </Text>
            </View>

            <View style={styles.reviewInputWrap}>
              <Text style={styles.inputLabel}>Rate this package</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setMyRating(star)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Star
                      size={26}
                      color={Colors.ratingGold}
                      fill={star <= myRating ? Colors.ratingGold : "none"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={myComment}
                onChangeText={setMyComment}
                placeholder="Write your feedback..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                style={styles.commentInput}
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!myRating || !myComment.trim() || submittingReview) &&
                    styles.submitBtnDisabled,
                ]}
                onPress={async () => {
                  if (!id) return;
                  if (!myRating) {
                    Alert.alert(
                      "Rating required",
                      "Please select a star rating.",
                    );
                    return;
                  }
                  if (!myComment.trim()) {
                    Alert.alert(
                      "Comment required",
                      "Please write a short feedback message.",
                    );
                    return;
                  }

                  setSubmittingReview(true);
                  const res = await addPackageReview(String(id), {
                    rating: myRating,
                    comment: myComment.trim(),
                  });
                  setSubmittingReview(false);

                  if (res.status !== "success") {
                    Alert.alert(
                      "Unable to submit feedback",
                      res.error || "Please try again later.",
                    );
                    return;
                  }

                  setMyRating(0);
                  setMyComment("");
                  await loadPackage();
                  await loadReviews();
                }}
                disabled={!myRating || !myComment.trim() || submittingReview}
              >
                <Text style={styles.submitText}>
                  {submittingReview ? "Submitting..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingReviews ? (
              <View style={styles.card}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {reviews.length === 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.description}>No feedback yet.</Text>
                  </View>
                ) : null}
                {reviews.map((review) => (
                  <View key={String(review._id)} style={styles.reviewCard}>
                    <View style={styles.reviewCardHead}>
                      <Text style={styles.reviewUser}>
                        {review.name || "Patient"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatDisplayDate(review.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.reviewStars}>
                      {"★".repeat(Number(review.rating || 0))}
                    </Text>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── BOOK NOW BUTTON ── */}
        <BottomActionBar contentStyle={styles.bookBtn}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/(patient)/packages/checkout",
                params: { id: String(id) },
              })
            }
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtnGradient}
            >
              <Text style={styles.bookBtnText}>Book Now - ₹{offerPrice}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BottomActionBar>
      </View>
    </SafeAreaView>
  );
}
