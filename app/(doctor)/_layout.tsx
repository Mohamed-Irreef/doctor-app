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
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";

const TAB_ITEMS = [
  { name: "index", title: "Dashboard", icon: LayoutDashboard },
  { name: "appointments", title: "Appts", icon: CalendarCheck },
  { name: "availability", title: "Slots", icon: Clock },
  { name: "earnings", title: "Earnings", icon: DollarSign },
  { name: "profile", title: "Profile", icon: User },
];

function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Icon
        color={focused ? Colors.primary : Colors.textTertiary}
        size={focused ? 24 : 23}
        strokeWidth={focused ? 2.3 : 2.0}
      />
    </View>
  );
}

export default function DoctorLayout() {
  const insets = useSafeAreaInsets();

  const bottomPad = insets.bottom > 0 ? insets.bottom : Spacing.sm;
  const baseHeight = 56;

  const tabBarStyle = {
    ...styles.tabBar,
    height: baseHeight + bottomPad,
    paddingBottom: bottomPad,
    paddingTop: 4,
  } as const;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {TAB_ITEMS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icon} focused={focused} />
            ),
          }}
        />
      ))}

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
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.tabBar,
  },
  tabBarItem: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  iconPill: {
    width: 44,
    height: 30,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
