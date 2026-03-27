import { useRouter } from 'expo-router';
import {
    Activity,
    ArrowRight,
    Bell,
    Check,
    ChevronRight,
    Clock,
    FileText,
    Heart,
    MapPin,
    Menu,
    Pill,
    Plus,
    Search,
    ShieldCheck,
    ShoppingCart,
    Star,
    Stethoscope,
    Video
} from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList, Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedCard from '../../components/AnimatedCard';
import BannerCarousel from '../../components/BannerCarousel';
import FadeInSection from '../../components/FadeInSection';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { Colors } from '../../constants/Colors';
import {
    AD_BANNERS,
    CATEGORIES,
    HEALTH_REMINDERS,
    LAB_TESTS, MEDICINES,
    RECENT_ACTIVITY,
    TRUST_HIGHLIGHTS,
    UPCOMING_APPOINTMENTS
} from '../../constants/MockData';
import { Typography } from '../../constants/Typography';
import { getArticles, getDoctors } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useDrawerStore } from '../../store/drawerStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import type { Article, Doctor } from '../../types';

const { width: W } = Dimensions.get('window');

// ─── HERO BANNERS ─────────────────────────────────────────────────────────────
const BANNERS = [
  { id: '1', title: 'Consult Top Doctors', subtitle: '20% off your first booking', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800', cta: 'Book Now', color: '#1D4ED8' },
  { id: '2', title: 'Full Body Checkup', subtitle: 'At-home sample collection', image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=800', cta: 'Explore', color: '#0D9488' },
  { id: '3', title: 'Mental Wellness', subtitle: 'Talk to a therapist from home', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800', cta: 'Join Free', color: '#7C3AED' },
];

// ─── QUICK ACTIONS ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: '1', label: 'Book Doctor',  icon: Stethoscope, bg: '#DBEAFE', fg: '#2563EB', route: '/(patient)/search' },
  { id: '2', label: 'Video Consult', icon: Video,       bg: '#DCFCE7', fg: '#16A34A', route: '/(patient)/consultation' },
  { id: '3', label: 'Lab Tests',    icon: Activity,    bg: '#FEF3C7', fg: '#D97706', route: '/(patient)/labs' },
  { id: '4', label: 'Medicines',    icon: Pill,        bg: '#F3E8FF', fg: '#7C3AED', route: '/(patient)/pharmacy' },
  { id: '5', label: 'Records',      icon: FileText,    bg: '#FEE2E2', fg: '#EF4444', route: '/(patient)/records' },
  { id: '6', label: 'Favorites',    icon: Heart,       bg: '#FCE7F3', fg: '#DB2777', route: '/(patient)/favorites' },
];

// ─── Memoized sub-components ──────────────────────────────────────────────────

const BannerSlide = memo(({ item, router }: { item: typeof BANNERS[0]; router: any }) => (
  <AnimatedCard style={styles.bannerCard} onPress={() => {}}>
    <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
    <View style={[styles.bannerOverlay, { backgroundColor: item.color + '99' }]}>
      <Text style={styles.bannerTitle}>{item.title}</Text>
      <Text style={styles.bannerSub}>{item.subtitle}</Text>
      <TouchableOpacity style={[styles.bannerCta, { backgroundColor: item.color }]} activeOpacity={0.85}>
        <Text style={styles.bannerCtaText}>{item.cta}</Text>
      </TouchableOpacity>
    </View>
  </AnimatedCard>
));

const SectionTitle = memo(({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => (
  <View style={styles.sectionTitle}>
    <Text style={Typography.h3}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} style={styles.seeAll}>
        <Text style={styles.seeAllText}>See All</Text>
        <ChevronRight size={16} color={Colors.primary} />
      </TouchableOpacity>
    )}
  </View>
));

const DoctorHCard = memo(({ item, onPress, onFav, faved }: any) => (
  <AnimatedCard style={styles.docCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.docImage} />
    <TouchableOpacity style={styles.heartBtn} onPress={onFav} activeOpacity={0.8} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Heart size={14} color={faved ? Colors.error : '#999'} fill={faved ? Colors.error : 'none'} />
    </TouchableOpacity>
    <View style={styles.docInfo}>
      <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.docSpec}>{item.specialization}</Text>
      <View style={styles.docRow}>
        <Star size={11} color="#F59E0B" fill="#F59E0B" />
        <Text style={styles.docRating}>{item.rating}</Text>
        <Text style={styles.docExp}> · {item.experience}</Text>
      </View>
      <View style={styles.docBottom}>
        <Text style={styles.docFee}>₹{item.fee}</Text>
        <View style={styles.availTag}><Text style={styles.availText}>Available</Text></View>
      </View>
    </View>
  </AnimatedCard>
));

