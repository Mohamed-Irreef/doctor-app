import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Activity,
    ArrowRight,
    Bell,
    ChevronRight,
    Clock,
    FileText,
    FlaskConical,
    Hand,
    Heart,
    Menu,
    Pill,
    Plus,
    Search,
    ShieldCheck,
    ShoppingCart,
    Star,
    Stethoscope,
} from "lucide-react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedCard from "../../components/AnimatedCard";
import Badge, { getStatusVariant } from "../../components/Badge";
import BannerCarousel from "../../components/BannerCarousel";
import FadeInSection from "../../components/FadeInSection";
import { ListSkeleton } from "../../components/SkeletonLoader";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import {
    getApprovedPackages,
    getDoctors,
    getFeaturedArticles,
    getLabTests,
    getMedicines,
    getPatientAppointments,
} from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useDrawerStore } from "../../store/drawerStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import type { Article, Doctor } from "../../types";

const { width: W } = Dimensions.get("window");
const CARD_GAP = Spacing.md;
const ITEM_W = (W - 56) / 3;
const FEATURED_CARD_WIDTH = (W - Spacing.screenH * 2 - Spacing.sm) / 2;
const HOME_MED_CARD_GAP = Spacing.sm;
const HOME_MED_CARD_WIDTH = (W - Spacing.screenH * 2 - HOME_MED_CARD_GAP) / 2;
const HOME_PACKAGE_COL_GAP = Spacing.sm;
const OFFERS_TOP_CARD_WIDTH = W * 0.82;
const OFFERS_BOTTOM_CARD_WIDTH = W * 0.86;
const DEFAULT_BANNER_WIDTH = W - Spacing.screenH * 2;
const DEFAULT_BANNER_HEIGHT = DEFAULT_BANNER_WIDTH / 3.11;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const BANNERS = [
  {
    id: "1",
    title: "Consult Top Doctors",
    subtitle: "20% off your first booking",
    image:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
    cta: "Book Now",
    color: Colors.primary,
  },
  {
    id: "2",
    title: "Full Body Checkup",
    subtitle: "At-home sample collection",
    image:
      "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=800",
    cta: "Explore",
    color: Colors.secondary,
  },
  {
    id: "3",
    title: "Mental Wellness",
    subtitle: "Talk to a therapist from home",
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    cta: "Join Free",
    color: Colors.primaryPressed,
  },
];

const QUICK_ACTIONS = [
  {
    id: "1",
    label: "Book Doctor",
    image: require("../../assets/images/book_doctor.png"),
    route: "/(patient)/search",
  },
  {
    id: "2",
    label: "Video Consult",
    image: require("../../assets/images/video_consult.png"),
    route: "/(patient)/video-consult",
  },
  {
    id: "3",
    label: "Lab Tests",
    image: require("../../assets/images/lab_tests.png"),
    route: "/(patient)/labs",
  },
  {
    id: "4",
    label: "Medicines",
    image: require("../../assets/images/medicines.png"),
    route: "/(patient)/pharmacy",
  },
  {
    id: "5",
    label: "Records",
    image: require("../../assets/images/records.png"),
    route: "/(patient)/records",
  },
  {
    id: "6",
    label: "Favorites",
    image: require("../../assets/images/favourites.png"),
    route: "/(patient)/favorites",
  },
];

const OFFERS_TOP_ROW = [
  {
    id: "ot1",
    image: require("../../assets/images/offers-banner1.png"),
  },
  {
    id: "ot2",
    image: require("../../assets/images/offers-banner2.png"),
  },
];

const FEATURED_SERVICES = [
  {
    id: "fs1",
    image: require("../../assets/images/feature-banner1.png"),
  },
  {
    id: "fs2",
    image: require("../../assets/images/feature-banner2.png"),
  },
  {
    id: "fs3",
    image: require("../../assets/images/feature-banner3.png"),
  },
];

const OFFERS_BOTTOM_ROW = [
  {
    id: "ob1",
    image: require("../../assets/images/banner1.png"),
  },
  {
    id: "ob2",
    image: require("../../assets/images/banner2.png"),
  },
  {
    id: "ob3",
    image: require("../../assets/images/banner3.png"),
  },
  {
    id: "ob4",
    image: require("../../assets/images/banner4.png"),
  },
  {
    id: "ob5",
    image: require("../../assets/images/banner5.png"),
  },
];

const CATEGORIES = [
  {
    id: "1",
    name: "Cardiologist",
    color: Colors.errorLight,
    iconColor: Colors.error,
    icon: Heart,
  },
  {
    id: "2",
    name: "Dentist",
    color: Colors.secondaryLight,
    iconColor: Colors.secondaryPressed,
    icon: Stethoscope,
  },
  {
    id: "3",
    name: "Dermatologist",
    color: Colors.warningLight,
    iconColor: Colors.warningPressed,
    icon: Activity,
  },
  {
    id: "4",
    name: "Neurologist",
    color: Colors.primaryLight,
    iconColor: Colors.primary,
    icon: FileText,
  },
  {
    id: "5",
    name: "Pediatrics",
    color: Colors.successLight,
    iconColor: Colors.successPressed,
    icon: ShieldCheck,
  },
  {
    id: "6",
    name: "Orthopedic",
    color: "#FEF9C3",
    iconColor: "#CA8A04",
    icon: Pill,
  },
];

const AD_BANNERS = [
  {
    id: "ad1",
    title: "MediCare Plus",
    subtitle: "Comprehensive health insurance from INR 2900/mo",
    image: "https://picsum.photos/seed/ad1/800/400",
    badge: "Insurance",
  },
  {
    id: "ad2",
    title: "Apollo Hospital",
    subtitle: "World-class cardiac care. Free OPD this weekend.",
    image: "https://picsum.photos/seed/ad2/800/400",
    badge: "Hospital",
  },
];

