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
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SideDrawer from "../../components/SideDrawer";
import { Colors } from "../../constants/Colors";
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
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Icon
          color={focused ? Colors.primary : Colors.textTertiary}
          size={focused ? 21 : 20}
          strokeWidth={focused ? 2.35 : 1.9}
        />
      </View>
    </View>
  );
}

export default function PatientLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    ...styles.tabBar,
    height: 66 + Math.max(insets.bottom, Spacing.sm),
    paddingBottom: Math.max(insets.bottom, Spacing.sm),
  } as const;

  const hiddenScreenOptions = {
    href: null,
    tabBarStyle: { display: "none" },
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
          tabBarIconStyle: { marginTop: 2, marginBottom: 4 },
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
                    {
                      color: focused ? Colors.primary : Colors.textTertiary,
                      fontWeight: focused ? "700" : "600",
                    },
                  ]}
                >
                  {title}
                </Text>
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
        <Tabs.Screen name="packages" options={hiddenScreenOptions} />
        <Tabs.Screen name="packages/[id]" options={hiddenScreenOptions} />
      </Tabs>
      <SideDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    paddingTop: Spacing.sm - 1,
    paddingHorizontal: 6,
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#0B1F4A",
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -6 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
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
    borderColor: "rgba(30,58,138,0.12)",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.15,
    marginTop: 3,
  },
});
