import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    MapPin,
    Minus,
    Phone,
    Plus,
    RefreshCcw,
    ShieldCheck,
    Star,
    Truck,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Image,
    Linking,
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
import ActionModal from "../../../components/ActionModal";
import ButtonPrimary from "../../../components/ButtonPrimary";
import { Colors } from "../../../constants/Colors";
import { getMedicineById, getMedicines } from "../../../services/api";
import { useCartStore } from "../../../store/cartStore";

function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(value)
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export default function MedicineDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [med, setMed] = useState<any | null>(null);
  const [allMedicines, setAllMedicines] = useState<any[]>([]);
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [response, listResponse] = await Promise.all([
        getMedicineById(id),
        getMedicines(),
      ]);
      if (response.data) setMed(response.data);
      if (listResponse.data) setAllMedicines(listResponse.data);
    };
    load();
  }, [id]);

  if (!med) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={Colors.textInverse} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medicine Details</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: Colors.textSecondary }}>
            Loading medicine...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const medicineId = String(med.id || med._id);
  const isAboutTab = activeTab === "about";
  const ratingValue = Number(med.rating || 0);
  const reviewCount = Number(med.reviewsCount || 0);
  const reviews = Array.isArray(med.reviews) ? med.reviews : [];
  const discountPercent = Math.max(0, Number(med.discountPercent || 0));
  const pharmacy = med.pharmacy || null;
  const pharmacyAddress = [
    pharmacy?.address,
    [pharmacy?.city, pharmacy?.state].filter(Boolean).join(", "),
    pharmacy?.pincode,
  ]
    .filter(Boolean)
    .join(" ");

  const sideEffects = normalizeList(med.sideEffects);
  const contraindications = normalizeList(med.contraindications);
  const drugInteractions = normalizeList(med.drugInteractions);

  const relatedMedicines = allMedicines
    .filter((item) => String(item.id || item._id) !== medicineId)
    .filter((item) => item.category && item.category === med.category)
    .slice(0, 4);

  const alternatives = allMedicines
    .filter((item) => String(item.id || item._id) !== medicineId)
    .filter(
      (item) =>
        (med.genericName && item.genericName === med.genericName) ||
        (med.composition && item.composition === med.composition),
    )
    .slice(0, 4);

  const frequentlyBoughtTogether = allMedicines
    .filter((item) => String(item.id || item._id) !== medicineId)
    .filter((item) => item.category === med.category)
    .slice(0, 6);

  const handleAdd = () => {
    for (let i = 0; i < qty; i += 1) {
      addItem({
        id: medicineId,
        name: med.name,
        price: med.price,
        image: med.image || "",
        category: med.category,
        prescriptionRequired: med.prescriptionRequired,
        mrp: med.mrp,
        deliveryEtaHours: med.deliveryEtaHours,
      });
    }
    setAdded(true);
  };

  const renderMedicalSection = (title: string, value: unknown) => {
    if (!hasValue(value)) return null;
    const list = normalizeList(value);

    return (
      <View style={styles.medicalBlock}>
        <Text style={styles.medicalBlockTitle}>{title}</Text>
        {list.length > 1 ? (
          list.map((item, index) => (
            <Text key={`${title}-${index}`} style={styles.medicalBullet}>
              {"\u2022"} {item}
            </Text>
          ))
        ) : (
          <Text style={styles.medicalParagraph}>{String(value)}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <ActionModal
        visible={added}
        type="success"
        title="Added to Cart!"
        message={`${qty}x ${med.name} added successfully.`}
        confirmLabel="View Cart"
        cancelLabel="Continue Shopping"
        onConfirm={() => {
          setAdded(false);
          router.push("/(patient)/cart");
        }}
        onCancel={() => setAdded(false)}
      />

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
        <Text style={styles.headerTitle}>Medicine Details</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 130 + Math.max(insets.bottom, 8) },
        ]}
      >
        {/* Product Image */}
        <View style={styles.imageBg}>
          <Image
            source={{ uri: med.image }}
            style={styles.medImage}
            resizeMode="contain"
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.medName}>{med.name}</Text>
            {med.inStock !== false ? (
              <View style={styles.inStockBadge}>
                <Text style={styles.inStockText}>In Stock</Text>
              </View>
            ) : (
              <View style={styles.outStockBadge}>
                <Text style={styles.outStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
          <Text style={styles.category}>
            {med.brand
              ? `${med.brand} · ${med.category ?? "General Medicine"}`
              : (med.category ?? "General Medicine")}
          </Text>

          {med.prescriptionRequired ? (
            <View style={styles.rxNotice}>
              <AlertTriangle size={14} color="#92400E" />
              <Text style={styles.rxNoticeText}>
                Prescription required at checkout
              </Text>
            </View>
          ) : null}

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                color="#F59E0B"
                fill={s <= Math.round(ratingValue) ? "#F59E0B" : "none"}
              />
            ))}
            <Text style={styles.ratingText}>
              {ratingValue > 0 ? ratingValue.toFixed(1) : "No rating"}
              {reviewCount > 0 ? ` (${reviewCount} reviews)` : ""}
            </Text>
          </View>

          <Text style={styles.price}>
            Rs {Number(med.price || 0).toFixed(2)}
          </Text>
          {med.mrp && Number(med.mrp) > Number(med.price) ? (
            <Text style={styles.mrp}>MRP Rs {Number(med.mrp).toFixed(2)}</Text>
          ) : null}
          {discountPercent > 0 ? (
            <Text style={styles.discountText}>Save {discountPercent}%</Text>
          ) : null}
          <Text style={styles.perUnit}>
            {med.packSize || "Per unit"} · MRP inclusive of all taxes
          </Text>

          {(hasValue(med.composition) ||
            hasValue(med.strength) ||
            hasValue(med.dosageForm) ||
            hasValue(med.manufacturer)) && (
            <View style={styles.quickInfoWrap}>
              <Text style={styles.quickInfoTitle}>Quick Info</Text>
              {!!med.composition && (
                <Text style={styles.quickInfoItem}>
                  Composition: {med.composition}
                </Text>
              )}
              {!!med.strength && (
                <Text style={styles.quickInfoItem}>
                  Strength: {med.strength}
                </Text>
              )}
              {!!med.dosageForm && (
                <Text style={styles.quickInfoItem}>
                  Dosage Form: {med.dosageForm}
                </Text>
              )}
              {!!med.manufacturer && (
                <Text style={styles.quickInfoItem}>
                  Manufacturer: {med.manufacturer}
                </Text>
              )}
            </View>
          )}

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
                Reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          {isAboutTab ? (
            <View style={styles.tabContent}>
              {/* Quantity */}
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantity</Text>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                    style={styles.qBtn}
                  >
                    <Minus size={16} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity
                    onPress={() => setQty((q) => q + 1)}
                    style={styles.qBtn}
                  >
                    <Plus size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Highlights */}
              <View style={styles.highlights}>
                <View style={styles.highlightRow}>
                  <View style={styles.highlightIcon}>
                    <Truck size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.highlightText}>
                    Estimated delivery in {med.deliveryEtaHours || 24} hours
                  </Text>
                </View>
                <View style={styles.highlightRow}>
                  <View style={styles.highlightIcon}>
                    <ShieldCheck size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.highlightText}>
                    100% authentic medicines
                  </Text>
                </View>
                <View style={styles.highlightRow}>
                  <View style={styles.highlightIcon}>
                    <RefreshCcw size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.highlightText}>Easy 7-day returns</Text>
                </View>
              </View>

              {pharmacy ? (
                <View style={styles.providerSection}>
                  <Text style={styles.descTitle}>Provided by</Text>
                  <View style={styles.providerCard}>
                    <View style={styles.providerTopRow}>
                      {pharmacy.logo ? (
                        <Image
                          source={{ uri: pharmacy.logo }}
                          style={styles.providerLogo}
                        />
                      ) : (
                        <View style={styles.providerLogoFallback}>
                          <Text style={styles.providerLogoFallbackText}>
                            {String(pharmacy.pharmacyName || "Pharmacy").charAt(
                              0,
                            )}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.providerName} numberOfLines={1}>
                          {pharmacy.pharmacyName || "Pharmacy Partner"}
                        </Text>
                        {!!pharmacy.registrationId && (
                          <Text style={styles.providerMeta} numberOfLines={1}>
                            Reg: {pharmacy.registrationId}
                          </Text>
                        )}
                      </View>
                      {!!pharmacy.supportPhone && (
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() =>
                            Linking.openURL(`tel:${pharmacy.supportPhone}`)
                          }
                          activeOpacity={0.85}
                        >
                          <Phone size={16} color={Colors.textInverse} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {!!pharmacyAddress && (
                      <View style={styles.providerRow}>
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text style={styles.providerText}>
                          {pharmacyAddress}
                        </Text>
                      </View>
                    )}

                    {!!pharmacy.supportPhone && (
                      <Text style={styles.providerText}>
                        Contact: {pharmacy.supportPhone}
                      </Text>
                    )}

                    {!!pharmacy.supportEmail && (
                      <Text style={styles.providerText}>
                        Email: {pharmacy.supportEmail}
                      </Text>
                    )}

                    {!!pharmacy.operationalHours && (
                      <Text style={styles.providerText}>
                        Hours: {pharmacy.operationalHours}
                      </Text>
                    )}
                  </View>
                </View>
              ) : null}

              {/* Description */}
              <View style={styles.descSection}>
                <Text style={styles.descTitle}>About this Medicine</Text>
                <Text style={styles.descText}>
                  {med.description ||
                    `${med.name} is commonly used for ${med.category?.toLowerCase() ?? "general care"}. Please use only under medical advice.`}
                </Text>

                {(hasValue(med.usageInstructions) ||
                  hasValue(med.indications) ||
                  hasValue(med.dosageInstructions) ||
                  sideEffects.length > 0 ||
                  hasValue(med.precautions) ||
                  drugInteractions.length > 0 ||
                  contraindications.length > 0) && (
                  <View style={styles.medicalSectionWrap}>
                    <Text style={styles.descTitle}>Medical Details</Text>
                    {renderMedicalSection(
                      "Usage Instructions",
                      med.usageInstructions,
                    )}
                    {renderMedicalSection("Indications", med.indications)}
                    {renderMedicalSection(
                      "Dosage Instructions",
                      med.dosageInstructions,
                    )}
                    {renderMedicalSection("Side Effects", sideEffects)}
                    {renderMedicalSection("Precautions", med.precautions)}
                    {renderMedicalSection(
                      "Drug Interactions",
                      drugInteractions,
                    )}
                    {renderMedicalSection(
                      "Contraindications",
                      contraindications,
                    )}
                  </View>
                )}

                {(hasValue(med.storageInstructions) ||
                  hasValue(med.expiryDate) ||
                  hasValue(med.precautions)) && (
                  <View style={styles.medicalSectionWrap}>
                    <Text style={styles.descTitle}>Additional Info</Text>
                    {!!med.storageInstructions && (
                      <Text style={styles.metaItem}>
                        Storage Conditions: {med.storageInstructions}
                      </Text>
                    )}
                    {!!med.expiryDate && (
                      <Text style={styles.metaItem}>
                        Expiry Awareness: Check expiry date before use.
                      </Text>
                    )}
                    {!!med.precautions && (
                      <Text style={styles.metaItem}>
                        Safety Advice: {med.precautions}
                      </Text>
                    )}
                  </View>
                )}

                {relatedMedicines.length > 0 && (
                  <View style={styles.relatedWrap}>
                    <Text style={styles.descTitle}>Related Medicines</Text>
                    {relatedMedicines.map((item) => (
                      <TouchableOpacity
                        key={`rel-${item._id || item.id}`}
                        style={styles.relatedItem}
                        onPress={() =>
                          router.push({
                            pathname: "/(patient)/medicine/[id]",
                            params: { id: item._id || item.id },
                          })
                        }
                      >
                        <Text style={styles.relatedName}>{item.name}</Text>
                        <Text style={styles.relatedPrice}>
                          Rs {Number(item.price || 0).toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {alternatives.length > 0 && (
                  <View style={styles.relatedWrap}>
                    <Text style={styles.descTitle}>Alternatives</Text>
                    {alternatives.map((item) => (
                      <TouchableOpacity
                        key={`alt-${item._id || item.id}`}
                        style={styles.relatedItem}
                        onPress={() =>
                          router.push({
                            pathname: "/(patient)/medicine/[id]",
                            params: { id: item._id || item.id },
                          })
                        }
                      >
                        <Text style={styles.relatedName}>{item.name}</Text>
                        <Text style={styles.relatedPrice}>
                          Rs {Number(item.price || 0).toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {frequentlyBoughtTogether.length > 0 && (
                  <View style={styles.relatedWrap}>
                    <Text style={styles.descTitle}>
                      Frequently Bought Together
                    </Text>
                    {frequentlyBoughtTogether.slice(0, 3).map((item) => (
                      <TouchableOpacity
                        key={`fbt-${item._id || item.id}`}
                        style={styles.relatedItem}
                        onPress={() =>
                          router.push({
                            pathname: "/(patient)/medicine/[id]",
                            params: { id: item._id || item.id },
                          })
                        }
                      >
                        <Text style={styles.relatedName}>{item.name}</Text>
                        <Text style={styles.relatedPrice}>
                          Rs {Number(item.price || 0).toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.tabContent}>
              <View style={styles.reviewSummary}>
                <Text style={styles.reviewSummaryTitle}>Ratings Snapshot</Text>
                <Text style={styles.reviewSummaryText}>
                  Average {ratingValue > 0 ? ratingValue.toFixed(1) : "0.0"} / 5
                  {reviewCount > 0 ? ` from ${reviewCount} ratings` : ""}
                </Text>
              </View>

              {reviews.length === 0 ? (
                <View style={styles.reviewEmptyWrap}>
                  <Text style={styles.reviewEmptyText}>No reviews yet.</Text>
                </View>
              ) : null}

              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.userImage || med.image }}
                      style={styles.reviewAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewUser}>
                        {review.userName || review.name || "Verified User"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {review.date || "Recently"}
                      </Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <Text style={styles.reviewStar}>★</Text>
                      <Text style={styles.reviewRatingText}>
                        {review.rating || 0}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>
                    {review.comment || "Great product and timely delivery."}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(patient)/review",
                    params: {
                      reviewType: "medicine",
                      entityId: medicineId,
                      entityName: med.name || "Medicine",
                      entitySubtitle: med.category || "Medicine",
                      entityImage: med.image || "",
                    },
                  })
                }
              >
                <Text style={styles.writeReviewText}>+ Write a Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: 16 + Math.max(insets.bottom, 8) },
        ]}
      >
        <View>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
            Total
          </Text>
          <Text
            style={{ fontSize: 20, fontWeight: "800", color: Colors.primary }}
          >
            Rs {(Number(med.price || 0) * qty).toFixed(2)}
          </Text>
        </View>
        <ButtonPrimary
          title="Add to Cart"
          onPress={handleAdd}
          disabled={med.inStock === false}
          style={{ flex: 1, marginLeft: 20, paddingVertical: 18 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
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
    textAlign: "left",
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  scroll: { paddingBottom: 120 },
  imageBg: {
    backgroundColor: Colors.surface,
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  medImage: { width: 180, height: 180 },
  infoCard: { padding: 20 },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  medName: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginRight: 10,
  },
  inStockBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inStockText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  outStockBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  outStockText: { fontSize: 11, fontWeight: "700", color: Colors.error },
  category: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 10,
  },
  rxNotice: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    marginBottom: 10,
  },
  rxNoticeText: {
    marginLeft: 6,
    fontSize: 11,
    color: "#92400E",
    fontWeight: "700",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  ratingText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 6 },
  price: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 4,
  },
  perUnit: { fontSize: 12, color: Colors.textSecondary, marginBottom: 20 },
  mrp: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.successPressed,
    marginBottom: 2,
  },
  tabs: {
    marginBottom: 14,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },
  tabContent: { marginTop: 0 },
  quickInfoWrap: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.background,
    padding: 12,
    marginBottom: 14,
  },
  quickInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  quickInfoItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  qtyLabel: { fontSize: 15, fontWeight: "600", color: Colors.text },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 24,
    padding: 4,
  },
  qBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    width: 36,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  highlights: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  highlightText: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  descSection: {},
  providerSection: {
    marginBottom: 18,
  },
  providerCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  providerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.lightGray,
  },
  providerLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
  },
  providerLogoFallbackText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  providerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  providerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  medicalSectionWrap: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  medicalBlock: {
    marginBottom: 12,
  },
  medicalBlockTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  medicalParagraph: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  medicalBullet: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  metaList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: { fontSize: 12, color: Colors.text, marginBottom: 6 },
  relatedWrap: {
    marginTop: 16,
  },
  relatedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: Colors.surface,
  },
  relatedName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: "600",
    marginRight: 8,
  },
  relatedPrice: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
  },
  reviewSummary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: Colors.background,
  },
  reviewSummaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  reviewSummaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reviewEmptyWrap: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginBottom: 12,
  },
  reviewEmptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  reviewCard: {
    marginBottom: 12,
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
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewStar: { fontSize: 12, color: "#D97706", marginRight: 4 },
  reviewRatingText: { fontSize: 12, fontWeight: "700", color: "#D97706" },
  reviewComment: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  writeReviewBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
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
  },
});
