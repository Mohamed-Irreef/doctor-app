import { Tabs } from "expo-router";
import {
    CalendarCheck,
    Clock,
    DollarSign,
    LayoutDashboard,
    User,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: any;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Icon
        color={focused ? Colors.primary : Colors.textSecondary}
        size={22}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

export default function DoctorLayout() {
  const insets = useSafeAreaInsets();
  const tabBarStyle = {
    ...styles.tabBar,
    height: 58 + Math.max(insets.bottom, 8) + 6,
    paddingBottom: Math.max(insets.bottom, 8) + 6,
  } as const;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={LayoutDashboard} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appts",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={CalendarCheck} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Slots",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Clock} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={DollarSign} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />

      {/* Hidden stack screens */}
      <Tabs.Screen name="appointment/[id]" options={{ href: null }} />
      <Tabs.Screen name="appointment/video/[id]" options={{ href: null }} />
      <Tabs.Screen name="consultation" options={{ href: null }} />
      <Tabs.Screen name="chat/index" options={{ href: null }} />
      <Tabs.Screen name="chat/[chatId]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  tabLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  iconActive: { backgroundColor: "#EFF6FF" },
});
