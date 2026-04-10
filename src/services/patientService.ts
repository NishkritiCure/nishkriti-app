// ── Patient Service ───────────────────────────────────────────────────────────
// All Supabase calls for the patient-facing app.
// Swap out the mock store calls for these in production.

import { supabase, getPatientId } from '../lib/supabase';
import type { DailyCheckIn, GeneratedPlan, ProgressEntry, TreatmentPlan } from '../types';

// ── PROFILE ──────────────────────────────────────────────────────────────────
export async function fetchMyProfile() {
  // Explicitly filter by current user's patient ID (don't rely on RLS alone)
  const patientId = await getPatientId();
  if (!patientId) return null;
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('*')
    .eq('id', patientId)
    .single();
  if (error) throw error;
  return data;
}

// ── CHECK-INS ─────────────────────────────────────────────────────────────────
export async function submitCheckIn(checkIn: DailyCheckIn) {
  const patientId = await getPatientId();
  if (!patientId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('daily_check_ins')
    .upsert({
      patient_id:          patientId,
      check_in_date:       checkIn.date,
      fbs_mg_dl:           checkIn.fbs,
      weight_kg:           checkIn.weight,
      waist_cm:            checkIn.waistCm,
      energy_level:        checkIn.energyLevel,
      symptoms:            checkIn.symptoms,
      adherence_yesterday: checkIn.adherenceYesterday,
      requests:            checkIn.requests as any,
      message_for_doctor:  checkIn.messageForDoctor,
    }, { onConflict: 'patient_id,check_in_date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCheckIns(days = 30) {
  const patientId = await getPatientId();
  if (!patientId) throw new Error('Not authenticated');

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('patient_id', patientId)
    .gte('check_in_date', since.toISOString().split('T')[0])
    .order('check_in_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTodayCheckIn() {
  const patientId = await getPatientId();
  if (!patientId) return null;
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('patient_id', patientId)
    .eq('check_in_date', today)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data;
}

// ── PLANS ─────────────────────────────────────────────────────────────────────
export async function savePlan(plan: GeneratedPlan) {
  const patientId = await getPatientId();
  if (!patientId) throw new Error('Not authenticated');

  // Column names must match database schema exactly
  const { data, error } = await (supabase
    .from('daily_plans')
    .upsert({
      patient_id:          patientId,
      plan_date:           plan.date,
      reasoning:           plan.reasoning,
      rules_fired:         plan.rulesFired as any,
      diet_type:           plan.dietType,
      calorie_target:      plan.calorieTarget,
      carbs_target_g:      plan.carbsTarget,
      protein_target_g:    plan.proteinTarget,
      fat_target_g:        plan.fatTarget,
      water_target_ml:     plan.waterTargetMl,
      meals:               plan.meals as any,
      workout:             plan.workout as any,
      supplements:         plan.supplements as any,
      doctor_flag_raised:  plan.doctorFlagRaised ?? false,
      doctor_flag_reason:  plan.doctorFlagReason,
    }, { onConflict: 'patient_id,plan_date' }) as any)
    .select()
    .single();

  if (error) throw error;

  // If flag raised, call database function to notify doctor
  if (plan.doctorFlagRaised && plan.doctorFlagReason && data?.id) {
    await supabase.rpc('flag_plan_for_doctor', {
      p_plan_id: data.id,
      p_reason: plan.doctorFlagReason,
    });
  }

  return data;
}

export async function fetchTodayPlan() {
  const patientId = await getPatientId();
  if (!patientId) return null;
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('patient_id', patientId)
    .eq('plan_date', today)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

// ── PROTOCOL (TREATMENT PLAN) ────────────────────────────────────────────────
export async function fetchMyProtocol(): Promise<TreatmentPlan | null> {
  const patientId = await getPatientId();
  if (!patientId) return null;

  // Cast as any — database.types.ts doesn't include migration 003 columns yet
  const { data, error } = await (supabase
    .from('protocols')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any);

  if (error?.code === 'PGRST116') return null; // not found
  if (error) return null;
  if (!data) return null;

  const d: any = data;
  return {
    id: d.id,
    patientId: d.patient_id,
    doctorId: d.doctor_id,
    condition: d.condition,
    isActive: d.is_active,
    dietType: d.diet_type,
    calorieTarget: d.calorie_target || 0,
    carbsTargetG: d.carbs_target_g || 0,
    proteinTargetG: d.protein_target_g || 0,
    fatTargetG: d.fat_target_g || 0,
    calorieDeficit: d.calorie_deficit || 350,
    exerciseType: d.exercise_type || 'mixed',
    exerciseDurationMin: d.exercise_duration_min || 45,
    exerciseIntensity: d.exercise_intensity || 'moderate',
    exerciseFrequency: d.exercise_frequency || '5x/week',
    exerciseNotes: d.exercise_notes || '',
    phases: d.phases || [],
    currentPhase: d.current_phase || 1,
    phaseName: d.phase_name || '',
    medications: d.medications || [],
    supplements: d.supplements || [],
    notes: d.notes || '',
    techniques: d.techniques || {},
    customRules: d.custom_rules || {},
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

// ── PROGRESS ──────────────────────────────────────────────────────────────────
export async function fetchProgress(days = 90) {
  const patientId = await getPatientId();
  if (!patientId) return [];

  const { data, error } = await supabase
    .rpc('get_patient_fbs_history', { p_patient_id: patientId, p_days: days });

  if (error) throw error;
  // FIX: rpc return type is not directly assignable — double-cast via unknown
  return (data ?? []) as unknown as ProgressEntry[];
}

export async function fetchProgressEntries(days = 90) {
  const patientId = await getPatientId();
  if (!patientId) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('patient_id', patientId)
    .gte('entry_date', since.toISOString().split('T')[0])
    .order('entry_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ── SUPPLEMENTS ───────────────────────────────────────────────────────────────
// FIX: supplement_logs uses supplement_id (FK to patient_supplements), not supplement_name.
// Look up the supplement_id from patient_supplements by name first.
export async function markSupplementTaken(supplementName: string, taken: boolean) {
  const patientId = await getPatientId();
  if (!patientId) return;
  const today = new Date().toISOString().split('T')[0];

  // FIX: Resolve supplement_id from patient_supplements by name
  const { data: supplement, error: lookupError } = await supabase
    .from('patient_supplements')
    .select('id')
    .eq('patient_id', patientId)
    .eq('name', supplementName)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (lookupError || !supplement) {
    // FIX: guarded with __DEV__ — supplement name is health data, should not appear in production logs
    if (__DEV__) console.warn(`[patientService] Supplement not found for patient — skipping log`);
    return;
  }

  const { error } = await supabase
    .from('supplement_logs')
    .upsert({
      patient_id:      patientId,
      supplement_id:   supplement.id,
      log_date:        today,
      taken,
    }, { onConflict: 'patient_id,supplement_id,log_date' });

  if (error) throw error;
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────
export async function sendMessageToDoctor(
  content: string,
  urgency: 'urgent' | 'question' | 'medication' | 'change',
  vitalsSnapshot?: Record<string, unknown>
) {
  const patientId = await getPatientId();
  if (!patientId) throw new Error('Not authenticated');

  // FIX: messages table requires `body` (not `content`) and `doctor_id`
  const { data: profile } = await supabase
    .from('patient_profiles')
    .select('assigned_doctor_id')
    .eq('id', patientId)
    .single();
  const doctorId = profile?.assigned_doctor_id;
  if (!doctorId) throw new Error('No assigned doctor found');

  const { error } = await supabase
    .from('messages')
    .insert({
      patient_id:       patientId,
      doctor_id:        doctorId,
      sender_role:      'patient',
      body:             content,
      urgency,
      vitals_snapshot:  (vitalsSnapshot ?? null) as any, // FIX: Record<string,unknown> not assignable to Json
    });

  if (error) throw error;
}