const TRUST_HIGHLIGHTS = [
  {
    id: "1",
    value: "1000+",
    label: "Verified Doctors",
    iconColor: Colors.primary,
    color: Colors.primaryLight,
  },
  {
    id: "2",
    value: "24/7",
    label: "Support Available",
    iconColor: Colors.successPressed,
    color: Colors.successLight,
  },
  {
    id: "3",
    value: "50K+",
    label: "Happy Patients",
    iconColor: Colors.warningPressed,
    color: Colors.warningLight,
  },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const BannerSlide = memo(({ item }: { item: (typeof BANNERS)[0] }) => (
  <AnimatedCard style={styles.bannerCard} onPress={() => {}}>
    <Image
      source={{ uri: item.image }}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    />
    <View style={styles.bannerGradient}>
      <Text style={styles.bannerTitle}>{item.title}</Text>
      <Text style={styles.bannerSub}>{item.subtitle}</Text>
      <View style={styles.bannerCta}>
        <Text style={styles.bannerCtaText}>{item.cta}</Text>
        <ArrowRight size={13} color={Colors.textInverse} strokeWidth={2.5} />
      </View>
    </View>
  </AnimatedCard>
));

const SectionTitle = memo(
  ({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          style={styles.seeAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  ),
);

const DoctorHCard = memo(({ item, onPress, onFav, faved }: any) => (
  <AnimatedCard style={styles.docCard} onPress={onPress} withShadow>
    <Image source={{ uri: item.image }} style={styles.docImage} />
    {/* Online dot */}
    <View
      style={[
        styles.onlineDot,
        {
          backgroundColor: item.isOnline ? Colors.success : Colors.textDisabled,
        },
      ]}
    />
    <TouchableOpacity
      style={styles.heartBtn}
      onPress={(e) => {
        (e as any).stopPropagation?.();
        onFav();
      }}
      activeOpacity={0.8}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Heart
        size={13}
        color={faved ? Colors.error : Colors.textDisabled}
        fill={faved ? Colors.error : "none"}
      />
    </TouchableOpacity>
    <View style={styles.docInfo}>
      <Text style={styles.docName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.docSpec} numberOfLines={1}>
        {item.specialization}
      </Text>
      <View style={styles.docRow}>
        <Star size={10} color={Colors.ratingGold} fill={Colors.ratingGold} />
        <Text style={styles.docRating}>{item.rating}</Text>
        <Text style={styles.docExp}> · {item.experience}</Text>
      </View>
      <View style={styles.docBottom}>
        <Text style={styles.docFee}>₹{item.fee}</Text>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bookBtn}
        >
          <Text style={styles.bookBtnText}>Book</Text>
        </LinearGradient>
      </View>
    </View>
  </AnimatedCard>
));

const LabCard = memo(
  ({ item, onPress }: { item: any; onPress: (id: string) => void }) => {
    const id = item.id || item._id;
    const originalPrice = Number(item.originalPrice || item.price || 0);
    const offerPrice = Number(item.price || 0);
    const disc =
      originalPrice > 0
        ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
        : 0;
    const imageUrl =
      item.testImage || item.imageUrl || item.testImageUrl || item.image || "";
    return (
      <AnimatedCard
        style={styles.labCard}
        onPress={() => onPress(id)}
        withShadow
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.labImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.labImageFallback}>
            <FlaskConical color={Colors.secondary} size={26} />
          </View>
        )}
        {item.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
        <View style={styles.labContent}>
          <Text style={styles.labName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.labTime}>
            {item.reportTime || item.turnaround || "24 hrs"}
          </Text>
          <View style={styles.labPriceRow}>
            <Text style={styles.labPrice}>₹{offerPrice}</Text>
            <Text style={styles.labOriginal}>₹{originalPrice}</Text>
            {disc > 0 && (
              <View style={styles.discBadge}>
                <Text style={styles.discText}>{disc}% off</Text>
              </View>
            )}
          </View>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.labAddBtn}
          >
            <TouchableOpacity
              onPress={() => onPress(id)}
              style={styles.labAddBtnInner}
            >
              <Plus size={13} color={Colors.textInverse} />
              <Text style={styles.labAddText}>Add</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </AnimatedCard>
    );
  },
);

const MedCard = memo(
  ({
    item,
    onPress,
    onAdd,
  }: {
    item: any;
    onPress: (id: string) => void;
    onAdd: (item: any) => void;
  }) => (
    <AnimatedCard
      style={styles.medCard}
      onPress={() => onPress(item.id || item._id)}
      withShadow
    >
      <View style={styles.medImageWrap}>
        <Image source={{ uri: item.image }} style={styles.medImage} />
        <View style={styles.medBadgesRow}>
          {item.inStock !== false ? (
            <View style={styles.medStockBadge}>
              <Text style={styles.medStockBadgeText}>In Stock</Text>
            </View>
          ) : (
            <View style={styles.medOutBadge}>
              <Text style={styles.medOutBadgeText}>Out of Stock</Text>
            </View>
          )}
          {(Number(item.discountPercent || 0) > 0 ||
            (Number(item.mrp || 0) > Number(item.price || 0) &&
              Number(item.price || 0) > 0)) && (
            <View style={styles.medDiscountBadge}>
              <Text style={styles.medDiscountBadgeText}>
                {Number(item.discountPercent || 0) > 0
                  ? `${Math.round(Number(item.discountPercent))}% OFF`
                  : `${Math.round(
                      ((Number(item.mrp || 0) - Number(item.price || 0)) /
                        Number(item.mrp || 1)) *
                        100,
                    )}% OFF`}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.medName} numberOfLines={2}>
        {item.name}
      </Text>

      {item.prescriptionRequired ? (
        <Text style={styles.medRxInline}>Rx Required</Text>
      ) : null}

      {(item.strength || item.dosageForm) && (
        <Text style={styles.medMeta} numberOfLines={1}>
          {[item.strength, item.dosageForm].filter(Boolean).join(" • ")}
        </Text>
      )}

      <View style={styles.medBottom}>
        <View style={styles.medPriceRow}>
          <Text style={styles.medPrice}>
            ₹{Number(item.price || 0).toFixed(2)}
          </Text>
          {Number(item.mrp || 0) > Number(item.price || 0) ? (
            <Text style={styles.medMrp}>
              ₹{Number(item.mrp || 0).toFixed(2)}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.medAddToCartBtn,
            !item.inStock && styles.medAddDisabled,
          ]}
          onPress={() => onAdd(item)}
          disabled={!item.inStock}
          activeOpacity={0.85}
        >
          <Text style={styles.medAddToCartText}>
            {item.inStock ? "Add to Cart" : "Unavailable"}
          </Text>
        </TouchableOpacity>
      </View>
    </AnimatedCard>
  ),
);

const ArticleHCard = memo(
  ({ item, onPress }: { item: any; onPress: (slug: string) => void }) => (
    <AnimatedCard
      style={styles.articleCard}
      onPress={() => onPress(item.slug || item.id)}
      withShadow
    >
      <Image source={{ uri: item.image }} style={styles.articleImage} />
      <View style={styles.articleBody}>
        <View style={styles.articleCategoryBadge}>
          <Text style={styles.articleCategoryText}>{item.category}</Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.articleMeta}>
          <Clock size={10} color={Colors.primary} />
          <Text style={styles.articleTime}>{item.readTime}</Text>
        </View>
      </View>
    </AnimatedCard>
  ),
);

