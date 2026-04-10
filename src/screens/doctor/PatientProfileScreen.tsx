import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { SectionCap } from '../../components/SectionCap';
import { Pill } from '../../components/Pill';
import { MetricCard } from '../../components/MetricCard';
import { supabase } from '../../lib/supabase';
import { fetchActiveProtocol } from '../../services/doctorService';
import type { TreatmentPlan } from '../../types';

// ── Helper: adapt Supabase patient_profiles row ──────────────────────────────
const adaptSupabasePatient = (sp: any) => ({
  profile: {
    id: sp.id,
    name: sp.full_name || 'Unknown',
    dob: sp.dob || '1990-01-01',
    sex: sp.sex || 'male',
    heightCm: sp.height_cm || 0,
    weightKg: sp.weight_kg || 0,
    primaryCondition: sp.primary_condition || 'diabetes_t2',
    currentPhase: sp.current_phase || 1,
    assignedDietType: sp.assigned_diet_type || 'low_carb',
    programmeStartDate: sp.programme_start_date || sp.onboarded_at || new Date().toISOString().split('T')[0],
    baselineWeight: sp.baseline_weight || sp.weight_kg || 0,
    baselineWaist: sp.baseline_waist || 0,
    baselineFbs: sp.baseline_fbs || 0,
    baselineHba1c: sp.baseline_hba1c || 0,
    baselineHip: sp.baseline_hip || 0,
  },
  checkIns: (sp.daily_check_ins || [])
    .sort((a: any, b: any) => (b.check_in_date || '').localeCompare(a.check_in_date || ''))
    .map((ci: any) => ({
      date: ci.check_in_date,
      fbs: ci.fbs_mg_dl || 0,
      weight: ci.weight_kg || 0,
      energyLevel: ci.energy_level || 3,
      waistCm: ci.waist_cm,
      adherence: ci.adherence_yesterday,
      symptoms: ci.symptoms,
      message: ci.message_for_doctor,
    })),
  supplements: (sp.patient_supplements || []).map((s: any) => ({
    name: s.name, dose: s.dose, timing: s.timing,
  })),
});

// ── Collapsible section header ───────────────────────────────────────────────
const SectionHeader = ({ title, expanded, onToggle, badge }: {
  title: string; expanded: boolean; onToggle: () => void; badge?: string;
}) => (
  <TouchableOpacity
    style={styles.sectionHeader}
    onPress={onToggle}
    activeOpacity={0.7}
    hitSlop={{ top: 8, bottom: 8 }}
  >
    <Text style={styles.sectionHeaderText}>{title}</Text>
    {badge && <Pill label={badge} color="teal" />}
    <Text style={styles.sectionChevron}>{expanded ? '▲' : '▼'}</Text>
  </TouchableOpacity>
);

