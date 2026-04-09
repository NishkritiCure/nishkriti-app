import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { SectionCap } from '../../components/SectionCap';
import { Pill } from '../../components/Pill';
import { ReasoningBox } from '../../components/ReasoningBox';
import { supabase } from '../../lib/supabase';

const BiomarkerCard = ({ val, lbl, status, statusColor }: any) => (
  <View style={styles.bm}>
    <Text style={[styles.bmVal, status === 'bad' ? { color: Colors.rose } : status === 'warn' ? { color: Colors.amber } : {}]}>{val}</Text>
    <Text style={styles.bmLbl}>{lbl}</Text>
    <Text style={[styles.bmStatus, { color: status === 'ok' ? Colors.teal : status === 'warn' ? Colors.amber : Colors.rose }]}>{statusColor}</Text>
  </View>
);

const ProtocolRow = ({ lbl, val, onEdit }: any) => (
  <View style={styles.protRow}>
    <Text style={styles.protLbl}>{lbl}</Text>
    <Text style={styles.protVal}>{val}</Text>
    <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
      <Text style={styles.editBtnText}>Edit</Text>
    </TouchableOpacity>
  </View>
);

// FIX: helper to adapt Supabase patient_profiles row into the shape this screen expects
const adaptSupabasePatient = (sp: any) => ({
  profile: {
    id: sp.id,
    name: sp.full_name || 'Unknown',
    dob: sp.dob || '1990-01-01',
    sex: sp.sex || 'male',
    heightCm: sp.height_cm || 170,
    weightKg: sp.weight_kg || 70,
    primaryCondition: sp.primary_condition || 'diabetes_t2',
    currentPhase: sp.current_phase || 1,
    assignedDietType: sp.assigned_diet_type || sp.diet_preference || 'low_carb',
    programmeStartDate: sp.programme_start_date || sp.onboarded_at || new Date().toISOString().split('T')[0],
    baselineWeight: sp.baseline_weight || sp.weight_kg || 70,
    baselineWaist: sp.baseline_waist || 0,
    baselineFbs: sp.baseline_fbs || 0,
    baselineHba1c: sp.baseline_hba1c || 0,
    baselineHip: sp.baseline_hip || 0,
    conditions: [sp.primary_condition || 'diabetes_t2'],
    medications: [],
  },
  checkIns: (sp.daily_check_ins || []).map((ci: any) => ({
    date: ci.check_in_date,
    fbs: ci.fbs_mg_dl || 0,
    weight: ci.weight_kg || 0,
    energyLevel: ci.energy_level || 3,
    waistCm: ci.waist_cm,
  })),
  supplements: (sp.patient_supplements || []).map((s: any) => ({
    name: s.supplement_name,
    dose: s.dose,
    timing: s.timing,
    withFood: s.with_food,
    patientReason: s.patient_reason,
    taken: false,
  })),
  progress: (sp.progress_entries || []).map((pe: any) => ({
    date: pe.entry_date,
    weight: pe.weight_kg,
    waist: pe.waist_cm,
    fbs: pe.fbs_mg_dl,
  })),
  plans: [],
});

