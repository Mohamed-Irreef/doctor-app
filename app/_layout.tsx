import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CallProvider } from "../context/CallContext";

export default function RootLayout() {
  return (
    <CallProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(doctor)" />
      </Stack>
      <StatusBar style="auto" />
    </CallProvider>
  );
}
