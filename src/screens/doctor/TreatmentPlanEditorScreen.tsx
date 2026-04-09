// TreatmentPlanEditorScreen — Doctor creates/edits a patient's full treatment plan
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { SectionCap } from '../../components/SectionCap';
import { Pill } from '../../components/Pill';
import { supabase } from '../../lib/supabase';
import { calcBMI, calcBMR, calcTDEE, macrosFromTDEE, macroCalsFromGrams, getAge } from '../../utils';
import { fetchActiveProtocol, createProtocol, updateProtocol } from '../../services/doctorService';
import { SUPPLEMENT_LIBRARY } from '../../data/supplementLibrary';
import type { TreatmentPlan, TreatmentPhase, DietType, Condition } from '../../types';

// ── Constants ────────────────────────────────────────────────────────────────

const DIET_OPTIONS: { label: string; value: DietType }[] = [
  { label: 'Low Carb', value: 'low_carb' },
  { label: 'Keto', value: 'keto' },
  { label: 'Carb Cycling', value: 'carb_cycling' },
  { label: 'High Protein', value: 'high_protein' },
  { label: 'Anti-Inflammatory', value: 'anti_inflammatory' },
  { label: 'Calorie Deficit', value: 'calorie_deficit' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'High Carb', value: 'high_carb' },
  { label: 'High Probiotic', value: 'high_probiotic' },
  { label: 'Frozen Carb', value: 'frozen_carb' },
];

const EXERCISE_TYPES = ['Resistance', 'Cardio', 'Yoga', 'HIIT', 'Walking', 'Mixed'];
const INTENSITY_OPTIONS = ['light', 'moderate', 'hard'] as const;

const EMPTY_PHASE: TreatmentPhase = {
  name: '', description: '', dietFocus: '', exerciseFocus: '',
  expectedDurationWeeks: 6, advancementCriteria: '',
};

// ── Reusable Sub-Components ──────────────────────────────────────────────────

const SectionLabel = ({ text, required }: { text: string; required?: boolean }) => (
  <Text style={s.label}>{text}{required ? ' *' : ''}</Text>
);

