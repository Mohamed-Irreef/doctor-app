import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Calendar, User, Stethoscope, Activity, Pill } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import SideDrawer from '../../components/SideDrawer';
import { useDrawerStore } from '../../store/drawerStore';

function TabIcon({ icon: Icon, color, focused }: { icon: any; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Icon color={focused ? Colors.primary : Colors.textSecondary} size={22} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

export default function PatientLayout() {
  const { openDrawer } = useDrawerStore();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Stethoscope} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="labs"
        options={{
          title: 'Labs',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Activity} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pharmacy"
        options={{
          title: 'Pharmacy',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Pill} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appts',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Calendar} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={User} color={color} focused={focused} />,
        }}
      />
      
      {/* Hidden screens — no tab bar entry */}
      <Tabs.Screen name="records"          options={{ href: null }} />
      <Tabs.Screen name="doctor/[id]"      options={{ href: null }} />
      <Tabs.Screen name="booking/[id]"     options={{ href: null }} />
      <Tabs.Screen name="consultation"     options={{ href: null }} />
      <Tabs.Screen name="lab/[id]"         options={{ href: null }} />
      <Tabs.Screen name="medicine/[id]"    options={{ href: null }} />
      <Tabs.Screen name="article/[id]"     options={{ href: null }} />
      <Tabs.Screen name="appointment/[id]" options={{ href: null }} />
      <Tabs.Screen name="menu"             options={{ href: null }} />
      <Tabs.Screen name="cart"             options={{ href: null }} />
      <Tabs.Screen name="favorites"        options={{ href: null }} />
      <Tabs.Screen name="notifications"    options={{ href: null }} />
      <Tabs.Screen name="payment-result"   options={{ href: null }} />
      <Tabs.Screen name="review"           options={{ href: null }} />
    </Tabs>
    <SideDrawer />
  </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconActive: {
    backgroundColor: '#EFF6FF',
  },
});
