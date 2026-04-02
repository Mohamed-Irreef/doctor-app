import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Camera,
    ChevronDown,
    Contact,
    Droplet,
    Lock,
    Mail,
    MapPin,
    Phone,
    User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionModal from "../../components/ActionModal";
import { Colors } from "../../constants/Colors";
import * as api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const PrimaryColor = Colors.primary;
const BgColor = Colors.primaryUltraLight;

type PickerType = "gender" | "blood" | null;

function InputField({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
}: any) {
  return (
    <View style={styles.inputContainer}>
      <Icon color="#6B7280" size={18} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function Dropdown({ icon: Icon, placeholder, value, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.inputContainer}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Icon color="#6B7280" size={18} style={styles.inputIcon} />
      <Text
        style={[
          styles.input,
          { color: value ? "#111827" : "#9CA3AF", paddingTop: 14 },
        ]}
      >
        {value || placeholder}
      </Text>
      <ChevronDown color="#6B7280" size={18} style={{ marginRight: 16 }} />
    </TouchableOpacity>
  );
}

export default function PatientSignupScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [imageUri, setImageUri] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [activePicker, setActivePicker] = useState<PickerType>(null);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorText, setErrorText] = useState(
    "Please complete all required fields.",
  );

  const GENDER_OPTIONS = ["Male", "Female", "Other"];
  const BLOOD_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const pickerOptions =
    activePicker === "gender" ? GENDER_OPTIONS : BLOOD_OPTIONS;

  const formatDate = (date: Date) => {
    const day = `${date.getDate()}`.padStart(2, "0");
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  };

  const openDobPicker = () => {
    DateTimePickerAndroid.open({
      value: dob || new Date(2000, 0, 1),
      mode: "date",
      maximumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
          setDob(selectedDate);
        }
      },
    });
  };

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorText("Please allow photo permissions to upload profile picture.");
      setErrorModal(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageUrl("");
    }
  };

  const validateForm = () => {
    const requiredOk =
      name.trim() &&
      phone.trim() &&
      email.trim() &&
      password.trim() &&
      gender &&
      bloodGroup &&
      dob &&
      address.trim() &&
      emergencyContact.trim();

    if (!requiredOk) {
      setErrorText("Please fill all required fields.");
      setErrorModal(true);
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);

    let uploadedImage = imageUrl;
    if (!uploadedImage && imageUri) {
      const upload = await api.uploadFile(
        {
          uri: imageUri,
          name: "patient-profile.jpg",
          type: "image/jpeg",
        },
        "nividoc/patients",
        true,
      );

      if (upload.status !== "success" || !upload.data) {
        setLoading(false);
        setErrorText(upload.error || "Profile photo upload failed");
        setErrorModal(true);
        return;
      }

      uploadedImage = (upload.data as any).url;
      setImageUrl(uploadedImage);
    }

    const register = await api.registerPatient({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      gender,
      dateOfBirth: dob ? dob.toISOString() : "",
      bloodGroup,
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      ...(uploadedImage ? { image: uploadedImage } : {}),
    });

    setLoading(false);

    if (register.status !== "success" || !register.data) {
      setErrorText(register.error || "Signup failed.");
      setErrorModal(true);
      return;
    }

    login("patient", (register.data as any).user);
    router.replace("/(patient)");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ActionModal
          visible={errorModal}
          type="error"
          title="Signup Error"
          message={errorText}
          confirmLabel="OK"
          onConfirm={() => setErrorModal(false)}
        />

        <LinearGradient
          colors={[Colors.primary, Colors.primaryPressed]}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft color={Colors.textInverse} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 44 }} />
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.title}>Patient Registration</Text>
            <Text style={styles.subtitle}>Profile photo is optional.</Text>

            <TouchableOpacity
              style={styles.uploadArea}
              activeOpacity={0.8}
              onPress={pickProfileImage}
            >
              <View style={styles.uploadIconBg}>
                <Camera color={PrimaryColor} size={24} />
              </View>
              <View>
                <Text style={styles.uploadText}>Upload Profile Picture</Text>
                <Text style={styles.uploadSub}>
                  {imageUri ? "Photo selected" : "PNG/JPG up to 5MB"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <InputField
                icon={User}
                placeholder="Full Name *"
                value={name}
                onChangeText={setName}
              />
              <InputField
                icon={Phone}
                placeholder="Phone Number *"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <InputField
                icon={Mail}
                placeholder="Email Address *"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <InputField
                icon={Lock}
                placeholder="Password *"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Dropdown
                icon={User}
                placeholder="Gender *"
                value={gender}
                onPress={() => setActivePicker("gender")}
              />
              <Dropdown
                icon={Calendar}
                placeholder="Date of Birth *"
                value={dob ? formatDate(dob) : ""}
                onPress={openDobPicker}
              />
              <Dropdown
                icon={Droplet}
                placeholder="Blood Group *"
                value={bloodGroup}
                onPress={() => setActivePicker("blood")}
              />
              <InputField
                icon={MapPin}
                placeholder="City, State, Pincode *"
                value={address}
                onChangeText={setAddress}
              />
              <InputField
                icon={Contact}
                placeholder="Emergency Contact Name & Number *"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={activePicker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          >
            <TouchableOpacity
              style={styles.modalCard}
              activeOpacity={1}
              onPress={() => null}
            >
              <Text style={styles.modalTitle}>
                {activePicker === "gender"
                  ? "Select Gender"
                  : "Select Blood Group"}
              </Text>
              {pickerOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => {
                    if (activePicker === "gender") {
                      setGender(option);
                    } else {
                      setBloodGroup(option);
                    }
                    setActivePicker(null);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BgColor },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PrimaryColor,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.textInverse },
  scroll: { padding: 18, paddingBottom: 60 },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 20,
  },

  formSection: { gap: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 52,
  },
  inputIcon: { marginLeft: 16, marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: "#111827" },

  uploadArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderStyle: "dashed",
    marginBottom: 18,
  },
  uploadIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  uploadText: { fontSize: 14, fontWeight: "600", color: PrimaryColor },
  uploadSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    justifyContent: "flex-end",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalOptionText: {
    fontSize: 15,
    color: "#111827",
  },

  submitBtn: {
    backgroundColor: PrimaryColor,
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    shadowColor: PrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, fontWeight: "700", color: PrimaryColor },
});
