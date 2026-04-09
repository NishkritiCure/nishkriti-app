// FIX: was a placeholder screen with no functionality — rebuilt with patient selector and protocol editing
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { SectionCap } from '../../components/SectionCap';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { Pill } from '../../components/Pill';
import { supabase } from '../../lib/supabase';

const DIET_OPTIONS = [
  { label: 'Low Carb', value: 'low_carb' },
  { label: 'Keto', value: 'keto' },
  { label: 'Carb Cycling', value: 'carb_cycling' },
  { label: 'High Protein', value: 'high_protein' },
  { label: 'Anti-Inflammatory', value: 'anti_inflammatory' },
  { label: 'Calorie Deficit', value: 'calorie_deficit' },
  { label: 'Maintenance', value: 'maintenance' },
];

const PHASE_OPTIONS = [
  { label: 'Phase 1 — Sugar Shutdown', value: 1 },
  { label: 'Phase 2 — Fat Adaptation', value: 2 },
  { label: 'Phase 3 — Reintroduction', value: 3 },
  { label: 'Phase 4 — Maintenance', value: 4 },
];

export const ProtocolEditorScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  // If navigated from PatientProfile, patientId is passed as param
  const initialPatientId = route.params?.patientId || null;

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialPatientId);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable protocol fields
  const [dietType, setDietType] = useState('');
  const [phase, setPhase] = useState(1);

  // FIX: fetch all patients for the selector
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .order('onboarded_at', { ascending: false });
    if (data) setPatients(data);
    setLoading(false);

    // Auto-select if patientId was passed
    if (initialPatientId && data) {
      const found = data.find((p: any) => p.id === initialPatientId);
      if (found) {
        setSelectedPatient(found);
        setDietType(found.assigned_diet_type || found.diet_preference || 'low_carb');
        setPhase(found.current_phase || 1);
      }
    }
  }, [initialPatientId]);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients])
  );

  const selectPatient = (p: any) => {
    // FIX: use push() not navigate() — ensures back button returns to this patient list
    // navigate() reuses existing screen instance, causing confusing back-navigation
    nav.push('TreatmentPlanEditor', { patientId: p.id });
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('patient_profiles')
        .update({
          assigned_diet_type: dietType,
          current_phase: phase,
        })
        .eq('id', selectedPatient.id);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Saved', `Protocol updated for ${selectedPatient.full_name}.`);
        // Update local state
        setSelectedPatient({ ...selectedPatient, assigned_diet_type: dietType, current_phase: phase });
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, assigned_diet_type: dietType, current_phase: phase } : p));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save.');
    }
    setSaving(false);
  };

  // ── No patient selected: show patient list ──
  if (!selectedPatient) {
    return (
      <SafeAreaView style={styles.safe}>
        {/* Back button only if navigated from stack (not tab) */}
        {initialPatientId && (
          <View style={styles.backBar}>
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerSection}>
          <NishkritiLogo size={40} showPulse />
          <Text style={styles.title}>Protocol Editor</Text>
          <Text style={styles.subtitle}>Select a patient to view and edit their treatment protocol.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.teal} style={{ marginTop: 40 }} />
        ) : patients.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>No patients yet</Text>
            <Text style={{ fontFamily: Typography.sans, fontSize: 15, color: Colors.ink3, marginTop: 4 }}>Create patients from the Roster tab first</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <SectionCap title="Select patient" />
            {patients.map(p => {
              const initials = (p.full_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const condition = (p.primary_condition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.patRow}
                  onPress={() => selectPatient(p)}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patName}>{p.full_name}</Text>
                    <Text style={styles.patCond}>{condition} · Phase {p.current_phase || 1}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ── Patient selected: show protocol editor ──
  const condition = (selectedPatient.primary_condition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const hasChanges = dietType !== (selectedPatient.assigned_diet_type || selectedPatient.diet_preference || 'low_carb')
    || phase !== (selectedPatient.current_phase || 1);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backBar}>
        <TouchableOpacity onPress={() => { setSelectedPatient(null); setSelectedId(null); }}>
          <Text style={styles.backText}>← Patients</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Protocol</Text>
        {hasChanges ? <Pill label="Unsaved" color="amber" /> : <Pill label="Current" color="teal" />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Patient hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(selectedPatient.full_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{selectedPatient.full_name}</Text>
            <Text style={styles.heroCond}>{condition} · UHID: {selectedPatient.uhid}</Text>
          </View>
        </View>

        {/* Diet Type */}
        <SectionCap title="Diet type" />
        <View style={styles.optionsGrid}>
          {DIET_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionChip, dietType === opt.value && styles.optionChipActive]}
              onPress={() => setDietType(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionChipText, dietType === opt.value && styles.optionChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phase */}
        <SectionCap title="Treatment phase" />
        {PHASE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.phaseRow, phase === opt.value && styles.phaseRowActive]}
            onPress={() => setPhase(opt.value)}
            activeOpacity={0.8}
          >
            <View style={[styles.phaseRadio, phase === opt.value && styles.phaseRadioActive]} />
            <Text style={[styles.phaseText, phase === opt.value && styles.phaseTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Current info */}
        <SectionCap title="Patient info" />
        <View style={styles.infoCard}>
          <InfoRow label="Baseline FBS" value={`${selectedPatient.baseline_fbs || '—'} mg/dL`} />
          <InfoRow label="Baseline HbA1c" value={`${selectedPatient.baseline_hba1c || '—'}%`} />
          <InfoRow label="Weight" value={`${selectedPatient.weight_kg || '—'} kg`} />
          <InfoRow label="Diet Preference" value={(selectedPatient.diet_preference || '—').replace(/_/g, ' ')} />
          <InfoRow label="Started" value={selectedPatient.programme_start_date || selectedPatient.onboarded_at?.split('T')[0] || '—'} />
        </View>

        {/* Save */}
        <View style={{ padding: Spacing.xl }}>
          <TouchableOpacity
            style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.deep} />
            ) : (
              <Text style={styles.saveBtnText}>
                {hasChanges ? 'Save Protocol Changes' : 'No Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.deep },
  backBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  backText:       { fontFamily: Typography.sans, fontSize: 17, color: Colors.teal },
  screenTitle:    { fontFamily: Typography.display, fontSize: 20, color: Colors.ink },
  headerSection:  { alignItems: 'center', padding: Spacing.xl, paddingBottom: Spacing.md },
  title:          { fontFamily: Typography.display, fontSize: 28, color: Colors.ink, marginTop: Spacing.md, marginBottom: Spacing.sm },
  subtitle:       { fontFamily: Typography.sans, fontSize: 16, color: Colors.ink2, textAlign: 'center', lineHeight: 24, maxWidth: 350 },
  patRow:         { marginHorizontal: Spacing.lg, marginBottom: 6, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 12, borderWidth: 0.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar:         { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.deep, fontWeight: '600' },
  patName:        { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.ink },
  patCond:        { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 2 },
  arrow:          { fontSize: 20, color: Colors.ink3 },
  heroSection:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.xl, backgroundColor: 'rgba(27,107,84,0.12)' },
  heroName:       { fontFamily: Typography.sansMed, fontSize: 20, color: Colors.ink },
  heroCond:       { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 3 },
  optionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  optionChip:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radii.md, backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2 },
  optionChipActive: { backgroundColor: Colors.em, borderColor: Colors.teal },
  optionChipText: { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2 },
  optionChipTextActive: { color: Colors.spring },
  phaseRow:       { marginHorizontal: Spacing.lg, marginBottom: 6, backgroundColor: Colors.card, borderRadius: Radii.md, padding: 13, borderWidth: 0.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 11 },
  phaseRowActive: { borderColor: Colors.teal, backgroundColor: 'rgba(27,107,84,0.08)' },
  phaseRadio:     { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.ink3 },
  phaseRadioActive: { borderColor: Colors.teal, backgroundColor: Colors.teal },
  phaseText:      { fontFamily: Typography.sans, fontSize: 16, color: Colors.ink2 },
  phaseTextActive: { fontFamily: Typography.sansMed, color: Colors.ink },
  infoCard:       { marginHorizontal: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden' },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  infoLabel:      { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2 },
  infoValue:      { fontFamily: Typography.sansMed, fontSize: 15, color: Colors.ink },
  saveBtn:        { backgroundColor: Colors.teal, borderRadius: Radii.lg, padding: 15, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText:    { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.deep, fontWeight: '600' },
});
