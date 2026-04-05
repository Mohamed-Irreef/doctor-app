import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
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
import ButtonPrimary from "../../components/ButtonPrimary";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import {
    addLabTestReview,
    createReview,
    getDoctorById,
} from "../../services/api";

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    doctorId,
    appointmentId,
    reviewType,
    entityId,
    entityName,
    entitySubtitle,
    entityImage,
  } = useLocalSearchParams<{
    doctorId: string;
    appointmentId: string;
    reviewType: "doctor" | "lab" | "medicine";
    entityId: string;
    entityName: string;
    entitySubtitle: string;
    entityImage: string;
  }>();
  const [doctor, setDoctor] = useState<any | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalize = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value || "";

  const currentReviewType = normalize(reviewType) || "doctor";
  const isDoctorReview = currentReviewType === "doctor";

  const titleByType =
    currentReviewType === "lab"
      ? "Write a Lab Test Review"
      : currentReviewType === "medicine"
        ? "Write a Medicine Review"
        : "Write a Review";

  const inputPlaceholder =
    currentReviewType === "lab"
      ? "Share your experience with this lab test..."
      : currentReviewType === "medicine"
        ? "Share your experience with this medicine..."
        : "Share your experience with this doctor...";

  const confirmLabelByType =
    currentReviewType === "lab"
      ? "Back to Lab Test"
      : currentReviewType === "medicine"
        ? "Back to Medicine"
        : "Back to Profile";

  const entity = isDoctorReview
    ? {
        name: doctor?.name || "Doctor",
        subtitle: doctor?.specialization || "Specialist",
        image: doctor?.image,
      }
    : {
        name: normalize(entityName) || "Item",
        subtitle:
          normalize(entitySubtitle) ||
          (currentReviewType === "lab" ? "Lab Test" : "Medicine"),
        image: normalize(entityImage),
      };

  React.useEffect(() => {
    const load = async () => {
      if (!isDoctorReview || !normalize(doctorId)) return;
      const response = await getDoctorById(normalize(doctorId));
      if (response.data) setDoctor(response.data);
    };
    load();
  }, [doctorId, isDoctorReview]);

  const handleSubmit = async () => {
    if (rating === 0)
      return Alert.alert("Rating Required", "Please select a star rating.");
    if (isDoctorReview && !normalize(doctorId)) {
      return Alert.alert(
        "Missing Context",
        "Doctor information is missing for this review.",
      );
    }

    if (currentReviewType === "lab") {
      if (!normalize(entityId)) {
        return Alert.alert(
          "Missing Context",
          "Lab test information is missing.",
        );
      }
      setLoading(true);
      const response = await addLabTestReview(normalize(entityId), {
        rating,
        comment,
      });
      setLoading(false);
      if (response.status === "success") {
        setSubmitted(true);
        return;
      }
      Alert.alert("Review Failed", response.error || "Unable to submit review");
      return;
    }

    if (currentReviewType === "medicine") {
      Alert.alert(
        "Coming Soon",
        "Medicine review submission will be enabled in the next update.",
      );
      return;
    }

    setLoading(true);
    const response = await createReview({
      doctorId: normalize(doctorId),
      appointmentId: normalize(appointmentId) || undefined,
      rating,
      comment,
    });
    setLoading(false);
    if (response.status === "success") {
      setSubmitted(true);
      return;
    }
    Alert.alert("Review Failed", response.error || "Unable to submit review");
  };

  const PROMPTS = [
    "Excellent!",
    "Very Bad",
    "Okay",
    "Good",
    "Great!",
    "Excellent!",
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ActionModal
        visible={submitted}
        type="success"
        title="Review Submitted!"
        message={
          isDoctorReview
            ? "Thank you for your feedback. It helps other patients make better decisions."
            : "Thank you for your feedback. Your review will be published after moderation."
        }
        confirmLabel={confirmLabelByType}
        onConfirm={() => router.back()}
      />

      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <LinearGradient
        colors={[Colors.primary, Colors.primaryPressed]}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 8, paddingBottom: 12 },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={Colors.textInverse} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{titleByType}</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Info */}
        <View style={styles.doctorCard}>
          <Image source={{ uri: entity.image }} style={styles.docAvatar} />
          <View>
            <Text style={[Typography.h3, { marginBottom: 4 }]}>
              {entity.name}
            </Text>
            <Text style={[Typography.body2, { color: Colors.primary }]}>
              {entity.subtitle}
            </Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={[Typography.h3, { marginBottom: 8 }]}>
            Overall Rating
          </Text>
          {rating > 0 && (
            <Text
              style={[
                Typography.body2,
                { color: Colors.primary, marginBottom: 16, fontWeight: "600" },
              ]}
            >
              {PROMPTS[rating]}
            </Text>
          )}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Star
                  size={40}
                  color="#F59E0B"
                  fill={star <= rating ? "#F59E0B" : "none"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment Input */}
        <View style={styles.commentSection}>
          <Text style={[Typography.h3, { marginBottom: 12 }]}>Add Details</Text>
          <TextInput
            style={styles.textArea}
            placeholder={inputPlaceholder}
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        <ButtonPrimary
          title="Submit Review"
          onPress={handleSubmit}
          loading={loading}
          disabled={rating === 0}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
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
    ...Typography.h3,
    flex: 1,
    textAlign: "left",
    marginLeft: 12,
    color: Colors.textInverse,
  },
  scrollContent: { padding: 24, paddingBottom: 60 },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  docAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: Colors.border,
  },
  ratingSection: { alignItems: "center", marginBottom: 32 },
  starsRow: { flexDirection: "row", justifyContent: "center" },
  starBtn: { padding: 6 },
  commentSection: { marginBottom: 24 },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 130,
  },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  submitBtn: { marginTop: 8 },
});
