import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Activity,
    Calendar,
    Home,
    Pill,
    Stethoscope,
    User,
} from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SideDrawer from "../../components/SideDrawer";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Radius, Spacing } from "../../constants/Spacing";

const TAB_ITEMS = [
  { name: "index", title: "Home", icon: Home },
  { name: "search", title: "Doctors", icon: Stethoscope },
  { name: "labs", title: "Labs", icon: Activity },
  { name: "pharmacy", title: "Pharmacy", icon: Pill },
  { name: "appointments", title: "Appts", icon: Calendar },
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

export default function PatientLayout() {
  const insets = useSafeAreaInsets();

  const baseHeight = 56;

  // On some Android devices (edge-to-edge + 3-button nav), the tab bar can be
  // rendered behind the system navigation buttons. Using a bottom *gap* (margin)
  // lifts the tab bar above the system UI, while iOS keeps the background under
  // the home indicator via padding.
  const androidBottomGap =
    insets.bottom > 0
      ? insets.bottom
      : Platform.OS === "android"
        ? Spacing.xxl
        : 0;

  const tabBarStyle = {
    ...styles.tabBar,
    ...(Platform.OS === "android"
      ? {
          height: baseHeight,
          paddingBottom: 0,
          marginBottom: androidBottomGap,
        }
      : {
          height: baseHeight + insets.bottom,
          paddingBottom: insets.bottom,
        }),
    paddingTop: 4,
  } as const;

  const hiddenScreenOptions = {
    href: null,
    tabBarStyle: { display: "none" },
  } as const;

  const hiddenButKeepTabBarOptions = {
    href: null,
  } as const;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
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

        {/* Hidden screens */}
        <Tabs.Screen name="bookings" options={hiddenScreenOptions} />
        <Tabs.Screen name="records" options={hiddenScreenOptions} />
        <Tabs.Screen name="doctor/[id]" options={hiddenScreenOptions} />
        <Tabs.Screen name="booking/[id]" options={hiddenScreenOptions} />
        <Tabs.Screen name="consultation" options={hiddenScreenOptions} />
        <Tabs.Screen name="chat/index" options={hiddenScreenOptions} />
        <Tabs.Screen name="chat/[chatId]" options={hiddenScreenOptions} />
        <Tabs.Screen name="lab/[id]" options={hiddenScreenOptions} />
        <Tabs.Screen name="lab/home-booking" options={hiddenScreenOptions} />
        <Tabs.Screen name="lab/visit-booking" options={hiddenScreenOptions} />
        <Tabs.Screen name="lab/summary" options={hiddenScreenOptions} />
        <Tabs.Screen name="lab/confirmation" options={hiddenScreenOptions} />
        <Tabs.Screen name="lab/sample-report" options={hiddenScreenOptions} />
        <Tabs.Screen name="medicine/[id]" options={hiddenScreenOptions} />
        <Tabs.Screen name="article/index" options={hiddenScreenOptions} />
        <Tabs.Screen name="article/[id]" options={hiddenScreenOptions} />
        <Tabs.Screen name="appointment/[id]" options={hiddenScreenOptions} />
        <Tabs.Screen
          name="appointment/video/[id]"
          options={hiddenScreenOptions}
        />
        <Tabs.Screen name="menu" options={hiddenScreenOptions} />
        <Tabs.Screen name="cart" options={hiddenScreenOptions} />
        <Tabs.Screen name="medicine-orders" options={hiddenScreenOptions} />
        <Tabs.Screen name="favorites" options={hiddenScreenOptions} />
        <Tabs.Screen name="ai-chat" options={hiddenScreenOptions} />
        <Tabs.Screen name="video-consult" options={hiddenScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenScreenOptions} />
        <Tabs.Screen name="payment-result" options={hiddenScreenOptions} />
        <Tabs.Screen name="review" options={hiddenScreenOptions} />
        <Tabs.Screen name="packages" options={hiddenButKeepTabBarOptions} />
        <Tabs.Screen name="packages/[id]" options={hiddenScreenOptions} />
        <Tabs.Screen name="packages/checkout" options={hiddenScreenOptions} />
      </Tabs>
      <SideDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 6,
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    ...Shadows.tabBar,
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  iconPill: {
    width: 50,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.15,
    marginTop: 2,
  },
});
