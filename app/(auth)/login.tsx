import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Lock, Mail, Stethoscope, UserRound } from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ActionModal from "../../components/ActionModal";
import ButtonPrimary from "../../components/ButtonPrimary";
import InputField from "../../components/InputField";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import * as api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import type { Role } from "../../types";

WebBrowser.maybeCompleteAuthSession();

const ROLE_OPTIONS: Role[] = ["patient", "doctor"];
const PATIENT_ROLE: Role = "patient";
const DOCTOR_ROLE: Role = "doctor";

type GoogleLoginButtonProps = {
  loading: boolean;
  webClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
  onIdToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
};

function GoogleLoginButton({
  loading,
  webClientId,
  androidClientId,
  iosClientId,
  onIdToken,
  onError,
}: GoogleLoginButtonProps) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId ?? androidClientId ?? iosClientId,
    androidClientId,
    iosClientId,
  });

  React.useEffect(() => {
    const doGoogleLogin = async () => {
      if (response?.type !== "success") return;

      const idToken = response.authentication?.idToken;
      if (!idToken) {
        onError("Google login failed. No idToken received.");
        return;
      }

      await onIdToken(idToken);
    };

    doGoogleLogin();
  }, [response, onIdToken, onError]);

  return (
    <TouchableOpacity
      style={styles.googleBtn}
      onPress={() => promptAsync()}
      disabled={!request || loading}
      activeOpacity={0.8}
    >
      <Text style={styles.googleText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorText, setErrorText] = useState(
    "Please enter your email and password to continue.",
  );

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const isGoogleConfiguredForPlatform =
    Platform.OS === "android"
      ? Boolean(googleAndroidClientId)
      : Platform.OS === "ios"
        ? Boolean(googleIosClientId)
        : Boolean(googleWebClientId);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorText("Please enter your email and password to continue.");
      setErrorModal(true);
      return;
    }
    setLoading(true);
    const result = await api.loginUser(
      email,
      password,
      selectedRole ?? "patient",
    );
    setLoading(false);
    if (result.status === "success") {
      login(selectedRole, result.data?.user as any);
      if (selectedRole === "patient") {
        const profileRes = await api.getMyProfile();
        const profileComplete = Boolean(
          (profileRes.data as any)?.profileComplete,
        );
        if (!profileComplete) {
          router.replace("/(patient)/profile");
          return;
        }
      }
      router.replace("/");
      return;
    }

    setErrorText(result.error || "Login failed. Please check credentials.");
    setErrorModal(true);
  };

  const handleGoogleIdToken = React.useCallback(
    async (idToken: string) => {
      setLoading(true);
      const result = await api.googleLogin(idToken, "patient");
      setLoading(false);

      if (result.status !== "success" || !result.data) {
        setErrorText(result.error || "Google login failed.");
        setErrorModal(true);
        return;
      }

      login("patient", (result.data as any).user);

      const profileRes = await api.getMyProfile();
      const profileComplete = Boolean(
        (profileRes.data as any)?.profileComplete,
      );
      if (!profileComplete) {
        router.replace("/(patient)/profile");
        return;
      }

      router.replace("/");
    },
    [login, router],
  );

  const handleGoogleError = React.useCallback((message: string) => {
    setErrorText(message);
    setErrorModal(true);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ActionModal
        visible={errorModal}
        type="error"
        title="Missing Information"
        message={errorText}
        confirmLabel="OK"
        onConfirm={() => setErrorModal(false)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?auto=format&fit=crop&q=80&w=800",
          }}
          style={styles.headerImage}
        />

        <View style={styles.formContainer}>
          <Text style={[Typography.h1, styles.title]}>Welcome Back</Text>
          <Text style={[Typography.body1, styles.subtitle]}>
            Login to continue to MediBook
          </Text>

          <View style={styles.roleContainer}>
            {ROLE_OPTIONS.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleCard,
                  selectedRole === role && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole(role)}
                activeOpacity={0.75}
              >
                {role === PATIENT_ROLE ? (
                  <UserRound
                    color={
                      selectedRole === role
                        ? Colors.primary
                        : Colors.textSecondary
                    }
                    size={24}
                  />
                ) : (
                  <Stethoscope
                    color={
                      selectedRole === role
                        ? Colors.primary
                        : Colors.textSecondary
                    }
                    size={24}
                  />
                )}
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === role && styles.roleTextActive,
                  ]}
                >
                  {role === PATIENT_ROLE ? "Patient" : "Doctor"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail color={Colors.textSecondary} size={20} />}
          />
          <InputField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock color={Colors.textSecondary} size={20} />}
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text
              style={[
                Typography.body2,
                { color: Colors.primary, fontWeight: "600" },
              ]}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <ButtonPrimary
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          {selectedRole === PATIENT_ROLE && isGoogleConfiguredForPlatform && (
            <GoogleLoginButton
              loading={loading}
              webClientId={googleWebClientId}
              androidClientId={googleAndroidClientId}
              iosClientId={googleIosClientId}
              onIdToken={handleGoogleIdToken}
              onError={handleGoogleError}
            />
          )}

          {selectedRole === PATIENT_ROLE && !isGoogleConfiguredForPlatform && (
            <Text style={[Typography.body2, styles.googleHint]}>
              Google sign-in is disabled. Set
              EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in root .env.
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={Typography.body2}>Do not have an account? </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  selectedRole === DOCTOR_ROLE
                    ? "/(auth)/doctor-signup"
                    : "/(auth)/patient-signup",
                )
              }
            >
              <Text
                style={[
                  Typography.body2,
                  { color: Colors.primary, fontWeight: "600" },
                ]}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  headerImage: { width: "100%", height: 300 },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  title: { marginBottom: 6 },
  subtitle: { color: Colors.textSecondary, marginBottom: 24 },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginHorizontal: 4,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: "#EFF6FF" },
  roleText: { marginLeft: 8, fontWeight: "600", color: Colors.textSecondary },
  roleTextActive: { color: Colors.primary },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 24 },
  loginBtn: { marginBottom: 24 },
  googleBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  googleText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  googleHint: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
});
