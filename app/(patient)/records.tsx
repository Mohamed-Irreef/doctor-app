import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
    ArrowLeft,
    Download,
    Eye,
    FileText,
    FlaskConical,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { getMyLabBookings } from "../../services/api";

type LabBooking = {
  _id: string;
  status: string;
  reportUrl?: string;
  reportUploadedAt?: string;
  createdAt?: string;
  labTest?: {
    name?: string;
    category?: string;
  };
};

export default function RecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<LabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const openRecord = async (
    reportUrl: string | undefined,
    mode: "view" | "download",
  ) => {
    if (!reportUrl) {
      Alert.alert(
        "Report unavailable",
        "This record does not have a report yet.",
      );
      return;
    }

    const canOpen = await Linking.canOpenURL(reportUrl);
    if (!canOpen) {
      Alert.alert(
        "Unable to open",
        "This report link is invalid or unavailable.",
      );
      return;
    }

    if (mode === "view") {
      await WebBrowser.openBrowserAsync(reportUrl);
      return;
    }

    await Linking.openURL(reportUrl);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const response = await getMyLabBookings();
      if (response.status === "error") {
        setError(response.error || "Unable to load records");
      }
      setRecords((response.data || []) as LabBooking[]);
      setLoading(false);
    };

    load();
  }, []);

  const sorted = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.reportUploadedAt || b.createdAt || 0).getTime() -
          new Date(a.reportUploadedAt || a.createdAt || 0).getTime(),
      ),
    [records],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color={Colors.text} size={20} />
        </TouchableOpacity>
        <Text style={Typography.h2}>Medical Records</Text>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.helperText}>Loading records...</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Text style={styles.helperText}>
                {error || "No lab records found yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const hasReport = Boolean(item.reportUrl);
            const dateText = item.reportUploadedAt || item.createdAt;
            return (
              <View style={styles.card}>
                <View style={styles.iconBox}>
                  {hasReport ? (
                    <FileText color={Colors.primary} size={24} />
                  ) : (
                    <FlaskConical color={Colors.primary} size={24} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.labTest?.name || "Lab Test"}
                  </Text>
                  <Text style={styles.meta}>
                    {item.labTest?.category || "Diagnostic"} | {item.status}
                  </Text>
                  <Text style={styles.meta}>
                    {dateText
                      ? new Date(dateText).toLocaleString()
                      : "Date unavailable"}
                  </Text>
                </View>
                <View style={styles.actionsCol}>
                  <TouchableOpacity
                    disabled={!hasReport}
                    onPress={() => openRecord(item.reportUrl, "view")}
                    style={[
                      styles.actionBtn,
                      !hasReport && styles.downloadBtnDisabled,
                    ]}
                  >
                    <Eye
                      color={hasReport ? Colors.textSecondary : "#CBD5E1"}
                      size={19}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={!hasReport}
                    onPress={() => openRecord(item.reportUrl, "download")}
                    style={[
                      styles.actionBtn,
                      !hasReport && styles.downloadBtnDisabled,
                    ]}
                  >
                    <Download
                      color={hasReport ? Colors.textSecondary : "#CBD5E1"}
                      size={19}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          keyExtractor={(item) => item._id}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionsCol: {
    gap: 4,
  },
  actionBtn: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadBtnDisabled: {
    opacity: 0.6,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