const OfferBannerCard = memo(
  ({
    item,
    width,
    height,
  }: {
    item: { id: string; image: any };
    width: number;
    height: number;
  }) => (
    <AnimatedCard
      style={[styles.offerBannerCard, { width, height }]}
      activeOpacity={0.92}
    >
      <Image
        source={item.image}
        style={styles.offerBannerImage}
        resizeMode="cover"
      />
    </AnimatedCard>
  ),
);

const PackageCard = memo(
  ({
    item,
    onPress,
    onBookNow,
  }: {
    item: any;
    onPress: (id: string) => void;
    onBookNow: (id: string) => void;
  }) => {
    const originalPrice = item.price?.original || 0;
    const offerPrice = item.price?.offer || originalPrice;
    const discount = item.price?.discount || 0;

    return (
      <AnimatedCard
        style={[
          styles.packageCard,
          { width: (W - Spacing.screenH * 2 - HOME_PACKAGE_COL_GAP) / 2 },
        ]}
        onPress={() => onPress(item._id || item.id)}
        withShadow
      >
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.packageCardImage} />
        )}
        {discount > 0 && (
          <View style={styles.packageOfferBadge}>
            <Text style={styles.packageOfferText}>{discount}% off</Text>
          </View>
        )}
        <View style={styles.packageCardContent}>
          <Text style={styles.packageCardName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.packageCardTests}>
            Includes {item.testCount || 0} tests
          </Text>
          <View style={styles.packageCardPrice}>
            <Text style={styles.packageCardOffer}>₹{offerPrice}</Text>
            {offerPrice !== originalPrice && (
              <Text style={styles.packageCardStrike}>₹{originalPrice}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.packageBookBtn}
            onPress={() => onBookNow(item._id || item.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.packageBookText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>
    );
  },
);

