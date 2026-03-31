import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, FlaskConical } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import { getLabTestById } from "../../../services/api";

export default function LabTestDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [test, setTest] = useState<any | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<"home" | "lab">("home");
  const discount = useMemo(() => {
    if (!test) return 0;
    if (!test.originalPrice) return 0;
    return Math.round(
      ((test.originalPrice - test.price) / test.originalPrice) * 100,
    );
  }, [test]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const response = await getLabTestById(id);
      if (response.data) setTest(response.data);
    };
    load();
  }, [id]);

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
        <Text style={styles.headerTitle}>Test Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
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
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Parameters</Text>
            </View>
            <View style={styles.tableWrap}>
              {test.parameters.map((item: any, index: number) => (
                <View key={`${item.name}-${index}`} style={styles.tableRow}>
                  <Text style={styles.tableCellPrimary}>{item.name}</Text>
                  <Text style={styles.tableCell}>{item.normalRange || ""}</Text>
                  <Text style={styles.tableCell}>{item.unit || ""}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
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
              <View style={styles.sectionAccent} />
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
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Instructions</Text>
            </View>
            <View style={styles.infoStack}>
              {test.preparationInstructions ? (
                <View style={styles.blockCard}>
                  <Text style={styles.blockTitle}>Preparation</Text>
                  <Text style={styles.blockText}>
                    {test.preparationInstructions}
                  </Text>
                </View>
              ) : null}
              {test.beforeTestInstructions ? (
                <View style={styles.blockCard}>
                  <Text style={styles.blockTitle}>Before Test</Text>
                  <Text style={styles.blockText}>
                    {test.beforeTestInstructions}
                  </Text>
                </View>
              ) : null}
              {test.afterTestInstructions ? (
                <View style={styles.blockCard}>
                  <Text style={styles.blockTitle}>After Test</Text>
                  <Text style={styles.blockText}>
                    {test.afterTestInstructions}
                  </Text>
                </View>
              ) : null}
              {test.collectionInstructions ? (
                <View style={styles.blockCard}>
                  <Text style={styles.blockTitle}>Collection</Text>
                  <Text style={styles.blockText}>
                    {test.collectionInstructions}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
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
      </View>
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
    backgroundColor: "#EEF2FF",
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
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discText: { fontSize: 10, fontWeight: "700", color: "#16A34A" },
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
    backgroundColor: "#EFF6FF",
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
  blockCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F8FAFF",
  },
  blockTitle: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
  blockText: { fontSize: 13, color: Colors.text, marginTop: 6 },
  linkCard: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#EFF6FF",
  },
  linkTitle: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  linkSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
    gap: 12,
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
    backgroundColor: "#2563EB",
  },
  actionText: { fontSize: 13, fontWeight: "700", color: Colors.text },
  actionTextActive: { color: Colors.surface },
});
