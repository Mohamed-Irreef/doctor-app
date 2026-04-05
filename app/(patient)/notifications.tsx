import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Calendar, Info, Tag } from "lucide-react-native";
import React from "react";
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import { Notification } from "../../types";

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Appointment Confirmed",
    message:
      "Your appointment with Dr. Sarah Jenkins on Oct 24 at 10:30 AM has been confirmed.",
    time: "10 min ago",
    read: false,
    type: "appointment",
  },
  {
    id: "2",
    title: "Reminder",
    message:
      "Your appointment with Dr. Mark Sloan is tomorrow at 11:00 AM. Please be ready 10 minutes early.",
    time: "2 hrs ago",
    read: false,
    type: "reminder",
  },
  {
    id: "3",
    title: "Exclusive Offer",
    message:
      "Get 30% off on all lab tests this week! Use code HEALTH30 at checkout.",
    time: "Yesterday",
    read: true,
    type: "promo",
  },
  {
    id: "4",
    title: "New Message",
    message:
      "Dr. Emily Chen has sent you a prescription. Download from your records.",
    time: "2 days ago",
    read: true,
    type: "general",
  },
];

const ICON_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: Colors.primary, bg: "#DBEAFE" },
  reminder: { icon: Bell, color: "#D97706", bg: "#FEF3C7" },
  promo: { icon: Tag, color: Colors.secondary, bg: "#CCFBF1" },
  general: { icon: Info, color: Colors.textSecondary, bg: Colors.lightGray },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={Colors.textInverse} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.headerActionText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={NOTIFICATIONS}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = ICON_MAP[item.type];
          const IconComp = cfg.icon;
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              activeOpacity={0.8}
            >
              {!item.read && <View style={styles.unreadDot} />}
              <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                <IconComp color={cfg.color} size={22} />
              </View>
              <View style={styles.textContent}>
                <View style={styles.titleRow}>
                  <Text
                    style={[Typography.body1, { fontWeight: "700", flex: 1 }]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={[Typography.caption, { lineHeight: 18 }]}>
                  {item.message}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.screenH,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    ...Typography.h3,
    fontSize: 18,
    color: Colors.textInverse,
  },
  headerActionText: {
    ...Typography.body2,
    color: Colors.textInverse,
    fontWeight: "700",
  },
  listContent: { padding: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: { borderColor: "#BFDBFE", backgroundColor: "#F8FAFF" },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContent: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  timeText: { fontSize: 10, color: Colors.textSecondary, marginLeft: 8 },
  separator: { height: 12 },
});