// ── Compact check-in row ─────────────────────────────────────────────────────
const CheckInRow = ({ ci, expanded, onToggle }: { ci: any; expanded: boolean; onToggle: () => void }) => {
  const fbsColor = ci.fbs > 180 ? Colors.rose : ci.fbs > 130 ? Colors.amber : Colors.teal;
  return (
    <TouchableOpacity style={styles.ciRow} onPress={onToggle} activeOpacity={0.8}>
      <Text style={styles.ciDate}>{ci.date}</Text>
      <Text style={[styles.ciVal, { color: fbsColor }]}>FBS {ci.fbs}</Text>
      <Text style={styles.ciVal}>{ci.weight} kg</Text>
      <Text style={styles.ciVal}>E {ci.energyLevel}/5</Text>
      <Text style={styles.ciChevron}>{expanded ? '▲' : '▼'}</Text>
      {expanded && (
        <View style={styles.ciExpanded}>
          {ci.waistCm != null && <Text style={styles.ciDetail}>Waist: {ci.waistCm} cm</Text>}
          {ci.adherence && <Text style={styles.ciDetail}>Adherence: {ci.adherence}</Text>}
          {ci.message && <Text style={styles.ciDetail}>Message: {ci.message}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ── Info row for protocol details ────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

// ══════════════════════════════════════════════════════════════════════════════
export const PatientProfileScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const patientId: string = route.params?.patientId;
  const supabasePatient = route.params?.supabasePatient;

  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [protocol, setProtocol] = useState<TreatmentPlan | null>(null);
  const [protocolLoading, setProtocolLoading] = useState(true);

  // Expandable sections
  const [bioExpanded, setBioExpanded] = useState(true);
  const [baseExpanded, setBaseExpanded] = useState(false);
  const [ciExpanded, setCiExpanded] = useState(false);
  const [expandedCiDate, setExpandedCiDate] = useState<string | null>(null);

  // Fetch patient data + protocol on focus (re-fetches when returning from editor)
  useFocusEffect(
    useCallback(() => {
      if (!patientId) return;

      // Fetch patient with relations
      setLoading(true);
      supabase
        .from('patient_profiles')
        .select(`
          *,
          daily_check_ins(check_in_date, fbs_mg_dl, weight_kg, energy_level, waist_cm, adherence_yesterday, symptoms, message_for_doctor),
          patient_supplements(name, dose, timing, with_food, patient_reason, is_active)
        `)
        .eq('id', patientId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setFullData(data);
          setLoading(false);
        });

      // Fetch active protocol
      setProtocolLoading(true);
      fetchActiveProtocol(patientId)
        .then(p => setProtocol(p))
        .catch(() => setProtocol(null))
        .finally(() => setProtocolLoading(false));
    }, [patientId])
  );

  // Build patient from best available data
  const raw = fullData || supabasePatient;
  if (loading && !raw) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator color={Colors.teal} size="large" style={{ marginTop: 100 }} />
    </SafeAreaView>
  );
  if (!raw) return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>Patient not found</Text>
      </View>
    </SafeAreaView>
  );

  const patient = adaptSupabasePatient(raw);
  const { profile, checkIns, supplements } = patient;
  const latest = checkIns[0]; // already sorted desc
  const isCritical = latest?.fbs > 180;
  const daysIn = Math.floor((Date.now() - new Date(profile.programmeStartDate).getTime()) / 86400000);

  // Adherence: check-ins in last 14 days / 14
  const fourteenDaysAgo = Date.now() - 14 * 86400000;
  const recentCount = checkIns.filter((ci: any) => new Date(ci.date).getTime() >= fourteenDaysAgo).length;
  const adherencePct = Math.min(100, Math.round((recentCount / 14) * 100));

  // BMI
  const bmi = profile.heightCm > 0 ? (profile.weightKg / (profile.heightCm / 100) ** 2).toFixed(1) : '—';

  const toggle = (setter: (fn: (v: boolean) => boolean) => void) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(v => !v);
  };

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
        {/* ── 1. Patient header ── */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>
                {(profile.name || '?').split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2) || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patName}>
                {profile.name}, {new Date().getFullYear() - new Date(profile.dob).getFullYear()}
                {profile.sex === 'male' ? 'M' : 'F'}
              </Text>
              <Text style={styles.patMeta}>
                {(profile.primaryCondition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                {' · '}Day {daysIn} · Phase {profile.currentPhase}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Today's biomarkers (expandable) ── */}
        <SectionHeader
          title={latest ? "Latest check-in" : "No check-ins yet"}
          expanded={bioExpanded}
          onToggle={() => toggle(setBioExpanded)}
          badge={latest ? latest.date : undefined}
        />
        {bioExpanded && (
          latest ? (
            <View style={styles.metricGrid}>
              <MetricCard label="FBS" value={latest.fbs} unit="mg/dL"
                status={latest.fbs > 180 ? 'critical' : latest.fbs > 130 ? 'warn' : 'ok'}
                delta={profile.baselineFbs ? `Baseline: ${profile.baselineFbs}` : undefined}
                style={styles.metricItem} />
              <MetricCard label="Weight" value={latest.weight} unit="kg"
                delta={profile.baselineWeight ? `↓ ${(profile.baselineWeight - latest.weight).toFixed(1)} kg` : undefined}
                style={styles.metricItem} />
              <MetricCard label="Energy" value={`${latest.energyLevel}/5`}
                status={latest.energyLevel <= 2 ? 'warn' : 'ok'}
                style={styles.metricItem} />
              <MetricCard label="Adherence" value={`${adherencePct}%`}
                status={adherencePct >= 80 ? 'ok' : adherencePct >= 50 ? 'warn' : 'alert'}
                style={styles.metricItem} />
              <MetricCard label="BMI" value={bmi}
                style={styles.metricItem} />
              {latest.waistCm != null && (
                <MetricCard label="Waist" value={latest.waistCm} unit="cm"
                  delta={profile.baselineWaist ? `Baseline: ${profile.baselineWaist}` : undefined}
                  style={styles.metricItem} />
              )}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Patient hasn't completed any check-ins yet.</Text>
            </View>
          )
        )}

        {/* ── 3. Baseline (collapsed by default) ── */}
        <SectionHeader
          title="Baseline"
          expanded={baseExpanded}
          onToggle={() => toggle(setBaseExpanded)}
          badge={`FBS ${profile.baselineFbs || '—'} · Wt ${profile.baselineWeight || '—'}`}
        />
        {baseExpanded && (
          <View style={styles.metricGrid}>
            <MetricCard label="FBS" value={profile.baselineFbs || '—'} unit="mg/dL" style={styles.metricItem} />
            <MetricCard label="HbA1c" value={profile.baselineHba1c || '—'} unit="%" style={styles.metricItem} />
            <MetricCard label="Weight" value={profile.baselineWeight || '—'} unit="kg" style={styles.metricItem} />
            <MetricCard label="Waist" value={profile.baselineWaist || '—'} unit="cm" style={styles.metricItem} />
            <MetricCard label="Hip" value={profile.baselineHip || '—'} unit="cm" style={styles.metricItem} />
            <MetricCard label="BMI" value={bmi} style={styles.metricItem} />
          </View>
        )}

        {/* ── 4. Recent check-ins (last 7) ── */}
        {checkIns.length > 0 && (
          <>
            <SectionHeader
              title="Recent check-ins"
              expanded={ciExpanded}
              onToggle={() => toggle(setCiExpanded)}
              badge={`${checkIns.length}`}
            />
            {ciExpanded && checkIns.slice(0, 7).map((ci: any) => (
              <CheckInRow
                key={ci.date}
                ci={ci}
                expanded={expandedCiDate === ci.date}
                onToggle={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExpandedCiDate(expandedCiDate === ci.date ? null : ci.date);
                }}
              />
            ))}
          </>
        )}

        {/* ── 5. Active protocol (from Supabase) ── */}
        <SectionCap title="Treatment plan" />
        {protocolLoading ? (
          <ActivityIndicator color={Colors.teal} style={{ marginVertical: Spacing.md }} />
        ) : protocol ? (
          <View style={styles.protocolCard}>
            <InfoRow label="Diet type" value={(protocol.dietType || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} />
            <InfoRow label="Calories" value={`${protocol.calorieTarget || '—'} cal/day`} />
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroVal}>{protocol.carbsTargetG || '—'}g</Text>
                <Text style={styles.macroLbl}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroVal}>{protocol.proteinTargetG || '—'}g</Text>
                <Text style={styles.macroLbl}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroVal}>{protocol.fatTargetG || '—'}g</Text>
                <Text style={styles.macroLbl}>Fat</Text>
              </View>
            </View>
            <InfoRow label="Exercise" value={`${protocol.exerciseType || '—'} · ${protocol.exerciseDurationMin || '—'} min · ${(protocol.exerciseIntensity || '').replace(/\b\w/g, (c: string) => c.toUpperCase())}`} />
            <InfoRow label="Frequency" value={protocol.exerciseFrequency || '—'} />
            {protocol.phases.length > 0 && (
              <InfoRow label={`Phase ${protocol.currentPhase}`} value={protocol.phases[protocol.currentPhase - 1]?.name || protocol.phaseName || '—'} />
            )}
            {protocol.medications.length > 0 && (
              <>
                <Text style={styles.subLabel}>Medications</Text>
                {protocol.medications.map((m, i) => (
                  <Text key={i} style={styles.listItem}>{m.name} · {m.dose} · {m.timing}</Text>
                ))}
              </>
            )}
            {protocol.supplements.length > 0 && (
              <>
                <Text style={styles.subLabel}>Supplements</Text>
                {protocol.supplements.map((s, i) => (
                  <Text key={i} style={styles.listItem}>{s.name} · {s.dose} · {s.timing}</Text>
                ))}
              </>
            )}
            {protocol.notes ? (
              <>
                <Text style={styles.subLabel}>Doctor notes</Text>
                <Text style={styles.notesText}>{protocol.notes}</Text>
              </>
            ) : null}
            <Text style={styles.updatedAt}>
              Last updated: {protocol.updatedAt ? new Date(protocol.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No treatment plan created yet.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => nav.navigate('TreatmentPlanEditor', { patientId: profile.id })}>
              <Text style={styles.createBtnText}>Create Plan →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 6. Rules fired (only if critical) ── */}
        {isCritical && (
          <>
            <SectionCap title="Rules fired today" />
            <View style={styles.ruleFired}>
              <View style={styles.ruleHead}>
                <Text style={styles.ruleIcon}>⚡</Text>
                <Text style={styles.ruleTitle}>DR003 — FBS {'>'}180 · Critical</Text>
              </View>
              <Text style={styles.ruleBody}>
                FBS {latest.fbs} mg/dL — above 180 threshold. Auto-adjustments applied. Doctor review needed.
              </Text>
            </View>
          </>
        )}

        {/* ── 7. Action buttons ── */}
        <View style={{ height: Spacing.md }} />
        <TouchableOpacity style={styles.btnPri} onPress={() => nav.navigate('TreatmentPlanEditor', { patientId: profile.id })}>
          <Text style={styles.btnPriTxt}>{protocol ? 'Edit treatment plan' : 'Create treatment plan'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSec} onPress={() => Alert.alert('Coming Soon', 'Messaging feature will be available in the next update.')}>
          <Text style={styles.btnSecTxt}>Write note to patient</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.deep },
  backBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, paddingHorizontal: Spacing.xl, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  back:           { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backArrow:      { fontSize: 22, color: Colors.ink2 },
  backTxt:        { fontFamily: Typography.mono, fontSize: 15, color: Colors.ink2 },
  screenTitle:    { fontFamily: Typography.display, fontSize: 20, color: Colors.ink },
  hero:           { padding: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: 'rgba(27,107,84,0.12)' },
  heroRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:         { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontFamily: Typography.sansMed, fontSize: 21, color: Colors.deep, fontWeight: '600' },
  patName:        { fontFamily: Typography.sansMed, fontSize: 20, color: Colors.ink },
  patMeta:        { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 3 },
  // Section headers
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, gap: 8 },
  sectionHeaderText: { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.ink, flex: 1 },
  sectionChevron: { fontFamily: Typography.mono, fontSize: 12, color: Colors.ink3 },
  // Metric grid
  metricGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 7, marginBottom: Spacing.sm },
  metricItem:     { width: '30%', flexGrow: 1 },
  // Empty state
  emptyBox:       { marginHorizontal: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center' },
  emptyText:      { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, textAlign: 'center' },
  createBtn:      { backgroundColor: Colors.teal, borderRadius: Radii.md, paddingHorizontal: 20, paddingVertical: 10, marginTop: Spacing.md },
  createBtnText:  { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.deep, fontWeight: '600' },
  // Check-in rows
  ciRow:          { marginHorizontal: Spacing.lg, marginBottom: 4, backgroundColor: Colors.card, borderRadius: Radii.md, padding: 10, borderWidth: 0.5, borderColor: Colors.border, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  ciDate:         { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2, width: 80 },
  ciVal:          { fontFamily: Typography.mono, fontSize: 14, color: Colors.ink },
  ciChevron:      { fontFamily: Typography.mono, fontSize: 10, color: Colors.ink3, marginLeft: 'auto' },
  ciExpanded:     { width: '100%', marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: Colors.border },
  ciDetail:       { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2, marginBottom: 2 },
  // Protocol card
  protocolCard:   { marginHorizontal: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden' },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  infoLabel:      { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2 },
  infoValue:      { fontFamily: Typography.sansMed, fontSize: 15, color: Colors.ink, flexShrink: 1, textAlign: 'right' },
  macroRow:       { flexDirection: 'row', justifyContent: 'space-around', padding: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  macroItem:      { alignItems: 'center' },
  macroVal:       { fontFamily: Typography.mono, fontSize: 18, color: Colors.spring },
  macroLbl:       { fontFamily: Typography.sans, fontSize: 12, color: Colors.ink2, marginTop: 2 },
  subLabel:       { fontFamily: Typography.mono, fontSize: 11, letterSpacing: 2, color: Colors.ink3, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  listItem:       { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, paddingHorizontal: 12, paddingVertical: 3 },
  notesText:      { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 21, paddingHorizontal: 12, paddingBottom: 10 },
  updatedAt:      { fontFamily: Typography.mono, fontSize: 11, color: Colors.ink3, padding: 12, textAlign: 'right' },
  // Rules
  ruleFired:      { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: 'rgba(232,184,75,0.05)', borderWidth: 0.5, borderColor: Colors.borderAmber, borderRadius: Radii.lg, padding: 13 },
  ruleHead:       { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  ruleIcon:       { fontSize: 18 },
  ruleTitle:      { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.amber, flex: 1 },
  ruleBody:       { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 22 },
  // Buttons
  btnPri:         { marginHorizontal: Spacing.lg, backgroundColor: Colors.teal, borderRadius: Radii.lg, padding: 14, alignItems: 'center', marginBottom: 8 },
  btnPriTxt:      { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.deep, fontWeight: '600' },
  btnSec:         { marginHorizontal: Spacing.lg, borderWidth: 0.5, borderColor: Colors.border3, borderRadius: Radii.lg, padding: 13, alignItems: 'center' },
  btnSecTxt:      { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.teal },
});
