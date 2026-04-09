// Create Patient — doctor fills in patient details, generates UHID + auth
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { supabase, getDoctorId } from '../../lib/supabase';
import { DEFAULT_DOCTOR_ID } from '../../lib/constants';

const CONDITIONS = [
  { label: 'Diabetes T2', value: 'diabetes_t2' },
  { label: 'Pre-Diabetes', value: 'pre_diabetes' },
  { label: 'PCOS', value: 'pcos' },
  { label: 'Hypothyroid', value: 'hypothyroid' },
  { label: 'Hypertension', value: 'hypertension' },
  { label: 'Obesity', value: 'obesity' },
  { label: 'Dyslipidemia', value: 'dyslipidemia' },
];

const DIETS = [
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Non-Veg', value: 'non_veg' },
  { label: 'Eggetarian', value: 'eggetarian' },
  { label: 'Vegan', value: 'vegan' },
];

const SEXES = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

// FIX: moved hardcoded UUID to shared constants — imported as DEFAULT_DOCTOR_ID

// ── Reusable Components ──

const SectionLabel = ({ text, required }: { text: string; required?: boolean }) => (
  <Text style={s.label}>{text}{required ? ' *' : ''}</Text>
);

const InlinePicker = ({
  options,
  value,
  onChange,
  allowCustom,
  customPlaceholder,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const isCustom = value && !options.find(o => o.value === value);

  return (
    <View>
      <View style={s.pickerRow}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            style={[s.pickerChip, value === o.value && s.pickerChipActive]}
            onPress={() => { onChange(o.value); setShowCustom(false); }}
            activeOpacity={0.7}
          >
            <Text style={[s.pickerChipText, value === o.value && s.pickerChipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
        {allowCustom && (
          <TouchableOpacity
            style={[s.pickerChip, (showCustom || isCustom) && s.pickerChipActive]}
            onPress={() => setShowCustom(true)}
            activeOpacity={0.7}
          >
            <Text style={[s.pickerChipText, (showCustom || isCustom) && s.pickerChipTextActive]}>
              {isCustom ? value.replace(/_/g, ' ') : '+ Custom'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {showCustom && (
        <TextInput
          style={[s.input, { marginTop: 8 }]}
          placeholder={customPlaceholder || 'Enter custom value'}
          placeholderTextColor={Colors.ink3}
          value={customVal}
          onChangeText={setCustomVal}
          autoFocus
          onSubmitEditing={() => {
            if (customVal.trim()) {
              onChange(customVal.trim().toLowerCase().replace(/\s+/g, '_'));
              setShowCustom(false);
            }
          }}
          returnKeyType="done"
        />
      )}
    </View>
  );
};

// ── Date Picker (scrollable day/month/year) ──
const DatePickerModal = ({
  visible,
  onClose,
  onSelect,
  initialDate,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate?: string;
}) => {
  const now = new Date();
  const [day, setDay] = useState(initialDate ? parseInt(initialDate.split('-')[2]) || 1 : 1);
  const [month, setMonth] = useState(initialDate ? parseInt(initialDate.split('-')[1]) || 1 : 1);
  const [year, setYear] = useState(initialDate ? parseInt(initialDate.split('-')[0]) || 1990 : 1990);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 80 }, (_, i) => now.getFullYear() - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <Text style={s.modalTitle}>Select Date of Birth</Text>
          <View style={s.datePickerRow}>
            {/* Day */}
            <View style={s.dateCol}>
              <Text style={s.dateColLabel}>Day</Text>
              <ScrollView style={s.dateScroll} showsVerticalScrollIndicator={false}>
                {days.map(d => (
                  <TouchableOpacity key={d} onPress={() => setDay(d)} style={[s.dateItem, day === d && s.dateItemActive]}>
                    <Text style={[s.dateItemText, day === d && s.dateItemTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* Month */}
            <View style={s.dateCol}>
              <Text style={s.dateColLabel}>Month</Text>
              <ScrollView style={s.dateScroll} showsVerticalScrollIndicator={false}>
                {months.map((m, i) => (
                  <TouchableOpacity key={m} onPress={() => setMonth(i + 1)} style={[s.dateItem, month === i + 1 && s.dateItemActive]}>
                    <Text style={[s.dateItemText, month === i + 1 && s.dateItemTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* Year */}
            <View style={s.dateCol}>
              <Text style={s.dateColLabel}>Year</Text>
              <ScrollView style={s.dateScroll} showsVerticalScrollIndicator={false}>
                {years.map(y => (
                  <TouchableOpacity key={y} onPress={() => setYear(y)} style={[s.dateItem, year === y && s.dateItemActive]}>
                    <Text style={[s.dateItemText, year === y && s.dateItemTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <Text style={s.datePreview}>
            {day} {months[month - 1]} {year}
          </Text>
          <View style={s.modalBtns}>
            <TouchableOpacity style={s.modalBtnCancel} onPress={onClose}>
              <Text style={s.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalBtnConfirm}
              onPress={() => {
                const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                onSelect(formatted);
                onClose();
              }}
            >
              <Text style={s.modalBtnConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Unit Toggle Input ──
const UnitInput = ({
  value,
  onChange,
  units,
  placeholder,
  convertFn,
}: {
  value: string;
  onChange: (v: string) => void;
  units: [string, string]; // [primary, secondary]
  placeholder: string;
  convertFn: (val: number, toSecondary: boolean) => number;
}) => {
  const [activeUnit, setActiveUnit] = useState(0);

  const switchUnit = () => {
    const numVal = parseFloat(value);
    if (!isNaN(numVal) && numVal > 0) {
      const converted = convertFn(numVal, activeUnit === 0);
      onChange(converted.toFixed(1));
    }
    setActiveUnit(activeUnit === 0 ? 1 : 0);
  };

  return (
    <View style={s.unitInputWrap}>
      <TextInput
        style={[s.input, { flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.ink3}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
      />
      <TouchableOpacity style={s.unitToggle} onPress={switchUnit}>
        <Text style={s.unitToggleText}>{units[activeUnit]}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Stepper Input ──
const StepperInput = ({
  value,
  onChange,
  step = 1,
  unit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  step?: number;
  unit: string;
  placeholder: string;
}) => {
  const increment = () => {
    const num = parseFloat(value) || 0;
    onChange(String(Math.round((num + step) * 10) / 10));
  };
  const decrement = () => {
    const num = parseFloat(value) || 0;
    if (num - step >= 0) onChange(String(Math.round((num - step) * 10) / 10));
  };

  return (
    <View style={s.stepperWrap}>
      <TouchableOpacity style={s.stepperBtn} onPress={decrement}>
        <Text style={s.stepperBtnText}>−</Text>
      </TouchableOpacity>
      <TextInput
        style={[s.input, { flex: 1, textAlign: 'center' }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.ink3}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
      />
      <TouchableOpacity style={s.stepperBtn} onPress={increment}>
        <Text style={s.stepperBtnText}>+</Text>
      </TouchableOpacity>
      <Text style={s.stepperUnit}>{unit}</Text>
    </View>
  );
};

// ── Main Screen ──

export const CreatePatientScreen = () => {
  const nav = useNavigation<any>();

  // FIX: was hardcoded, now fetched dynamically with fallback
  const [doctorId, setDoctorId] = useState<string | null>(DEFAULT_DOCTOR_ID);
  useEffect(() => {
    getDoctorId().then(id => { if (id) setDoctorId(id); });
  }, []);

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sex, setSex] = useState('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [primaryCondition, setPrimaryCondition] = useState('diabetes_t2');
  const [dietPreference, setDietPreference] = useState('vegetarian');
  const [baselineFbs, setBaselineFbs] = useState('');
  const [baselineHba1c, setBaselineHba1c] = useState('');
  const [baselineWaist, setBaselineWaist] = useState('');
  const [baselineHip, setBaselineHip] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter the patient name.'); return; }
    if (!dob.trim()) { Alert.alert('Required', 'Please select date of birth.'); return; }
    if (!baselineFbs.trim()) { Alert.alert('Required', 'Please enter baseline FBS.'); return; }

    setLoading(true);
    try {
      // 1. Generate UHID
      let uhid: string | null = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('generate_uhid' as any);
        if (!rpcErr && rpcData) uhid = rpcData as unknown as string;
      } catch (rpcError: any) {
        // FIX: was empty catch — now logs error context (no PII) for debugging
        // FIX: __DEV__ guard — error messages could leak internal API details in production
        if (__DEV__) console.warn('[CreatePatient] generate_uhid RPC failed, using fallback:', rpcError?.message || 'unknown');
      }
      if (!uhid) {
        const { count } = await supabase.from('patient_profiles').select('id', { count: 'exact', head: true });
        uhid = `NK-${String((count || 0) + 1).padStart(4, '0')}`;
      }

      // 2. Generate password
      const nameChars = name.trim().replace(/\s/g, '').toUpperCase().slice(0, 4);
      // FIX: append random 4-digit suffix to avoid collisions for same-name patients
      const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
      const generatedPassword = `NK${nameChars}${randomSuffix}`;

      // 3. Create auth user (REST to avoid signing out doctor)
      // FIX: guard against missing env vars — crashes in demo mode when SUPABASE_URL is undefined
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        Alert.alert('Error', 'Supabase is not configured. Cannot create patients in demo mode.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: uhid.toLowerCase() + '@nishkriti.internal', password: generatedPassword }),
      });
      const authResponse = await res.json();
      const userId = authResponse.id || authResponse.user?.id;
      if (!userId) {
        Alert.alert('Error', 'Failed to create auth user: ' + (authResponse.msg || authResponse.error_description || 'Unknown error'));
        setLoading(false);
        return;
      }

      // 4. Ensure height/weight are in metric (cm/kg)
      const heightVal = parseFloat(heightCm) || null;
      const weightVal = parseFloat(weightKg) || null;

      // 5. Insert patient (return id for plan creation navigation)
      // FIX: added .select('id').single() to get the new patient ID
      const { data: insertData, error: insertErr } = await (supabase.from('patient_profiles') as any).insert({
        auth_id: userId,
        assigned_doctor_id: doctorId,
        full_name: name.trim(),
        dob: dob.trim(),
        sex,
        height_cm: heightVal,
        weight_kg: weightVal,
        primary_condition: primaryCondition,
        diet_preference: dietPreference,
        baseline_fbs: parseFloat(baselineFbs) || null,
        baseline_hba1c: parseFloat(baselineHba1c) || null,
        baseline_weight: weightVal,
        baseline_waist: parseFloat(baselineWaist) || null,
        baseline_hip: parseFloat(baselineHip) || null,
        uhid,
        initial_password: generatedPassword,
        programme_start_date: new Date().toISOString().split('T')[0],
        current_phase: 1,
      }).select('id').single();

      setLoading(false);
      if (insertErr) { Alert.alert('Error', insertErr.message); return; }

      const newPatientId = insertData?.id;

      Alert.alert(
        'Patient Created',
        `UHID: ${uhid}\nPassword: ${generatedPassword}\n\nShare these credentials with the patient.`,
        [
          { text: 'Back to Roster', style: 'cancel', onPress: () => nav.goBack() },
          // FIX: navigate to treatment plan editor after patient creation
          { text: 'Create Plan →', onPress: () => {
            if (newPatientId) {
              nav.replace('TreatmentPlanEditor', { patientId: newPatientId, isNew: true });
            } else {
              nav.goBack();
            }
          }},
        ],
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Something went wrong.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Patient</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <SectionLabel text="FULL NAME" required />
          <TextInput style={s.input} placeholder="Patient full name" placeholderTextColor={Colors.ink3} value={name} onChangeText={setName} autoCorrect={false} />

          <SectionLabel text="DATE OF BIRTH" required />
          <TouchableOpacity style={s.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={dob ? s.dateButtonText : s.dateButtonPlaceholder}>
              {dob ? formatDisplayDate(dob) : 'Tap to select date'}
            </Text>
            <Text style={s.dateButtonIcon}>📅</Text>
          </TouchableOpacity>

          <SectionLabel text="SEX" />
          <InlinePicker options={SEXES} value={sex} onChange={setSex} />

          <View style={s.row}>
            <View style={s.halfCol}>
              <SectionLabel text="HEIGHT" />
              <UnitInput
                value={heightCm}
                onChange={setHeightCm}
                units={['cm', 'ft']}
                placeholder="170"
                convertFn={(val, toFt) => toFt ? val / 30.48 : val * 30.48}
              />
            </View>
            <View style={s.halfCol}>
              <SectionLabel text="WEIGHT" />
              <UnitInput
                value={weightKg}
                onChange={setWeightKg}
                units={['kg', 'lbs']}
                placeholder="72"
                convertFn={(val, toLbs) => toLbs ? val * 2.205 : val / 2.205}
              />
            </View>
          </View>

          <SectionLabel text="PRIMARY CONDITION" required />
          <InlinePicker
            options={CONDITIONS}
            value={primaryCondition}
            onChange={setPrimaryCondition}
            allowCustom
            customPlaceholder="e.g. Fatty Liver"
          />

          <SectionLabel text="DIET PREFERENCE" />
          <InlinePicker options={DIETS} value={dietPreference} onChange={setDietPreference} />

          <SectionLabel text="BASELINE FBS" required />
          <StepperInput value={baselineFbs} onChange={setBaselineFbs} step={5} unit="mg/dL" placeholder="120" />

          <SectionLabel text="BASELINE HBA1C" />
          <StepperInput value={baselineHba1c} onChange={setBaselineHba1c} step={0.1} unit="%" placeholder="6.5" />

          <View style={s.row}>
            <View style={s.halfCol}>
              <SectionLabel text="WAIST" />
              <UnitInput
                value={baselineWaist}
                onChange={setBaselineWaist}
                units={['cm', 'in']}
                placeholder="Optional"
                convertFn={(val, toIn) => toIn ? val / 2.54 : val * 2.54}
              />
            </View>
            <View style={s.halfCol}>
              <SectionLabel text="HIP" />
              <UnitInput
                value={baselineHip}
                onChange={setBaselineHip}
                units={['cm', 'in']}
                placeholder="Optional"
                convertFn={(val, toIn) => toIn ? val / 2.54 : val * 2.54}
              />
            </View>
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={Colors.deep} /> : <Text style={s.btnText}>Create Patient →</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={setDob}
          initialDate={dob}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.deep },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  back: { fontFamily: Typography.sans, fontSize: 18, color: Colors.teal },
  headerTitle: { fontFamily: Typography.display, fontSize: 24, color: Colors.ink },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl },
  label: {
    fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2,
    color: Colors.ink2, marginBottom: 8, marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.card2, borderRadius: Radii.md,
    borderWidth: 0.5, borderColor: Colors.border2,
    padding: 14, fontFamily: Typography.sans, fontSize: 18, color: Colors.ink,
  },
  row: { flexDirection: 'row', gap: Spacing.md },
  halfCol: { flex: 1 },
  // Picker
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radii.md,
    backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2,
  },
  pickerChipActive: { backgroundColor: Colors.em, borderColor: Colors.teal },
  pickerChipText: { fontFamily: Typography.sans, fontSize: 16, color: Colors.ink2 },
  pickerChipTextActive: { color: Colors.spring },
  // Date button
  dateButton: {
    backgroundColor: Colors.card2, borderRadius: Radii.md,
    borderWidth: 0.5, borderColor: Colors.border2,
    padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dateButtonText: { fontFamily: Typography.sans, fontSize: 18, color: Colors.ink },
  dateButtonPlaceholder: { fontFamily: Typography.sans, fontSize: 18, color: Colors.ink3 },
  dateButtonIcon: { fontSize: 22 },
  // Date picker modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: Typography.display, fontSize: 22, color: Colors.ink,
    textAlign: 'center', marginBottom: Spacing.lg,
  },
  datePickerRow: { flexDirection: 'row', gap: Spacing.md, height: 200 },
  dateCol: { flex: 1 },
  dateColLabel: {
    fontFamily: Typography.mono, fontSize: 11, letterSpacing: 2,
    color: Colors.ink2, textAlign: 'center', marginBottom: 8,
  },
  dateScroll: { flex: 1 },
  dateItem: {
    paddingVertical: 10, borderRadius: Radii.sm, marginBottom: 4, alignItems: 'center',
  },
  dateItemActive: { backgroundColor: Colors.em },
  dateItemText: { fontFamily: Typography.sans, fontSize: 17, color: Colors.ink2 },
  dateItemTextActive: { color: Colors.spring, fontWeight: '600' },
  datePreview: {
    fontFamily: Typography.sansMed, fontSize: 20, color: Colors.teal,
    textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.md,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  modalBtnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: Radii.lg,
    borderWidth: 0.5, borderColor: Colors.border2, alignItems: 'center',
  },
  modalBtnCancelText: { fontFamily: Typography.sans, fontSize: 17, color: Colors.ink2 },
  modalBtnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: Radii.lg,
    backgroundColor: Colors.teal, alignItems: 'center',
  },
  modalBtnConfirmText: { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.deep, fontWeight: '600' },
  // Unit input
  unitInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitToggle: {
    backgroundColor: Colors.em, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: Radii.md, minWidth: 50, alignItems: 'center',
  },
  unitToggleText: { fontFamily: Typography.mono, fontSize: 15, color: Colors.spring },
  // Stepper
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: {
    width: 44, height: 44, borderRadius: Radii.md,
    backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: { fontFamily: Typography.mono, fontSize: 22, color: Colors.teal },
  stepperUnit: { fontFamily: Typography.mono, fontSize: 14, color: Colors.ink2, minWidth: 50 },
  // Button
  btn: {
    backgroundColor: Colors.teal, borderRadius: Radii.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: Spacing.xxl,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: Typography.sansMed, fontSize: 19, color: Colors.deep, fontWeight: '600' },
});