const ChipPicker = ({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <View style={s.chipRow}>
    {options.map(o => (
      <TouchableOpacity
        key={o.value}
        style={[s.chip, value === o.value && s.chipActive]}
        onPress={() => onChange(o.value)}
        activeOpacity={0.7}
      >
        <Text style={[s.chipText, value === o.value && s.chipTextActive]}>{o.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const Stepper = ({ value, onChange, step = 1, unit, min = 0, max = 9999 }: {
  value: number; onChange: (v: number) => void; step?: number; unit: string; min?: number; max?: number;
}) => (
  <View style={s.stepperWrap}>
    <TouchableOpacity style={s.stepperBtn} onPress={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}>
      <Text style={s.stepperBtnText}>−</Text>
    </TouchableOpacity>
    <TextInput
      style={s.stepperInput}
      value={String(value)}
      onChangeText={t => { const n = parseFloat(t); if (!isNaN(n)) onChange(n); }}
      keyboardType="numeric"
    />
    <TouchableOpacity style={s.stepperBtn} onPress={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}>
      <Text style={s.stepperBtnText}>+</Text>
    </TouchableOpacity>
    <Text style={s.stepperUnit}>{unit}</Text>
  </View>
);

const RepeatableRow = ({ items, onChange, fields, addLabel }: {
  items: any[]; onChange: (items: any[]) => void;
  fields: { key: string; placeholder: string; flex?: number }[];
  addLabel: string;
}) => (
  <View>
    {items.map((item, i) => (
      <View key={i} style={s.repeatRow}>
        {fields.map(f => (
          <TextInput
            key={f.key}
            style={[s.repeatInput, f.flex ? { flex: f.flex } : {}]}
            placeholder={f.placeholder}
            placeholderTextColor={Colors.ink3}
            value={item[f.key] || ''}
            onChangeText={t => {
              const updated = [...items];
              updated[i] = { ...updated[i], [f.key]: t };
              onChange(updated);
            }}
          />
        ))}
        <TouchableOpacity style={s.repeatRemove} onPress={() => onChange(items.filter((_, j) => j !== i))}>
          <Text style={s.repeatRemoveText}>✕</Text>
        </TouchableOpacity>
      </View>
    ))}
    <TouchableOpacity style={s.addBtn} onPress={() => {
      const empty: any = {};
      fields.forEach(f => empty[f.key] = '');
      onChange([...items, empty]);
    }}>
      <Text style={s.addBtnText}>+ {addLabel}</Text>
    </TouchableOpacity>
  </View>
);

// ── Main Screen ──────────────────────────────────────────────────────────────

export const TreatmentPlanEditorScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const patientId: string = route.params?.patientId;
  const isNew: boolean = route.params?.isNew || false;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [existingPlan, setExistingPlan] = useState<TreatmentPlan | null>(null);

  // ── Form state ──
  const [dietType, setDietType] = useState<DietType>('low_carb');
  const [calorieTarget, setCalorieTarget] = useState(1400);
  const [carbsG, setCarbsG] = useState(70);
  const [proteinG, setProteinG] = useState(100);
  const [fatG, setFatG] = useState(60);

  const [exerciseType, setExerciseType] = useState('Mixed');
  const [exerciseDuration, setExerciseDuration] = useState(45);
  const [exerciseIntensity, setExerciseIntensity] = useState<'light' | 'moderate' | 'hard'>('moderate');
  const [exerciseFrequency, setExerciseFrequency] = useState('5x/week');
  const [exerciseNotes, setExerciseNotes] = useState('');

  const [phases, setPhases] = useState<TreatmentPhase[]>([{ ...EMPTY_PHASE, name: 'Phase 1' }]);
  const [medications, setMedications] = useState<{ name: string; dose: string; timing: string }[]>([]);
  const [supplements, setSupplements] = useState<{ name: string; dose: string; timing: string; reason: string }[]>([]);
  const [notes, setNotes] = useState('');

  // ── Auto-calculated values ──
  const [autoCalories, setAutoCalories] = useState(0);
  const [autoCarbsG, setAutoCarbsG] = useState(0);
  const [autoProteinG, setAutoProteinG] = useState(0);
  const [autoFatG, setAutoFatG] = useState(0);

  // ── Load patient + existing protocol ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch patient profile
      const { data: p } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('id', patientId)
        .single();
      if (p) {
        setPatient(p);
        // Auto-calculate suggestions
        const age = getAge(p.dob);
        const bmr = calcBMR(p.weight_kg || 70, p.height_cm || 170, age, (p.sex || 'male') as 'male' | 'female' | 'other');
        const tdee = calcTDEE(bmr, p.activity_level || 'sedentary');
        const macros = macrosFromTDEE(tdee, p.assigned_diet_type || 'low_carb');
        setAutoCalories(macros.cals);
        setAutoCarbsG(macros.carbs);
        setAutoProteinG(macros.protein);
        setAutoFatG(macros.fat);
      }

      // Fetch existing active protocol
      const plan = await fetchActiveProtocol(patientId);
      if (plan) {
        setExistingPlan(plan);
        // Populate form
        setDietType(plan.dietType);
        setCalorieTarget(plan.calorieTarget || autoCalories);
        setCarbsG(plan.carbsTargetG || autoCarbsG);
        setProteinG(plan.proteinTargetG || autoProteinG);
        setFatG(plan.fatTargetG || autoFatG);
        setExerciseType(plan.exerciseType || 'Mixed');
        setExerciseDuration(plan.exerciseDurationMin || 45);
        setExerciseIntensity(plan.exerciseIntensity || 'moderate');
        setExerciseFrequency(plan.exerciseFrequency || '5x/week');
        setExerciseNotes(plan.exerciseNotes || '');
        if (plan.phases.length > 0) setPhases(plan.phases);
        if (plan.medications.length > 0) setMedications(plan.medications);
        if (plan.supplements.length > 0) setSupplements(plan.supplements);
        setNotes(plan.notes || '');
      } else if (p) {
        // New plan — pre-fill with auto-calculated values
        const age = getAge(p.dob);
        const bmr = calcBMR(p.weight_kg || 70, p.height_cm || 170, age, (p.sex || 'male') as 'male' | 'female' | 'other');
        const tdee = calcTDEE(bmr, p.activity_level || 'sedentary');
        const macros = macrosFromTDEE(tdee, p.assigned_diet_type || 'low_carb');
        setCalorieTarget(macros.cals);
        setCarbsG(macros.carbs);
        setProteinG(macros.protein);
        setFatG(macros.fat);
        setDietType((p.assigned_diet_type || 'low_carb') as DietType);
        // Pre-fill medications from patient profile
        const meds = (p as any).medications;
        if (meds && Array.isArray(meds) && meds.length > 0) {
          setMedications(meds);
        }
      }
      setLoading(false);
    })();
  }, [patientId]);

  // ── Recalculate auto-suggestions when diet type changes ──
  const recalcMacros = useCallback((dt: DietType) => {
    if (!patient) return;
    const age = getAge(patient.dob);
    const bmr = calcBMR(patient.weight_kg || 70, patient.height_cm || 170, age, patient.sex || 'male');
    const tdee = calcTDEE(bmr, patient.activity_level || 'sedentary');
    const macros = macrosFromTDEE(tdee, dt);
    setAutoCalories(macros.cals);
    setAutoCarbsG(macros.carbs);
    setAutoProteinG(macros.protein);
    setAutoFatG(macros.fat);
  }, [patient]);

  const handleDietChange = (dt: string) => {
    const typed = dt as DietType;
    setDietType(typed);
    recalcMacros(typed);
  };

  const acceptAutoValues = () => {
    setCalorieTarget(autoCalories);
    setCarbsG(autoCarbsG);
    setProteinG(autoProteinG);
    setFatG(autoFatG);
  };

  // ── Suggested supplements based on condition ──
  const suggestedSupps = patient
    ? SUPPLEMENT_LIBRARY.filter(s => s.conditions.includes(patient.primary_condition))
    : [];

  const addSuggestedSupplement = (supp: typeof SUPPLEMENT_LIBRARY[0]) => {
    if (supplements.find(s => s.name === supp.name)) return; // already added
    setSupplements([...supplements, {
      name: supp.name,
      dose: supp.dose,
      timing: supp.timing,
      reason: supp.patientReason,
    }]);
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const planData: Partial<TreatmentPlan> = {
        condition: (patient?.primary_condition || 'diabetes_t2') as Condition,
        dietType,
        calorieTarget,
        carbsTargetG: carbsG,
        proteinTargetG: proteinG,
        fatTargetG: fatG,
        exerciseType,
        exerciseDurationMin: exerciseDuration,
        exerciseIntensity,
        exerciseFrequency,
        exerciseNotes,
        phases,
        currentPhase: existingPlan?.currentPhase || 1,
        phaseName: phases[0]?.name || 'Phase 1',
        medications,
        supplements,
        notes,
      };

      if (existingPlan) {
        await updateProtocol(existingPlan.id, planData);
      } else {
        await createProtocol(patientId, planData);
      }

      // Also update patient_profiles with diet type and phase
      await supabase
        .from('patient_profiles')
        .update({
          assigned_diet_type: dietType,
          current_phase: existingPlan?.currentPhase || 1,
        } as any)
        .eq('id', patientId);

      Alert.alert(
        existingPlan ? 'Plan Updated' : 'Plan Created',
        `Treatment plan ${existingPlan ? 'updated' : 'created'} for ${patient?.full_name || 'patient'}.`,
        [{ text: 'OK', onPress: () => nav.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save plan.');
    }
    setSaving(false);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color={Colors.teal} size="large" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>Patient not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bmi = calcBMI(patient.weight_kg || 70, patient.height_cm || 170);
  const liveCalories = macroCalsFromGrams(carbsG, proteinG, fatG);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={s.safe}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{existingPlan ? 'Edit Plan' : 'Create Plan'}</Text>
          {existingPlan ? <Pill label="Active" color="teal" /> : <Pill label="New" color="amber" />}
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Patient Header ── */}
          <View style={s.patientCard}>
            <View style={s.patAvatar}>
              <Text style={s.patAvatarText}>
                {(patient.full_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.patName}>{patient.full_name}</Text>
              <Text style={s.patMeta}>
                {(patient.primary_condition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                {' · '}{getAge(patient.dob)}y {patient.sex === 'male' ? 'M' : 'F'}
                {' · BMI '}{bmi}
              </Text>
            </View>
            <View style={s.patStats}>
              <Text style={s.patStatVal}>{patient.weight_kg || '—'} kg</Text>
              <Text style={s.patStatVal}>{patient.height_cm || '—'} cm</Text>
              <Text style={s.patStatVal}>FBS {patient.baseline_fbs || '—'}</Text>
            </View>
          </View>

          {/* Auto-calculated suggestion banner */}
          <View style={s.suggestionBanner}>
            <Text style={s.suggestionTitle}>Auto-calculated (BMR/TDEE)</Text>
            <Text style={s.suggestionText}>
              {autoCalories} cal · {autoCarbsG}g C · {autoProteinG}g P · {autoFatG}g F
            </Text>
            <TouchableOpacity style={s.acceptBtn} onPress={acceptAutoValues}>
              <Text style={s.acceptBtnText}>Use these values</Text>
            </TouchableOpacity>
          </View>

          {/* ── SECTION: Diet Type ── */}
          <SectionCap title="Diet type" />
          <ChipPicker
            options={DIET_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
            value={dietType}
            onChange={handleDietChange}
          />

          {/* ── SECTION: Calorie & Macro Targets ── */}
          <SectionCap title="Calorie & macro targets" />
          <View style={s.macroSection}>
            <SectionLabel text="CALORIES" />
            <Stepper value={calorieTarget} onChange={setCalorieTarget} step={50} unit="cal/day" min={800} max={4000} />

            <View style={s.macroRow}>
              <View style={s.macroCol}>
                <SectionLabel text="CARBS" />
                <Stepper value={carbsG} onChange={setCarbsG} step={5} unit="g" min={10} max={500} />
              </View>
              <View style={s.macroCol}>
                <SectionLabel text="PROTEIN" />
                <Stepper value={proteinG} onChange={setProteinG} step={5} unit="g" min={30} max={300} />
              </View>
              <View style={s.macroCol}>
                <SectionLabel text="FAT" />
                <Stepper value={fatG} onChange={setFatG} step={5} unit="g" min={10} max={200} />
              </View>
            </View>

            <View style={s.macroCalcBar}>
              <Text style={s.macroCalcText}>
                From macros: {liveCalories} cal
                {Math.abs(liveCalories - calorieTarget) > 50 && (
                  <Text style={{ color: Colors.amber }}> ({liveCalories > calorieTarget ? '+' : ''}{liveCalories - calorieTarget})</Text>
                )}
              </Text>
            </View>
          </View>

          {/* ── SECTION: Exercise ── */}
          <SectionCap title="Exercise strategy" />
          <SectionLabel text="TYPE" />
          <ChipPicker
            options={EXERCISE_TYPES.map(t => ({ label: t, value: t }))}
            value={exerciseType}
            onChange={setExerciseType}
          />

          <View style={s.macroRow}>
            <View style={s.macroCol}>
              <SectionLabel text="DURATION" />
              <Stepper value={exerciseDuration} onChange={setExerciseDuration} step={5} unit="min" min={10} max={120} />
            </View>
            <View style={s.macroCol}>
              <SectionLabel text="INTENSITY" />
              <ChipPicker
                options={INTENSITY_OPTIONS.map(i => ({ label: i.charAt(0).toUpperCase() + i.slice(1), value: i }))}
                value={exerciseIntensity}
                onChange={v => setExerciseIntensity(v as any)}
              />
            </View>
          </View>

          <SectionLabel text="FREQUENCY" />
          <TextInput
            style={s.input}
            placeholder="e.g. 5x/week"
            placeholderTextColor={Colors.ink3}
            value={exerciseFrequency}
            onChangeText={setExerciseFrequency}
          />

          <SectionLabel text="EXERCISE NOTES" />
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Special instructions, restrictions..."
            placeholderTextColor={Colors.ink3}
            value={exerciseNotes}
            onChangeText={setExerciseNotes}
            multiline
          />

          {/* ── SECTION: Phases ── */}
          <SectionCap title={`Phases (${phases.length})`} />
          {phases.map((phase, i) => (
            <View key={i} style={s.phaseCard}>
              <View style={s.phaseHeader}>
                <Text style={s.phaseNumber}>Phase {i + 1}</Text>
                {phases.length > 1 && (
                  <TouchableOpacity onPress={() => setPhases(phases.filter((_, j) => j !== i))}>
                    <Text style={s.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={s.input}
                placeholder="Phase name (e.g. Sugar Shutdown)"
                placeholderTextColor={Colors.ink3}
                value={phase.name}
                onChangeText={t => { const u = [...phases]; u[i] = { ...u[i], name: t }; setPhases(u); }}
              />
              <TextInput
                style={[s.input, s.textArea, { marginTop: 8 }]}
                placeholder="Description — what this phase aims to achieve"
                placeholderTextColor={Colors.ink3}
                value={phase.description}
                onChangeText={t => { const u = [...phases]; u[i] = { ...u[i], description: t }; setPhases(u); }}
                multiline
              />
              <View style={[s.macroRow, { marginTop: 8 }]}>
                <View style={s.macroCol}>
                  <TextInput style={s.input} placeholder="Diet focus" placeholderTextColor={Colors.ink3}
                    value={phase.dietFocus} onChangeText={t => { const u = [...phases]; u[i] = { ...u[i], dietFocus: t }; setPhases(u); }} />
                </View>
                <View style={s.macroCol}>
                  <TextInput style={s.input} placeholder="Exercise focus" placeholderTextColor={Colors.ink3}
                    value={phase.exerciseFocus} onChangeText={t => { const u = [...phases]; u[i] = { ...u[i], exerciseFocus: t }; setPhases(u); }} />
                </View>
              </View>
              <View style={[s.macroRow, { marginTop: 8 }]}>
                <View style={s.macroCol}>
                  <Stepper value={phase.expectedDurationWeeks} onChange={v => { const u = [...phases]; u[i] = { ...u[i], expectedDurationWeeks: v }; setPhases(u); }} step={1} unit="weeks" min={1} max={52} />
                </View>
              </View>
              <TextInput
                style={[s.input, { marginTop: 8 }]}
                placeholder="Advancement criteria — when to move to next phase"
                placeholderTextColor={Colors.ink3}
                value={phase.advancementCriteria}
                onChangeText={t => { const u = [...phases]; u[i] = { ...u[i], advancementCriteria: t }; setPhases(u); }}
              />
            </View>
          ))}
          {phases.length < 4 && (
            <TouchableOpacity style={s.addBtn} onPress={() => setPhases([...phases, { ...EMPTY_PHASE, name: `Phase ${phases.length + 1}` }])}>
              <Text style={s.addBtnText}>+ Add Phase</Text>
            </TouchableOpacity>
          )}

          {/* ── SECTION: Medications ── */}
          <SectionCap title="Current medications" />
          <RepeatableRow
            items={medications}
            onChange={setMedications}
            fields={[
              { key: 'name', placeholder: 'Medication name', flex: 2 },
              { key: 'dose', placeholder: 'Dose', flex: 1 },
              { key: 'timing', placeholder: 'Timing', flex: 1 },
            ]}
            addLabel="Add medication"
          />

          {/* ── SECTION: Supplements ── */}
          <SectionCap title="Supplements" />
          <RepeatableRow
            items={supplements}
            onChange={setSupplements}
            fields={[
              { key: 'name', placeholder: 'Name', flex: 2 },
              { key: 'dose', placeholder: 'Dose', flex: 1 },
              { key: 'timing', placeholder: 'Timing', flex: 1 },
              { key: 'reason', placeholder: 'Reason', flex: 2 },
            ]}
            addLabel="Add supplement"
          />

          {/* Suggested supplements */}
          {suggestedSupps.length > 0 && (
            <View style={s.suggestedSection}>
              <Text style={s.suggestedTitle}>Suggested for {(patient.primary_condition || '').replace(/_/g, ' ')}</Text>
              {suggestedSupps.slice(0, 6).map(supp => {
                const alreadyAdded = supplements.some(s => s.name === supp.name);
                return (
                  <TouchableOpacity
                    key={supp.name}
                    style={[s.suggestedRow, alreadyAdded && s.suggestedRowAdded]}
                    onPress={() => addSuggestedSupplement(supp)}
                    disabled={alreadyAdded}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.suggestedName}>{supp.name}</Text>
                      <Text style={s.suggestedDose}>{supp.dose} · {supp.timing}</Text>
                    </View>
                    <Pill label={alreadyAdded ? 'Added' : supp.priority} color={alreadyAdded ? 'teal' : supp.priority === 'essential' ? 'rose' : 'amber'} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── SECTION: Doctor Notes ── */}
          <SectionCap title="Doctor notes" />
          <TextInput
            style={[s.input, s.textArea, { minHeight: 100 }]}
            placeholder="Treatment philosophy, special considerations, goals..."
            placeholderTextColor={Colors.ink3}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.deep} />
            ) : (
              <Text style={s.saveBtnText}>
                {existingPlan ? 'Update Treatment Plan' : 'Create Treatment Plan'} →
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.deep },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backText: { fontFamily: Typography.sans, fontSize: 17, color: Colors.teal },
  headerTitle: { fontFamily: Typography.display, fontSize: 22, color: Colors.ink },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingTop: Spacing.md },
  label: {
    fontFamily: Typography.mono, fontSize: 11, letterSpacing: 2,
    color: Colors.ink2, marginBottom: 6, marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card2, borderRadius: Radii.md,
    borderWidth: 0.5, borderColor: Colors.border2,
    padding: 12, fontFamily: Typography.sans, fontSize: 16, color: Colors.ink,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  // Patient card
  patientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, backgroundColor: 'rgba(27,107,84,0.12)',
    borderRadius: Radii.lg, marginBottom: Spacing.md,
  },
  patAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  patAvatarText: { fontFamily: Typography.sansMed, fontSize: 18, color: Colors.deep, fontWeight: '600' },
  patName: { fontFamily: Typography.sansMed, fontSize: 18, color: Colors.ink },
  patMeta: { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2, marginTop: 2 },
  patStats: { alignItems: 'flex-end', gap: 2 },
  patStatVal: { fontFamily: Typography.mono, fontSize: 12, color: Colors.teal },
  // Suggestion banner
  suggestionBanner: {
    backgroundColor: Colors.card, borderRadius: Radii.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: 12, marginBottom: Spacing.md, alignItems: 'center',
  },
  suggestionTitle: { fontFamily: Typography.mono, fontSize: 11, letterSpacing: 1, color: Colors.ink3, marginBottom: 4 },
  suggestionText: { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.teal, marginBottom: 8 },
  acceptBtn: { backgroundColor: 'rgba(62,219,165,0.1)', borderRadius: Radii.sm, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 0.5, borderColor: Colors.teal },
  acceptBtnText: { fontFamily: Typography.mono, fontSize: 13, color: Colors.teal },
  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: Spacing.sm },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: Radii.md, backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2 },
  chipActive: { backgroundColor: Colors.em, borderColor: Colors.teal },
  chipText: { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2 },
  chipTextActive: { color: Colors.spring },
  // Stepper
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperBtn: { width: 38, height: 38, borderRadius: Radii.md, backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: Typography.mono, fontSize: 20, color: Colors.teal },
  stepperInput: { flex: 1, backgroundColor: Colors.card2, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border2, padding: 10, fontFamily: Typography.mono, fontSize: 16, color: Colors.ink, textAlign: 'center' },
  stepperUnit: { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2, minWidth: 40 },
  // Macros section
  macroSection: { paddingHorizontal: Spacing.sm },
  macroRow: { flexDirection: 'row', gap: Spacing.md },
  macroCol: { flex: 1 },
  macroCalcBar: { marginTop: 8, paddingVertical: 6, alignItems: 'center' },
  macroCalcText: { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink3 },
  // Phase card
  phaseCard: {
    backgroundColor: Colors.card, borderRadius: Radii.lg,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: 8,
  },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  phaseNumber: { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.teal },
  removeText: { fontFamily: Typography.mono, fontSize: 13, color: Colors.rose },
  // Repeatable rows
  repeatRow: { flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' },
  repeatInput: { flex: 1, backgroundColor: Colors.card2, borderRadius: Radii.sm, borderWidth: 0.5, borderColor: Colors.border2, padding: 10, fontFamily: Typography.sans, fontSize: 14, color: Colors.ink },
  repeatRemove: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(217,123,114,0.1)', alignItems: 'center', justifyContent: 'center' },
  repeatRemoveText: { fontSize: 14, color: Colors.rose },
  addBtn: { paddingVertical: 10, alignItems: 'center' },
  addBtnText: { fontFamily: Typography.sansMed, fontSize: 15, color: Colors.teal },
  // Suggested supplements
  suggestedSection: { marginTop: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden' },
  suggestedTitle: { fontFamily: Typography.mono, fontSize: 11, letterSpacing: 1, color: Colors.ink3, padding: 10, paddingBottom: 4 },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 0.5, borderTopColor: Colors.border, gap: 8 },
  suggestedRowAdded: { opacity: 0.5 },
  suggestedName: { fontFamily: Typography.sansMed, fontSize: 15, color: Colors.ink },
  suggestedDose: { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2, marginTop: 1 },
  // Save
  saveBtn: { backgroundColor: Colors.teal, borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.xxl },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: Typography.sansMed, fontSize: 18, color: Colors.deep, fontWeight: '600' },
});
