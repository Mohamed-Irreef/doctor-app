import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Minus, Plus, Tag, Trash2 } from "lucide-react-native";
import React from "react";
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
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
import ButtonPrimary from "../../components/ButtonPrimary";
import BottomActionBar from "../../components/common/BottomActionBar";
import { Colors } from "../../constants/Colors";
import { Spacing } from "../../constants/Spacing";
import { Typography } from "../../constants/Typography";
import { createOrder, uploadFile } from "../../services/api";
import { processEntityPayment } from "../../services/payment";
import { useCartStore } from "../../store/cartStore";

type CartFooterProps = {
  subtotal: number;
  delivery: number;
  total: number;
  deliveryAddress: string;
  onChangeDeliveryAddress: (value: string) => void;
  contactName: string;
  onChangeContactName: (value: string) => void;
  contactPhone: string;
  onChangeContactPhone: (value: string) => void;
  prescriptionRequired: boolean;
  uploadingPrescription: boolean;
  prescription: { url: string; name: string; mimeType: string } | null;
  onPickPrescription: () => void;
  onRemovePrescription: () => void;
  onPreviewPrescription: (url: string) => void;
};

const BILL_LABEL_ITEM_TOTAL = "Item Total";
const BILL_LABEL_DELIVERY_FEE = "Delivery Fee";

