import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Download, FileText } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";

type Status = "opening" | "error" | "done";

export default function LabSampleReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const [status, setStatus] = useState<Status>("opening");
  const [errorMsg, setErrorMsg] = useState("");

  const rawUrl = (() => {
    if (!params.url) return "";
    try {
      return decodeURIComponent(String(params.url));
    } catch {
      return String(params.url);
    }
  })();

  const openPdf = async () => {
    if (!rawUrl) {
      setErrorMsg("No PDF URL provided.");
      setStatus("error");
      return;
    }
    try {
      setStatus("opening");
      // Open the HTTPS URL in the device browser — Chrome/Safari render PDFs natively.
      // WebView fails with ERR_HTTP_RESPONSE_CODE_FAILURE for PDFs; the full browser does not.
      await Linking.openURL(rawUrl);
      setStatus("done");
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to open PDF.");
      setStatus("error");
    }
  };

  useEffect(() => {
    openPdf();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {params.title || "Sample Report"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <FileText size={48} color={Colors.primary} strokeWidth={1.5} />
        </View>

        {status === "opening" && (
          <>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.title}>Opening PDF…</Text>
          </>
        )}

        {status === "done" && (
          <>
            <Text style={styles.title}>Opened in Browser</Text>
            <Text style={styles.sub}>
              The PDF is being displayed in your browser.{"\n"}Tap below to open
              it again.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={openPdf}>
              <Download size={16} color={Colors.textInverse} />
              <Text style={styles.btnText}>Open Again</Text>
            </TouchableOpacity>
          </>
        )}

        {status === "error" && (
          <>
            <Text style={styles.title}>Could not open PDF</Text>
            <Text style={styles.sub}>{errorMsg}</Text>
            <TouchableOpacity style={styles.btn} onPress={openPdf}>
              <Text style={styles.btnText}>Retry</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    ...Typography.h3,
    fontSize: 16,
    color: Colors.text,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { ...Typography.h3, color: Colors.text, textAlign: "center" },
  sub: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  btnText: { color: Colors.textInverse, fontWeight: "700", fontSize: 14 },
});
