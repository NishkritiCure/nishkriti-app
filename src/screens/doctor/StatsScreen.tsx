import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { SectionCap } from '../../components/SectionCap';
import { MetricCard } from '../../components/MetricCard';
import { DrillDownModal } from '../../components/DrillDownModal';
import { supabase } from '../../lib/supabase';

// ── Tappable stat card ──
const TapCard = ({ val, lbl, color, sub, onPress, style }: {
  val: string | number; lbl: string; color?: string; sub?: string; onPress?: () => void; style?: any;
}) => (
  <TouchableOpacity style={[styles.tapCard, style]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Text style={[styles.tapVal, color ? { color } : {}]}>{val}</Text>
    <Text style={styles.tapLbl}>{lbl}</Text>
    {sub && <Text style={styles.tapSub}>{sub}</Text>}
  </TouchableOpacity>
);

export const StatsScreen = () => {
  const nav = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [flagData, setFlagData] = useState<any[]>([]);
  const [resolvedCount, setResolvedCount] = useState(0);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<any[]>([]);

  const todayISO = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, ciRes, flagRes, resolvedRes] = await Promise.all([
      supabase.from('patient_profiles').select('id, full_name, primary_condition, current_phase, weight_kg, baseline_weight'),
      (supabase.from('daily_check_ins').select('patient_id, check_in_date, fbs_mg_dl, weight_kg').gte('check_in_date', weekAgo).order('check_in_date', { ascending: false }) as any),
      (supabase.from('daily_plans').select('patient_id, doctor_flag_reason, plan_date, patient_profiles(id, full_name)').eq('doctor_flag_raised', true).in('flag_status', ['open', 'reviewing']).limit(50) as any),
      supabase.from('daily_plans').select('id', { count: 'exact', head: true }).eq('flag_status', 'resolved').gte('doctor_reviewed_at', weekAgo),
    ]);
    if (pRes.data) setPatients(pRes.data);
    if (ciRes.data) setCheckIns(ciRes.data);
    if (flagRes.data) setFlagData(flagRes.data);
    setResolvedCount(resolvedRes.count || 0);
    setLoading(false);
  }, [weekAgo]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleModalItem = (id: string) => { setModalVisible(false); nav.navigate('PatientProfile', { patientId: id }); };
  const showModal = (title: string, items: any[]) => { setModalTitle(title); setModalItems(items); setModalVisible(true); };

  // ── Computed stats ──
  const totalPatients = patients.length;

  // Latest FBS per patient
  const latestFbsByPatient: Record<string, number> = {};
  checkIns.forEach((ci: any) => {
    if (!latestFbsByPatient[ci.patient_id] && ci.fbs_mg_dl) latestFbsByPatient[ci.patient_id] = ci.fbs_mg_dl;
  });

  // Avg 7-day FBS
  const fbsValues = Object.values(latestFbsByPatient);
  const avg7FBS = fbsValues.length > 0 ? Math.round(fbsValues.reduce((s, v) => s + v, 0) / fbsValues.length) : 0;

  // Check-in adherence today
  const todayCheckins = new Set(checkIns.filter((ci: any) => ci.check_in_date === todayISO).map((ci: any) => ci.patient_id));
  const adherencePct = totalPatients > 0 ? Math.round((todayCheckins.size / totalPatients) * 100) : 0;
  const adherenceColor = adherencePct >= 80 ? Colors.teal : adherencePct >= 50 ? Colors.amber : Colors.rose;

  // FBS distribution
  const fbsBands = { target: [] as any[], amber: [] as any[], high: [] as any[], critical: [] as any[], noData: [] as any[] };
  patients.forEach(p => {
    const fbs = latestFbsByPatient[p.id];
    if (!fbs) fbsBands.noData.push(p);
    else if (fbs <= 100) fbsBands.target.push({ ...p, fbs });
    else if (fbs <= 130) fbsBands.amber.push({ ...p, fbs });
    else if (fbs <= 180) fbsBands.high.push({ ...p, fbs });
    else fbsBands.critical.push({ ...p, fbs });
  });

  // Phase distribution
  const phaseCounts: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
  patients.forEach(p => {
    const ph = p.current_phase || 1;
    if (!phaseCounts[ph]) phaseCounts[ph] = [];
    phaseCounts[ph].push(p);
  });

  // Weight change
  const weightDeltas: number[] = [];
  patients.forEach(p => {
    const latestCI = checkIns.find((ci: any) => ci.patient_id === p.id && ci.weight_kg);
    if (latestCI && p.baseline_weight) {
      weightDeltas.push(latestCI.weight_kg - p.baseline_weight);
    }
  });
  const avgWeightChange = weightDeltas.length > 0 ? (weightDeltas.reduce((s, v) => s + v, 0) / weightDeltas.length).toFixed(1) : null;
  const losingWeight = weightDeltas.filter(d => d < 0).length;

  // ── Modal helpers ──
  const showBand = (title: string, items: any[]) => showModal(title, items.map(p => ({
    id: p.id, title: p.full_name, value: p.fbs ? `FBS ${p.fbs}` : '—',
    valueColor: (p.fbs || 0) > 180 ? Colors.rose : (p.fbs || 0) > 130 ? Colors.amber : Colors.teal,
  })));
  const showPhase = (phase: number) => showModal(`Phase ${phase}`, (phaseCounts[phase] || []).map(p => ({ id: p.id, title: p.full_name, subtitle: (p.primary_condition || '').replace(/_/g, ' ') })));
  const showCheckedIn = () => {
    const checked = patients.filter(p => todayCheckins.has(p.id));
    const notChecked = patients.filter(p => !todayCheckins.has(p.id));
    showModal('Adherence Today', [
      ...checked.map(p => ({ id: p.id, title: p.full_name, value: 'Checked in', valueColor: Colors.teal })),
      ...notChecked.map(p => ({ id: p.id, title: p.full_name, value: 'Not yet', valueColor: Colors.ink3 })),
    ]);
  };

  if (loading) return (
    <SafeAreaView style={styles.safe}><ActivityIndicator color={Colors.teal} size="large" style={{ marginTop: 100 }} /></SafeAreaView>
  );

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.heroSub}>{today}</Text>
              <Text style={styles.heroTitle}>Analytics</Text>
            </View>
            <NishkritiLogo size={40} showPulse />
          </View>
        </View>

        {/* Overview 2x2 */}
        <View style={styles.grid}>
          <TapCard val={totalPatients} lbl="Active patients" onPress={() => showModal('All Patients', patients.map(p => ({ id: p.id, title: p.full_name })))} style={styles.gridItem} />
          <TapCard val={avg7FBS || '—'} lbl="Avg 7-day FBS" color={avg7FBS > 130 ? Colors.amber : Colors.teal}
            onPress={() => showModal('7-Day Avg FBS', Object.entries(latestFbsByPatient).map(([pid, fbs]) => {
              const p = patients.find(pt => pt.id === pid);
              return { id: pid, title: p?.full_name || 'Unknown', value: `FBS ${fbs}`, valueColor: fbs > 180 ? Colors.rose : fbs > 130 ? Colors.amber : Colors.teal };
            }).sort((a, b) => parseInt(b.value.split(' ')[1]) - parseInt(a.value.split(' ')[1])))}
            style={styles.gridItem} />
          <TapCard val={`${adherencePct}%`} lbl="Check-in adherence" color={adherenceColor} sub={`${todayCheckins.size}/${totalPatients} today`}
            onPress={showCheckedIn} style={styles.gridItem} />
          <TapCard val={flagData.length} lbl="Open flags" color={flagData.length > 0 ? Colors.rose : Colors.teal}
            onPress={() => showModal('Open Flags', flagData.map((d: any) => ({ id: d.patient_profiles?.id || d.patient_id, title: d.patient_profiles?.full_name || 'Unknown', subtitle: d.doctor_flag_reason })))}
            style={styles.gridItem} />
        </View>

        {/* FBS Distribution */}
        <SectionCap title="FBS Distribution" />
        <View style={styles.bandRow}>
          <TapCard val={fbsBands.target.length} lbl="Target (70-100)" color={Colors.teal} onPress={() => showBand('Target FBS', fbsBands.target)} style={styles.bandItem} />
          <TapCard val={fbsBands.amber.length} lbl="Amber (101-130)" color={Colors.amber} onPress={() => showBand('Amber FBS', fbsBands.amber)} style={styles.bandItem} />
          <TapCard val={fbsBands.high.length} lbl="High (131-180)" color={Colors.rose} onPress={() => showBand('High FBS', fbsBands.high)} style={styles.bandItem} />
          <TapCard val={fbsBands.critical.length} lbl="Critical (>180)" color={Colors.rose} onPress={() => showBand('Critical FBS', fbsBands.critical)} style={styles.bandItem} />
          <TapCard val={fbsBands.noData.length} lbl="No data" color={Colors.ink3} onPress={() => showBand('No FBS Data', fbsBands.noData)} style={styles.bandItem} />
        </View>

        {/* Phase Distribution */}
        <SectionCap title="Phase Distribution" />
        <View style={styles.bandRow}>
          {[1, 2, 3, 4].map(ph => (
            <TapCard key={ph} val={(phaseCounts[ph] || []).length} lbl={`Phase ${ph}`}
              color={ph === 1 ? Colors.teal : ph === 2 ? Colors.amber : ph === 3 ? Colors.spring : Colors.ink2}
              onPress={() => showPhase(ph)} style={styles.bandItem} />
          ))}
        </View>

        {/* Flags Summary */}
        <SectionCap title="Flag Activity" />
        <View style={styles.flagRow}>
          <MetricCard label="Open flags" value={flagData.length} status={flagData.length > 0 ? 'alert' : 'ok'} style={{ flex: 1 }} />
          <MetricCard label="Resolved (7d)" value={resolvedCount} style={{ flex: 1 }} />
        </View>

        {/* Weight Progress */}
        <SectionCap title="Weight Progress" />
        <View style={styles.weightCard}>
          <Text style={styles.weightVal}>{avgWeightChange !== null ? `Avg ${Number(avgWeightChange) < 0 ? '↓' : '↑'} ${Math.abs(Number(avgWeightChange))} kg` : 'No data'}</Text>
          <Text style={styles.weightSub}>{avgWeightChange !== null ? `from baseline · ${losingWeight} of ${weightDeltas.length} losing weight` : 'No patients with weight data'}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <DrillDownModal visible={modalVisible} title={modalTitle} items={modalItems} onClose={() => setModalVisible(false)} onItemPress={handleModalItem} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.deep },
  hero:       { padding: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: 'rgba(27,107,84,0.1)' },
  heroSub:    { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2, marginBottom: 4 },
  heroTitle:  { fontFamily: Typography.display, fontSize: 32, color: Colors.ink },
  // Grid
  grid:       { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg, gap: 8 },
  gridItem:   { width: '47%' },
  tapCard:    { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, borderWidth: 0.5, borderColor: Colors.border },
  tapVal:     { fontFamily: Typography.mono, fontSize: 26, color: Colors.spring, marginBottom: 4 },
  tapLbl:     { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2 },
  tapSub:     { fontFamily: Typography.mono, fontSize: 11, color: Colors.ink3, marginTop: 3 },
  // Bands
  bandRow:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 7, marginBottom: Spacing.sm },
  bandItem:   { flexGrow: 1, minWidth: '18%' },
  // Flags
  flagRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  // Weight
  weightCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: Spacing.lg, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center' },
  weightVal:  { fontFamily: Typography.mono, fontSize: 22, color: Colors.spring, marginBottom: 4 },
  weightSub:  { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2 },
});
