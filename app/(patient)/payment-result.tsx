import { useLocalSearchParams, useRouter } from "expo-router";
import {
    CheckCircle,
    XCircle
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ButtonPrimary from "../../components/ButtonPrimary";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";

export default function PaymentResultScreen() {
  const router = useRouter();
  const { success, amount, doctorName, context, retryPath, reason } =
    useLocalSearchParams<{
      success: string;
      amount: string;
      doctorName: string;
      context: string;
      retryPath: string;
      reason: string;
    }>();

  const isSuccess = success !== "false";
  const failureMessage = "Payment could not be completed. Please try again.";
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.iconWrapper, { transform: [{ scale }], opacity }]}
        >
          <View
            style={[
              styles.iconBg,
              { backgroundColor: isSuccess ? "#DCFCE7" : "#FEF2F2" },
            ]}
          >
            {isSuccess ? (
              <CheckCircle size={72} color={Colors.success} />
            ) : (
              <XCircle size={72} color={Colors.error} />
            )}
          </View>
        </Animated.View>

        <Text style={[Typography.h1, styles.headline]}>
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </Text>
        <Text style={[Typography.body1, styles.sub]}>
          {isSuccess
            ? `${context ?? "Payment"} for ${doctorName ?? "your order"} has been confirmed.`
            : failureMessage}
        </Text>

        {isSuccess && (
          <View style={styles.receiptCard}>
            <Text style={[Typography.h3, { marginBottom: 16 }]}>Receipt</Text>
            <View style={styles.receiptRow}>
              <Text style={Typography.body2}>{context ?? "Order Type"}</Text>
              <Text style={[Typography.body1, { fontWeight: "600" }]}>
                {doctorName ?? "Dr. Sarah Jenkins"}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={Typography.body2}>Date</Text>
              <Text style={[Typography.body1, { fontWeight: "600" }]}>
                Oct 24, 2026
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={Typography.body2}>Time</Text>
              <Text style={[Typography.body1, { fontWeight: "600" }]}>
                10:30 AM
              </Text>
            </View>
            <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
              <Text style={Typography.body2}>Amount Paid</Text>
              <Text style={[Typography.h2, { color: Colors.success }]}>
                ${amount ?? "150"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        {isSuccess ? (
          <>
            <ButtonPrimary
              title="View Appointments"
              onPress={() => router.replace("/(patient)/appointments")}
              style={{ marginBottom: 12 }}
            />
            <ButtonPrimary
              title="Go Home"
              type="outline"
              onPress={() => router.replace("/(patient)")}
              textStyle={{ color: Colors.text }}
            />
          </>
        ) : (
          <>
            <ButtonPrimary
              title="Try Again"
              onPress={() => {
                if (retryPath) {
                  router.replace(retryPath as any);
                  return;
                }
                router.back();
              }}
              style={{ marginBottom: 12 }}
            />
            <ButtonPrimary
              title="Go Home"
              type="outline"
              onPress={() => router.replace("/(patient)")}
              textStyle={{ color: Colors.text }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  iconWrapper: { marginBottom: 32 },
  iconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: { textAlign: "center", marginBottom: 16 },
  sub: {
    textAlign: "center",
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  bottomActions: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