const LabCard = memo(({ item, onPress }: { item: any; onPress: (id: string) => void }) => {
  const disc = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
  return (
    <AnimatedCard style={styles.labCard} onPress={() => onPress(item.id)}>
      <Image source={{ uri: item.image }} style={styles.labImage} />
      {item.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>Popular</Text></View>}
      <View style={styles.labContent}>
        <Text style={styles.labName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.labTime}>⏱ {item.turnaround}</Text>
        <View style={styles.labPriceRow}>
          <Text style={styles.labPrice}>₹{item.price}</Text>
          <Text style={styles.labOriginal}>₹{item.originalPrice}</Text>
          <View style={styles.discBadge}><Text style={styles.discText}>{disc}% off</Text></View>
        </View>
        <TouchableOpacity style={styles.labAddBtn} onPress={() => onPress(item.id)}>
          <Plus size={14} color={Colors.surface} />
          <Text style={styles.labAddText}>Add</Text>
        </TouchableOpacity>
      </View>
    </AnimatedCard>
  );
});

const MedCard = memo(({ item, onPress }: { item: any; onPress: (id: string) => void }) => (
  <AnimatedCard style={styles.medCard} onPress={() => onPress(item.id)}>
    <Image source={{ uri: item.image }} style={styles.medImage} />
    <Text style={styles.medName} numberOfLines={2}>{item.name}</Text>
    <View style={styles.medBottom}>
      <Text style={styles.medPrice}>₹{item.price.toFixed(2)}</Text>
      <TouchableOpacity style={[styles.medAddBtn, !item.inStock && { backgroundColor: Colors.border }]} disabled={!item.inStock}>
        {item.inStock ? <Plus size={14} color={Colors.surface} /> : <Text style={{ fontSize: 9, color: Colors.textSecondary }}>Out</Text>}
      </TouchableOpacity>
    </View>
  </AnimatedCard>
));

