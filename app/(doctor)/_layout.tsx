import { Tabs } from "expo-router";
import {
  CalendarCheck,
  Clock,
  DollarSign,
  LayoutDashboard,
  User,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { Spacing, Radius } from "../../constants/Spacing";
import { Shadows } from "../../constants/Shadows";

const TAB_ITEMS = [
  { name: "index", title: "Dashboard", icon: LayoutDashboard },
  { name: "appointments", title: "Appts", icon: CalendarCheck },
  { name: "availability", title: "Slots", icon: Clock },
  { name: "earnings", title: "Earnings", icon: DollarSign },
  { name: "profile", title: "Profile", icon: User },
];

function TabIcon({
  icon: Icon,
  focused,
}: {
  icon: any;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Icon
        color={focused ? Colors.primary : Colors.textTertiary}
        size={21}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

export default function DoctorLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    ...styles.tabBar,
    height: 58 + Math.max(insets.bottom, Spacing.sm) + 4,
    paddingBottom: Math.max(insets.bottom, Spacing.sm) + 4,
  } as const;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle,
        tabBarIconStyle: { marginTop: 2 },
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
            tabBarLabel: ({ focused }) => (
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? Colors.primary : Colors.textTertiary },
                ]}
              >
                {title}
              </Text>
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
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.tabBar,
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
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 1,
  },
});
