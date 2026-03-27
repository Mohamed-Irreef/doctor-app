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
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const role = useAuthStore((state) => state.role);

  // 🔥 Prevent rendering before state is ready
  if (role === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
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