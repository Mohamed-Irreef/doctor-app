import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { LAB_TESTS } from '../../constants/MockData';
import { ArrowLeft, Home as HomeIcon, FlaskConical, Check, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ButtonPrimary from '../../components/ButtonPrimary';

const CATEGORIES = ['All', 'Blood Tests', 'Hormones', 'Diabetes', 'Lipid', 'Full Body'];

export default function LabsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Tests</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={LAB_TESTS}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            {/* Hero Banner */}
            <View style={styles.heroBanner}>
              <View>
                <Text style={styles.heroTitle}>At-Home Lab Tests</Text>
                <Text style={styles.heroSub}>Safe · Fast · Affordable</Text>
                <View style={styles.heroTicks}>
                  {['NABL Accredited', 'Free Collection', 'Digital Reports'].map(t => (
                    <View key={t} style={styles.heroTick}>
                      <Check size={10} color="#fff" />
                      <Text style={styles.heroTickText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <FlaskConical color="rgba(255,255,255,0.15)" size={80} />
            </View>

            {/* Categories */}
            <View style={styles.catRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.resultCount}>{LAB_TESTS.length} tests available</Text>
          </>
        )}
        keyExtractor={t => t.id}
        renderItem={({ item }) => {
          const disc = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
          return (
            <TouchableOpacity
              style={styles.testCard}
              onPress={() => router.push({ pathname: '/(patient)/lab/[id]', params: { id: item.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.testLeft}>
                <View style={styles.testIcon}>
                  <FlaskConical color={Colors.primary} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testName}>{item.name}</Text>
                  {item.turnaround && (
                    <View style={styles.timeRow}>
                      <Clock size={11} color={Colors.textSecondary} />
                      <Text style={styles.timeText}>Results in {item.turnaround}</Text>
                    </View>
                  )}
                  <View style={styles.homeRow}>
                    <HomeIcon size={11} color={Colors.primary} />
                    <Text style={styles.homeText}>Free home collection</Text>
                  </View>
                </View>
              </View>
              <View style={styles.testRight}>
                {item.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>Popular</Text></View>}
                <Text style={styles.testPrice}>${item.price}</Text>
                <Text style={styles.testOriginal}>${item.originalPrice}</Text>
                <View style={styles.offBadge}><Text style={styles.offText}>{disc}% OFF</Text></View>
                <View style={styles.addBtn}><Text style={styles.addBtnText}>Add</Text></View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  listContent: { paddingBottom: 40 },
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, margin: 16, borderRadius: 20, padding: 20,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
  heroTicks: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroTick: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  heroTickText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  catTextActive: { color: Colors.surface },
  resultCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', paddingHorizontal: 16, marginBottom: 10 },
  testCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  testLeft: { flex: 1, flexDirection: 'row', marginRight: 12, gap: 12 },
  testIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  testName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  timeText: { fontSize: 11, color: Colors.textSecondary },
  homeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  homeText: { fontSize: 11, color: Colors.primary, fontWeight: '500' },
  testRight: { alignItems: 'flex-end' },
  popularBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  popularText: { fontSize: 9, fontWeight: '700', color: '#D97706' },
  testPrice: { fontSize: 18, fontWeight: '800', color: Colors.text },
  testOriginal: { fontSize: 12, color: Colors.textSecondary, textDecorationLine: 'line-through', marginBottom: 4 },
  offBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 10 },
  offText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { color: Colors.surface, fontSize: 12, fontWeight: '700' },
});
