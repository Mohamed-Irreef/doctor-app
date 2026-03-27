import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { ArrowLeft, Trash2, Tag, Minus, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ButtonPrimary from '../../components/ButtonPrimary';
import { useCartStore } from '../../store/cartStore';
import { MEDICINES } from '../../constants/MockData';

// Pre-populate cart with initial data for demo (since no persistent storage)
const DEMO_ITEMS = [
  { ...MEDICINES[0], quantity: 2 },
  { ...MEDICINES[1], quantity: 1 },
];

export default function CartScreen() {
  const router = useRouter();
  const { incrementQuantity, decrementQuantity, removeItem } = useCartStore();
  
  // Use demo items directly for mock display
  const items = DEMO_ITEMS;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = 5.00;
  const total = subtotal + delivery;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { flex: 1, textAlign: 'center' }]}>My Cart ({items.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={items}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <>
            <TouchableOpacity style={styles.promoCard}>
              <Tag color={Colors.primary} size={20} />
              <Text style={[Typography.body1, { flex: 1, marginLeft: 12, fontWeight: '500' }]}>Apply Promo Code</Text>
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>ADD</Text>
            </TouchableOpacity>

            <View style={styles.billCard}>
              <Text style={[Typography.h3, { marginBottom: 16 }]}>Bill Details</Text>
              {[
                { label: 'Item Total', value: `$${subtotal.toFixed(2)}` },
                { label: 'Delivery Fee', value: `$${delivery.toFixed(2)}` },
              ].map((row, i) => (
                <View key={i} style={styles.billRow}>
                  <Text style={Typography.body2}>{row.label}</Text>
                  <Text style={Typography.body1}>{row.value}</Text>
                </View>
              ))}
              <View style={[styles.billRow, styles.totalRow]}>
                <Text style={[Typography.body1, { fontWeight: '700' }]}>To Pay</Text>
                <Text style={[Typography.h2, { color: Colors.primary }]}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={[Typography.body1, { fontWeight: '600' }]} numberOfLines={2}>{item.name}</Text>
              <Text style={[Typography.h3, { color: Colors.primary, marginTop: 4 }]}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qBtn} onPress={() => decrementQuantity(item.id)}>
                <Minus size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qBtn} onPress={() => incrementQuantity(item.id)}>
                <Plus size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
      />

      <View style={styles.bottomBar}>
        <ButtonPrimary
          title={`Place Order · $${total.toFixed(2)}`}
          onPress={() => router.push({ pathname: '/(patient)/payment-result', params: { success: 'true', amount: String(total.toFixed(2)), doctorName: 'Pharmacy' } })}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  listContent: { padding: 20, paddingBottom: 100 },
  cartItem: {
    flexDirection: 'row', backgroundColor: Colors.surface, padding: 12, borderRadius: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  itemImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: Colors.lightGray, marginRight: 16 },
  itemInfo: { flex: 1 },
  quantityControl: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lightGray,
    borderRadius: 24, paddingHorizontal: 4, paddingVertical: 4,
  },
  qBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  qText: { width: 28, textAlign: 'center', fontWeight: '700' },
  promoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 16,
    borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed', marginBottom: 20,
  },
  billCard: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16, marginTop: 4, marginBottom: 0 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
