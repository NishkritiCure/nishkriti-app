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

const DIET_FOCUS_PRESETS = [
  'Low Carb, High Protein', 'Keto (Very Low Carb, High Fat)', 'Balanced Macros',
  'High Protein, Moderate Carb', 'Anti-Inflammatory', 'Calorie Deficit', 'Low Fat, High Fibre',
];
const EXERCISE_FOCUS_PRESETS = [
  'Resistance Training', 'Zone 2 Cardio', 'HIIT', 'Yoga + Flexibility',
  'Walking Only', 'Progressive Overload', 'Bodyweight Circuit',
  'Post-meal Walks', 'Swimming / Aquatic', 'Sports / Recreational',
];
const DOSE_UNITS = ['mg', 'mcg', 'ml', 'IU', 'g', 'tablets', 'capsules', 'drops'];
const FREQ_PERIODS = ['per day', 'per week', 'per month'];
const SUPP_FREQ_PERIODS = ['per day', 'per week'];

const EMPTY_PHASE: TreatmentPhase = {
  name: '', description: '', dietFocus: '', exerciseFocus: '',
  expectedDurationWeeks: 6, advancementCriteria: '',
};

// ── Reusable Sub-Components ──────────────────────────────────────────────────

const SectionLabel = ({ text, required }: { text: string; required?: boolean }) => (
  <Text style={s.label}>{text}{required ? ' *' : ''}</Text>
);

