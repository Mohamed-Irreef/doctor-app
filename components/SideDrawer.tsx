import { useRouter } from 'expo-router';
import {
    Activity,
    Bell,
    CalendarHeart,
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
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import { useDrawerStore } from '../store/drawerStore';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

const DRAWER_GROUPS = [
  {
    title: 'Core Services',
    items: [
      { id: 'book', label: 'Book Doctor', icon: CalendarHeart, route: '/(patient)/search' },
      { id: 'video', label: 'Video Consultation', icon: Video, route: '/(patient)/search' },
      { id: 'labs', label: 'Lab Tests', icon: Activity, route: '/(patient)/labs' },
      { id: 'meds', label: 'Medicines', icon: Pill, route: '/(patient)/pharmacy' },
    ]
  },
  {
    title: 'Personal',
    items: [
      { id: 'favs', label: 'Favorites', icon: Heart, route: '/(patient)/favorites' },
      { id: 'notifs', label: 'Notifications', icon: Bell, route: '/(patient)/notifications' },
      { id: 'records', label: 'Health Records', icon: FileText, route: '/(patient)/records' },
    ]
  },
  {
    title: 'Transactions',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingBag, route: '/(patient)/cart' },
      { id: 'payments', label: 'Payments', icon: CreditCard, route: '/(patient)/cart' },
      { id: 'lab-bookings', label: 'Lab Bookings', icon: TestTube, route: '/(patient)/records' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { id: 'edit-profile', label: 'Edit Profile', icon: Settings, route: '/(patient)/profile' },
      { id: 'app-settings', label: 'App Settings', icon: Settings, route: '/(patient)/profile' },
    ]
  },
  {
    title: 'Support',
    items: [
      { id: 'help', label: 'Help Center', icon: HelpCircle, route: '/(patient)/profile' },
      { id: 'contact', label: 'Contact Us', icon: PhoneCall, route: '/(patient)/profile' },
    ]
  }
];

export default function SideDrawer() {
  const { isOpen, closeDrawer } = useDrawerStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      translateX.value = withTiming(0, { duration: 300 }); 
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen]);

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: isOpen ? 'auto' : 'none',
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
      router.replace('/(auth)/login');
    }, 300);
  };

  if (!mounted && !isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} activeOpacity={1} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, animatedDrawerStyle]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          
          {/* User Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image source={{ uri: user?.image }} style={styles.avatar} />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeDrawer} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
              <X color={Colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Links */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {DRAWER_GROUPS.map((group, i) => (
              <View key={i} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.groupItems}>
                  {group.items.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.drawerItem} 
                      onPress={() => handleNav(item.route)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemIconBg}>
                        <item.icon color={Colors.primary} size={20} />
                      </View>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <LogOut color={Colors.error} size={20} />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    zIndex: 100,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.lightGray, marginRight: 12 },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: 13, color: Colors.textSecondary },
  scrollContent: { padding: 20, paddingBottom: 60 },
  group: { marginBottom: 24 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  groupItems: { gap: 8 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error, marginLeft: 14 },
});