const CartFooter = React.memo(function CartFooter({
  subtotal,
  delivery,
  total,
  deliveryAddress,
  onChangeDeliveryAddress,
  contactName,
  onChangeContactName,
  contactPhone,
  onChangeContactPhone,
  prescriptionRequired,
  uploadingPrescription,
  prescription,
  onPickPrescription,
  onRemovePrescription,
  onPreviewPrescription,
}: CartFooterProps) {
  return (
    <>
      <TouchableOpacity style={styles.promoCard}>
        <Tag color={Colors.primary} size={20} />
        <Text
          style={[
            Typography.body1,
            { flex: 1, marginLeft: 12, fontWeight: "500" },
          ]}
        >
          Apply Promo Code
        </Text>
        <Text style={{ color: Colors.primary, fontWeight: "700" }}>ADD</Text>
      </TouchableOpacity>

      <View style={styles.billCard}>
        <Text style={[Typography.h3, { marginBottom: 16 }]}>Bill Details</Text>
        {[
          { label: BILL_LABEL_ITEM_TOTAL, value: `Rs ${subtotal.toFixed(2)}` },
          {
            label: BILL_LABEL_DELIVERY_FEE,
            value: `Rs ${delivery.toFixed(2)}`,
          },
        ].map((row, i) => (
          <View key={i} style={styles.billRow}>
            <Text style={Typography.body2}>{row.label}</Text>
            <Text style={Typography.body1}>{row.value}</Text>
          </View>
        ))}
        <View style={[styles.billRow, styles.totalRow]}>
          <Text style={[Typography.body1, { fontWeight: "700" }]}>To Pay</Text>
          <Text style={[Typography.h2, { color: Colors.primary }]}>
            Rs {total.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.checkoutCard}>
        <Text style={styles.checkoutTitle}>Delivery Details</Text>
        <TextInput
          value={deliveryAddress}
          onChangeText={onChangeDeliveryAddress}
          style={styles.input}
          placeholder="Delivery address"
          placeholderTextColor={Colors.textSecondary}
          multiline
        />
        <TextInput
          value={contactName}
          onChangeText={onChangeContactName}
          style={styles.input}
          placeholder="Contact name"
          placeholderTextColor={Colors.textSecondary}
        />
        <TextInput
          value={contactPhone}
          onChangeText={onChangeContactPhone}
          style={styles.input}
          placeholder="Contact phone"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />

        {prescriptionRequired ? (
          <>
            <Text style={styles.prescriptionLabel}>
              Prescription Upload (PDF/JPG/PNG)
            </Text>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={onPickPrescription}
              disabled={uploadingPrescription}
            >
              <Text style={styles.uploadBtnText}>
                {uploadingPrescription
                  ? "Uploading..."
                  : prescription
                    ? "Replace Prescription"
                    : "Upload Prescription"}
              </Text>
            </TouchableOpacity>
            {prescription ? (
              <View style={styles.prescriptionCard}>
                <Text style={styles.prescriptionName} numberOfLines={1}>
                  {prescription.name}
                </Text>
                <View style={styles.prescriptionActions}>
                  <TouchableOpacity
                    onPress={() => onPreviewPrescription(prescription.url)}
                  >
                    <Text style={styles.prescriptionLink}>Preview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onRemovePrescription}>
                    <Text style={styles.prescriptionRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.prescriptionHint}>
                Upload is required for medicines marked prescription-only.
              </Text>
            )}
          </>
        ) : null}
      </View>
    </>
  );
});

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, incrementQuantity, decrementQuantity, removeItem, clearCart } =
    useCartStore();
  const [loading, setLoading] = React.useState(false);
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [prescription, setPrescription] = React.useState<{
    url: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [uploadingPrescription, setUploadingPrescription] =
    React.useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const delivery = 5.0;
  const total = subtotal + delivery;
  const prescriptionRequired = items.some((item) => item.prescriptionRequired);

  const pickPrescription = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const mimeType = String(asset.mimeType || "").toLowerCase();
    const fileName = asset.name || "prescription";
    const lowerName = fileName.toLowerCase();

    const validMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
    const validExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const isValidType =
      validMimeTypes.includes(mimeType) ||
      validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidType) {
      Alert.alert(
        "Unsupported file",
        "Please upload prescription as PDF, JPG, or PNG.",
      );
      return;
    }

    setUploadingPrescription(true);

    const uploadResponse = await uploadFile(
      {
        uri: asset.uri,
        name: fileName,
        type: mimeType || "application/octet-stream",
      },
      "nividoc/prescriptions",
    );

    setUploadingPrescription(false);

    if (uploadResponse.status !== "success" || !uploadResponse.data?.url) {
      Alert.alert(
        "Upload failed",
        uploadResponse.error || "Could not upload prescription file.",
      );
      return;
    }

    setPrescription({
      url: uploadResponse.data.url,
      name: fileName,
      mimeType: mimeType || "application/octet-stream",
    });
  };

  const handlePlaceOrder = async () => {
    if (!items.length) {
      router.push("/(patient)/pharmacy");
      return;
    }

    if (prescriptionRequired && !prescription?.url) {
      Alert.alert(
        "Prescription required",
        "Please upload a valid prescription before placing this order.",
      );
      return;
    }

    setLoading(true);

    const response = await createOrder(
      items.map((item) => ({ medicineId: item.id, quantity: item.quantity })),
      {
        deliveryAddress: deliveryAddress || undefined,
        deliveryContactName: contactName || undefined,
        deliveryContactPhone: contactPhone || undefined,
        prescription: prescription
          ? { url: prescription.url, note: prescription.name }
          : undefined,
      },
    );

    if (response.status !== "success" || !response.data) {
      setLoading(false);
      if (
        (response.error || "").toLowerCase().includes("complete your profile")
      ) {
        router.push("/(patient)/profile");
        return;
      }

      router.push({
        pathname: "/(patient)/payment-result",
        params: {
          success: "false",
          amount: String(total.toFixed(2)),
          doctorName: "Pharmacy",
          context: "Medicine Order",
          retryPath: "/(patient)/cart",
          reason: response.error || "Unable to create order",
        },
      });
      return;
    }

    const orderId = String(
      (response.data as any)._id || (response.data as any).id,
    );
    const payment = await processEntityPayment("pharmacy", orderId);
    setLoading(false);

    if (payment.status === "success") {
      clearCart();
      router.push({
        pathname: "/(patient)/payment-result",
        params: {
          success: "true",
          amount: String(total.toFixed(2)),
          doctorName: "Pharmacy",
          context: "Medicine Order",
        },
      });
      return;
    }

    router.push({
      pathname: "/(patient)/payment-result",
      params: {
        success: "false",
        amount: String(total.toFixed(2)),
        doctorName: "Pharmacy",
        context: "Medicine Order",
        retryPath: "/(patient)/cart",
        reason: payment.error || "Payment verification failed",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryPressed}
      />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
              style={styles.headerIconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft color={Colors.textInverse} size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Cart ({items.length})</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <FlatList
          data={items}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 140 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListFooterComponent={
            <CartFooter
              subtotal={subtotal}
              delivery={delivery}
              total={total}
              deliveryAddress={deliveryAddress}
              onChangeDeliveryAddress={setDeliveryAddress}
              contactName={contactName}
              onChangeContactName={setContactName}
              contactPhone={contactPhone}
              onChangeContactPhone={setContactPhone}
              prescriptionRequired={prescriptionRequired}
              uploadingPrescription={uploadingPrescription}
              prescription={prescription}
              onPickPrescription={pickPrescription}
              onRemovePrescription={() => setPrescription(null)}
              onPreviewPrescription={(url) => Linking.openURL(url)}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text
                  style={[Typography.body1, { fontWeight: "600" }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    Typography.h3,
                    { color: Colors.primary, marginTop: 4 },
                  ]}
                >
                  Rs {item.price.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={{ marginRight: 10 }}
                onPress={() => removeItem(item.id)}
              >
                <Trash2 size={18} color={Colors.error} />
              </TouchableOpacity>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.qBtn}
                  onPress={() => decrementQuantity(item.id)}
                >
                  <Minus size={16} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.qText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qBtn}
                  onPress={() => incrementQuantity(item.id)}
                >
                  <Plus size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySub}>
                Add medicines from pharmacy to place an order.
              </Text>
            </View>
          }
        />

        <BottomActionBar>
          <ButtonPrimary
            title={
              loading
                ? "Processing Payment..."
                : items.length
                  ? `Place Order · Rs ${total.toFixed(2)}`
                  : "Go to Pharmacy"
            }
            onPress={handlePlaceOrder}
            loading={loading}
            style={{ width: "100%" }}
          />
        </BottomActionBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardWrap: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.screenH,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBtn: {
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
    ...Typography.h3,
    fontSize: 18,
    color: Colors.textInverse,
  },
  listContent: { padding: 20 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    marginRight: 16,
  },
  itemInfo: { flex: 1 },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qText: { width: 28, textAlign: "center", fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: "center" },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  billCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkoutCard: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
  },
  checkoutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  prescriptionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  uploadBtn: {
    borderRadius: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    alignItems: "center",
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  prescriptionCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    backgroundColor: Colors.background,
  },
  prescriptionName: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600",
  },
  prescriptionActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 16,
  },
  prescriptionLink: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  prescriptionRemove: {
    color: Colors.error,
    fontWeight: "700",
    fontSize: 12,
  },
  prescriptionHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    marginTop: 4,
    marginBottom: 0,
  },
});
