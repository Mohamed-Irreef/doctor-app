import { Tabs } from "expo-router";
import {
    Activity,
    Calendar,
    Home,
    Pill,
    Stethoscope,
    User,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SideDrawer from "../../components/SideDrawer";
import { Colors } from "../../constants/Colors";
import { useDrawerStore } from "../../store/drawerStore";

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

export default function PatientLayout() {
  const { openDrawer } = useDrawerStore();
  const insets = useSafeAreaInsets();
  const hiddenScreenOptions = {
    href: null,
    tabBarStyle: { display: "none" },
  } as const;

  const tabBarStyle = {
    ...styles.tabBar,
    height: 58 + Math.max(insets.bottom, 8) + 6,
    paddingBottom: Math.max(insets.bottom, 8) + 6,
  } as const;

  return (
    <View style={{ flex: 1 }}>
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
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={Home} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Doctors",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={Stethoscope} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="labs"
          options={{
            title: "Labs",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={Activity} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="pharmacy"
          options={{
            title: "Pharmacy",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={Pill} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: "Appts",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={Calendar} color={color} focused={focused} />
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

        {/* Hidden screens — no tab bar entry */}
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
        <Tabs.Screen name="notifications" options={hiddenScreenOptions} />
        <Tabs.Screen name="payment-result" options={hiddenScreenOptions} />
        <Tabs.Screen name="review" options={hiddenScreenOptions} />
      </Tabs>
      <SideDrawer />
    </View>
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
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  iconActive: {
    backgroundColor: "#EFF6FF",
  },
});