BannerSlide.displayName = "BannerSlide";
SectionTitle.displayName = "SectionTitle";
DoctorHCard.displayName = "DoctorHCard";
LabCard.displayName = "LabCard";
PackageCard.displayName = "PackageCard";
MedCard.displayName = "MedCard";
ArticleHCard.displayName = "ArticleHCard";
OfferBannerCard.displayName = "OfferBannerCard";

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function PatientHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { openDrawer } = useDrawerStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [offersTopIndex, setOffersTopIndex] = useState(0);
  const [offersBottomIndex, setOffersBottomIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [dr, ar, lr, pkg, mr, pr] = await Promise.all([
      getDoctors(),
      getFeaturedArticles(8),
      getLabTests(),
      getApprovedPackages({ limit: 10 }),
      getMedicines(),
      getPatientAppointments(),
    ]);
    if (dr.data) setDoctors(dr.data);
    if (ar.data) setArticles(ar.data as Article[]);
    if (lr.data) setLabs(lr.data);
    if (pkg.data)
      setPackages(
        Array.isArray(pkg.data) ? pkg.data : pkg.data?.packages || [],
      );
    if (mr.data) setMedicines(mr.data);
    if (pr.data) setAppointments(pr.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  };

  const isUpcomingAppointment = useCallback((appt: any) => {
    const status = String(appt?.status || "").toLowerCase();
    return status === "upcoming" || status === "pending";
  }, []);

  const getDoctorId = useCallback((doctor: any) => {
    return String(doctor?.id ?? doctor?._id ?? "");
  }, []);

  const handleToggleFavorite = useCallback(
    (doctor: any) => {
      const doctorId = getDoctorId(doctor);
      if (!doctorId) return;
      toggleFavorite({ ...(doctor as Doctor), id: doctorId });
    },
    [getDoctorId, toggleFavorite],
  );

  const getDoctorsBySpecialization = (keyword: string) => {
    const needle = keyword.toLowerCase();
    return doctors.filter((d) =>
      String(d.specialization || "")
        .toLowerCase()
        .includes(needle),
    );
  };

  const dermatologistDoctors = getDoctorsBySpecialization("dermat");
  const cardiologistDoctors = getDoctorsBySpecialization("cardio");
  const neurologistDoctors = getDoctorsBySpecialization("neuro");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* ── STICKY HEADER (Practo Dark Blue) ── */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryPressed]}
          style={styles.header}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={openDrawer}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ marginRight: Spacing.sm + 4 }}
            >
              <Menu color={Colors.textInverse} size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerLeft} activeOpacity={0.8}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: user?.image }} style={styles.avatar} />
                <View style={styles.avatarOnline} />
              </View>
              <View>
                <Text style={styles.greeting}>{greeting()}</Text>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>
                    {user?.name?.split(" ")[0] ?? "User"}
                  </Text>
                  <Hand
                    size={16}
                    color="#FBBF24"
                    strokeWidth={1.8}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/(patient)/notifications")}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Bell color={Colors.textInverse} size={19} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/(patient)/cart")}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ShoppingCart color={Colors.textInverse} size={19} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* ── SEARCH BAR ── */}
          <TouchableOpacity
            style={styles.searchBox}
            onPress={() => router.push("/(patient)/search")}
            activeOpacity={0.85}
          >
            <View style={styles.searchInner}>
              <Search color={Colors.textTertiary} size={17} />
              <Text style={styles.searchPlaceholder}>
                Search doctors, labs, medicines…
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── AI NiviDoc BANNER (Premium Gradient) ── */}
          <FadeInSection delay={50} style={styles.pad}>
            <AnimatedCard
              onPress={() => router.push("/(patient)/ai-chat")}
              scaleValue={0.97}
            >
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiBanner}
              >
                <View style={styles.aiBannerContent}>
                  <View style={styles.aiIconWrap}>
                    <Activity
                      color={Colors.gradientEnd}
                      size={18}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View style={styles.aiBannerTexts}>
                    <Text style={styles.aiBannerTitle}>
                      Nivi AI Symptom Checker
                    </Text>
                    <Text style={styles.aiBannerSub}>
                      Analyze your symptoms & find exactly which doctor to
                      consult.
                    </Text>
                  </View>
                </View>
                <ChevronRight color={Colors.textInverse} size={20} />
              </LinearGradient>
            </AnimatedCard>
          </FadeInSection>

          {/* ── HERO BANNER CAROUSEL ── */}
          <FadeInSection
            delay={100}
            style={[
              styles.pad,
              { marginBottom: Spacing.section, marginTop: Spacing.md },
            ]}
          >
            <BannerCarousel
              data={BANNERS}
              renderItem={(item) => <BannerSlide item={item} />}
            />
          </FadeInSection>

          {/* ── QUICK ACTIONS GRID ── */}
          <FadeInSection delay={200} style={styles.pad}>
            <View style={styles.qaGrid}>
              {QUICK_ACTIONS.map((a) => (
                <AnimatedCard
                  key={a.id}
                  style={styles.qaItem}
                  onPress={() => router.push(a.route as any)}
                  scaleValue={0.94}
                >
                  <Text style={styles.qaLabel}>{a.label}</Text>
                  <Image
                    source={a.image}
                    style={styles.qaImage}
                    resizeMode="contain"
                  />
                </AnimatedCard>
              ))}
            </View>
          </FadeInSection>

          {/* ── GENERAL BANNER ── */}
          <FadeInSection delay={250} style={styles.pad}>
            <AnimatedCard style={styles.generalBannerCard} activeOpacity={0.9}>
              <Image
                source={require("../../assets/images/general-banner.png")}
                style={styles.generalBannerImage}
                resizeMode="cover"
              />
            </AnimatedCard>
          </FadeInSection>

          {/* ── FEATURED SERVICES ── */}
          <FadeInSection delay={270} style={[styles.pad, styles.section]}>
            <SectionTitle title="Featured services" />
            <FlatList
              data={FEATURED_SERVICES}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: Spacing.sm }}
              ItemSeparatorComponent={() => (
                <View style={{ width: Spacing.sm }} />
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <OfferBannerCard
                  item={item}
                  width={FEATURED_CARD_WIDTH}
                  height={240}
                />
              )}
              onScroll={(event) => {
                const x = event.nativeEvent.contentOffset.x;
                const fullWidth = FEATURED_CARD_WIDTH + Spacing.sm;
                const maxOffset = Math.max(
                  fullWidth * (FEATURED_SERVICES.length - 2),
                  1,
                );
                const progress = Math.max(0, Math.min(1, x / maxOffset));
                const idx = Math.round(
                  progress * (FEATURED_SERVICES.length - 1),
                );
                setFeaturedIndex(idx);
              }}
              scrollEventThrottle={16}
            />
            <View style={styles.featuredDotsRow}>
              {FEATURED_SERVICES.map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.featuredDot,
                    idx === featuredIndex && styles.featuredDotActive,
                  ]}
                />
              ))}
            </View>
          </FadeInSection>

          {/* ── PRACTO OFFERS SECTION ── */}
          <FadeInSection delay={280} style={styles.section}>
            <View style={styles.practoSection}>
              <View style={styles.practoInner}>
                <View style={styles.practoTitleRow}>
                  <View style={styles.practoBadge}>
                    <Text style={styles.practoBadgeText}>%</Text>
                  </View>
                  <Text style={styles.practoTitle}>Best Offers</Text>
                </View>
                <Text style={styles.practoSubtitle}>
                  Explore deals, offers, health updates and more
                </Text>
              </View>

              <FlatList
                data={OFFERS_TOP_ROW}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                decelerationRate="fast"
                snapToInterval={OFFERS_TOP_CARD_WIDTH + Spacing.sm}
                snapToAlignment="start"
                contentContainerStyle={styles.practoRowContainer}
                ItemSeparatorComponent={() => <View style={styles.offerGap} />}
                renderItem={({ item }) => (
                  <OfferBannerCard
                    item={item}
                    width={OFFERS_TOP_CARD_WIDTH}
                    height={188}
                  />
                )}
                onMomentumScrollEnd={(event) => {
                  const x = event.nativeEvent.contentOffset.x;
                  const idx = Math.round(
                    x / (OFFERS_TOP_CARD_WIDTH + Spacing.sm),
                  );
                  const clamped = Math.max(
                    0,
                    Math.min(OFFERS_TOP_ROW.length - 1, idx),
                  );
                  setOffersTopIndex(clamped);
                }}
              />

              <View style={styles.practoDotsRow}>
                {OFFERS_TOP_ROW.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.practoDot,
                      idx === offersTopIndex && styles.practoDotActive,
                    ]}
                  />
                ))}
              </View>

              <View style={styles.practoInnerBottom}>
                <Text style={styles.practoTitle2}>
                  Safe and Secure surgeries
                </Text>
                <Text style={styles.practoSubtitle2}>
                  Get your first consultation FREE
                </Text>
              </View>

              <FlatList
                data={OFFERS_BOTTOM_ROW}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                decelerationRate="fast"
                snapToInterval={OFFERS_BOTTOM_CARD_WIDTH + Spacing.sm}
                snapToAlignment="start"
                contentContainerStyle={styles.practoRowContainer}
                ItemSeparatorComponent={() => <View style={styles.offerGap} />}
                renderItem={({ item }) => (
                  <OfferBannerCard
                    item={item}
                    width={OFFERS_BOTTOM_CARD_WIDTH}
                    height={220}
                  />
                )}
                onMomentumScrollEnd={(event) => {
                  const x = event.nativeEvent.contentOffset.x;
                  const idx = Math.round(
                    x / (OFFERS_BOTTOM_CARD_WIDTH + Spacing.sm),
                  );
                  const clamped = Math.max(
                    0,
                    Math.min(OFFERS_BOTTOM_ROW.length - 1, idx),
                  );
                  setOffersBottomIndex(clamped);
                }}
              />

              <View style={[styles.practoDotsRow, styles.practoBottomDots]}>
                {OFFERS_BOTTOM_ROW.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.practoDot,
                      idx === offersBottomIndex && styles.practoDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </FadeInSection>

          {/* ── TOP DOCTORS ── */}
          <FadeInSection delay={300} style={[styles.pad, styles.section]}>
            <SectionTitle
              title="Top Doctors"
              onSeeAll={() => router.push("/(patient)/search")}
            />
            {loading ? (
              <View style={{ flexDirection: "row" }}>
                <ListSkeleton count={2} type="doctor" />
              </View>
            ) : (
              <FlatList
                data={doctors}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(d) => getDoctorId(d)}
                renderItem={({ item }) => (
                  <DoctorHCard
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/doctor/[id]",
                        params: { id: getDoctorId(item) },
                      })
                    }
                    onFav={() => handleToggleFavorite(item)}
                    faved={isFavorite(getDoctorId(item))}
                  />
                )}
              />
            )}
          </FadeInSection>

          <FadeInSection delay={320} style={[styles.pad, styles.section]}>
            <SectionTitle
              title="Top Dermatologist"
              onSeeAll={() => router.push("/(patient)/search")}
            />
            {loading ? (
              <View style={{ flexDirection: "row" }}>
                <ListSkeleton count={2} type="doctor" />
              </View>
            ) : (
              <FlatList
                data={dermatologistDoctors}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(d) => getDoctorId(d)}
                ListEmptyComponent={
                  <Text style={styles.emptySpecialityText}>
                    No dermatologist found
                  </Text>
                }
                renderItem={({ item }) => (
                  <DoctorHCard
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/doctor/[id]",
                        params: { id: getDoctorId(item) },
                      })
                    }
                    onFav={() => handleToggleFavorite(item)}
                    faved={isFavorite(getDoctorId(item))}
                  />
                )}
              />
            )}
          </FadeInSection>

          <FadeInSection delay={340} style={[styles.pad, styles.section]}>
            <SectionTitle
              title="Top Cardiologist"
              onSeeAll={() => router.push("/(patient)/search")}
            />
            {loading ? (
              <View style={{ flexDirection: "row" }}>
                <ListSkeleton count={2} type="doctor" />
              </View>
            ) : (
              <FlatList
                data={cardiologistDoctors}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(d) => getDoctorId(d)}
                ListEmptyComponent={
                  <Text style={styles.emptySpecialityText}>
                    No cardiologist found
                  </Text>
                }
                renderItem={({ item }) => (
                  <DoctorHCard
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/doctor/[id]",
                        params: { id: getDoctorId(item) },
                      })
                    }
                    onFav={() => handleToggleFavorite(item)}
                    faved={isFavorite(getDoctorId(item))}
                  />
                )}
              />
            )}
          </FadeInSection>

          <FadeInSection delay={360} style={[styles.pad, styles.section]}>
            <SectionTitle
              title="Top Neurologist"
              onSeeAll={() => router.push("/(patient)/search")}
            />
            {loading ? (
              <View style={{ flexDirection: "row" }}>
                <ListSkeleton count={2} type="doctor" />
              </View>
            ) : (
              <FlatList
                data={neurologistDoctors}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(d) => getDoctorId(d)}
                ListEmptyComponent={
                  <Text style={styles.emptySpecialityText}>
                    No neurologist found
                  </Text>
                }
                renderItem={({ item }) => (
                  <DoctorHCard
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/doctor/[id]",
                        params: { id: getDoctorId(item) },
                      })
                    }
                    onFav={() => handleToggleFavorite(item)}
                    faved={isFavorite(getDoctorId(item))}
                  />
                )}
              />
            )}
          </FadeInSection>

          {/* ── DEFAULT BANNER ── */}
          <FadeInSection
            delay={350}
            style={[styles.pad, styles.defaultBannerSection]}
          >
            <Image
              source={require("../../assets/images/default.png")}
              style={styles.defaultBannerImage}
              resizeMode="contain"
            />
          </FadeInSection>

          {/* ── SPECIALITIES ── */}
          <FadeInSection delay={400} style={[styles.pad, styles.section]}>
            <SectionTitle
              title="Top Specialities"
              onSeeAll={() => router.push("/(patient)/search")}
            />
            <View style={styles.specGrid}>
              {CATEGORIES.slice(0, 6).map((cat) => (
                <AnimatedCard
                  key={cat.id}
                  style={styles.specItem}
                  onPress={() => router.push("/(patient)/search")}
                  scaleValue={0.94}
                >
                  <cat.icon
                    color={Colors.textInverse}
                    size={22}
                    strokeWidth={1.8}
                  />
                  <Text style={styles.specLabel} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </AnimatedCard>
              ))}
            </View>
          </FadeInSection>

          {/* ── LAB TESTS ── */}
          <FadeInSection delay={500} style={styles.section}>
            <View style={styles.pad}>
              <SectionTitle
                title="Lab Tests"
                onSeeAll={() => router.push("/(patient)/labs")}
              />
            </View>
            {loading ? (
              <View style={[{ flexDirection: "row" }, styles.pad]}>
                <ListSkeleton count={2} type="doctor" />
              </View>
            ) : (
              <FlatList
                data={labs}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.screenH }}
                keyExtractor={(t) => String(t.id || t._id)}
                renderItem={({ item }) => (
                  <LabCard
                    item={item}
                    onPress={(id) =>
                      router.push({
                        pathname: "/(patient)/lab/[id]",
                        params: { id },
                      })
                    }
                  />
                )}
              />
            )}
          </FadeInSection>

          {/* ── POPULAR HEALTH CHECKUP PACKAGES ── */}
          {packages.length > 0 && (
            <FadeInSection delay={520} style={styles.section}>
              <View style={styles.pad}>
                <SectionTitle
                  title="Popular Health Checkup Packages"
                  onSeeAll={() => router.push("/(patient)/packages")}
                />
              </View>
              <FlatList
                data={packages.slice(0, 4)}
                numColumns={2}
                columnWrapperStyle={{
                  paddingHorizontal: Spacing.screenH,
                  justifyContent: "space-between",
                }}
                scrollEnabled={false}
                keyExtractor={(p) => String(p._id || p.id)}
                renderItem={({ item }) => (
                  <PackageCard
                    item={item}
                    onPress={(id) =>
                      router.push({
                        pathname: "/(patient)/packages/[id]",
                        params: { id },
                      })
                    }
                    onBookNow={(id) =>
                      router.push({
                        pathname: "/(patient)/packages/checkout",
                        params: { id },
                      })
                    }
                  />
                )}
              />

              <View style={styles.packageLoadMoreWrap}>
                <TouchableOpacity
                  style={styles.packageLoadMoreBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(patient)/packages")}
                >
                  <Text style={styles.packageLoadMoreText}>Load More</Text>
                </TouchableOpacity>
              </View>
            </FadeInSection>
          )}

          {/* ── PHARMACY ── */}
          <FadeInSection delay={600} style={styles.section}>
            <View style={styles.pad}>
              <SectionTitle
                title="Medicines"
                onSeeAll={() => router.push("/(patient)/pharmacy")}
              />
            </View>
            {loading ? (
              <View style={[{ flexDirection: "row" }, styles.pad]}>
                <ListSkeleton count={3} type="article" />
              </View>
            ) : (
              <>
                <FlatList
                  data={medicines.slice(0, 4)}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={{
                    paddingHorizontal: Spacing.screenH,
                    paddingBottom: Spacing.xs,
                  }}
                  columnWrapperStyle={{ justifyContent: "space-between" }}
                  keyExtractor={(m) => String(m.id || m._id)}
                  renderItem={({ item }) => (
                    <MedCard
                      item={item}
                      onPress={(id) =>
                        router.push({
                          pathname: "/(patient)/medicine/[id]",
                          params: { id },
                        })
                      }
                      onAdd={(medItem) =>
                        addItem({
                          id: medItem.id || medItem._id,
                          name: medItem.name,
                          price: medItem.price,
                          image: medItem.image || "",
                          category: medItem.category,
                          prescriptionRequired: medItem.prescriptionRequired,
                          mrp: medItem.mrp,
                          deliveryEtaHours: medItem.deliveryEtaHours,
                        })
                      }
                    />
                  )}
                />

                <View style={styles.packageLoadMoreWrap}>
                  <TouchableOpacity
                    style={styles.packageLoadMoreBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push("/(patient)/pharmacy")}
                  >
                    <Text style={styles.packageLoadMoreText}>Load More</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </FadeInSection>

          {/* ── AD BANNERS ── */}
          <FadeInSection delay={720} style={[styles.pad, styles.section]}>
            <SectionTitle title="Featured" />
            <BannerCarousel
              data={AD_BANNERS}
              autoScrollInterval={3200}
              renderItem={(ad) => (
                <TouchableOpacity
                  style={styles.adBannerSlide}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: ad.image }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <View style={styles.adOverlay}>
                    <View style={styles.adBadge}>
                      <Text style={styles.adBadgeText}>{ad.badge}</Text>
                    </View>
                    <Text style={styles.adTitle}>{ad.title}</Text>
                    <Text style={styles.adSub}>{ad.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </FadeInSection>

          {/* ── HEALTH ARTICLES ── */}
          <FadeInSection delay={700} style={[styles.pad, styles.section]}>
            <SectionTitle
              title="Health Articles"
              onSeeAll={() => router.push("/(patient)/article")}
            />
            {loading ? (
              <ListSkeleton count={2} type="article" />
            ) : (
              <FlatList
                data={articles}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 6 }}
                keyExtractor={(item) => item.id || (item as any).slug}
                renderItem={({ item }) => (
                  <ArticleHCard
                    item={item}
                    onPress={(slug) =>
                      router.push({
                        pathname: "/(patient)/article/[id]",
                        params: { id: slug },
                      })
                    }
                  />
                )}
              />
            )}
          </FadeInSection>

          {/* ── TRUST SECTION ── */}
          <View style={[styles.pad, styles.section]}>
            <SectionTitle title="Why NiviDoc?" />
            <View style={styles.trustRow}>
              {TRUST_HIGHLIGHTS.map((t) => (
                <View
                  key={t.id}
                  style={[
                    styles.trustCard,
                    { borderColor: t.color, backgroundColor: Colors.surface },
                  ]}
                >
                  <View style={styles.trustIcon}>
                    <ShieldCheck
                      color={Colors.textInverse}
                      size={20}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={styles.trustValue}>{t.value}</Text>
                  <Text style={styles.trustLabel}>{t.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── UPCOMING APPOINTMENTS ── */}
          {appointments.length > 0 && (
            <View style={[styles.pad, styles.section]}>
              <SectionTitle
                title="Upcoming Appointments"
                onSeeAll={() => router.push("/(patient)/appointments")}
              />
              {appointments
                .filter(isUpcomingAppointment)
                .slice(0, 3)
                .map((appt) => (
                  <View key={appt._id || appt.id} style={styles.apptCard}>
                    <View
                      style={[
                        styles.apptAccent,
                        { backgroundColor: Colors.primary },
                      ]}
                    />
                    <Image
                      source={{ uri: appt.doctor?.image }}
                      style={styles.apptAvatar}
                    />
                    <View style={styles.apptInfo}>
                      <Text style={styles.apptDoc}>{appt.doctor?.name}</Text>
                      <Text style={styles.apptSub}>{appt.type}</Text>
                      <View style={styles.apptTimeRow}>
                        <Clock size={11} color={Colors.textTertiary} />
                        <Text style={styles.apptTime}>
                          {appt.date} · {appt.time}
                        </Text>
                      </View>
                    </View>
                    <Badge
                      label={
                        String(appt.status).toLowerCase() === "upcoming"
                          ? "Upcoming"
                          : "Pending"
                      }
                      variant={getStatusVariant(appt.status)}
                      size="sm"
                    />
                    <TouchableOpacity
                      style={styles.joinBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/(patient)/appointment/[id]",
                          params: { id: appt._id || appt.id },
                        })
                      }
                    >
                      <ArrowRight size={14} color={Colors.textInverse} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {/* ── NIVIDOC FOOTER ── */}
          <View style={styles.homeFooter}>
            <Text style={styles.homeFooterBrand}>NiviDoc</Text>
            <Text style={styles.homeFooterBody}>
              Our vision is to make quality healthcare accessible, affordable
              and convenient for everyone.
            </Text>
            <Text style={styles.homeFooterMeta}>Made with 💙 in Chennai</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 0 },

  // Header — Practo Dark Blue
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenH,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { position: "relative", marginRight: Spacing.sm + 2 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: Colors.border,
  },
  avatarOnline: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  greeting: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 1,
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  userName: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm - 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  cartBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: Colors.error,
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  cartBadgeText: { color: Colors.textInverse, fontSize: 9, fontWeight: "800" },

  // Utility
  pad: { paddingHorizontal: Spacing.screenH },
  section: { marginTop: Spacing.section + Spacing.xs },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitleText: { ...Typography.h3, fontSize: 18 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { ...Typography.label, color: Colors.primary },

  // Search
  searchBox: {
    marginHorizontal: Spacing.screenH,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: 13,
  },
  searchPlaceholder: { ...Typography.body2, color: Colors.textTertiary },

  // Banner
  bannerCard: { height: 180, borderRadius: Radius.lg, overflow: "hidden" },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bannerTitle: {
    color: Colors.textInverse,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginBottom: Spacing.sm + 4,
  },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignSelf: "flex-start",
  },
  bannerCtaText: { color: Colors.textInverse, fontWeight: "700", fontSize: 13 },

  // Quick Actions
  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  qaItem: {
    width: ITEM_W,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  qaLabel: {
    ...Typography.label,
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "left",
  },
  qaImage: {
    width: "100%",
    height: 64,
  },

  generalBannerCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  generalBannerImage: {
    width: "100%",
    height: 210,
  },

  defaultBannerSection: {
    marginTop: Spacing.xl,
    marginBottom: 0,
  },
  defaultBannerImage: {
    width: DEFAULT_BANNER_WIDTH,
    height: DEFAULT_BANNER_HEIGHT,
    alignSelf: "center",
    borderRadius: 18,
  },

  featuredDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  featuredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D4D4D8",
  },
  featuredDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  practoSection: {
    backgroundColor: "#121D73",
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  practoInner: {
    paddingHorizontal: Spacing.screenH,
  },
  practoInnerBottom: {
    paddingHorizontal: Spacing.screenH,
    marginTop: Spacing.md,
  },
  practoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  practoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  practoBadgeText: {
    color: "#121D73",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 16,
  },
  practoTitle: {
    color: Colors.textInverse,
    fontSize: 19,
    fontWeight: "800",
  },
  practoSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  practoTitle2: {
    color: Colors.textInverse,
    fontSize: 19,
    fontWeight: "800",
  },
  practoSubtitle2: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  practoRowContainer: {
    paddingHorizontal: Spacing.screenH,
    paddingRight: Spacing.screenH + Spacing.sm,
  },
  offerGap: {
    width: Spacing.sm,
  },
  offerBannerCard: {
    borderRadius: 14,
    overflow: "hidden",
  },
  offerBannerImage: {
    width: "100%",
    height: "100%",
  },
  practoDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  practoBottomDots: {
    marginTop: 14,
  },
  practoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  practoDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textInverse,
  },

  // Doctor Card
  docCard: {
    width: 180,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginRight: CARD_GAP,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docImage: { width: "100%", height: 125 },
  onlineDot: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.soft,
  },
  docInfo: { padding: Spacing.sm + 2 },
  docName: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  docSpec: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 5,
  },
  docRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  docRating: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.warningPressed,
    marginLeft: 3,
  },
  docExp: { ...Typography.caption, color: Colors.textTertiary, fontSize: 10 },
  docBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  docFee: { fontSize: 14, fontWeight: "800", color: Colors.text },
  emptySpecialityText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    paddingVertical: Spacing.sm,
  },
  availTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  availDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  availText: { fontSize: 9, fontWeight: "700", color: Colors.successPressed },
  bookBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: "hidden",
  },
  bookBtnText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: "700",
  },

  // Specialities
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  specItem: {
    width: ITEM_W,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E2F96",
    paddingVertical: Spacing.sm + 3,
    borderRadius: Radius.lg,
    minHeight: 92,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    ...Shadows.card,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
    color: Colors.textInverse,
  },

  // Labs
  labCard: {
    width: 175,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginRight: CARD_GAP,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  labImage: { width: "100%", height: 110, backgroundColor: Colors.border },
  labImageFallback: {
    width: "100%",
    height: 110,
    backgroundColor: Colors.secondaryUltraLight,
    alignItems: "center",
    justifyContent: "center",
  },
  labContent: { padding: Spacing.sm + 4 },
  popularBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    zIndex: 1,
  },
  popularText: { fontSize: 9, fontWeight: "700", color: Colors.warningPressed },
  labName: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 17,
  },
  labTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  labPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  labPrice: { fontSize: 15, fontWeight: "800", color: Colors.text },
  labOriginal: { ...Typography.caption, textDecorationLine: "line-through" },
  discBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginLeft: "auto",
  },
  discText: { fontSize: 9, fontWeight: "700", color: Colors.successPressed },
  labAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.sm,
    paddingVertical: 7,
  },
  labAddText: { color: Colors.textInverse, fontSize: 12, fontWeight: "700" },
  labAddBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  // Pharmacy
  pharmBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.secondaryLight,
    borderWidth: 1,
    borderColor: Colors.secondaryLight,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm + 6,
  },
  pharmText: {
    ...Typography.caption,
    color: Colors.secondaryPressed,
    fontWeight: "600",
  },
  medCard: {
    width: HOME_MED_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.sm + 2,
    minHeight: 235,
    ...Shadows.soft,
  },
  medImageWrap: {
    position: "relative",
    marginBottom: 8,
  },
  medImage: {
    width: "100%",
    height: 88,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lightGray,
  },
  medBadgesRow: {
    position: "absolute",
    left: 6,
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  medStockBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  medStockBadgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  medOutBadge: {
    backgroundColor: "#991B1B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  medOutBadgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  medDiscountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  medDiscountBadgeText: {
    fontSize: 9,
    color: Colors.textInverse,
    fontWeight: "800",
  },
  medName: {
    ...Typography.caption,
    fontWeight: "700",
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 16,
  },
  medRxInline: {
    alignSelf: "flex-start",
    fontSize: 10,
    color: "#92400E",
    fontWeight: "700",
    backgroundColor: "#FEF3C7",
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  medBrand: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: "600",
  },
  medCategory: {
    fontSize: 11,
    color: Colors.primary,
    marginBottom: 2,
    fontWeight: "600",
  },
  medMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 8,
    lineHeight: 14,
    fontWeight: "600",
  },
  medBottom: {
    marginTop: "auto",
    gap: 6,
  },
  medPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  medPrice: { fontSize: 14, fontWeight: "800", color: Colors.primary },
  medMrp: {
    fontSize: 11,
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  medAddToCartBtn: {
    width: "100%",
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  medAddToCartText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: "700",
  },
  medAddDisabled: {
    backgroundColor: Colors.border,
  },

  // Articles
  articleCard: {
    width: 295,
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm + 4,
    ...Shadows.soft,
  },
  articleImage: { width: 108, height: 108 },
  articleBody: {
    flex: 1,
    padding: Spacing.sm + 4,
    justifyContent: "center",
    gap: 5,
  },
  articleCategoryBadge: {
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },
  articleCategoryText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.primary,
  },
  articleTitle: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  articleMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  articleTime: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Ads
  adBanner: {
    height: 110,
    marginHorizontal: Spacing.screenH,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm + 4,
    ...Shadows.soft,
  },
  adBannerSlide: {
    height: 110,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadows.soft,
  },
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.44)",
    padding: Spacing.md,
    justifyContent: "center",
  },
  adBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  adBadgeText: { color: Colors.textInverse, fontSize: 9, fontWeight: "700" },
  adTitle: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  adSub: { color: "rgba(255,255,255,0.82)", fontSize: 11 },

  // Trust
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  trustCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 4,
    alignItems: "center",
    borderWidth: 1.5,
    ...Shadows.soft,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  trustValue: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
    color: Colors.primary,
  },
  trustLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  homeFooter: {
    marginTop: Spacing.xl,
    backgroundColor: "#243593",
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl + 18,
    marginBottom: 0,
  },
  homeFooterBrand: {
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  homeFooterBody: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  homeFooterMeta: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: "700",
  },

  // Appointments
  apptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm + 4,
    overflow: "hidden",
    ...Shadows.soft,
  },
  apptAccent: { width: 4, alignSelf: "stretch" },
  apptAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    marginRight: Spacing.sm + 2,
    marginLeft: Spacing.sm + 2,
    backgroundColor: Colors.border,
  },
  apptInfo: { flex: 1, paddingVertical: Spacing.sm + 4 },
  apptDoc: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.text,
    fontWeight: "700",
  },
  apptSub: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 3,
  },
  apptTimeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  apptTime: { ...Typography.caption, color: Colors.textTertiary },
  joinBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm + 4,
    marginLeft: Spacing.sm,
  },

  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    justifyContent: "space-between",
  },
  aiBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  aiBannerTexts: {
    flex: 1,
    paddingRight: 12,
  },
  aiBannerTitle: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  aiBannerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 16,
  },

  // Package Cards
  packageCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm + 2,
    ...Shadows.soft,
  },
  packageCardImage: {
    width: "100%",
    height: 140,
    backgroundColor: Colors.border,
  },
  packageOfferBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    zIndex: 10,
  },
  packageOfferText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: "800",
  },
  packageCardContent: {
    padding: Spacing.sm,
  },
  packageCardName: {
    ...Typography.subheading,
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 16,
  },
  packageCardTests: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  packageCardPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  packageCardOffer: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  packageCardStrike: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },

  packageBookBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: "center",
  },
  packageBookText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: "800",
  },

  packageLoadMoreWrap: {
    paddingHorizontal: Spacing.screenH,
    marginTop: Spacing.md,
  },
  packageLoadMoreBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  packageLoadMoreText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
