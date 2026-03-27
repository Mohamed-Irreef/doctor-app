import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Modal, TextInput, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import {
  Plus, Trash2, X, Clock, Edit2, Ban, Copy,
  CalendarCheck, AlertCircle, Check, ChevronDown
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type SlotStatus = 'available' | 'booked' | 'blocked';
type Slot = { id: string; time: string; status: SlotStatus };

// ─── Initial Data ─────────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DURATIONS = [15, 30, 45, 60];
const REPEAT_OPTIONS = ['Only this day', 'Repeat weekly'];

const START_HOURS = [
  '06:00 AM','06:30 AM','07:00 AM','07:30 AM','08:00 AM','08:30 AM',
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM',
  '03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM',
  '06:00 PM','06:30 PM','07:00 PM','07:30 PM','08:00 PM',
];

function generateSlots(start: string, end: string, duration: number): string[] {
  // Parse times to minutes from midnight
  const toMins = (t: string) => {
    const [timePart, period] = t.split(' ');
    let [hh, mm] = timePart.split(':').map(Number);
    if (period === 'PM' && hh !== 12) hh += 12;
    if (period === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  };
  const toLabel = (mins: number) => {
    let hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const period = hh >= 12 ? 'PM' : 'AM';
    if (hh > 12) hh -= 12;
    if (hh === 0) hh = 12;
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${period}`;
  };
  const startM = toMins(start);
  const endM   = toMins(end);
  const slots: string[] = [];
  for (let t = startM; t + duration <= endM; t += duration) {
    slots.push(`${toLabel(t)} – ${toLabel(t + duration)}`);
  }
  return slots;
}

const INITIAL_SLOTS: Record<string, Slot[]> = {
  Mon: [
    { id: 'm1', time: '09:00 AM – 09:30 AM', status: 'available' },
    { id: 'm2', time: '09:30 AM – 10:00 AM', status: 'booked'    },
    { id: 'm3', time: '10:00 AM – 10:30 AM', status: 'available' },
    { id: 'm4', time: '02:00 PM – 02:30 PM', status: 'available' },
    { id: 'm5', time: '04:00 PM – 04:30 PM', status: 'blocked'   },
  ],
  Tue: [
    { id: 't1', time: '09:00 AM – 09:30 AM', status: 'available' },
    { id: 't2', time: '10:00 AM – 10:30 AM', status: 'booked'    },
  ],
  Wed: [
    { id: 'w1', time: '11:00 AM – 11:30 AM', status: 'available' },
    { id: 'w2', time: '03:00 PM – 03:30 PM', status: 'available' },
  ],
  Thu: [{ id: 'th1', time: '09:00 AM – 09:30 AM', status: 'available' }],
  Fri: [
    { id: 'f1', time: '10:00 AM – 10:30 AM', status: 'available' },
    { id: 'f2', time: '04:00 PM – 04:30 PM', status: 'available' },
  ],
  Sat: [],
  Sun: [],
};

const STATUS_CONFIG: Record<SlotStatus, { color: string; bg: string; label: string }> = {
  available: { color: Colors.primary,   bg: '#EFF6FF', label: 'Available' },
  booked:    { color: '#64748B',        bg: '#F1F5F9', label: 'Booked'    },
  blocked:   { color: '#EF4444',        bg: '#FEF2F2', label: 'Blocked'   },
};

function groupSlots(slots: Slot[]) {
  const toMinutes = (t: string) => {
    const part = t.split(' – ')[0];
    const [timePart, period] = part.split(' ');
    let [hh] = timePart.split(':').map(Number);
    if (period === 'PM' && hh !== 12) hh += 12;
    if (period === 'AM' && hh === 12) hh = 0;
    return hh * 60;
  };
  return [
    { label: 'Morning',   items: slots.filter(s => { const m = toMinutes(s.time); return m >= 0 && m < 720; }) },
    { label: 'Afternoon', items: slots.filter(s => { const m = toMinutes(s.time); return m >= 720 && m < 960; }) },
    { label: 'Evening',   items: slots.filter(s => { const m = toMinutes(s.time); return m >= 960; }) },
  ].filter(g => g.items.length > 0);
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DoctorAvailabilityScreen() {
  const [selectedDay, setSelectedDay]     = useState('Mon');
  const [globalOnline, setGlobalOnline]   = useState(true);
  const [availMap, setAvailMap]           = useState<Record<string,boolean>>(Object.fromEntries(DAYS.map(d=>[d,true])));
  const [slotsMap, setSlotsMap]           = useState<Record<string,Slot[]>>({...INITIAL_SLOTS});
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showBulkMenu, setShowBulkMenu]   = useState(false);
  const [saveState, setSaveState]         = useState<'idle'|'saving'|'saved'>('idle');
  // Edit modal
  const [editSlot, setEditSlot]           = useState<Slot | null>(null);
  const [editTime, setEditTime]           = useState('');
  // Add modal fields
  const [addStart, setAddStart]           = useState('09:00 AM');
  const [addEnd, setAddEnd]               = useState('12:00 PM');
  const [addDuration, setAddDuration]     = useState(30);
  const [addRepeat, setAddRepeat]         = useState('Only this day');
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen]     = useState(false);

  const isAvailable = availMap[selectedDay];
  const slots = slotsMap[selectedDay] ?? [];
  const grouped = groupSlots(slots);

  // ── Slot actions ──
  const deleteSlot = (id: string) =>
    setSlotsMap(m => ({ ...m, [selectedDay]: (m[selectedDay]??[]).filter(s=>s.id!==id) }));

  const toggleBlock = (id: string) =>
    setSlotsMap(m => ({
      ...m,
      [selectedDay]: (m[selectedDay]??[]).map(s =>
        s.id === id ? { ...s, status: s.status === 'blocked' ? 'available' : 'blocked' } : s
      )
    }));

  const openEdit = (slot: Slot) => { setEditSlot(slot); setEditTime(slot.time); };
  const saveEdit = () => {
    if (!editSlot) return;
    setSlotsMap(m => ({
      ...m,
      [selectedDay]: (m[selectedDay]??[]).map(s => s.id===editSlot.id ? {...s, time: editTime} : s)
    }));
    setEditSlot(null);
  };

  // ── Add slots ──
  const handleAddSlots = () => {
    const times = generateSlots(addStart, addEnd, addDuration);
    if (times.length === 0) { setShowAddModal(false); return; }
    const newSlots: Slot[] = times.map((t, i) => ({ id: `new_${Date.now()}_${i}`, time: t, status: 'available' }));
    const daysToUpdate = addRepeat === 'Repeat weekly' ? DAYS : [selectedDay];
    setSlotsMap(m => {
      const updated = { ...m };
      daysToUpdate.forEach(d => {
        const existing = updated[d] ?? [];
        const existingTimes = new Set(existing.map(s=>s.time));
        updated[d] = [...existing, ...newSlots.filter(s=>!existingTimes.has(s.time))];
      });
      return updated;
    });
    setShowAddModal(false);
  };

  // ── Bulk actions ──
  const copyToAllDays = () => {
    setSlotsMap(m => {
      const current = m[selectedDay] ?? [];
      const updated = { ...m };
      DAYS.filter(d=>d!==selectedDay).forEach(d => { updated[d] = current.map(s=>({...s,id:`cp_${d}_${s.id}`})); });
      return updated;
    });
    setShowBulkMenu(false);
  };
  const clearAllSlots = () => {
    setSlotsMap(m => ({ ...m, [selectedDay]: [] }));
    setShowBulkMenu(false);
  };
  const applyWeek = () => { copyToAllDays(); };

  // ── Save ──
  const handleSave = () => {
    setSaveState('saving');
    setTimeout(() => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000); }, 900);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Global Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Manage Availability</Text>
          <Text style={styles.headerSub}>{slots.length} slot{slots.length!==1?'s':''} on {selectedDay}</Text>
        </View>
        <View style={styles.globalToggleWrap}>
          <Text style={[styles.globalToggleLabel, {color: globalOnline?'#16A34A':Colors.textSecondary}]}>
            {globalOnline ? '● Online' : '○ Offline'}
          </Text>
          <Switch value={globalOnline} onValueChange={setGlobalOnline}
            trackColor={{false:Colors.border, true:'#86EFAC'}} thumbColor={Colors.surface} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Day Picker ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {DAYS.map(day => {
            const daySlots = slotsMap[day]??[];
            const booked = daySlots.filter(s=>s.status==='booked').length;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCard, selectedDay===day && styles.dayCardActive, !availMap[day] && styles.dayCardOff]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayText, selectedDay===day && styles.dayTextActive, !availMap[day] && styles.dayTextOff]}>{day}</Text>
                {availMap[day] ? (
                  <View style={styles.dayMeta}>
                    <View style={[styles.dayDot, selectedDay===day && styles.dayDotActive]} />
                    {booked>0 && <Text style={styles.dayBooked}>{booked}🔒</Text>}
                  </View>
                ) : (
                  <Text style={styles.holidayLabel}>Holiday</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Day Toggle ── */}
        <View style={[styles.toggleCard, !isAvailable && styles.toggleCardOff]}>
          <View style={styles.toggleLeft}>
            <Text style={[styles.toggleTitle, !isAvailable && {color: Colors.textSecondary}]}>
              {isAvailable ? 'Available for Consultation' : 'Marked as Holiday'}
            </Text>
            <Text style={styles.toggleHint}>
              {isAvailable ? 'Turn off to mark this day unavailable' : 'No appointments will be scheduled'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={v => setAvailMap(m=>({...m,[selectedDay]:v}))}
            trackColor={{false:Colors.border, true:Colors.primary}}
            thumbColor={Colors.surface}
          />
        </View>

        {isAvailable && (
          <>
            {/* ── Slot Toolbar ── */}
            <View style={styles.toolbar}>
              <TouchableOpacity style={styles.addSlotBtn} onPress={() => setShowAddModal(true)}>
                <Plus color={Colors.primary} size={18} />
                <Text style={styles.addSlotText}>Add Slot</Text>
              </TouchableOpacity>
              <View style={{flex:1}} />
              <TouchableOpacity style={styles.bulkBtn} onPress={()=>setShowBulkMenu(true)}>
                <Copy color={Colors.textSecondary} size={16} />
                <Text style={styles.bulkBtnText}>Bulk</Text>
                <ChevronDown color={Colors.textSecondary} size={14} />
              </TouchableOpacity>
            </View>

            {/* ── Slots ── */}
            {slots.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={40} color={Colors.border} />
                <Text style={styles.emptyTitle}>No slots added for {selectedDay}</Text>
                <Text style={styles.emptyHint}>Tap "+ Add Slot" to create availability</Text>
              </View>
            ) : (
              grouped.map(group => (
                <View key={group.label} style={{marginBottom: 20}}>
                  <View style={styles.groupLabelRow}>
                    <Text style={styles.groupLabel}>{group.label}</Text>
                    <Text style={styles.groupCount}>{group.items.length} slot{group.items.length!==1?'s':''}</Text>
                  </View>
                  {group.items.map(slot => {
                    const cfg = STATUS_CONFIG[slot.status];
                    return (
                      <View key={slot.id} style={[styles.slotCard, {borderLeftColor: cfg.color, borderLeftWidth: 4}]}>
                        <View style={[styles.statusDot, {backgroundColor: cfg.bg, borderColor: cfg.color}]}>
                          <Text style={[styles.statusText, {color: cfg.color}]}>{cfg.label}</Text>
                        </View>
                        <Text style={styles.slotTime}>{slot.time}</Text>
                        <View style={styles.slotActions}>
                          <TouchableOpacity style={styles.slotActionBtn} onPress={() => openEdit(slot)}>
                            <Edit2 color={Colors.primary} size={15} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.slotActionBtn, slot.status==='blocked' && styles.slotActionActive]}
                            onPress={() => toggleBlock(slot.id)}
                          >
                            <Ban color={slot.status==='blocked' ? Colors.error : Colors.textSecondary} size={15} />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.slotActionBtn, styles.deleteAction]} onPress={() => deleteSlot(slot.id)}>
                            <Trash2 color={Colors.error} size={15} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── Save Bar ── */}
      <View style={styles.bottomBar}>
        {saveState === 'saved' && (
          <View style={styles.savedBanner}>
            <Check color='#16A34A' size={16} />
            <Text style={styles.savedText}>Availability updated successfully</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, saveState==='saving' && styles.saveBtnLoading]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          {saveState==='saving'
            ? <Text style={styles.saveBtnText}>Saving…</Text>
            : saveState==='saved'
            ? <><Check color={Colors.surface} size={18}/><Text style={styles.saveBtnText}>  Saved!</Text></>
            : <Text style={styles.saveBtnText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ════════════ ADD SLOT MODAL ════════════ */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Time Slot</Text>
              <TouchableOpacity onPress={()=>setShowAddModal(false)}>
                <X color={Colors.text} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Start Time */}
              <Text style={styles.modalLabel}>Start Time</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={()=>{setStartPickerOpen(v=>!v); setEndPickerOpen(false);}}>
                <Clock color={Colors.primary} size={16} />
                <Text style={styles.pickerBtnText}>{addStart}</Text>
                <ChevronDown color={Colors.textSecondary} size={16} />
              </TouchableOpacity>
              {startPickerOpen && (
                <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                  {START_HOURS.map(t => (
                    <TouchableOpacity key={t} style={[styles.timeOption, addStart===t && styles.timeOptionActive]}
                      onPress={() => { setAddStart(t); setStartPickerOpen(false); }}>
                      <Text style={[styles.timeOptionText, addStart===t && styles.timeOptionTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* End Time */}
              <Text style={styles.modalLabel}>End Time</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={()=>{setEndPickerOpen(v=>!v); setStartPickerOpen(false);}}>
                <Clock color={Colors.primary} size={16} />
                <Text style={styles.pickerBtnText}>{addEnd}</Text>
                <ChevronDown color={Colors.textSecondary} size={16} />
              </TouchableOpacity>
              {endPickerOpen && (
                <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                  {START_HOURS.map(t => (
                    <TouchableOpacity key={t} style={[styles.timeOption, addEnd===t && styles.timeOptionActive]}
                      onPress={() => { setAddEnd(t); setEndPickerOpen(false); }}>
                      <Text style={[styles.timeOptionText, addEnd===t && styles.timeOptionTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Duration */}
              <Text style={styles.modalLabel}>Slot Duration</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(d => (
                  <TouchableOpacity key={d} style={[styles.durationChip, addDuration===d && styles.durationChipActive]}
                    onPress={() => setAddDuration(d)}>
                    <Text style={[styles.durationText, addDuration===d && styles.durationTextActive]}>{d} min</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              {(() => {
                const preview = generateSlots(addStart, addEnd, addDuration);
                return (
                  <View style={styles.previewBox}>
                    <AlertCircle size={14} color={Colors.primary} />
                    <Text style={styles.previewText}>
                      {preview.length > 0
                        ? `${preview.length} slot${preview.length!==1?'s':''} will be created (${preview[0]} … ${preview[preview.length-1]})`
                        : 'No slots — adjust start/end times'}
                    </Text>
                  </View>
                );
              })()}

              {/* Repeat */}
              <Text style={styles.modalLabel}>Repeat</Text>
              <View style={styles.repeatRow}>
                {REPEAT_OPTIONS.map(r => (
                  <TouchableOpacity key={r} style={[styles.repeatChip, addRepeat===r && styles.repeatChipActive]}
                    onPress={() => setAddRepeat(r)}>
                    <Text style={[styles.repeatText, addRepeat===r && styles.repeatTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddSlots} activeOpacity={0.8}>
                <Plus color={Colors.surface} size={18} />
                <Text style={styles.confirmBtnText}>Add Slots</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════════════ EDIT SLOT MODAL ════════════ */}
      <Modal visible={!!editSlot} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.editModal}>
            <Text style={styles.modalTitle}>Edit Slot Time</Text>
            <TextInput
              style={styles.editInput}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="e.g. 09:00 AM – 09:30 AM"
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelEditBtn} onPress={()=>setEditSlot(null)}>
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveEditBtn} onPress={saveEdit}>
                <Text style={styles.saveEditText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ════════════ BULK ACTIONS SHEET ════════════ */}
      <Modal visible={showBulkMenu} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalSheet, {maxHeight: 260}]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Actions</Text>
              <TouchableOpacity onPress={()=>setShowBulkMenu(false)}><X color={Colors.text} size={22}/></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.bulkAction} onPress={copyToAllDays}>
              <Copy color={Colors.primary} size={20} />
              <View style={{flex:1}}>
                <Text style={styles.bulkActionTitle}>Copy Slots to All Days</Text>
                <Text style={styles.bulkActionSub}>Apply {selectedDay}'s slots to every day</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkAction} onPress={applyWeek}>
              <CalendarCheck color='#16A34A' size={20} />
              <View style={{flex:1}}>
                <Text style={styles.bulkActionTitle}>Apply to Entire Week</Text>
                <Text style={styles.bulkActionSub}>Set all 7 days to match {selectedDay}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkAction} onPress={clearAllSlots}>
              <Trash2 color={Colors.error} size={20} />
              <View style={{flex:1}}>
                <Text style={[styles.bulkActionTitle, {color: Colors.error}]}>Clear All Slots</Text>
                <Text style={styles.bulkActionSub}>Remove all slots for {selectedDay}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:16, paddingBottom:12, backgroundColor:Colors.surface, borderBottomWidth:1, borderBottomColor:Colors.border },
  headerTitle: { fontSize:18, fontWeight:'800', color:Colors.text },
  headerSub: { fontSize:12, color:Colors.textSecondary, marginTop:2 },
  globalToggleWrap: { flexDirection:'row', alignItems:'center', gap:8 },
  globalToggleLabel: { fontSize:12, fontWeight:'700' },

  scrollContent: { paddingHorizontal:20, paddingTop:20, paddingBottom:130 },

  dayCard: { width:68, height:76, borderRadius:18, backgroundColor:Colors.surface, borderWidth:1, borderColor:Colors.border, alignItems:'center', justifyContent:'center', marginRight:10, gap:6 },
  dayCardActive: { backgroundColor:Colors.primary, borderColor:Colors.primary },
  dayCardOff: { backgroundColor:'#F8FAFC', opacity:0.6 },
  dayText: { fontSize:15, fontWeight:'700', color:Colors.textSecondary },
  dayTextActive: { color:Colors.surface },
  dayTextOff: { color:Colors.textSecondary },
  dayMeta: { flexDirection:'row', alignItems:'center', gap:4 },
  dayDot: { width:7, height:7, borderRadius:3.5, backgroundColor:'#16A34A' },
  dayDotActive: { backgroundColor:Colors.surface },
  dayBooked: { fontSize:9, color:Colors.textSecondary },
  holidayLabel: { fontSize:9, color:Colors.error, fontWeight:'700' },

  toggleCard: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:Colors.surface, padding:18, borderRadius:16, borderWidth:1, borderColor:Colors.border, marginBottom:20 },
  toggleCardOff: { backgroundColor:'#F8FAFC', borderStyle:'dashed' },
  toggleLeft: { flex:1, marginRight:12 },
  toggleTitle: { fontSize:15, fontWeight:'700', color:Colors.text, marginBottom:3 },
  toggleHint: { fontSize:12, color:Colors.textSecondary },

  toolbar: { flexDirection:'row', alignItems:'center', marginBottom:20, gap:10 },
  addSlotBtn: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#EFF6FF', paddingHorizontal:16, paddingVertical:10, borderRadius:12, borderWidth:1, borderColor:'#BFDBFE' },
  addSlotText: { fontSize:14, fontWeight:'700', color:Colors.primary },
  bulkBtn: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:Colors.surface, paddingHorizontal:12, paddingVertical:10, borderRadius:12, borderWidth:1, borderColor:Colors.border },
  bulkBtnText: { fontSize:13, fontWeight:'600', color:Colors.textSecondary },

  emptyState: { alignItems:'center', paddingVertical:50, gap:10 },
  emptyTitle: { fontSize:15, fontWeight:'700', color:Colors.text },
  emptyHint: { fontSize:13, color:Colors.textSecondary },

  groupLabelRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  groupLabel: { fontSize:11, fontWeight:'800', color:Colors.textSecondary, textTransform:'uppercase', letterSpacing:0.6 },
  groupCount: { fontSize:11, color:Colors.textSecondary, fontWeight:'500' },

  slotCard: { flexDirection:'row', alignItems:'center', backgroundColor:Colors.surface, borderRadius:14, paddingHorizontal:14, paddingVertical:13, marginBottom:8, borderWidth:1, borderColor:Colors.border, gap:10 },
  statusDot: { paddingHorizontal:8, paddingVertical:3, borderRadius:8, borderWidth:1 },
  statusText: { fontSize:10, fontWeight:'700' },
  slotTime: { flex:1, fontSize:14, fontWeight:'600', color:Colors.text },
  slotActions: { flexDirection:'row', gap:4 },
  slotActionBtn: { width:32, height:32, borderRadius:8, backgroundColor:Colors.background, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:Colors.border },
  slotActionActive: { backgroundColor:'#FEF2F2', borderColor:'#FECACA' },
  deleteAction: { backgroundColor:'#FEF2F2', borderColor:'#FECACA' },

  bottomBar: { position:'absolute', bottom:0, left:0, right:0, backgroundColor:Colors.surface, paddingHorizontal:20, paddingTop:12, paddingBottom: Platform.OS==='ios'?34:20, borderTopWidth:1, borderTopColor:Colors.border, elevation:10 },
  savedBanner: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#F0FDF4', borderRadius:10, paddingHorizontal:12, paddingVertical:8, marginBottom:10, borderWidth:1, borderColor:'#86EFAC' },
  savedText: { fontSize:13, color:'#16A34A', fontWeight:'600' },
  saveBtn: { backgroundColor:Colors.primary, borderRadius:14, paddingVertical:15, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:6 },
  saveBtnLoading: { backgroundColor:'#93C5FD' },
  saveBtnText: { fontSize:15, fontWeight:'700', color:Colors.surface },

  // Modals
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalSheet: { backgroundColor:Colors.surface, borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, maxHeight:'85%' },
  modalHandle: { width:40, height:4, borderRadius:2, backgroundColor:Colors.border, alignSelf:'center', marginBottom:16 },
  modalHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  modalTitle: { fontSize:18, fontWeight:'800', color:Colors.text },
  modalLabel: { fontSize:13, fontWeight:'700', color:Colors.textSecondary, marginBottom:8, marginTop:16 },

  pickerBtn: { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:Colors.background, borderRadius:12, padding:14, borderWidth:1, borderColor:Colors.border },
  pickerBtnText: { flex:1, fontSize:15, fontWeight:'600', color:Colors.text },
  timeDropdown: { backgroundColor:Colors.surface, borderRadius:12, borderWidth:1, borderColor:Colors.border, maxHeight:180, marginTop:4 },
  timeOption: { padding:12, borderBottomWidth:1, borderBottomColor:Colors.border },
  timeOptionActive: { backgroundColor:'#EFF6FF' },
  timeOptionText: { fontSize:14, color:Colors.text, fontWeight:'500' },
  timeOptionTextActive: { color:Colors.primary, fontWeight:'700' },

  durationRow: { flexDirection:'row', gap:10 },
  durationChip: { flex:1, paddingVertical:12, borderRadius:12, backgroundColor:Colors.background, alignItems:'center', borderWidth:1, borderColor:Colors.border },
  durationChipActive: { backgroundColor:Colors.primary, borderColor:Colors.primary },
  durationText: { fontSize:13, fontWeight:'700', color:Colors.textSecondary },
  durationTextActive: { color:Colors.surface },

  previewBox: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#EFF6FF', borderRadius:10, padding:12, marginTop:14, borderWidth:1, borderColor:'#BFDBFE' },
  previewText: { flex:1, fontSize:12, color:Colors.primary, fontWeight:'600' },

  repeatRow: { flexDirection:'row', gap:10 },
  repeatChip: { flex:1, paddingVertical:12, borderRadius:12, backgroundColor:Colors.background, alignItems:'center', borderWidth:1, borderColor:Colors.border },
  repeatChipActive: { backgroundColor:'#F0FDF4', borderColor:'#86EFAC' },
  repeatText: { fontSize:13, fontWeight:'600', color:Colors.textSecondary },
  repeatTextActive: { color:'#16A34A' },

  confirmBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:Colors.primary, borderRadius:14, paddingVertical:15, marginTop:20 },
  confirmBtnText: { fontSize:15, fontWeight:'700', color:Colors.surface },

  editModal: { backgroundColor:Colors.surface, borderRadius:20, padding:24, margin:24 },
  editInput: { backgroundColor:Colors.background, borderRadius:12, padding:14, fontSize:14, color:Colors.text, borderWidth:1, borderColor:Colors.border, marginTop:12, marginBottom:16 },
  editActions: { flexDirection:'row', gap:10 },
  cancelEditBtn: { flex:1, paddingVertical:12, borderRadius:12, backgroundColor:Colors.background, alignItems:'center', borderWidth:1, borderColor:Colors.border },
  cancelEditText: { fontSize:14, fontWeight:'700', color:Colors.text },
  saveEditBtn: { flex:1, paddingVertical:12, borderRadius:12, backgroundColor:Colors.primary, alignItems:'center' },
  saveEditText: { fontSize:14, fontWeight:'700', color:Colors.surface },

  bulkAction: { flexDirection:'row', alignItems:'center', gap:14, paddingVertical:14, borderTopWidth:1, borderTopColor:Colors.border },
  bulkActionTitle: { fontSize:14, fontWeight:'700', color:Colors.text },
  bulkActionSub: { fontSize:12, color:Colors.textSecondary, marginTop:2 },
});
