import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { Shadows } from "../../constants/Shadows";
import { Spacing } from "../../constants/Spacing";

export default function BottomActionBar({
  children,
  bottomOffset = 0,
  contentStyle,
  style,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: bottomOffset }, style]}
    >
      <View
        style={[
          styles.container,
          {
            paddingBottom: insets.bottom + Spacing.md,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
  },
  container: {
    width: "100%",
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.tabBar,
    ...Platform.select({
      android: {
        // Shadows.tabBar already sets elevation; keep explicit for safety.
        elevation: 12,
      },
      default: {},
    }),
  },
});
