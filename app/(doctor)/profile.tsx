import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Edit2,
  LogOut,
  Star,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
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
import { Typography } from "../../constants/Typography";
import * as api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

type SectionKey = "personal" | "clinic" | "fee" | "availability";

const SECTION_TITLES: Record<SectionKey, string> = {
  personal: "Personal Information",
  clinic: "Clinic Details",
  fee: "Consultation Fee",
  availability: "Availability Type",
};

const FIELD_GROUPS: Record<SectionKey, { label: string; key: string }[]> = {
  personal: [
    { label: "Full Name", key: "name" },
    { label: "Phone Number", key: "phone" },
    { label: "Location", key: "location" },
  ],
  clinic: [
    { label: "Clinic Name", key: "clinicName" },
    { label: "Address", key: "clinicAddress" },
    { label: "Hospital Affiliation", key: "hospital" },
  ],
  fee: [
    { label: "Video Consult Fee", key: "consultationFeeVideo" },
    { label: "In-person Fee", key: "consultationFeeInPerson" },
    { label: "Chat Consult Fee", key: "consultationFeeChat" },
  ],
  availability: [
    { label: "Consultation Modes", key: "availabilityType" },
    { label: "Daily Slot Limit", key: "dailySlotLimit" },
    { label: "Notice Period (hours)", key: "noticePeriodHours" },
  ],
};

const availabilityLabel: Record<string, string> = {
  both: "Video, In-person, Chat",
  online: "Video, Chat",
  offline: "In-person",
};