const ArticleHCard = memo(({ item, onPress }: { item: any; onPress: (id: string) => void }) => (
  <AnimatedCard style={styles.articleCard} onPress={() => onPress(item.id)}>
    <Image source={{ uri: item.image }} style={styles.articleImage} />
    <View style={styles.articleBody}>
      <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.articleDesc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.articleTime}>{item.readTime}</Text>
    </View>
  </AnimatedCard>
));

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function PatientHomeScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { openDrawer } = useDrawerStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const cartItems = useCartStore(s => s.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [dr, ar] = await Promise.all([getDoctors(), getArticles()]);
    if (dr.data) setDoctors(dr.data);
    if (ar.data) setArticles(ar.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── 1. STICKY HEADER ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openDrawer} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ marginRight: 12 }}>
            <Menu color={Colors.text} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerLeft} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image source={{ uri: user?.image }} style={styles.avatar} />
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] ?? 'User'} 👋</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.locBtn} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MapPin size={12} color={Colors.primary} />
            <Text style={styles.locText}>New York</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(patient)/notifications')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell color={Colors.text} size={20} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.notifBtn, { marginLeft: 10 }]}
            onPress={() => router.push('/(patient)/cart')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ShoppingCart color={Colors.text} size={20} />
            {cartCount > 0 && (
              <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: Colors.error, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── 2. SEARCH BAR ── */}
        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => router.push('/(patient)/search')}
          activeOpacity={0.85}
        >
          <Search color={Colors.textSecondary} size={18} />
          <Text style={styles.searchPlaceholder}>Search doctors, specialties, clinics…</Text>
        </TouchableOpacity>

        {/* ── 3. HERO BANNER CAROUSEL ── */}
        <FadeInSection delay={100} style={[styles.pad, { marginBottom: 24 }]}>
          <BannerCarousel
            data={BANNERS}
            renderItem={(item) => <BannerSlide item={item} router={router} />}
          />
        </FadeInSection>

        {/* ── 4. QUICK ACTION GRID ── */}
        <FadeInSection delay={200} style={styles.pad}>
          <View style={styles.qaGrid}>
            {QUICK_ACTIONS.map(a => (
              <AnimatedCard
                key={a.id}
                style={styles.qaItem}
                onPress={() => router.push(a.route as any)}
              >
                <View style={[styles.qaIcon, { backgroundColor: a.bg }]}>
                  <a.icon color={a.fg} size={24} />
                </View>
                <Text style={styles.qaLabel}>{a.label}</Text>
              </AnimatedCard>
            ))}
          </View>
        </FadeInSection>

        {/* ── 5. TOP DOCTORS ── */}
        <FadeInSection delay={300} style={[styles.pad, styles.section]}>
          <SectionTitle title="Top Doctors" onSeeAll={() => router.push('/(patient)/search')} />
          {loading ? (
            <View style={{ flexDirection: 'row' }}>
              <ListSkeleton count={2} type="doctor" />
            </View>
          ) : (
            <FlatList
              data={doctors}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={d => d.id}
              renderItem={({ item }) => (
                <DoctorHCard
                  item={item}
                  onPress={() => router.push({ pathname: '/(patient)/doctor/[id]', params: { id: item.id } })}
                  onFav={() => toggleFavorite(item)}
                  faved={isFavorite(item.id)}
                />
              )}
            />
          )}
        </FadeInSection>

        {/* ── 6. SPECIALITIES GRID ── */}
        <FadeInSection delay={400} style={[styles.pad, styles.section]}>
          <SectionTitle title="Top Specialities" onSeeAll={() => router.push('/(patient)/search')} />
          <View style={styles.specGrid}>
            {CATEGORIES.slice(0, 6).map(cat => (
              <AnimatedCard
                key={cat.id}
                style={[styles.specItem, { backgroundColor: cat.color }]}
                onPress={() => router.push('/(patient)/search')}
              >
                <Stethoscope color={cat.iconColor} size={22} />
                <Text style={[styles.specLabel, { color: cat.iconColor }]} numberOfLines={1}>{cat.name}</Text>
              </AnimatedCard>
            ))}
          </View>
        </FadeInSection>

        {/* ── 7. LAB TESTS ── */}
        <FadeInSection delay={500} style={[styles.section]}>
          <View style={styles.pad}>
            <SectionTitle title="Lab Tests" onSeeAll={() => router.push('/(patient)/labs')} />
            <View style={styles.labBanner}>
              <Activity color={Colors.primary} size={20} />
              <Text style={styles.labBannerText}>Free home sample collection · Results in 24–72 hrs</Text>
            </View>
          </View>
          {loading ? (
             <View style={[{ flexDirection: 'row' }, styles.pad]}>
               <ListSkeleton count={2} type="doctor" />
             </View>
          ) : (
            <FlatList
              data={LAB_TESTS}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              keyExtractor={t => t.id}
              renderItem={({ item }) => (
                <LabCard item={item} onPress={(id) => router.push({ pathname: '/(patient)/lab/[id]', params: { id } })} />
              )}
            />
          )}
        </FadeInSection>

        {/* ── 8. PHARMACY ── */}
        <FadeInSection delay={600} style={[styles.section]}>
          <View style={styles.pad}>
            <SectionTitle title="Medicines" onSeeAll={() => router.push('/(patient)/pharmacy')} />
            <View style={styles.pharmBanner}>
              <Pill color="#7C3AED" size={18} />
              <Text style={styles.pharmText}>Up to 30% off on all medicines</Text>
            </View>
          </View>
          {loading ? (
             <View style={[{ flexDirection: 'row' }, styles.pad]}>
               <ListSkeleton count={3} type="article" />
             </View>
          ) : (
            <FlatList
              data={MEDICINES}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              keyExtractor={m => m.id}
              renderItem={({ item }) => (
                <MedCard item={item} onPress={(id) => router.push({ pathname: '/(patient)/medicine/[id]', params: { id } })} />
              )}
            />
          )}
        </FadeInSection>

        {/* ── 9. HEALTH ARTICLES ── */}
        <FadeInSection delay={700} style={[styles.pad, styles.section]}>
          <SectionTitle title="Health Articles" onSeeAll={() => {}} />
          {loading ? <ListSkeleton count={2} type="article" /> : (
            articles.map(a => (
              <ArticleHCard key={a.id} item={a} onPress={(id) => router.push({ pathname: '/(patient)/article/[id]', params: { id } })} />
            ))
          )}
        </FadeInSection>

        {/* ── 10. ADVERTISEMENT BANNERS ── */}
        <View style={[styles.section]}>
          <View style={styles.pad}>
            <SectionTitle title="Featured" />
          </View>
          {AD_BANNERS.map(ad => (
            <TouchableOpacity key={ad.id} style={styles.adBanner} activeOpacity={0.85}>
              <Image source={{ uri: ad.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.adOverlay}>
                <View style={styles.adBadge}><Text style={styles.adBadgeText}>{ad.badge}</Text></View>
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adSub}>{ad.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 11. TRUST SECTION ── */}
        <View style={[styles.pad, styles.section]}>
          <SectionTitle title="Why MediBook?" />
          <View style={styles.trustRow}>
            {TRUST_HIGHLIGHTS.map(t => (
              <View key={t.id} style={[styles.trustCard, { backgroundColor: t.color }]}>
                <ShieldCheck color={t.iconColor} size={24} />
                <Text style={[styles.trustValue, { color: t.iconColor }]}>{t.value}</Text>
                <Text style={styles.trustLabel}>{t.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 12. UPCOMING APPOINTMENTS ── */}
        {UPCOMING_APPOINTMENTS.length > 0 && (
          <View style={[styles.pad, styles.section]}>
            <SectionTitle title="Upcoming Appointments" onSeeAll={() => router.push('/(patient)/appointments')} />
            {UPCOMING_APPOINTMENTS.map(appt => (
              <View key={appt.id} style={styles.apptCard}>
                <Image source={{ uri: appt.doctor.image }} style={styles.apptAvatar} />
                <View style={styles.apptInfo}>
                  <Text style={styles.apptDoc}>{appt.doctor.name}</Text>
                  <Text style={styles.apptSub}>{appt.doctor.specialization}</Text>
                  <View style={styles.apptTimeRow}>
                    <Clock size={12} color={Colors.textSecondary} />
                    <Text style={styles.apptTime}>{appt.date} · {appt.time}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.joinBtn, appt.status === 'Pending' && { backgroundColor: Colors.border }]}
                  onPress={() => router.push({ pathname: '/(patient)/appointment/[id]', params: { id: appt.id } })}
                >
                  <Text style={[styles.joinText, appt.status === 'Pending' && { color: Colors.textSecondary }]}>
                    {appt.status === 'Upcoming' ? 'Join' : 'View'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── 13. HEALTH REMINDERS ── */}
        <View style={[styles.pad, styles.section]}>
          <SectionTitle title="Health Reminders" />
          {HEALTH_REMINDERS.map(r => (
            <View key={r.id} style={styles.reminderRow}>
              <View style={styles.reminderIcon}>
                <Check size={14} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>{r.title}</Text>
                <Text style={styles.reminderTime}>{r.time}</Text>
              </View>
              <View style={[styles.reminderBadge, { backgroundColor: r.done ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: r.done ? Colors.success : '#D97706' }}>
                  {r.done ? 'Done' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── 14. RECENT ACTIVITY ── */}
        <View style={[styles.pad, { ...styles.section, marginBottom: 32 }]}>
          <SectionTitle title="Recent Activity" />
          {RECENT_ACTIVITY.map(ra => (
            <TouchableOpacity key={ra.id} style={styles.activityRow} activeOpacity={0.8}>
              <View style={styles.activityIcon}>
                <Stethoscope size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle} numberOfLines={1}>{ra.title}</Text>
                <Text style={styles.activitySub}>{ra.subtitle}</Text>
              </View>
              <ArrowRight size={16} color={Colors.border} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: Colors.border },
  greeting: { fontSize: 12, color: Colors.textSecondary },
  userName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  locText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.error },

  // Utils
  pad: { paddingHorizontal: 20 },
  section: { marginTop: 28 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 20, marginTop: 16, marginBottom: 24,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchPlaceholder: { color: Colors.textSecondary, fontSize: 14 },

  // Banner
  bannerCard: { height: 176, borderRadius: 20, overflow: 'hidden' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, padding: 20, justifyContent: 'center' },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 16 },
  bannerCta: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, alignSelf: 'flex-start' },
  bannerCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Quick Actions
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  qaItem: { width: (W - 56) / 3, alignItems: 'center', marginBottom: 16 },
  qaIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qaLabel: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center' },

  // Doctor Card
  docCard: {
    width: 170, backgroundColor: Colors.surface, borderRadius: 18, overflow: 'hidden',
    marginRight: 14, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  docImage: { width: '100%', height: 120 },
  heartBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.black, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  docInfo: { padding: 10 },
  docName: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  docSpec: { fontSize: 11, color: Colors.primary, fontWeight: '500', marginBottom: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  docRating: { fontSize: 11, fontWeight: '700', color: '#D97706', marginLeft: 3 },
  docExp: { fontSize: 11, color: Colors.textSecondary },
  docBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  docFee: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  availTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  availText: { fontSize: 9, fontWeight: '600', color: '#16A34A' },

  // Specialities
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  specItem: {
    width: (W - 56) / 3, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, marginBottom: 12,
  },
  specLabel: { fontSize: 10, fontWeight: '700', marginTop: 6, textAlign: 'center' },

  // Lab Tests
  labBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF',
    padding: 12, borderRadius: 12, marginBottom: 14,
  },
  labBannerText: { fontSize: 12, fontWeight: '500', color: Colors.primary, flex: 1 },
  labCard: {
    width: 170, backgroundColor: Colors.surface, borderRadius: 16,
    marginRight: 14, borderWidth: 1, borderColor: Colors.border, position: 'relative', overflow: 'hidden'
  },
  labImage: { width: '100%', height: 100, backgroundColor: Colors.border },
  labContent: { padding: 14 },
  popularBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 1 },
  popularText: { fontSize: 9, fontWeight: '700', color: '#D97706' },
  labName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 4, marginTop: 2, lineHeight: 18 },
  labTime: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  labPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  labPrice: { fontSize: 16, fontWeight: '800', color: Colors.text },
  labOriginal: { fontSize: 11, color: Colors.textSecondary, textDecorationLine: 'line-through' },
  discBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
  discText: { fontSize: 9, fontWeight: '700', color: '#16A34A' },
  labAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 8,
  },
  labAddText: { color: Colors.surface, fontSize: 12, fontWeight: '700' },

  // Pharmacy
  pharmBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3E8FF',
    padding: 12, borderRadius: 12, marginBottom: 14,
  },
  pharmText: { fontSize: 12, fontWeight: '600', color: '#7C3AED' },
  medCard: {
    width: 130, backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    marginRight: 12, borderWidth: 1, borderColor: Colors.border, padding: 10,
  },
  medImage: { width: '100%', height: 80, borderRadius: 10, backgroundColor: Colors.lightGray, marginBottom: 8 },
  medName: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 8, lineHeight: 16 },
  medBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  medPrice: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  medAddBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Articles
  articleCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  articleImage: { width: 104, height: 100 },
  articleBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  articleTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, lineHeight: 18 },
  articleDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  articleTime: { fontSize: 10, fontWeight: '600', color: Colors.primary },

  // Ads
  adBanner: { height: 110, marginHorizontal: 20, borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  adOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.46)', padding: 16, justifyContent: 'center' },
  adBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  adBadgeText: { color: Colors.surface, fontSize: 9, fontWeight: '700' },
  adTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  adSub: { color: 'rgba(255,255,255,0.82)', fontSize: 11 },

  // Trust
  trustRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trustCard: {
    flex: 1, marginHorizontal: 4, borderRadius: 16, padding: 14, alignItems: 'center',
  },
  trustValue: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  trustLabel: { fontSize: 10, fontWeight: '500', color: Colors.text, textAlign: 'center' },

  // Appointments
  apptCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  apptAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: Colors.border },
  apptInfo: { flex: 1 },
  apptDoc: { fontSize: 13, fontWeight: '700', color: Colors.text },
  apptSub: { fontSize: 11, color: Colors.primary, fontWeight: '500', marginBottom: 4 },
  apptTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apptTime: { fontSize: 11, color: Colors.textSecondary },
  joinBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  joinText: { color: Colors.surface, fontSize: 12, fontWeight: '700' },

  // Reminders
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10, gap: 12,
  },
  reminderIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  reminderTime: { fontSize: 11, color: Colors.textSecondary },
  reminderBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

  // Recent Activity
  activityRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10, gap: 12,
  },
  activityIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  activitySub: { fontSize: 11, color: Colors.textSecondary },
});
