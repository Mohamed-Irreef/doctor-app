// import { Redirect } from 'expo-router';
// import { useAuthStore } from '../store/authStore';

// export default function Index() {
//   const role = useAuthStore(state => state.role);

//   if (role === 'patient') {
//     return <Redirect href="/(patient)" />;
//   }

//   if (role === 'doctor') {
//     return <Redirect href="/(doctor)" />;
//   }

//   return <Redirect href="/(auth)/login" />;
// }

import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const role = useAuthStore((state) => state.role);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1700);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || role === undefined) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#2D3698" />

        <View style={styles.centerWrap}>
          <View style={styles.brandRow}>
            <View style={styles.dot} />
            <Text style={styles.brandText}>nividoc</Text>
            <View style={styles.dot} />
          </View>
          <Text style={styles.tagline}>
            India's trusted doctors to guide you
          </Text>
          <Text style={styles.tagline}>to better health every day</Text>
        </View>

        <View style={styles.bottomWrap}>
          <View style={styles.isoSealOuter}>
            <View style={styles.isoSealInner}>
              <Text style={styles.isoText}>ISO</Text>
            </View>
          </View>
          <Text style={styles.bottomText}>ISO certified online</Text>
          <Text style={styles.bottomText}>healthcare platform</Text>
        </View>
      </View>
    );
  }

  if (role === "patient") {
    return <Redirect href="/(patient)" />;
  }

  if (role === "doctor") {
    return <Redirect href="/(doctor)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2D3698",
    justifyContent: "space-between",
    alignItems: "center",
  },
  centerWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#19C5F4",
    marginHorizontal: 8,
    marginTop: 2,
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 58,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "lowercase",
  },
  tagline: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 28,
    textAlign: "center",
  },
  bottomWrap: {
    alignItems: "center",
    paddingBottom: 58,
  },
  isoSealOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#9FDFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  isoSealInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#42B9E8",
    alignItems: "center",
    justifyContent: "center",
  },
  isoText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bottomText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "500",
  },
});
