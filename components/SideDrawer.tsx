import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Activity,
    Bell,
    CalendarHeart,
    ChevronRight,
    CreditCard,
    FileText,
    Heart,
    HelpCircle,
    LogOut,
    PhoneCall,
    Pill,
    Settings,
    ShoppingBag,
    TestTube,
    Video,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { Shadows } from "../constants/Shadows";
import { Radius } from "../constants/Spacing";
import { useAuthStore } from "../store/authStore";
import { useDrawerStore } from "../store/drawerStore";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.82;

const DRAWER_GROUPS = [
  {
    title: "Core Services",
    items: [
      {
        id: "book",
        label: "Book Doctor",
        icon: CalendarHeart,
        route: "/(patient)/search",
      },
      {
        id: "video",
        label: "Video Consultation",
        icon: Video,
        route: "/(patient)/search",
      },
      {
        id: "labs",
        label: "Lab Tests",
        icon: Activity,
        route: "/(patient)/labs",
      },
      {
        id: "meds",
        label: "Medicines",
        icon: Pill,
        route: "/(patient)/pharmacy",
      },
    ],
  },
  {
    title: "Personal",
    items: [
      {
        id: "favs",
        label: "Favorites",
        icon: Heart,
        route: "/(patient)/favorites",
      },
      {
        id: "notifs",
        label: "Notifications",
        icon: Bell,
        route: "/(patient)/notifications",
      },
      {
        id: "records",
        label: "Health Records",
        icon: FileText,
        route: "/(patient)/records",
      },
    ],
  },
  {
    title: "Transactions",
    items: [
      {
        id: "orders",
        label: "Orders",
        icon: ShoppingBag,
        route: "/(patient)/cart",
      },
      {
        id: "payments",
        label: "Payments",
        icon: CreditCard,
        route: "/(patient)/cart",
      },
      {
        id: "lab-bookings",
        label: "Lab Bookings",
        icon: TestTube,
        route: "/(patient)/bookings",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        id: "edit-profile",
        label: "Edit Profile",
        icon: Settings,
        route: "/(patient)/profile",
      },
      {
        id: "app-settings",
        label: "App Settings",
        icon: Settings,
        route: "/(patient)/profile",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        id: "help",
        label: "Help Center",
        icon: HelpCircle,
        route: "/(patient)/profile",
      },
      {
        id: "contact",
        label: "Contact Us",
        icon: PhoneCall,
        route: "/(patient)/profile",
      },
    ],
  },
];

export default function SideDrawer() {
  const { isOpen, closeDrawer } = useDrawerStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      translateX.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(
        -DRAWER_WIDTH,
        { duration: 300 },
        (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
          }
        },
      );
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen]);

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: isOpen ? "auto" : "none",
  }));

  const handleNav = (route: string) => {
    closeDrawer();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleLogout = () => {
    closeDrawer();
    setTimeout(() => {
      logout();
      router.replace("/(auth)/login");
    }, 300);
  };

  if (!mounted && !isOpen) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={closeDrawer}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, animatedDrawerStyle]}>
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: Math.max(insets.top, 8) + 8 }]}
          >
            <TouchableOpacity
              onPress={closeDrawer}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={styles.closeBtn}
            >
              <X color={Colors.textInverse} size={22} />
            </TouchableOpacity>

            <View style={styles.profileSection}>
              <View style={styles.avatarRing}>
                <Image source={{ uri: user?.image }} style={styles.avatar} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewProfileBtn}
                onPress={() => handleNav("/(patient)/profile")}
                activeOpacity={0.8}
              >
                <Text style={styles.viewProfileText}>View Profile</Text>
                <ChevronRight
                  size={14}
                  color={Colors.textInverse}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ── Navigation Links ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {DRAWER_GROUPS.map((group, i) => (
              <View key={i} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.groupItems}>
                  {group.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.drawerItem}
                      onPress={() => handleNav(item.route)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemIconBg}>
                        <item.icon
                          color={Colors.primary}
                          size={18}
                          strokeWidth={1.8}
                        />
                      </View>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      <ChevronRight
                        size={16}
                        color={Colors.textTertiary}
                        strokeWidth={1.5}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.logoutIconBg}>
                <LogOut color={Colors.error} size={18} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 99,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    zIndex: 100,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    ...Shadows.elevated,
  },
  safeArea: { flex: 1 },

  // ── Practo-style Blue Gradient Header ──
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  closeBtn: {
    alignSelf: "flex-end",
    marginBottom: 12,
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileSection: {
    alignItems: "flex-start",
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
    marginBottom: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  userDetails: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textInverse,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    gap: 4,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textInverse,
  },

  // ── Navigation ──
  scrollContent: { padding: 20, paddingBottom: 60 },
  group: { marginBottom: 20 },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textTertiary,
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  groupItems: { gap: 2 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
  },
  itemIconBg: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logoutIconBg: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.error,
  },
});
