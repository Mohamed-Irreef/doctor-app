import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { FileText, FileImage, Download, Plus } from 'lucide-react-native';

const RECORDS = [
  { id: '1', title: 'Blood Test Report', date: 'Oct 15, 2026', type: 'PDF', size: '1.2 MB' },
  { id: '2', title: 'Dr. Sarah Prescription', date: 'Sep 20, 2026', type: 'JPG', size: '850 KB' },
  { id: '3', title: 'X-Ray Scan', date: 'Aug 05, 2026', type: 'JPG', size: '2.5 MB' },
];

export default function RecordsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={Typography.h2}>Medical Records</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Plus color={Colors.surface} size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={RECORDS}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.timelineLine} />
        )}
        renderItem={({ item, index }) => (
          <View style={styles.recordItem}>
            <View style={styles.timelineNode} />
            
            <View style={styles.dateCol}>
              <Text style={[Typography.body2, { fontWeight: '600' }]}>{item.date.split(',')[0]}</Text>
              <Text style={Typography.caption}>{item.date.split(',')[1]}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.iconBox}>
                {item.type === 'PDF' ? <FileText color={Colors.primary} size={24} /> : <FileImage color={Colors.primary} size={24} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.body1, { fontWeight: '600', marginBottom: 4 }]} numberOfLines={1}>{item.title}</Text>
                <Text style={Typography.caption}>{item.type} • {item.size}</Text>
              </View>
              <TouchableOpacity style={styles.downloadBtn}>
                <Download color={Colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  timelineLine: { position: 'absolute', left: 78, top: 0, bottom: 0, width: 2, backgroundColor: Colors.border, zIndex: 0 },
  recordItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  timelineNode: { position: 'absolute', left: 75, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, zIndex: 1, borderWidth: 2, borderColor: Colors.surface },
  dateCol: { width: 60, marginRight: 24, alignItems: 'flex-end' },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  downloadBtn: { padding: 8 },
});
