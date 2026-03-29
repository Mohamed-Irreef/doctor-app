import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react-native';
import ActionModal from '../../components/ActionModal';
import ButtonPrimary from '../../components/ButtonPrimary';
import { getDoctorSubscription, getPlans } from '../../services/api';
import { processSubscriptionPayment } from '../../services/payment';

const TRANSACTIONS = [
  { id: 't1', name: 'Ravi Kumar',    type: 'Video Consult', date: 'Oct 27, 2026', amount: '₹1,500', status: 'Paid' },
  { id: 't2', name: 'Priya Sharma',  type: 'In-person',     date: 'Oct 26, 2026', amount: '₹1,500', status: 'Paid' },
  { id: 't3', name: 'Arjun Mehta',   type: 'Chat Consult',  date: 'Oct 25, 2026', amount: '₹800',   status: 'Pending' },
  { id: 't4', name: 'Sunita Verma',  type: 'Video Consult', date: 'Oct 24, 2026', amount: '₹1,500', status: 'Paid' },
  { id: 't5', name: 'Vikram Pillai', type: 'In-person',     date: 'Oct 22, 2026', amount: '₹1,500', status: 'Paid' },
  { id: 't6', name: 'Meena Joshi',   type: 'Chat Consult',  date: 'Oct 20, 2026', amount: '₹800',   status: 'Paid' },
];

const WEEK_DATA = [
  { day: 'Mon', value: 3000, consults: 2 },
  { day: 'Tue', value: 4500, consults: 3 },
  { day: 'Wed', value: 1500, consults: 1 },
  { day: 'Thu', value: 6000, consults: 4 },
  { day: 'Fri', value: 4500, consults: 3 },
  { day: 'Sat', value: 7500, consults: 5 },
  { day: 'Sun', value: 0,    consults: 0 },
];

const MAX_VALUE = Math.max(...WEEK_DATA.map(d => d.value));

const METRICS = [
  { label: 'Consultations', value: '42',      icon: Users,      bg: '#DBEAFE', color: Colors.primary },
  { label: 'Avg Fee',       value: '₹1,250',  icon: DollarSign, bg: '#DCFCE7', color: '#16A34A' },
  { label: 'Pending',       value: '₹2,300',  icon: Clock,      bg: '#FEF3C7', color: '#D97706' },
];

export default function DoctorEarningsScreen() {
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlanCode, setActivePlanCode] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Unable to complete subscription payment');

  useEffect(() => {
    const load = async () => {
      const plansResponse = await getPlans();
      if (plansResponse.status === 'success' && plansResponse.data) {
        setPlans(plansResponse.data as any[]);
      }

      try {
        const userRaw = await AsyncStorage.getItem('nividoc_user');
        if (!userRaw) return;
        const user = JSON.parse(userRaw);
        const doctorId = String(user?._id || user?.id || '');
        if (!doctorId) return;
        const subscriptionResponse = await getDoctorSubscription(doctorId);
        if (subscriptionResponse.status === 'success' && subscriptionResponse.data) {
          const subscription = subscriptionResponse.data as any;
          if (subscription?.status === 'active') {
            setActivePlanCode(subscription?.plan?.code || null);
          }
        }
      } catch {
        // Ignore cached user parse errors and continue.
      }
    };

    load();
  }, []);

  const handlePlanPurchase = async (planCode: string) => {
    setProcessingPlan(planCode);
    const payment = await processSubscriptionPayment(planCode);
    setProcessingPlan(null);

    if (payment.status === 'success') {
      setActivePlanCode(planCode);
      setSuccessModal(true);
      return;
    }

    setErrorMessage(payment.error || 'Subscription verification failed');
    setErrorModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ActionModal
        visible={successModal}
        type="success"
        title="Subscription Activated"
        message="Your doctor subscription is now active and verified."
        confirmLabel="OK"
        onConfirm={() => setSuccessModal(false)}
      />

      <ActionModal
        visible={errorModal}
        type="error"
        title="Subscription Failed"
        message={errorMessage}
        confirmLabel="OK"
        onConfirm={() => setErrorModal(false)}
      />

      <View style={styles.header}>
        <Text style={Typography.h2}>Earnings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Total Earnings Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>This Month</Text>
            <Text style={styles.totalAmount}>₹52,500</Text>
            <View style={styles.growthRow}>
              <TrendingUp size={14} color='#16A34A' />
              <Text style={styles.growthText}>+18% vs last month</Text>
            </View>
          </View>
          <View style={styles.totalIconWrap}>
            <DollarSign color={Colors.surface} size={32} />
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          {METRICS.map((m, i) => (
            <View key={i} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
                <m.icon color={m.color} size={18} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.chartArea}>
            {WEEK_DATA.map((d, i) => {
              const pct = MAX_VALUE > 0 ? (d.value / MAX_VALUE) : 0;
              const barH = Math.max(pct * 100, d.value > 0 ? 6 : 0);
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barAmount}>{d.value > 0 ? `₹${(d.value/1000).toFixed(1)}k` : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: barH, backgroundColor: d.value > 0 ? Colors.primary : Colors.border }]} />
                  </View>
                  <Text style={styles.barDay}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {TRANSACTIONS.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{tx.name}</Text>
                <Text style={styles.txMeta}>{tx.type} · {tx.date}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>{tx.amount}</Text>
                <View style={[styles.txBadge, tx.status === 'Paid' ? styles.paidBadge : styles.pendingBadge]}>
                  <Text style={[styles.txBadgeText, tx.status === 'Paid' ? styles.paidText : styles.pendingText]}>
                    {tx.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription Plans</Text>
          {plans.length === 0 ? (
            <Text style={styles.emptyText}>No plans available right now.</Text>
          ) : (
            plans.map((plan) => {
              const planCode = String(plan.code || '');
              const isActive = activePlanCode === planCode;
              const isProcessing = processingPlan === planCode;
              return (
                <View key={planCode} style={styles.planCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planMeta}>{plan.interval} plan</Text>
                    <Text style={styles.planPrice}>₹{plan.price}</Text>
                  </View>
                  <ButtonPrimary
                    title={isActive ? 'Active' : isProcessing ? 'Processing...' : 'Buy Plan'}
                    onPress={() => handlePlanPurchase(planCode)}
                    loading={isProcessing}
                    disabled={isActive || isProcessing}
                    style={styles.planButton}
                  />
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  totalCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: 24, padding: 24, marginBottom: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  totalLeft: {},
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 6 },
  totalAmount: { fontSize: 36, fontWeight: '800', color: Colors.surface, marginBottom: 8 },
  growthRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  growthText: { fontSize: 12, color: '#86EFAC', fontWeight: '600' },
  totalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metricCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  metricIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 16, fontWeight: '800', color: Colors.text },
  metricLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barAmount: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  barTrack: { width: 24, height: 100, justifyContent: 'flex-end', borderRadius: 6, backgroundColor: Colors.background, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barDay: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  txRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  txMeta: { fontSize: 12, color: Colors.textSecondary },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: '700', color: Colors.text },
  txBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  paidBadge: { backgroundColor: '#DCFCE7' },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  txBadgeText: { fontSize: 11, fontWeight: '700' },
  paidText: { color: '#16A34A' },
  pendingText: { color: '#D97706' },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  planName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  planMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  planButton: { paddingVertical: 10, paddingHorizontal: 14, minWidth: 110 },
});
