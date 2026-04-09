// ── Doctor Service ────────────────────────────────────────────────────────────

import { supabase, getDoctorId } from '../lib/supabase';
import type { TreatmentPlan } from '../types';

export async function fetchDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('get_doctor_dashboard', { doctor_auth_id: user.id });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPatientProfile(patientId: string) {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select(`
      *,
      daily_check_ins(check_in_date, fbs_mg_dl, weight_kg, energy_level)
        order(daily_check_ins.check_in_date.desc),
      daily_plans(plan_date, reasoning, rules_fired, diet_type, doctor_flag_raised, doctor_flag_reason, flag_status)
        order(daily_plans.plan_date.desc),
      progress_entries(entry_date, weight_kg, waist_cm, fbs_mg_dl)
        order(progress_entries.entry_date.asc),
      patient_supplements(supplement_name, dose, timing, with_food, patient_reason, is_active)
    `)
    .eq('id', patientId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPatientFBSHistory(patientId: string, days = 30) {
  const { data, error } = await supabase
    .rpc('get_patient_fbs_history', { p_patient_id: patientId, p_days: days });

  if (error) throw error;
  return data ?? [];
}

export async function approvePlan(planId: string, note?: string) {
  // FIX: 'doctor_approve_plan' RPC not in generated types — cast as any
  const { error } = await (supabase.rpc as any)('doctor_approve_plan', {
      p_plan_id: planId,
      p_doctor_note: note,
    });
  if (error) throw error;
}

export async function overridePlan(
  patientId: string,
  planId: string,
  overrides: {
    dietType?: string;
    carbsTarget?: number;
    proteinTarget?: number;
    note?: string;
  }
) {
  const { error } = await supabase
    .from('daily_plans')
    .update({
      diet_type:      overrides.dietType,
      carbs_target:   overrides.carbsTarget,
      protein_target: overrides.proteinTarget,
      doctor_note:    overrides.note,
      doctor_approved: true,
      flag_status:    'resolved',
      doctor_reviewed_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (error) throw error;
}

export async function advancePatientPhase(patientId: string, newPhase: number) {
  const doctorId = await getDoctorId();
  if (!doctorId) throw new Error('Not authenticated as doctor');

  const { error } = await supabase
    .from('patient_profiles')
    .update({ current_phase: newPhase })
    .eq('id', patientId)
    .eq('assigned_doctor_id', doctorId); // RLS double-check

  if (error) throw error;
}

export async function sendMessageToPatient(
  patientId: string,
  content: string
) {
  // FIX: messages table requires `body` (not `content`) and `doctor_id`
  const doctorId = await getDoctorId();
  if (!doctorId) throw new Error('Not authenticated as doctor');

  const { error } = await supabase
    .from('messages')
    .insert({
      patient_id:   patientId,
      doctor_id:    doctorId,
      sender_role:  'doctor',
      body:         content,
      urgency:      'update',
    });
  if (error) throw error;
}

export async function fetchUnreadMessages(patientId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('patient_id', patientId)
    .eq('read_by_doctor', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── Treatment Plan (Protocol) CRUD ───────────────────────────────────────────

// Helper to map Supabase row → TreatmentPlan shape
function mapProtocolRow(row: any): TreatmentPlan {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    condition: row.condition,
    isActive: row.is_active,
    dietType: row.diet_type,
    calorieTarget: row.calorie_target || 0,
    carbsTargetG: row.carbs_target_g || 0,
    proteinTargetG: row.protein_target_g || 0,
    fatTargetG: row.fat_target_g || 0,
    calorieDeficit: row.calorie_deficit || 350,
    exerciseType: row.exercise_type || 'mixed',
    exerciseDurationMin: row.exercise_duration_min || 45,
    exerciseIntensity: row.exercise_intensity || 'moderate',
    exerciseFrequency: row.exercise_frequency || '5x/week',
    exerciseNotes: row.exercise_notes || '',
    phases: row.phases || [],
    currentPhase: row.current_phase || 1,
    phaseName: row.phase_name || '',
    medications: row.medications || [],
    supplements: row.supplements || [],
    notes: row.notes || '',
    techniques: row.techniques || {},
    customRules: row.custom_rules || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchActiveProtocol(patientId: string): Promise<TreatmentPlan | null> {
  // Cast as any — database.types.ts doesn't include migration 003 columns yet
  const { data, error } = await (supabase
    .from('protocols')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any);

  if (error || !data) return null;
  return mapProtocolRow(data);
}

export async function createProtocol(patientId: string, plan: Partial<TreatmentPlan>): Promise<string> {
  const doctorId = await getDoctorId();
  if (!doctorId) throw new Error('Not authenticated as doctor');

  // Deactivate any existing active protocol for this patient
  await supabase
    .from('protocols')
    .update({ is_active: false } as any)
    .eq('patient_id', patientId)
    .eq('is_active', true);

  const { data, error } = await (supabase.from('protocols') as any).insert({
    patient_id: patientId,
    doctor_id: doctorId,
    condition: plan.condition || 'diabetes_t2',
    is_active: true,
    diet_type: plan.dietType || 'low_carb',
    calorie_target: plan.calorieTarget,
    carbs_target_g: plan.carbsTargetG,
    protein_target_g: plan.proteinTargetG,
    fat_target_g: plan.fatTargetG,
    calorie_deficit: plan.calorieDeficit || 350,
    exercise_type: plan.exerciseType,
    exercise_duration_min: plan.exerciseDurationMin,
    exercise_intensity: plan.exerciseIntensity,
    exercise_frequency: plan.exerciseFrequency,
    exercise_notes: plan.exerciseNotes,
    phases: plan.phases || [],
    current_phase: plan.currentPhase || 1,
    phase_name: plan.phaseName,
    medications: plan.medications || [],
    supplements: plan.supplements || [],
    notes: plan.notes,
    techniques: plan.techniques || {},
    custom_rules: plan.customRules || {},
  }).select('id').single();

  if (error) throw error;
  return data.id;
}

export async function updateProtocol(protocolId: string, updates: Partial<TreatmentPlan>): Promise<void> {
  const mapped: any = {};
  if (updates.dietType !== undefined) mapped.diet_type = updates.dietType;
  if (updates.calorieTarget !== undefined) mapped.calorie_target = updates.calorieTarget;
  if (updates.carbsTargetG !== undefined) mapped.carbs_target_g = updates.carbsTargetG;
  if (updates.proteinTargetG !== undefined) mapped.protein_target_g = updates.proteinTargetG;
  if (updates.fatTargetG !== undefined) mapped.fat_target_g = updates.fatTargetG;
  if (updates.calorieDeficit !== undefined) mapped.calorie_deficit = updates.calorieDeficit;
  if (updates.exerciseType !== undefined) mapped.exercise_type = updates.exerciseType;
  if (updates.exerciseDurationMin !== undefined) mapped.exercise_duration_min = updates.exerciseDurationMin;
  if (updates.exerciseIntensity !== undefined) mapped.exercise_intensity = updates.exerciseIntensity;
  if (updates.exerciseFrequency !== undefined) mapped.exercise_frequency = updates.exerciseFrequency;
  if (updates.exerciseNotes !== undefined) mapped.exercise_notes = updates.exerciseNotes;
  if (updates.phases !== undefined) mapped.phases = updates.phases;
  if (updates.currentPhase !== undefined) mapped.current_phase = updates.currentPhase;
  if (updates.phaseName !== undefined) mapped.phase_name = updates.phaseName;
  if (updates.medications !== undefined) mapped.medications = updates.medications;
  if (updates.supplements !== undefined) mapped.supplements = updates.supplements;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  if (updates.techniques !== undefined) mapped.techniques = updates.techniques;
  if (updates.condition !== undefined) mapped.condition = updates.condition;

  // Cast as any — database.types.ts doesn't include migration 003 columns yet
  const { error } = await (supabase
    .from('protocols')
    .update(mapped) as any)
    .eq('id', protocolId);

  if (error) throw error;
}
