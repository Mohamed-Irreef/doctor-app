import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Clock } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
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
import ActionModal from "../../../components/ActionModal";
import ButtonPrimary from "../../../components/ButtonPrimary";
import { Colors } from "../../../constants/Colors";
import {
    getLabSlotAvailability,
    getLabTestById,
    holdLabSlot,
} from "../../../services/api";

const DATE_WINDOW_DAYS = 7;
const SLOT_LOAD_BATCH_SIZE = 12;

function toISODateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function LabHomeBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [test, setTest] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState(() =>
    toISODateOnly(new Date()),
  );
  const [slots, setSlots] = useState<{ time: string; status: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [visibleSlotCount, setVisibleSlotCount] =
    useState(SLOT_LOAD_BATCH_SIZE);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [address, setAddress] = useState({
    flatHouse: "",
    streetArea: "",
    landmark: "",
    city: "",
    pincode: "",
    contactNumber: "",
  });
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Unable to continue");
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = useMemo(() => {
    return Array.from({ length: DATE_WINDOW_DAYS }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return {
        iso: toISODateOnly(date),
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        day: date.getDate(),
        month: date.toLocaleDateString(undefined, { month: "short" }),
      };
    });
  }, []);

  const visibleSlots = useMemo(
    () => slots.slice(0, visibleSlotCount),
    [slots, visibleSlotCount],
  );

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const response = await getLabTestById(id);
      if (response.data) setTest(response.data);
    };
    load();
  }, [id]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!id) return;
      setLoadingSlots(true);
      const response = await getLabSlotAvailability(id, selectedDate);
      if (response.data?.slots) {
        setSlots(response.data.slots);
        const held = response.data.slots.find(
          (slot: any) => slot.status === "held-by-you",
        );
        if (held) setSelectedSlot(held.time);
      }
      setVisibleSlotCount(SLOT_LOAD_BATCH_SIZE);
      setLoadingSlots(false);
    };
    loadSlots();
  }, [id, selectedDate]);

  const updateAddress = (key: string, value: string) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!selectedSlot) return "Select a time slot.";
    if (!address.flatHouse.trim()) return "Enter flat/house details.";
    if (!address.streetArea.trim()) return "Enter street or area.";
    if (!address.city.trim()) return "Enter city.";
    if (!address.pincode.trim()) return "Enter pincode.";
    if (!address.contactNumber.trim()) return "Enter contact number.";
    if (address.contactNumber.trim().length < 8) {
      return "Enter a valid contact number.";
    }
    return "";
  };

  const handleContinue = async () => {
    const error = validate();
    if (error) {
      setErrorMessage(error);
      setErrorModal(true);
      return;
    }

    if (!id) return;
    setSubmitting(true);
    const hold = await holdLabSlot(id, selectedDate, selectedSlot);
    setSubmitting(false);

    if (hold.status !== "success" || !hold.data) {
      setErrorMessage(hold.error || "Unable to reserve this slot.");
      setErrorModal(true);
      return;
    }

    router.push({
      pathname: "/(patient)/lab/summary",
      params: {
        id,
        collectionType: "home",
        date: selectedDate,
        time: selectedSlot,
        holdId: String(hold.data._id || hold.data.id),
        addressFlatHouse: address.flatHouse,
        addressStreetArea: address.streetArea,
        addressLandmark: address.landmark,
        addressCity: address.city,
        addressPincode: address.pincode,
        addressContact: address.contactNumber,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ActionModal
        visible={errorModal}
        type="error"
        title="Booking Error"
        message={errorMessage}
        confirmLabel="OK"
        onConfirm={() => setErrorModal(false)}
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
        <Text style={styles.headerTitle}>Home Collection</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 130 + Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {dateOptions.map((item) => (
              <TouchableOpacity
                key={item.iso}
                style={[
                  styles.dateCard,
                  selectedDate === item.iso && styles.dateCardActive,
                ]}
                onPress={() => setSelectedDate(item.iso)}
              >
                <Text
                  style={[
                    styles.dateWeek,
                    selectedDate === item.iso && styles.dateWeekActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.dateDay,
                    selectedDate === item.iso && styles.dateDayActive,
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateMonth,
                    selectedDate === item.iso && styles.dateMonthActive,
                  ]}
                >
                  {item.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Select Time</Text>
          </View>
          {loadingSlots ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading slots...</Text>
            </View>
          ) : (
            <View style={styles.slotGrid}>
              {visibleSlots.map((slot) => {
                const disabled =
                  slot.status === "booked" || slot.status === "held";
                const selected = selectedSlot === slot.time;
                return (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.slotChip,
                      selected && styles.slotChipActive,
                      disabled && styles.slotChipDisabled,
                    ]}
                    onPress={() => !disabled && setSelectedSlot(slot.time)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selected && styles.slotTextActive,
                        disabled && styles.slotTextDisabled,
                      ]}
                    >
                      {slot.status === "booked" ? "Booked" : slot.time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {!loadingSlots && visibleSlotCount < slots.length ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() =>
                setVisibleSlotCount((count) => count + SLOT_LOAD_BATCH_SIZE)
              }
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Collection Address</Text>
          <TextInput
            value={address.flatHouse}
            onChangeText={(value) => updateAddress("flatHouse", value)}
            placeholder="Flat / House"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={address.streetArea}
            onChangeText={(value) => updateAddress("streetArea", value)}
            placeholder="Street / Area"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={address.landmark}
            onChangeText={(value) => updateAddress("landmark", value)}
            placeholder="Landmark (optional)"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              value={address.city}
              onChangeText={(value) => updateAddress("city", value)}
              placeholder="City"
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, styles.rowInput]}
            />
            <TextInput
              value={address.pincode}
              onChangeText={(value) => updateAddress("pincode", value)}
              placeholder="Pincode"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
              style={[styles.input, styles.rowInput]}
            />
          </View>
          <TextInput
            value={address.contactNumber}
            onChangeText={(value) => updateAddress("contactNumber", value)}
            placeholder="Contact Number"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: 16 + Math.max(insets.bottom, 8) },
        ]}
      >
        <View>
          <Text style={styles.totalLabel}>Test Price</Text>
          <Text style={styles.totalPrice}>₹{test?.price || 0}</Text>
        </View>
        <ButtonPrimary
          title={submitting ? "Reserving..." : "Continue"}
          onPress={handleContinue}
          style={{ flex: 1, marginLeft: 16, paddingVertical: 16 }}
          disabled={submitting}
        />
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
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  scroll: { padding: 20, paddingBottom: 120, gap: 16 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  dateRow: { gap: 10, marginTop: 12 },
  dateCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    minWidth: 72,
    backgroundColor: Colors.surface,
  },
  dateCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dateWeek: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },
  dateWeekActive: { color: Colors.surface },
  dateDay: { fontSize: 18, fontWeight: "800", color: Colors.text },
  dateDayActive: { color: Colors.surface },
  dateMonth: { fontSize: 11, color: Colors.textSecondary },
  dateMonthActive: { color: "rgba(255,255,255,0.8)" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: { fontSize: 12, color: Colors.textSecondary },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  slotChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    minWidth: 90,
    alignItems: "center",
  },
  slotChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  slotChipDisabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.border,
  },
  slotText: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },
  slotTextActive: { color: Colors.primary, fontWeight: "700" },
  slotTextDisabled: { color: Colors.textSecondary },
  loadMoreBtn: {
    marginTop: 12,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginTop: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  rowInput: { flex: 1 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: { fontSize: 12, color: Colors.textSecondary },
  totalPrice: { fontSize: 22, fontWeight: "800", color: Colors.primary },
});