export const PatientProfileScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { doctorPatients } = useAppStore();
  const patientId = route.params?.patientId;
  const supabasePatient = route.params?.supabasePatient;
  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // FIX: fetch full patient data with relations from Supabase on mount
  useEffect(() => {
    if (!supabasePatient || !patientId) return;
    setLoading(true);
    supabase
      .from('patient_profiles')
      .select(`
        *,
        daily_check_ins(check_in_date, fbs_mg_dl, weight_kg, energy_level, waist_cm),
        progress_entries(entry_date, weight_kg, waist_cm, fbs_mg_dl),
        patient_supplements(supplement_name, dose, timing, with_food, patient_reason, is_active)
      `)
      .eq('id', patientId)
      .single()
      .then(({ data, error }) => {
        if (data) setFullData(data);
        setLoading(false);
      });
  }, [patientId]);

  // FIX: support both Supabase patient data (from Roster) and mock store data
  let patient: any;
  if (fullData) {
    patient = adaptSupabasePatient(fullData);
  } else if (supabasePatient) {
    patient = adaptSupabasePatient(supabasePatient);
  } else {
    patient = doctorPatients.find(p => p.profile.id === patientId) || doctorPatients[0];
  }
  if (!patient) return null;

  const { profile, checkIns, supplements } = patient;
  const latest = checkIns[checkIns.length - 1];
  const isCritical = latest?.fbs > 180;
  const prog = patient.progress || [];
  const startWeight = prog[0]?.weight ?? profile.baselineWeight;
  const weightDelta = ((profile.weightKg || 0) - (startWeight || 0)).toFixed(1);
  const startWaist  = prog[0]?.waist  ?? profile.baselineWaist;
  const waistDelta  = ((profile.baselineWaist || 91) - (latest?.waistCm || 88)).toFixed(0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back bar */}
      <View style={styles.backBar}>
        <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backTxt}>Roster</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Patient profile</Text>
        {isCritical ? <Pill label="Critical" color="rose" /> : <Pill label="On track" color="teal" />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{profile.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patName}>{profile.name}, {new Date().getFullYear() - new Date(profile.dob).getFullYear()}
                {profile.sex === 'male' ? 'M' : 'F'}
              </Text>
              <Text style={styles.patMeta}>
                {profile.primaryCondition.replace(/_/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())} · Day{' '}
                {Math.floor((Date.now() - new Date(profile.programmeStartDate).getTime())/86400000)} · Phase {profile.currentPhase} of 4
              </Text>
            </View>
          </View>
        </View>

        <SectionCap title={latest ? "Today's biomarkers" : "Baseline"} />
        <View style={styles.bmGrid}>
          {/* FIX: show baseline FBS when no check-ins, avoid displaying "undefined" */}
          <BiomarkerCard val={latest?.fbs ?? profile.baselineFbs ?? '—'} lbl="FBS mg/dL" status={isCritical?'bad':latest?.fbs>130?'warn':'ok'} statusColor={isCritical?'Critical ↑':latest?.fbs>130?'Watch':latest?'On track ↓':'Baseline'} />
          <BiomarkerCard val={`${profile.weightKg || '—'}`} lbl="Weight kg" status="ok" statusColor={`↓ ${Math.abs(Number(weightDelta))} kg`} />
          <BiomarkerCard val={latest?.waistCm || profile.baselineWaist || '—'} lbl="Waist cm" status="ok" statusColor={`↓ ${waistDelta} cm`} />
          <BiomarkerCard val={latest ? `${latest.energyLevel}/5` : '—'} lbl="Energy" status={latest?.energyLevel<=2?'warn':'ok'} statusColor={latest?.energyLevel<=2?'Low':latest?'Average':'—'} />
          <BiomarkerCard val="—" lbl="Adherence" status="ok" statusColor="—" />
          {/* FIX: guard against division by zero when heightCm is 0 or missing */}
          <BiomarkerCard val={profile.heightCm ? (profile.weightKg/(profile.heightCm/100)**2).toFixed(1) : '—'} lbl="BMI" status="warn" statusColor={profile.heightCm ? 'Overweight' : '—'} />
        </View>

        {isCritical && (
          <>
            <SectionCap title="Rules fired today" />
            <View style={styles.ruleFired}>
              <View style={styles.ruleHead}>
                <Text style={styles.ruleIcon}>⚡</Text>
                <Text style={styles.ruleTitle}>DR003 — FBS 181–250 · Day 3 consecutive</Text>
              </View>
              <Text style={styles.ruleBody}>
                Auto-action: Carbs reduced to 60g. Fruit snack removed. No carbs after 3pm. Post-meal walk added after lunch and dinner. Doctor review flagged for your approval.
              </Text>
            </View>
          </>
        )}

        <SectionCap title="Protocol" />
        {/* FIX: navigate to TreatmentPlanEditor instead of inline editor */}
        <ProtocolRow lbl="Diet type" val={(profile.assignedDietType || 'low_carb').replace(/_/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())} onEdit={() => nav.navigate('TreatmentPlanEditor', { patientId: profile.id })} />
        <ProtocolRow lbl="Phase" val={`${profile.currentPhase}`} onEdit={() => nav.navigate('TreatmentPlanEditor', { patientId: profile.id })} />
        <ProtocolRow lbl="Carb target" val={`${isCritical?60:70}g/day${isCritical?' (60g today)':''}`} onEdit={() => nav.navigate('TreatmentPlanEditor', { patientId: profile.id })} />
        <ProtocolRow lbl="FBS flag threshold" val="> 180 mg/dL" onEdit={() => nav.navigate('TreatmentPlanEditor', { patientId: profile.id })} />

        <View style={{ height: Spacing.md }} />
        <TouchableOpacity style={styles.btnPri} onPress={() => nav.navigate('TreatmentPlanEditor', { patientId: profile.id })}>
          <Text style={styles.btnPriTxt}>{isCritical ? 'Escalate — Switch to Keto today' : 'Edit full protocol'}</Text>
        </TouchableOpacity>
        {/* FIX: was missing onPress handler — show placeholder alert */}
        <TouchableOpacity style={styles.btnSec} onPress={() => Alert.alert('Coming Soon', 'Messaging feature will be available in the next update.')}>
          <Text style={styles.btnSecTxt}>Write note to patient</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.deep },
  backBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, paddingHorizontal: Spacing.xl, borderBottomWidth: 0.5, borderBottomColor: Colors.border, backgroundColor: Colors.deep },
  back:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backArrow: { fontSize: 22, color: Colors.ink2 },
  backTxt:   { fontFamily: Typography.mono, fontSize: 15, color: Colors.ink2 },
  screenTitle: { fontFamily: Typography.display, fontSize: 20, color: Colors.ink },
  hero:      { padding: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: 'rgba(27,107,84,0.12)' },
  heroRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: Typography.sansMed, fontSize: 21, color: Colors.deep, fontWeight: '600' },
  patName:   { fontFamily: Typography.sansMed, fontSize: 20, color: Colors.ink },
  patMeta:   { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 3 },
  bmGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 7, marginBottom: Spacing.sm },
  bm:        { width: '30.5%', backgroundColor: Colors.card, borderRadius: Radii.md, padding: 10, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center' },
  bmVal:     { fontFamily: Typography.mono, fontSize: 20, color: Colors.spring, marginBottom: 2 },
  bmLbl:     { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2 },
  bmStatus:  { fontFamily: Typography.mono, fontSize: 12, marginTop: 3 },
  ruleFired: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: 'rgba(232,184,75,0.05)', borderWidth: 0.5, borderColor: Colors.borderAmber, borderRadius: Radii.lg, padding: 13 },
  ruleHead:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  ruleIcon:  { fontSize: 18 },
  ruleTitle: { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.amber, flex: 1 },
  ruleBody:  { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 22 },
  protRow:   { marginHorizontal: Spacing.lg, marginBottom: 6, backgroundColor: Colors.card, borderRadius: Radii.md, padding: 12, borderWidth: 0.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  protLbl:   { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, flex: 1 },
  protVal:   { fontFamily: Typography.sansMed, fontSize: 15, color: Colors.ink, flex: 1.5 },
  editBtn:   { backgroundColor: 'rgba(62,219,165,0.06)', borderWidth: 0.5, borderColor: Colors.border2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  editBtnText: { fontFamily: Typography.mono, fontSize: 13, color: Colors.teal },
  btnPri:    { marginHorizontal: Spacing.lg, backgroundColor: Colors.teal, borderRadius: Radii.lg, padding: 14, alignItems: 'center', marginBottom: 8 },
  btnPriTxt: { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.deep, fontWeight: '600' },
  btnSec:    { marginHorizontal: Spacing.lg, borderWidth: 0.5, borderColor: Colors.border3, borderRadius: Radii.lg, padding: 13, alignItems: 'center' },
  btnSecTxt: { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.teal },
});