// Single-select chip picker (for intensity, dose unit, freq period)
const ChipPicker = ({ options, value, onChange, small }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  small?: boolean;
}) => (
  <View style={s.chipRow}>
    {options.map(o => (
      <TouchableOpacity
        key={o.value}
        style={[small ? s.chipSmall : s.chip, value === o.value && s.chipActive]}
        onPress={() => onChange(o.value)}
        activeOpacity={0.7}
      >
        <Text style={[small ? s.chipTextSmall : s.chipText, value === o.value && s.chipTextActive]}>{o.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// B1/B3: Multi-select chip picker
const MultiChipPicker = ({ options, values, onToggle, small }: {
  options: { label: string; value: string }[];
  values: string[];
  onToggle: (v: string) => void;
  small?: boolean;
}) => (
  <View style={s.chipRow}>
    {options.map(o => {
      const active = values.includes(o.value);
      return (
        <TouchableOpacity
          key={o.value}
          style={[small ? s.chipSmall : s.chip, active && s.chipActive]}
          onPress={() => onToggle(o.value)}
          activeOpacity={0.7}
        >
          <Text style={[small ? s.chipTextSmall : s.chipText, active && s.chipTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// B2: Stepper with NaN-safe input
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
      onChangeText={t => { const n = parseFloat(t); onChange(isNaN(n) ? 0 : n); }}
      keyboardType="numeric"
    />
    <TouchableOpacity style={s.stepperBtn} onPress={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}>
      <Text style={s.stepperBtnText}>+</Text>
    </TouchableOpacity>
    <Text style={s.stepperUnit}>{unit}</Text>
  </View>
);

// B8/B9: Preset chips that fill a text input (multi-select appends)
const PresetChips = ({ presets, value, onChange }: {
  presets: string[]; value: string; onChange: (v: string) => void;
}) => {
  const current = value.split(',').map(s => s.trim()).filter(Boolean);
  return (
    <View style={s.chipRow}>
      {presets.map(p => {
        const active = current.includes(p);
        return (
          <TouchableOpacity
            key={p}
            style={[s.chipSmall, active && s.chipActive]}
            onPress={() => {
              if (active) {
                onChange(current.filter(c => c !== p).join(', '));
              } else {
                onChange([...current, p].join(', '));
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[s.chipTextSmall, active && s.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const parseFreq = (raw: string): { perDay: number; perWeek: number; perMonth: number } => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return { perDay: parsed.perDay || 0, perWeek: parsed.perWeek || 0, perMonth: parsed.perMonth || 0 };
  } catch {}
  // Old format like "5x/week" — extract number for perWeek
  const m = (raw || '').match(/(\d+)/);
  return { perDay: 0, perWeek: m ? parseInt(m[1]) : 5, perMonth: 0 };
};

const composeFreqText = (d: number, w: number, m: number) => {
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}x/day`);
  if (w > 0) parts.push(`${w}x/week`);
  if (m > 0) parts.push(`${m}x/month`);
  return parts.join(', ') || '—';
};

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
  // B1: diet type is now an array (multi-select)
  const [dietTypes, setDietTypes] = useState<string[]>(['low_carb']);
  const [calorieTarget, setCalorieTarget] = useState(1400);
  const [carbsG, setCarbsG] = useState(70);
  const [proteinG, setProteinG] = useState(100);
  const [fatG, setFatG] = useState(60);

  // B3: exercise type is now an array (multi-select)
  const [exerciseTypes, setExerciseTypes] = useState<string[]>(['Mixed']);
  const [exerciseDuration, setExerciseDuration] = useState(45);
  const [exerciseIntensity, setExerciseIntensity] = useState<'light' | 'moderate' | 'hard'>('moderate');
  // B6: structured frequency
  const [freqPerDay, setFreqPerDay] = useState(0);
  const [freqPerWeek, setFreqPerWeek] = useState(5);
  const [freqPerMonth, setFreqPerMonth] = useState(0);
  const [exerciseNotes, setExerciseNotes] = useState('');

  const [phases, setPhases] = useState<TreatmentPhase[]>([{ ...EMPTY_PHASE, name: 'Phase 1' }]);
  // B11: medications with structured dose/frequency
  const [medications, setMedications] = useState<any[]>([]);
  // B12: supplements with frequency
  const [supplements, setSupplements] = useState<any[]>([]);
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
      const { data: p } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('id', patientId)
        .single();
      if (p) {
        setPatient(p);
        const age = getAge(p.dob);
        const bmr = calcBMR(p.weight_kg || 70, p.height_cm || 170, age, (p.sex || 'male') as 'male' | 'female' | 'other');
        const tdee = calcTDEE(bmr, p.activity_level || 'sedentary');
        const macros = macrosFromTDEE(tdee, p.assigned_diet_type || 'low_carb');
        setAutoCalories(macros.cals);
        setAutoCarbsG(macros.carbs);
        setAutoProteinG(macros.protein);
        setAutoFatG(macros.fat);
      }

      const plan = await fetchActiveProtocol(patientId);
      if (plan) {
        setExistingPlan(plan);
        // B1: split comma-separated diet type string into array
        setDietTypes(String(plan.dietType || 'low_carb').split(',').map(s => s.trim()).filter(Boolean));
        setCalorieTarget(plan.calorieTarget || autoCalories);
        setCarbsG(plan.carbsTargetG || autoCarbsG);
        setProteinG(plan.proteinTargetG || autoProteinG);
        setFatG(plan.fatTargetG || autoFatG);
        // B3: split exercise type
        setExerciseTypes(String(plan.exerciseType || 'Mixed').split(',').map(s => s.trim()).filter(Boolean));
        setExerciseDuration(plan.exerciseDurationMin || 45);
        setExerciseIntensity(plan.exerciseIntensity || 'moderate');
        // B6: parse structured frequency
        const freq = parseFreq(plan.exerciseFrequency || '');
        setFreqPerDay(freq.perDay); setFreqPerWeek(freq.perWeek); setFreqPerMonth(freq.perMonth);
        setExerciseNotes(plan.exerciseNotes || '');
        if (plan.phases.length > 0) setPhases(plan.phases);
        if (plan.medications.length > 0) setMedications(plan.medications);
        if (plan.supplements.length > 0) setSupplements(plan.supplements);
        setNotes(plan.notes || '');
      } else if (p) {
        const age = getAge(p.dob);
        const bmr = calcBMR(p.weight_kg || 70, p.height_cm || 170, age, (p.sex || 'male') as 'male' | 'female' | 'other');
        const tdee = calcTDEE(bmr, p.activity_level || 'sedentary');
        const macros = macrosFromTDEE(tdee, p.assigned_diet_type || 'low_carb');
        setCalorieTarget(macros.cals); setCarbsG(macros.carbs); setProteinG(macros.protein); setFatG(macros.fat);
        setDietTypes([(p.assigned_diet_type || 'low_carb')]);
        const meds = (p as any).medications;
        if (meds && Array.isArray(meds) && meds.length > 0) setMedications(meds);
      }
      setLoading(false);
    })();
  }, [patientId]);

  // ── Recalculate auto-suggestions (uses first selected diet type) ──
  const recalcMacros = useCallback((dt: DietType) => {
    if (!patient) return;
    const age = getAge(patient.dob);
    const bmr = calcBMR(patient.weight_kg || 70, patient.height_cm || 170, age, patient.sex || 'male');
    const tdee = calcTDEE(bmr, patient.activity_level || 'sedentary');
    const macros = macrosFromTDEE(tdee, dt);
    setAutoCalories(macros.cals); setAutoCarbsG(macros.carbs); setAutoProteinG(macros.protein); setAutoFatG(macros.fat);
  }, [patient]);

  // B1: toggle diet type in multi-select
  const toggleDietType = (dt: string) => {
    setDietTypes(prev => {
      const next = prev.includes(dt) ? prev.filter(d => d !== dt) : [...prev, dt];
      if (next.length > 0) recalcMacros(next[0] as DietType);
      return next.length > 0 ? next : prev; // keep at least one
    });
  };

  // B3: toggle exercise type in multi-select
  const toggleExerciseType = (et: string) => {
    setExerciseTypes(prev => {
      const next = prev.includes(et) ? prev.filter(e => e !== et) : [...prev, et];
      return next.length > 0 ? next : prev;
    });
  };

  const acceptAutoValues = () => {
    setCalorieTarget(autoCalories); setCarbsG(autoCarbsG); setProteinG(autoProteinG); setFatG(autoFatG);
  };

  // ── Suggested supplements ──
  const suggestedSupps = patient
    ? SUPPLEMENT_LIBRARY.filter(sl => sl.conditions.includes(patient.primary_condition))
    : [];

  const addSuggestedSupplement = (supp: typeof SUPPLEMENT_LIBRARY[0]) => {
    if (supplements.find((sl: any) => sl.name === supp.name)) return;
    setSupplements([...supplements, {
      name: supp.name, dose: supp.dose, timing: supp.timing, reason: supp.patientReason,
      frequencyCount: '', frequencyPeriod: 'per day',
    }]);
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const planData: Partial<TreatmentPlan> = {
        condition: (patient?.primary_condition || 'diabetes_t2') as Condition,
        // B1: store as comma-separated string
        dietType: dietTypes.join(',') as any,
        calorieTarget,
        carbsTargetG: carbsG,
        proteinTargetG: proteinG,
        fatTargetG: fatG,
        // B3: store as comma-separated string
        exerciseType: exerciseTypes.join(','),
        exerciseDurationMin: exerciseDuration,
        exerciseIntensity,
        // B6: store as JSON string
        exerciseFrequency: JSON.stringify({ perDay: freqPerDay, perWeek: freqPerWeek, perMonth: freqPerMonth }),
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

      await supabase
        .from('patient_profiles')
        .update({
          assigned_diet_type: dietTypes[0] || 'low_carb',
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

  // ── Loading / error states ──
  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ActivityIndicator color={Colors.teal} size="large" style={{ marginTop: 100 }} />
    </SafeAreaView>
  );
  if (!patient) return (
    <SafeAreaView style={s.safe}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>Patient not found</Text>
      </View>
    </SafeAreaView>
  );

  const bmi = calcBMI(patient.weight_kg || 70, patient.height_cm || 170);
  const liveCalories = macroCalsFromGrams(carbsG, proteinG, fatG);

  // ── Helper to update a phase field ──
  const updatePhase = (i: number, field: string, val: any) => {
    const u = [...phases]; u[i] = { ...u[i], [field]: val }; setPhases(u);
  };
  // Helper to update a medication field
  const updateMed = (i: number, field: string, val: any) => {
    const u = [...medications]; u[i] = { ...u[i], [field]: val }; setMedications(u);
  };
  // Helper to update a supplement field
  const updateSupp = (i: number, field: string, val: any) => {
    const u = [...supplements]; u[i] = { ...u[i], [field]: val }; setSupplements(u);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{existingPlan ? 'Edit Plan' : 'Create Plan'}</Text>
          {existingPlan ? <Pill label="Active" color="teal" /> : <Pill label="New" color="amber" />}
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Patient Header */}
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

          {/* ── B1: Diet Type (multi-select) ── */}
          <SectionCap title="Diet type" />
          <MultiChipPicker
            options={DIET_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
            values={dietTypes}
            onToggle={toggleDietType}
          />

          {/* ── B2: Calorie & Macro Targets (min=0, NaN-safe) ── */}
          <SectionCap title="Calorie & macro targets" />
          <View style={s.macroSection}>
            <SectionLabel text="CALORIES" />
            <Stepper value={calorieTarget} onChange={setCalorieTarget} step={50} unit="cal/day" min={0} max={5000} />
            <View style={s.macroRow}>
              <View style={s.macroCol}>
                <SectionLabel text="CARBS" />
                <Stepper value={carbsG} onChange={setCarbsG} step={5} unit="g" min={0} max={500} />
              </View>
              <View style={s.macroCol}>
                <SectionLabel text="PROTEIN" />
                <Stepper value={proteinG} onChange={setProteinG} step={5} unit="g" min={0} max={500} />
              </View>
              <View style={s.macroCol}>
                <SectionLabel text="FAT" />
                <Stepper value={fatG} onChange={setFatG} step={5} unit="g" min={0} max={300} />
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

          {/* ── B3: Exercise Type (multi-select) ── */}
          <SectionCap title="Exercise strategy" />
          <SectionLabel text="TYPE" />
          <MultiChipPicker
            options={EXERCISE_TYPES.map(t => ({ label: t, value: t }))}
            values={exerciseTypes}
            onToggle={toggleExerciseType}
          />

          {/* ── B4: Duration (min=0) + B5: Intensity ── */}
          <View style={s.macroRow}>
            <View style={s.macroCol}>
              <SectionLabel text="DURATION" />
              <Stepper value={exerciseDuration} onChange={setExerciseDuration} step={5} unit="min" min={0} max={180} />
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

          {/* ── B6: Exercise Frequency (structured steppers) ── */}
          <SectionLabel text="FREQUENCY" />
          <View style={s.macroRow}>
            <View style={s.macroCol}>
              <Text style={s.freqLabel}>per day</Text>
              <Stepper value={freqPerDay} onChange={setFreqPerDay} step={1} unit="" min={0} max={5} />
            </View>
            <View style={s.macroCol}>
              <Text style={s.freqLabel}>per week</Text>
              <Stepper value={freqPerWeek} onChange={setFreqPerWeek} step={1} unit="" min={0} max={14} />
            </View>
            <View style={s.macroCol}>
              <Text style={s.freqLabel}>per month</Text>
              <Stepper value={freqPerMonth} onChange={setFreqPerMonth} step={1} unit="" min={0} max={60} />
            </View>
          </View>
          <Text style={s.freqSummary}>{composeFreqText(freqPerDay, freqPerWeek, freqPerMonth)}</Text>

          {/* B7: Exercise Notes */}
          <SectionLabel text="EXERCISE NOTES" />
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Special instructions, restrictions..."
            placeholderTextColor={Colors.ink3}
            value={exerciseNotes}
            onChangeText={setExerciseNotes}
            multiline
          />

          {/* ── B8/B9: Phases with preset chips ── */}
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
              <TextInput style={s.input} placeholder="Phase name" placeholderTextColor={Colors.ink3}
                value={phase.name} onChangeText={t => updatePhase(i, 'name', t)} />
              <TextInput style={[s.input, s.textArea, { marginTop: 8 }]} placeholder="Description" placeholderTextColor={Colors.ink3}
                value={phase.description} onChangeText={t => updatePhase(i, 'description', t)} multiline />

              {/* B8: Diet focus with presets */}
              <SectionLabel text="DIET FOCUS" />
              <PresetChips presets={DIET_FOCUS_PRESETS} value={phase.dietFocus || ''} onChange={v => updatePhase(i, 'dietFocus', v)} />
              <TextInput style={[s.input, { marginTop: 6 }]} placeholder="Diet focus (edit or use presets above)" placeholderTextColor={Colors.ink3}
                value={phase.dietFocus} onChangeText={t => updatePhase(i, 'dietFocus', t)} />

              {/* B9: Exercise focus with presets */}
              <SectionLabel text="EXERCISE FOCUS" />
              <PresetChips presets={EXERCISE_FOCUS_PRESETS} value={phase.exerciseFocus || ''} onChange={v => updatePhase(i, 'exerciseFocus', v)} />
              <TextInput style={[s.input, { marginTop: 6 }]} placeholder="Exercise focus (edit or use presets above)" placeholderTextColor={Colors.ink3}
                value={phase.exerciseFocus} onChangeText={t => updatePhase(i, 'exerciseFocus', t)} />

              <View style={[s.macroRow, { marginTop: 8 }]}>
                <View style={s.macroCol}>
                  <Stepper value={phase.expectedDurationWeeks} onChange={v => updatePhase(i, 'expectedDurationWeeks', v)} step={1} unit="weeks" min={1} max={52} />
                </View>
              </View>
              <TextInput style={[s.input, { marginTop: 8 }]} placeholder="Advancement criteria" placeholderTextColor={Colors.ink3}
                value={phase.advancementCriteria} onChangeText={t => updatePhase(i, 'advancementCriteria', t)} />
            </View>
          ))}
          {phases.length < 4 && (
            <TouchableOpacity style={s.addBtn} onPress={() => setPhases([...phases, { ...EMPTY_PHASE, name: `Phase ${phases.length + 1}` }])}>
              <Text style={s.addBtnText}>+ Add Phase</Text>
            </TouchableOpacity>
          )}

          {/* ── B11: Medications (structured) ── */}
          <SectionCap title="Current medications" />
          {medications.map((med: any, i: number) => (
            <View key={i} style={s.medCard}>
              {/* Row 1: Name + remove */}
              <View style={s.medRow1}>
                <TextInput style={[s.repeatInput, { flex: 1 }]} placeholder="Medication name" placeholderTextColor={Colors.ink3}
                  value={med.name || ''} onChangeText={t => updateMed(i, 'name', t)} />
                <TouchableOpacity style={s.repeatRemove} onPress={() => setMedications(medications.filter((_, j) => j !== i))}>
                  <Text style={s.repeatRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
              {/* Row 2: Dose value + unit + freq count + period + timing */}
              <View style={s.medRow2}>
                <TextInput style={[s.repeatInput, { width: 60 }]} placeholder="Dose" placeholderTextColor={Colors.ink3}
                  value={med.doseValue || ''} onChangeText={t => updateMed(i, 'doseValue', t)} keyboardType="numeric" />
                <ChipPicker small options={DOSE_UNITS.map(u => ({ label: u, value: u }))}
                  value={med.doseUnit || 'mg'} onChange={v => updateMed(i, 'doseUnit', v)} />
              </View>
              <View style={s.medRow2}>
                <TextInput style={[s.repeatInput, { width: 40 }]} placeholder="#" placeholderTextColor={Colors.ink3}
                  value={med.frequencyCount || ''} onChangeText={t => updateMed(i, 'frequencyCount', t)} keyboardType="numeric" />
                <ChipPicker small options={FREQ_PERIODS.map(p => ({ label: p, value: p }))}
                  value={med.frequencyPeriod || 'per day'} onChange={v => updateMed(i, 'frequencyPeriod', v)} />
              </View>
              <TextInput style={[s.repeatInput, { marginTop: 4 }]} placeholder="Timing (e.g. with meals)" placeholderTextColor={Colors.ink3}
                value={med.timing || ''} onChangeText={t => updateMed(i, 'timing', t)} />
              {/* Composed summary */}
              {med.name && (
                <Text style={s.medSummary}>
                  {med.name} {med.doseValue || ''} {med.doseUnit || ''} — {med.frequencyCount || ''}x {med.frequencyPeriod || ''} — {med.timing || ''}
                </Text>
              )}
            </View>
          ))}
          <TouchableOpacity style={s.addBtn} onPress={() => setMedications([...medications, { name: '', doseValue: '', doseUnit: 'mg', frequencyCount: '', frequencyPeriod: 'per day', timing: '' }])}>
            <Text style={s.addBtnText}>+ Add medication</Text>
          </TouchableOpacity>

          {/* ── B12: Supplements (with frequency) ── */}
          <SectionCap title="Supplements" />
          {supplements.map((sup: any, i: number) => (
            <View key={i} style={s.medCard}>
              {/* Row 1: Name + dose + remove */}
              <View style={s.medRow1}>
                <TextInput style={[s.repeatInput, { flex: 2 }]} placeholder="Name" placeholderTextColor={Colors.ink3}
                  value={sup.name || ''} onChangeText={t => updateSupp(i, 'name', t)} />
                <TextInput style={[s.repeatInput, { flex: 1 }]} placeholder="Dose" placeholderTextColor={Colors.ink3}
                  value={sup.dose || ''} onChangeText={t => updateSupp(i, 'dose', t)} />
                <TouchableOpacity style={s.repeatRemove} onPress={() => setSupplements(supplements.filter((_, j) => j !== i))}>
                  <Text style={s.repeatRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
              {/* Row 2: Timing + frequency */}
              <View style={s.medRow2}>
                <TextInput style={[s.repeatInput, { flex: 1 }]} placeholder="Timing" placeholderTextColor={Colors.ink3}
                  value={sup.timing || ''} onChangeText={t => updateSupp(i, 'timing', t)} />
                <TextInput style={[s.repeatInput, { width: 40 }]} placeholder="#" placeholderTextColor={Colors.ink3}
                  value={sup.frequencyCount || ''} onChangeText={t => updateSupp(i, 'frequencyCount', t)} keyboardType="numeric" />
                <ChipPicker small options={SUPP_FREQ_PERIODS.map(p => ({ label: p, value: p }))}
                  value={sup.frequencyPeriod || 'per day'} onChange={v => updateSupp(i, 'frequencyPeriod', v)} />
              </View>
              {/* Row 3: Reason */}
              <TextInput style={[s.repeatInput, { marginTop: 4 }]} placeholder="Reason for patient" placeholderTextColor={Colors.ink3}
                value={sup.reason || ''} onChangeText={t => updateSupp(i, 'reason', t)} />
            </View>
          ))}
          <TouchableOpacity style={s.addBtn} onPress={() => setSupplements([...supplements, { name: '', dose: '', timing: '', reason: '', frequencyCount: '', frequencyPeriod: 'per day' }])}>
            <Text style={s.addBtnText}>+ Add supplement</Text>
          </TouchableOpacity>

          {/* Suggested supplements */}
          {suggestedSupps.length > 0 && (
            <View style={s.suggestedSection}>
              <Text style={s.suggestedTitle}>Suggested for {(patient.primary_condition || '').replace(/_/g, ' ')}</Text>
              {suggestedSupps.slice(0, 6).map(supp => {
                const alreadyAdded = supplements.some((sl: any) => sl.name === supp.name);
                return (
                  <TouchableOpacity key={supp.name} style={[s.suggestedRow, alreadyAdded && s.suggestedRowAdded]}
                    onPress={() => addSuggestedSupplement(supp)} disabled={alreadyAdded} activeOpacity={0.7}>
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

          {/* ── B13: Doctor Notes (no change) ── */}
          <SectionCap title="Doctor notes" />
          <TextInput
            style={[s.input, s.textArea, { minHeight: 100 }]}
            placeholder="Treatment philosophy, special considerations, goals..."
            placeholderTextColor={Colors.ink3}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Save */}
          <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator color={Colors.deep} />
            ) : (
              <Text style={s.saveBtnText}>{existingPlan ? 'Update Treatment Plan' : 'Create Treatment Plan'} →</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  backText: { fontFamily: Typography.sans, fontSize: 17, color: Colors.teal },
  headerTitle: { fontFamily: Typography.display, fontSize: 22, color: Colors.ink },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingTop: Spacing.md },
  label: { fontFamily: Typography.mono, fontSize: 11, letterSpacing: 2, color: Colors.ink2, marginBottom: 6, marginTop: Spacing.md },
  input: { backgroundColor: Colors.card2, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border2, padding: 12, fontFamily: Typography.sans, fontSize: 16, color: Colors.ink },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  // Patient card
  patientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, backgroundColor: 'rgba(27,107,84,0.12)', borderRadius: Radii.lg, marginBottom: Spacing.md },
  patAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  patAvatarText: { fontFamily: Typography.sansMed, fontSize: 18, color: Colors.deep, fontWeight: '600' },
  patName: { fontFamily: Typography.sansMed, fontSize: 18, color: Colors.ink },
  patMeta: { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2, marginTop: 2 },
  patStats: { alignItems: 'flex-end', gap: 2 },
  patStatVal: { fontFamily: Typography.mono, fontSize: 12, color: Colors.teal },
  // Suggestion banner
  suggestionBanner: { backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border, padding: 12, marginBottom: Spacing.md, alignItems: 'center' },
  suggestionTitle: { fontFamily: Typography.mono, fontSize: 11, letterSpacing: 1, color: Colors.ink3, marginBottom: 4 },
  suggestionText: { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.teal, marginBottom: 8 },
  acceptBtn: { backgroundColor: 'rgba(62,219,165,0.1)', borderRadius: Radii.sm, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 0.5, borderColor: Colors.teal },
  acceptBtnText: { fontFamily: Typography.mono, fontSize: 13, color: Colors.teal },
  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: Spacing.sm },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: Radii.md, backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2 },
  chipSmall: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: Radii.sm, backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2 },
  chipActive: { backgroundColor: Colors.em, borderColor: Colors.teal },
  chipText: { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2 },
  chipTextSmall: { fontFamily: Typography.sans, fontSize: 12, color: Colors.ink2 },
  chipTextActive: { color: Colors.spring },
  // Stepper
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperBtn: { width: 38, height: 38, borderRadius: Radii.md, backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: Typography.mono, fontSize: 20, color: Colors.teal },
  stepperInput: { flex: 1, backgroundColor: Colors.card2, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border2, padding: 10, fontFamily: Typography.mono, fontSize: 16, color: Colors.ink, textAlign: 'center' },
  stepperUnit: { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2, minWidth: 40 },
  // Macros
  macroSection: { paddingHorizontal: Spacing.sm },
  macroRow: { flexDirection: 'row', gap: Spacing.md },
  macroCol: { flex: 1 },
  macroCalcBar: { marginTop: 8, paddingVertical: 6, alignItems: 'center' },
  macroCalcText: { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink3 },
  // Frequency
  freqLabel: { fontFamily: Typography.mono, fontSize: 11, color: Colors.ink3, textAlign: 'center', marginBottom: 4 },
  freqSummary: { fontFamily: Typography.sansMed, fontSize: 15, color: Colors.teal, textAlign: 'center', marginTop: 6, marginBottom: 4 },
  // Phase card
  phaseCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md, marginBottom: 8 },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  phaseNumber: { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.teal },
  removeText: { fontFamily: Typography.mono, fontSize: 13, color: Colors.rose },
  // Medication / supplement cards
  medCard: { backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border, padding: 10, marginBottom: 6 },
  medRow1: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  medRow2: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  medSummary: { fontFamily: Typography.mono, fontSize: 12, color: Colors.ink3, marginTop: 4, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: Colors.border },
  // Repeatable
  repeatInput: { backgroundColor: Colors.card2, borderRadius: Radii.sm, borderWidth: 0.5, borderColor: Colors.border2, padding: 10, fontFamily: Typography.sans, fontSize: 14, color: Colors.ink },
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
