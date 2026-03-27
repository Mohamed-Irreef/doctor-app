import { useRouter } from 'expo-router';
import { Bell, ChevronRight, CreditCard, Heart, LogOut, Settings, Shield, User } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuthStore } from '../../store/authStore';
import { useFavoritesStore } from '../../store/favoritesStore';

const MENU_ITEMS = [
  { id: '1', title: 'Personal Information', icon: User, route: null },
  { id: '2', title: 'My Favorites', icon: Heart, route: '/(patient)/favorites' },
  { id: '3', title: 'Notifications', icon: Bell, route: '/(patient)/notifications' },
  { id: '4', title: 'Payment Methods', icon: CreditCard, route: null },
  { id: '5', title: 'Security & Privacy', icon: Shield, route: null },
  { id: '6', title: 'App Settings', icon: Settings, route: null },
];

export default function PatientProfileScreen() {
  const { user, logout } = useAuthStore();
  const { favorites } = useFavoritesStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Header */}
        <View style={styles.headerCard}>
          <Image source={{ uri: user?.image }} style={styles.avatar} />
          <Text style={[Typography.h2, { marginBottom: 4 }]}>{user?.name ?? 'Alex Johnson'}</Text>
          <Text style={[Typography.body2, { color: Colors.textSecondary }]}>{user?.email}</Text>
          <Text style={[Typography.body2, { color: Colors.primary, marginTop: 4 }]}>{user?.phone}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{favorites.length}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <item.icon color={Colors.textSecondary} size={22} />
              </View>
              <Text style={[Typography.body1, styles.menuTitle]}>{item.title}</Text>
              <ChevronRight color={Colors.border} size={22} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <LogOut color={Colors.error} size={22} />
          <Text style={[Typography.body1, styles.logoutText]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 60 },
  headerCard: {
    alignItems: 'center', backgroundColor: Colors.surface, paddingTop: 32, paddingBottom: 24,
    paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 24,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48, marginBottom: 16,
    borderWidth: 3, borderColor: Colors.primary,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: Colors.background, borderRadius: 16, padding: 16, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  menuContainer: {
    backgroundColor: Colors.surface, marginHorizontal: 20, borderRadius: 20,
    paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.lightGray,
  },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuTitle: { flex: 1, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', paddingVertical: 18, borderRadius: 16,
    borderWidth: 1, borderColor: '#FECACA', marginHorizontal: 20,
  },
  logoutText: { color: Colors.error, fontWeight: '700', marginLeft: 12 },
});
