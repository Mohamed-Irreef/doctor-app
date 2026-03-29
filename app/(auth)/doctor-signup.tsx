import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Camera,
    CheckCircle,
    ChevronDown,
    Eye,
    EyeOff,
    FileText,
    IndianRupee,
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
import * as api from "../../services/api";

const PrimaryColor = "#2563EB";
const SecondaryColor = "#14B8A6";
const BgColor = "#F9FAFB";
const AVAILABILITY_TYPES: ("online" | "offline" | "both")[] = [
  "online",
  "offline",
  "both",
];
const GENDER_OPTIONS = ["Male", "Female", "Other"];

function InputField({
  icon: Icon,
  placeholder,
  secureTextEntry,
  keyboardType,
  showToggle,
  onToggle,
  multiline,
  style,
  value,
  onChangeText,
}: any) {
  return (
    <View style={[styles.inputContainer, style]}>
      {Icon && <Icon color="#6B7280" size={18} style={styles.inputIcon} />}
      <TextInput
        style={[
          styles.input,
          multiline && { height: 80, textAlignVertical: "top" },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        value={value}
        onChangeText={onChangeText}
      />
      {showToggle !== undefined && (
        <TouchableOpacity onPress={onToggle} style={{ padding: 10 }}>
          {showToggle ? (
            <EyeOff color="#6B7280" size={18} />
          ) : (
            <Eye color="#6B7280" size={18} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

function Dropdown({ icon: Icon, placeholder, value, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.inputContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {Icon && <Icon color="#6B7280" size={18} style={styles.inputIcon} />}
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

export default function DoctorSignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");

  const [specialization, setSpecialization] = useState("Cardiologist");
  const [qualifications, setQualifications] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [certificateUri, setCertificateUri] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");

  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [availabilityType, setAvailabilityType] = useState<
    "online" | "offline" | "both"
  >("both");
  const [clinicLatitude, setClinicLatitude] = useState<number | null>(null);
  const [clinicLongitude, setClinicLongitude] = useState<number | null>(null);

  const [profileImageUri, setProfileImageUri] = useState("");
  const [profileImageName, setProfileImageName] =
    useState("doctor-profile.jpg");
  const [profileImageType, setProfileImageType] = useState("image/jpeg");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const [certificateName, setCertificateName] = useState("doctor-certificate");
  const [certificateType, setCertificateType] = useState(
    "application/octet-stream",
  );

  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorText, setErrorText] = useState(
    "Please fill all required fields.",
  );
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const SPECIALTIES = [
    "Cardiologist",
    "Dentist",
    "Neurologist",
    "Pediatrician",
    "Dermatologist",
  ];

  const validateStep = () => {
    if (step === 1) {
      if (
        !name.trim() ||
        !email.trim() ||
        !phone.trim() ||
        !password.trim() ||
        !gender
      ) {
        setErrorText("Step 1 is incomplete. Please fill all required fields.");
        setErrorModal(true);
        return false;
      }

      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setErrorText("Please enter a valid email address.");
        setErrorModal(true);
        return false;
      }

      if (phone.trim().length < 8) {
        setErrorText("Phone number must be at least 8 digits.");
        setErrorModal(true);
        return false;
      }

      if (password.trim().length < 6) {
        setErrorText("Password must be at least 6 characters.");
        setErrorModal(true);
        return false;
      }
    }

    if (step === 2) {
      if (
        !specialization ||
        !qualifications.trim() ||
        !experienceYears.trim() ||
        !licenseNumber.trim()
      ) {
        setErrorText(
          "Step 2 is incomplete. Please provide professional details.",
        );
        setErrorModal(true);
        return false;
      }
    }

    if (step === 3) {
      if (
        !clinicName.trim() ||
        !clinicAddress.trim() ||
        !consultationFee.trim()
      ) {
        setErrorText(
          "Step 3 is incomplete. Please fill clinic details and consultation fee.",
        );
        setErrorModal(true);
        return false;
      }

      const parsedFee = Number(consultationFee.replace(/,/g, "."));
      if (!Number.isFinite(parsedFee) || parsedFee <= 0) {
        setErrorText("Consultation fee must be a valid amount greater than 0.");
        setErrorModal(true);
        return false;
      }
    }

    return true;
  };

  const pickProfileImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setProfileImageUri(asset.uri);
      setProfileImageName(asset.name || "doctor-profile.jpg");
      setProfileImageType(asset.mimeType || "image/jpeg");
      setProfileImageUrl("");
    }
  };

  const pickCertificate = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setCertificateUri(asset.uri);
      setCertificateName(asset.name || "doctor-certificate");
      setCertificateType(asset.mimeType || "application/octet-stream");
      setCertificateUrl("");
    }
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setErrorText(
        "Location permission is required to capture clinic latitude/longitude.",
      );
      setErrorModal(true);
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setClinicLatitude(location.coords.latitude);
    setClinicLongitude(location.coords.longitude);
  };

  const uploadIfNeeded = async () => {
    let uploadedProfileUrl = profileImageUrl;
    let uploadedCertificateUrl = certificateUrl;

    if (!uploadedProfileUrl && profileImageUri) {
      const profileUpload = await api.uploadFile(
        {
          uri: profileImageUri,
          name: profileImageName,
          type: profileImageType,
        },
        "nividoc/doctors/profiles",
        true,
      );
      if (profileUpload.status !== "success" || !profileUpload.data) {
        return {
          ok: false,
          error: profileUpload.error || "Doctor profile image upload failed",
        };
      }
      uploadedProfileUrl = (profileUpload.data as any).url;
      setProfileImageUrl(uploadedProfileUrl);
    }

    if (!uploadedCertificateUrl && certificateUri) {
      const certificateUpload = await api.uploadFile(
        {
          uri: certificateUri,
          name: certificateName,
          type: certificateType,
        },
        "nividoc/doctors/certificates",
        true,
      );
      if (certificateUpload.status !== "success" || !certificateUpload.data) {
        return {
          ok: false,
          error: certificateUpload.error || "Certificate upload failed",
        };
      }
      uploadedCertificateUrl = (certificateUpload.data as any).url;
      setCertificateUrl(uploadedCertificateUrl);
    }

    return {
      ok: true,
      profileUrl: uploadedProfileUrl,
      certificateUrl: uploadedCertificateUrl,
    };
  };

  const nextStep = async () => {
    if (!validateStep()) return;

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    const uploadResult = await uploadIfNeeded();

    if (!uploadResult.ok) {
      setLoading(false);
      setErrorText(uploadResult.error || "Upload failed.");
      setErrorModal(true);
      return;
    }

    const submit = await api.registerDoctorSignupRequest({
      consultationFee: Number(consultationFee.replace(/,/g, ".")),
      consultationFeeVideo: Number(consultationFee.replace(/,/g, ".")),
      consultationFeeInPerson: Number(consultationFee.replace(/,/g, ".")),
      consultationFeeChat: Number(consultationFee.replace(/,/g, ".")),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      ...(uploadResult.profileUrl ? { image: uploadResult.profileUrl } : {}),
      gender,
      specialization,
      qualifications: qualifications
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      licenseNumber: licenseNumber.trim(),
      experienceYears: Number(experienceYears),
      availabilityType,
      clinicName: clinicName.trim(),
      clinicAddress: clinicAddress.trim(),
      clinicLocation: {
        latitude: clinicLatitude ?? 0,
        longitude: clinicLongitude ?? 0,
      },
      hospital: clinicName.trim(),
      bio: `${specialization} doctor at ${clinicName.trim()}`,
      languages: ["English"],
      ...(uploadResult.certificateUrl
        ? {
            certificateUrls: [uploadResult.certificateUrl],
            certificateFiles: [
              {
                url: uploadResult.certificateUrl,
                name: certificateName,
              },
            ],
          }
        : {}),
    });

    setLoading(false);

    if (submit.status !== "success") {
      setErrorText(submit.error || "Doctor signup request failed.");
      setErrorModal(true);
      return;
    }

    setIsSuccess(true);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <CheckCircle color={SecondaryColor} size={80} strokeWidth={1.5} />
        <Text style={styles.successTitle}>Profile Submitted</Text>
        <Text style={styles.successText}>
          Your signup request has been sent to admin for approval.
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.successBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {errorModal ? (
          <ActionModal
            visible={errorModal}
            type="error"
            title="Validation Error"
            message={errorText}
            confirmLabel="OK"
            onConfirm={() => setErrorModal(false)}
          />
        ) : null}

        <View style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Registration</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]}
          />
        </View>
        <Text style={styles.stepText}>Step {step} of 3</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
        >
          {step === 1 && (
            <View style={styles.formSection}>
              <Text style={styles.title}>Basic Details</Text>

              <TouchableOpacity
                style={styles.uploadAvatar}
                activeOpacity={0.8}
                onPress={pickProfileImage}
              >
                <View style={styles.avatarPlaceholder}>
                  <Camera color="#9CA3AF" size={28} />
                </View>
                <Text style={styles.uploadAvatarText}>
                  {profileImageUri
                    ? "Profile Photo Selected"
                    : "Upload Profile Photo (Optional)"}
                </Text>
              </TouchableOpacity>

              <InputField
                icon={User}
                placeholder="Full Name (with Dr.) *"
                value={name}
                onChangeText={setName}
              />
              <InputField
                icon={Mail}
                placeholder="Email Address *"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <InputField
                icon={Phone}
                placeholder="Phone Number *"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <InputField
                icon={Lock}
                placeholder="Password *"
                secureTextEntry={!showPass}
                showToggle={showPass}
                onToggle={() => setShowPass(!showPass)}
                value={password}
                onChangeText={setPassword}
              />
              <Dropdown
                icon={User}
                placeholder="Gender *"
                value={gender}
                onPress={() => setShowGenderPicker(true)}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.formSection}>
              <Text style={styles.title}>Professional Details</Text>

              <Text style={styles.label}>Specialization *</Text>
              <View style={styles.chipsContainer}>
                {SPECIALTIES.map((item) => {
                  const active = specialization === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSpecialization(item)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <InputField
                icon={FileText}
                placeholder="Qualifications (comma-separated) *"
                value={qualifications}
                onChangeText={setQualifications}
              />
              <InputField
                icon={User}
                placeholder="Years of Experience *"
                keyboardType="numeric"
                value={experienceYears}
                onChangeText={setExperienceYears}
              />
              <InputField
                icon={FileText}
                placeholder="Medical Registration Number *"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />

              <TouchableOpacity
                style={styles.uploadDoc}
                activeOpacity={0.8}
                onPress={pickCertificate}
              >
                <FileText color={PrimaryColor} size={24} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.uploadDocText}>
                    {certificateUri
                      ? "Medical Certificate Selected"
                      : "Upload Medical Certificate (Optional)"}
                  </Text>
                  <Text style={styles.uploadDocSub}>PDF or Image</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.formSection}>
              <Text style={styles.title}>Clinic & Availability</Text>

              <InputField
                placeholder="Clinic / Hospital Name *"
                value={clinicName}
                onChangeText={setClinicName}
              />
              <InputField
                placeholder="Clinic Address *"
                multiline
                style={{ height: 80, alignItems: "flex-start", paddingTop: 12 }}
                value={clinicAddress}
                onChangeText={setClinicAddress}
              />

              <TouchableOpacity
                style={styles.mapPlaceholder}
                onPress={captureLocation}
                activeOpacity={0.85}
              >
                <MapPin color={PrimaryColor} size={20} />
                <Text style={styles.mapText}>
                  {clinicLatitude !== null && clinicLongitude !== null
                    ? `Location captured (${clinicLatitude.toFixed(4)}, ${clinicLongitude.toFixed(4)})`
                    : "Capture Clinic Location (Latitude/Longitude) (Optional)"}
                </Text>
              </TouchableOpacity>

              <InputField
                icon={IndianRupee}
                placeholder="Consultation Fee (INR) *"
                keyboardType="numeric"
                value={consultationFee}
                onChangeText={setConsultationFee}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>
                Availability Type *
              </Text>
              <View style={styles.radioGroup}>
                {AVAILABILITY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioBtn}
                    onPress={() => setAvailabilityType(type)}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        availabilityType === type && styles.radioOuterActive,
                      ]}
                    >
                      {availabilityType === type && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.btnRow}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.backActionBtn]}
                onPress={prevStep}
              >
                <Text style={styles.backActionText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.nextActionBtn]}
              onPress={nextStep}
              disabled={loading}
            >
              <Text style={styles.nextActionText}>
                {loading
                  ? "Submitting..."
                  : step === 3
                    ? "Submit Profile"
                    : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {showGenderPicker ? (
          <Modal
            visible={showGenderPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowGenderPicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowGenderPicker(false)}
            >
              <TouchableOpacity
                style={styles.modalCard}
                activeOpacity={1}
                onPress={() => null}
              >
                <Text style={styles.modalTitle}>Select Gender</Text>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalOption}
                    onPress={() => {
                      setGender(option);
                      setShowGenderPicker(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        ) : null}
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
    backgroundColor: BgColor,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  progressContainer: {
    height: 4,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: PrimaryColor,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: PrimaryColor,
    textAlign: "center",
    marginTop: 12,
  },

  scroll: { padding: 24, paddingBottom: 60 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 24,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },

  formSection: { gap: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 52,
  },
  inputIcon: { marginLeft: 16, marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: "#111827", paddingHorizontal: 16 },

  uploadAvatar: { alignItems: "center", marginBottom: 16 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  uploadAvatarText: { fontSize: 14, fontWeight: "600", color: PrimaryColor },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#EFF6FF", borderColor: PrimaryColor },
  chipText: { fontSize: 13, fontWeight: "500", color: "#6B7280" },
  chipTextActive: { color: PrimaryColor, fontWeight: "600" },

  uploadDoc: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    marginTop: 8,
  },
  uploadDocText: { fontSize: 14, fontWeight: "600", color: PrimaryColor },
  uploadDocSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  mapPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  mapText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
    textAlign: "center",
  },

  radioGroup: { flexDirection: "row", gap: 16 },
  radioBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: PrimaryColor },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PrimaryColor,
  },
  radioLabel: { fontSize: 15, color: "#4B5563" },

  btnRow: { flexDirection: "row", gap: 16, marginTop: 40 },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backActionBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backActionText: { fontSize: 16, fontWeight: "600", color: "#4B5563" },
  nextActionBtn: {
    backgroundColor: PrimaryColor,
    shadowColor: PrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextActionText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

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

  successScreen: {
    flex: 1,
    backgroundColor: BgColor,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  successBtn: {
    backgroundColor: PrimaryColor,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  successBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
