import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, Camera, MapPin, Save } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import ActionModal from "../../components/ActionModal";
import { Colors } from "../../constants/Colors";
import * as api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

function formatDate(date?: string | Date | null) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

export default function PatientProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "error",
  );
  const [modalTitle, setModalTitle] = useState("Profile Error");
  const [modalText, setModalText] = useState(
    "Please complete required fields.",
  );

  const showModal = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalText(message);
    setModalVisible(true);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const response = await api.getMyProfile();
      if (response.status !== "success" || !response.data) return;

      const userData = (response.data as any).user;
      const profile = (response.data as any).profile || {};

      setName(userData?.name || "");
      setPhone(userData?.phone || "");
      setImageUrl(userData?.image || "");
      setGender(profile.gender || "");
      setDob(profile.dateOfBirth ? new Date(profile.dateOfBirth) : null);
      setBloodGroup(profile.bloodGroup || "");
      setAddress(profile.address || "");
      setEmergencyContact(profile.emergencyContact || "");
      setLatitude(profile.location?.latitude ?? null);
      setLongitude(profile.location?.longitude ?? null);
    };

    loadProfile();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showModal(
        "error",
        "Profile Error",
        "Please allow gallery permission to upload profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      showModal("error", "Profile Error", "Location permission denied.");
      return;
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const nextLatitude = current.coords.latitude;
    const nextLongitude = current.coords.longitude;
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);

    const update = await api.updatePatientProfile({
      location: { latitude: nextLatitude, longitude: nextLongitude },
    });

    if (update.status !== "success" || !update.data) {
      showModal(
        "error",
        "Profile Error",
        update.error || "Unable to save location",
      );
      return;
    }

    login("patient", (update.data as any).user);
  };

  const openDobPicker = () => {
    DateTimePickerAndroid.open({
      value: dob || new Date(2000, 0, 1),
      mode: "date",
      maximumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) setDob(selectedDate);
      },
    });
  };

  const saveProfile = async () => {
    if (
      !name.trim() ||
      !phone.trim() ||
      !gender ||
      !dob ||
      !bloodGroup ||
      !address.trim() ||
      !emergencyContact.trim()
    ) {
      showModal(
        "error",
        "Profile Error",
        "Please complete all required profile fields.",
      );
      return;
    }

    setLoading(true);

    let finalImage = imageUrl;
    if (imageUri) {
      const upload = await api.uploadFile(
        { uri: imageUri, name: "patient-profile.jpg", type: "image/jpeg" },
        "nividoc/patients",
        false,
      );
      if (upload.status !== "success" || !upload.data) {
        setLoading(false);
        showModal(
          "error",
          "Profile Error",
          upload.error || "Image upload failed",
        );
        return;
      }
      finalImage = (upload.data as any).url;
      setImageUrl(finalImage);
      setImageUri("");
    }

    const update = await api.updatePatientProfile({
      name: name.trim(),
      phone: phone.trim(),
      image: finalImage,
      gender,
      dateOfBirth: dob.toISOString(),
      bloodGroup,
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      location:
        latitude !== null && longitude !== null
          ? { latitude, longitude }
          : undefined,
    });

    setLoading(false);

    if (update.status !== "success" || !update.data) {
      showModal(
        "error",
        "Profile Error",
        update.error || "Unable to update profile",
      );
      return;
    }

    login("patient", (update.data as any).user);
    router.replace("/(patient)");
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <ActionModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalText}
        confirmLabel="OK"
        onConfirm={() => setModalVisible(false)}
      />

      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color={Colors.textInverse} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Fill all details before booking appointments or placing orders.
        </Text>

        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
          {imageUri || imageUrl ? (
            <Image
              source={{ uri: imageUri || imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Camera color={Colors.primary} size={24} />
            </View>
          )}
          <Text style={styles.avatarText}>Upload Profile Photo *</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone *"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <View style={styles.optionRow}>
          {GENDERS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setGender(item)}
              style={[
                styles.optionChip,
                gender === item && styles.optionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  gender === item && styles.optionChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.inputButton} onPress={openDobPicker}>
          <Calendar color="#6B7280" size={18} />
          <Text style={{ marginLeft: 10, color: dob ? "#111827" : "#9CA3AF" }}>
            {dob ? formatDate(dob) : "Date of Birth *"}
          </Text>
        </TouchableOpacity>

        <View style={styles.optionRow}>
          {BLOOD_GROUPS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setBloodGroup(item)}
              style={[
                styles.optionChip,
                bloodGroup === item && styles.optionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  bloodGroup === item && styles.optionChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="City, State, Pincode *"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Emergency Contact *"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />

        <TouchableOpacity style={styles.locationBtn} onPress={captureLocation}>
          <MapPin color={Colors.primary} size={18} />
          <Text style={styles.locationText}>
            {latitude !== null && longitude !== null
              ? `Location captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              : "Capture Current Location (Lat/Long)"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveProfile}
          disabled={loading}
        >
          <Save color="#FFFFFF" size={18} />
          <Text style={styles.saveText}>
            {loading ? "Saving..." : "Save Profile"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
  },
  backBtn: {
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
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  scroll: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, marginBottom: 20 },
  avatarWrap: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  avatarPlaceholder: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  avatarText: { marginTop: 8, color: Colors.primary, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipActive: { borderColor: Colors.primary, backgroundColor: "#EFF6FF" },
  optionChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  optionChipTextActive: { color: Colors.primary },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#EFF6FF",
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 10,
    color: Colors.primary,
    fontWeight: "600",
    flex: 1,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
