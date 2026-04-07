import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import {
    SafeAreaProvider,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { Radius, Spacing } from "../constants/Spacing";
import { CallProvider } from "../context/CallContext";

const CHATBOT_ICON = require("../assets/images/chatbot-icon.png");

function RootLayoutInner() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const pulse = useRef(new Animated.Value(1)).current;

  const inPatientGroup = segments[0] === "(patient)";
  const patientRoute = inPatientGroup ? (segments[1] ?? "index") : null;
  const isPatientHomeRoute =
    inPatientGroup &&
    (segments.length === 1 || segments.length === 2) &&
    patientRoute === "index" &&
    !pathname.includes("ai-chat");

  const baseTabBarHeight = 56;
  const androidBottomGap =
    insets.bottom > 0
      ? insets.bottom
      : Platform.OS === "android"
        ? Spacing.xxl
        : 0;

  const patientTabBarHeight =
    Platform.OS === "android"
      ? baseTabBarHeight + androidBottomGap
      : baseTabBarHeight + insets.bottom;
  const fabBottomOffset = patientTabBarHeight;

  useEffect(() => {
    if (!isPatientHomeRoute) {
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isPatientHomeRoute, pulse]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(doctor)" />
      </Stack>

      {isPatientHomeRoute && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open chatbot"
            onPress={() => router.push("/(patient)/ai-chat")}
            style={[
              styles.chatbotFab,
              {
                right: Spacing.sm,
                bottom: fabBottomOffset,
              },
            ]}
            hitSlop={12}
          >
            <Animated.Image
              source={CHATBOT_ICON}
              style={[
                styles.chatbotIcon,
                {
                  transform: [{ scale: pulse }],
                },
              ]}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CallProvider>
        <RootLayoutInner />
      </CallProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chatbotFab: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Colors.transparent,
    alignItems: "center",
    justifyContent: "center",
  },
  chatbotIcon: {
    width: 46,
    height: 46,
  },
});