const toCurrency = (value: string | number) => {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString("en-IN")}`;
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const DEFAULT_BANNER_URL =
  "https://res.cloudinary.com/dvbpddm9g/image/upload/v1774791127/nividoc/doctors/banners/kbacvcvtl4a1rgjzy6cs.png";

export default function DoctorProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const isApprovedDoctor = (user as any)?.doctorApprovalStatus === "approved";

  const [expanded, setExpanded] = useState<SectionKey | null>("personal");
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    name: "",
    phone: "",
    location: "",
    clinicName: "",
    clinicAddress: "",
    hospital: "",
    consultationFeeVideo: "0",
    consultationFeeInPerson: "0",
    consultationFeeChat: "0",
    availabilityType: "both",
    dailySlotLimit: "20",
    noticePeriodHours: "24",
  });

  const [doctorImage, setDoctorImage] = useState("");
  const [newImageUri, setNewImageUri] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [newBannerUri, setNewBannerUri] = useState("");
  const [bioText, setBioText] = useState("");
  const [specialization, setSpecialization] = useState("Doctor");
  const [rating, setRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorModal, setErrorModal] = useState(false);
  const [errorText, setErrorText] = useState("Unable to load profile.");

  const setError = (message: string) => {
    setErrorText(message);
    setErrorModal(true);
  };

  const hydrateFromProfile = (payload: any) => {
    const userData = payload?.user || {};
    const profile = payload?.profile || {};

    setDoctorImage(userData.image || "");
    setNewImageUri("");
    setBannerImage(profile.bannerImage || "");
    setNewBannerUri("");
    setBioText(profile.bio || "");
    setSpecialization(profile.specialization || "Doctor");
    setRating(profile.rating || 0);
    setReviewsCount(profile.reviewsCount || 0);

    setFieldValues({
      name: userData.name || "",
      phone: userData.phone || "",
      location: profile.clinicAddress || "",
      clinicName: profile.clinicName || "",
      clinicAddress: profile.clinicAddress || "",
      hospital: profile.hospital || "",
      consultationFeeVideo: String(profile.consultationFeeVideo ?? 0),
      consultationFeeInPerson: String(profile.consultationFeeInPerson ?? 0),
      consultationFeeChat: String(profile.consultationFeeChat ?? 0),
      availabilityType: profile.availabilityType || "both",
      dailySlotLimit: String(profile.dailySlotLimit ?? 20),
      noticePeriodHours: String(profile.noticePeriodHours ?? 24),
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const response = await api.getMyProfile();
      setLoading(false);

      if (response.status !== "success" || !response.data) {
        setError(response.error || "Unable to fetch doctor profile.");
        return;
      }

      hydrateFromProfile(response.data);
    };

    loadProfile();
  }, []);

  const visibleFields = useMemo(
    () => (section: SectionKey) =>
      FIELD_GROUPS[section].map((field) => {
        let value = fieldValues[field.key] || "";
        if (section === "fee") {
          value = toCurrency(value);
        }
        if (field.key === "availabilityType") {
          value = availabilityLabel[value] || value;
        }
        if (field.key === "dailySlotLimit") {
          value = `${value} patients`;
        }
        if (field.key === "noticePeriodHours") {
          value = `${value} hours`;
        }
        return { ...field, value };
      }),
    [fieldValues],
  );

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Please allow gallery permission to update profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const pickBannerImage = async () => {
    if (!isApprovedDoctor) {
      setError("Banner can be uploaded after your profile is approved.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Please allow gallery permission to upload banner image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewBannerUri(result.assets[0].uri);
    }
  };

  const savePublicProfile = async () => {
    if (!isApprovedDoctor) {
      setError("You can update public banner and bio after approval.");
      return;
    }

    setSaving(true);

    let uploadedBannerUrl = bannerImage;
    if (newBannerUri) {
      const upload = await api.uploadFile(
        {
          uri: newBannerUri,
          name: "doctor-banner.jpg",
          type: "image/jpeg",
        },
        "nividoc/doctors/banners",
        true,
      );

      if (upload.status !== "success" || !upload.data) {
        setSaving(false);
        setError(upload.error || "Banner upload failed.");
        return;
      }

      uploadedBannerUrl = (upload.data as any).url;
    }

    const payload: Record<string, any> = {
      bio: bioText.trim(),
    };

    if (uploadedBannerUrl) {
      payload.bannerImage = uploadedBannerUrl;
    }

    const response = await api.updateDoctorProfile(payload);
    setSaving(false);

    if (response.status !== "success" || !response.data) {
      setError(response.error || "Unable to update public profile.");
      return;
    }

    hydrateFromProfile(response.data);
    login("doctor", (response.data as any).user);
  };

  const saveSection = async (section: SectionKey) => {
    setSaving(true);

    let uploadedImageUrl = doctorImage;
    if (newImageUri) {
      const upload = await api.uploadFile(
        {
          uri: newImageUri,
          name: "doctor-profile.jpg",
          type: "image/jpeg",
        },
        "nividoc/doctors/profiles",
        true,
      );

      if (upload.status !== "success" || !upload.data) {
        setSaving(false);
        setError(upload.error || "Image upload failed.");
        return;
      }

      uploadedImageUrl = (upload.data as any).url;
    }

    const payload: Record<string, any> = {};

    if (section === "personal") {
      payload.name = fieldValues.name.trim();
      payload.phone = fieldValues.phone.trim();
      payload.clinicAddress = fieldValues.location.trim();
    }

    if (section === "clinic") {
      payload.clinicName = fieldValues.clinicName.trim();
      payload.clinicAddress = fieldValues.clinicAddress.trim();
      payload.hospital = fieldValues.hospital.trim();
    }

    if (section === "fee") {
      payload.consultationFeeVideo = toNumber(fieldValues.consultationFeeVideo);
      payload.consultationFeeInPerson = toNumber(
        fieldValues.consultationFeeInPerson,
      );
      payload.consultationFeeChat = toNumber(fieldValues.consultationFeeChat);
      payload.consultationFee = Math.max(
        payload.consultationFeeVideo,
        payload.consultationFeeInPerson,
        payload.consultationFeeChat,
      );
    }

    if (section === "availability") {
      const selectedMode = fieldValues.availabilityType.toLowerCase();
      payload.availabilityType = ["online", "offline", "both"].includes(
        selectedMode,
      )
        ? selectedMode
        : "both";
      payload.dailySlotLimit = Math.max(
        1,
        toNumber(fieldValues.dailySlotLimit),
      );
      payload.noticePeriodHours = Math.max(
        0,
        toNumber(fieldValues.noticePeriodHours),
      );
    }

    if (uploadedImageUrl) {
      payload.image = uploadedImageUrl;
    }

    const response = await api.updateDoctorProfile(payload as any);
    setSaving(false);

    if (response.status !== "success" || !response.data) {
      setError(response.error || "Unable to update doctor profile.");
      return;
    }

    hydrateFromProfile(response.data);
    login("doctor", (response.data as any).user);
    setEditingSection(null);
  };

  const onEditPress = async (section: SectionKey) => {
    if (editingSection === section) {
      await saveSection(section);
      return;
    }
    setEditingSection(section);
  };

  const toggle = (key: SectionKey) => {
    setExpanded((current) => (current === key ? null : key));
    if (editingSection && editingSection !== key) {
      setEditingSection(null);
    }
  };

  const onChangeField = (key: string, value: string) => {
    setFieldValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {errorModal ? (
        <ActionModal
          visible={errorModal}
          type="error"
          title="Profile Error"
          message={errorText}
          confirmLabel="OK"
          onConfirm={() => setErrorModal(false)}
        />
      ) : null}

      <View style={styles.header}>
        <Text style={Typography.h2}>My Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {newImageUri || doctorImage ? (
              <Image
                source={{ uri: newImageUri || doctorImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Camera color={Colors.textSecondary} size={20} />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={pickProfileImage}
            >
              <Camera color={Colors.surface} size={14} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.docName}>
              {fieldValues.name || user?.name || "Doctor"}
            </Text>
            <Text style={styles.docSpec}>{specialization}</Text>
            <View style={styles.ratingRow}>
              <Star color="#FBBF24" fill="#FBBF24" size={14} />
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({reviewsCount} reviews)</Text>
            </View>
          </View>
        </View>

        <View style={styles.publicProfileCard}>
          <Text style={styles.publicTitle}>Public Profile</Text>
          {!isApprovedDoctor ? (
            <Text style={styles.publicHint}>
              Banner upload is enabled once your doctor profile gets approved.
            </Text>
          ) : null}

          <View style={styles.bannerPreviewWrap}>
            <Image
              source={{
                uri: newBannerUri || bannerImage || DEFAULT_BANNER_URL,
              }}
              style={styles.bannerPreview}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.bannerUploadBtn,
              !isApprovedDoctor && styles.bannerUploadBtnDisabled,
            ]}
            onPress={pickBannerImage}
            disabled={!isApprovedDoctor || saving}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerUploadBtnText}>Upload Banner</Text>
          </TouchableOpacity>

          <Text style={styles.bioLabel}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bioText}
            onChangeText={setBioText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={isApprovedDoctor && !saving}
            placeholder="Add a short professional bio for patients"
            placeholderTextColor={Colors.textSecondary}
          />

          <TouchableOpacity
            style={[
              styles.savePublicBtn,
              (!isApprovedDoctor || saving) && styles.savePublicBtnDisabled,
            ]}
            onPress={savePublicProfile}
            disabled={!isApprovedDoctor || saving}
            activeOpacity={0.85}
          >
            <Text style={styles.savePublicBtnText}>
              {saving ? "Saving..." : "Save Public Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          (Object.keys(SECTION_TITLES) as SectionKey[]).map((sectionKey) => (
            <View key={sectionKey} style={styles.sectionCard}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>
                  {SECTION_TITLES[sectionKey]}
                </Text>
                <View style={styles.sectionActions}>
                  {expanded === sectionKey && (
                    <TouchableOpacity
                      style={styles.editBtn}
                      disabled={saving}
                      onPress={() => onEditPress(sectionKey)}
                    >
                      <Edit2 color={Colors.primary} size={14} />
                      <Text style={styles.editBtnText}>
                        {editingSection === sectionKey
                          ? saving
                            ? "Saving..."
                            : "Save"
                          : "Edit"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Pressable
                    onPress={() => toggle(sectionKey)}
                    android_ripple={{
                      color: "rgba(148, 163, 184, 0.2)",
                      borderless: true,
                    }}
                    style={styles.toggleBtn}
                  >
                    {expanded === sectionKey ? (
                      <ChevronUp color={Colors.textSecondary} size={20} />
                    ) : (
                      <ChevronDown color={Colors.textSecondary} size={20} />
                    )}
                  </Pressable>
                </View>
              </View>

              {expanded === sectionKey && (
                <View style={styles.fieldsContainer}>
                  {visibleFields(sectionKey).map((field) => (
                    <View key={field.key} style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      {editingSection === sectionKey ? (
                        <TextInput
                          style={styles.fieldInput}
                          value={fieldValues[field.key] || ""}
                          onChangeText={(value) =>
                            onChangeField(field.key, value)
                          }
                          placeholderTextColor={Colors.textSecondary}
                        />
                      ) : (
                        <Text style={styles.fieldValue}>
                          {field.value || "-"}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            router.replace("/(auth)/login");
          }}
          activeOpacity={0.8}
        >
          <LogOut color={Colors.error} size={18} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarWrap: { position: "relative", marginRight: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.lightGray,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  profileInfo: { flex: 1, gap: 4 },
  docName: { fontSize: 18, fontWeight: "800", color: Colors.text },
  docSpec: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13, fontWeight: "700", color: Colors.text },
  ratingCount: { fontSize: 12, color: Colors.textSecondary },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  loadingText: { color: Colors.textSecondary, fontWeight: "600" },
  publicProfileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  publicTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  publicHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  bannerPreviewWrap: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerPreview: {
    width: "100%",
    height: 140,
    backgroundColor: Colors.lightGray,
  },
  bannerUploadBtn: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  bannerUploadBtnDisabled: {
    opacity: 0.5,
  },
  bannerUploadBtnText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  bioLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  bioInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  savePublicBtn: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  savePublicBtnDisabled: {
    opacity: 0.5,
  },
  savePublicBtnText: {
    color: Colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  sectionActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  fieldsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  fieldValue: { fontSize: 14, color: Colors.text, fontWeight: "600" },
  fieldInput: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: Colors.error },
});
