
// TODO: OFFLINE SUPPORT — future requirement. See previous commit for details.

import { create } from "zustand";
import type { Patient, DailyCheckIn, GeneratedPlan, PatientProfile } from "../types";
import { generateDailyPlan } from "../engine/adaptiveEngine";
import { todayStr } from "../utils";
import { fetchMyProfile, fetchCheckIns, fetchTodayPlan, fetchMyProtocol, savePlan } from "../services/patientService";

// ── Empty initial state (no demo data) ──────────────────────────
const EMPTY_PATIENT: Patient = {
  profile: {
    id: '', name: '', dob: '', sex: 'male', heightCm: 0, weightKg: 0,
    conditions: [], primaryCondition: 'diabetes_t2',
    medications: [], dietPreference: 'non_veg', allergies: [],
    dislikedFoods: [], cuisinePreference: [], cookingSetup: 'home',
    activityLevel: 'sedentary', workoutEquipment: [], workoutLocation: ['home'],
    availableMinutes: 45, preferredWorkoutTime: 'morning', goals: [], injuries: [],
    programmeStartDate: new Date().toISOString().split('T')[0],
    currentPhase: 1, assignedDietType: 'low_carb',
    baselineFbs: 0, baselineWeight: 0, baselineWaist: 0, baselineHip: 0,
  },
  checkIns: [], plans: [], progress: [], supplements: [], unreadMessages: 0,
};

// ── STORE INTERFACE ──────────────────────────────────────────────
interface AppState {
  // Auth
  mode: "patient" | "doctor" | null;
  setMode: (m: "patient" | "doctor") => void;
  // Patient state
  patient: Patient;
  updateCheckIn: (ci: Partial<DailyCheckIn>) => void;
  submitCheckIn: (ci: DailyCheckIn) => void;
  todayPlan: GeneratedPlan | null;
  generatePlan: () => void;
  // Doctor state
  doctorPatients: Patient[];
  selectedPatient: Patient | null;
  selectPatient: (id: string) => void;
  approvePatientPlan: (patientId: string) => void;
  overrideDietType: (patientId: string, dietType: string) => void;
  // Supplements
  markSupplementTaken: (name: string, taken: boolean) => void;
  // Progress
  refreshProgress: () => void;
  // Supabase integration
  loadPatientFromSupabase: () => Promise<void>;
  patientLoaded: boolean;
  patientLoadError: string | null;
  // UI state
  splashDone: boolean;
  setSplashDone: () => void;
  setPatientProfile: (profile: any) => void;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: null,
  setMode: (mode) => set({ mode }),
  splashDone: false,
  patientLoaded: false,
  patientLoadError: null,
  isNewUser: false,
  setIsNewUser: (isNewUser) => set({ isNewUser }),
  setSplashDone: () => set({ splashDone: true }),
  setPatientProfile: (profile) => set(state => ({
    patient: {
      ...state.patient,
      profile: { ...state.patient.profile, ...profile },
      checkIns: [],
      plans: [],
      progress: [{ date: profile.programmeStartDate || new Date().toISOString().split('T')[0], weight: profile.baselineWeight || profile.weightKg, fbs: profile.baselineFbs || 0 }],
    }
  })),

  // Load real patient data from Supabase
  loadPatientFromSupabase: async () => {
    // 15-second timeout so app doesn't hang forever
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), ms))]);
    try {
      const profile = await withTimeout(fetchMyProfile(), 15000);
      if (!profile) {
        set({ patientLoaded: true, patientLoadError: 'No patient profile found' });
        return;
      }

      const checkInsRaw = await fetchCheckIns(30);
      const todayPlanRaw = await fetchTodayPlan();

      // Map Supabase columns → store shape
      const mappedProfile: any = {
        id: profile.id,
        name: profile.full_name,
        dob: profile.dob,
        sex: profile.sex,
        heightCm: profile.height_cm,
        weightKg: profile.weight_kg,
        primaryCondition: profile.primary_condition,
        conditions: profile.conditions || [profile.primary_condition],
        medications: profile.medications || [],
        dietPreference: profile.diet_preference || 'non_veg',
        allergies: profile.allergies || [],
        dislikedFoods: profile.disliked_foods || [],
        cuisinePreference: profile.cuisine_preference || [],
        cookingSetup: profile.cooking_setup || 'home',
        activityLevel: profile.activity_level || 'sedentary',
        workoutEquipment: profile.workout_equipment || [],
        workoutLocation: profile.workout_location || ['home'],
        availableMinutes: profile.available_minutes || 45,
        preferredWorkoutTime: profile.preferred_workout_time || 'morning',
        goals: profile.goals || [],
        injuries: profile.injuries || [],
        programmeStartDate: profile.programme_start_date || new Date().toISOString().split('T')[0],
        currentPhase: profile.current_phase || 1,
        assignedDietType: profile.assigned_diet_type || 'low_carb',
        baselineFbs: profile.baseline_fbs || 0,
        baselineHba1c: profile.baseline_hba1c,
        baselineWeight: profile.baseline_weight || profile.weight_kg,
        baselineWaist: profile.baseline_waist || 0,
        baselineHip: profile.baseline_hip || 0,
      };

      const mappedCheckIns = (checkInsRaw || []).map((ci: any) => ({
        id: ci.id,
        patientId: ci.patient_id,
        date: ci.check_in_date,
        fbs: ci.fbs_mg_dl || 0,
        weight: ci.weight_kg || 0,
        waistCm: ci.waist_cm,
        hipCm: ci.hip_cm,
        energyLevel: ci.energy_level || 3,
        sleepHours: ci.sleep_hours,
        symptoms: ci.symptoms || [],
        adherenceYesterday: ci.adherence_yesterday || 'mostly',
        requests: ci.requests || {},
        messageForDoctor: ci.message_for_doctor,
      }));

      let mappedTodayPlan: GeneratedPlan | null = null;
      if (todayPlanRaw) {
        const p: any = todayPlanRaw;
        mappedTodayPlan = {
          patientId: p.patient_id,
          date: p.plan_date,
          reasoning: p.reasoning || '',
          rulesFired: p.rules_fired || [],
          dietType: p.diet_type,
          calorieTarget: p.calorie_target || 0,
          carbsTarget: p.carbs_target_g || 0,
          proteinTarget: p.protein_target_g || 0,
          fatTarget: p.fat_target_g || 0,
          waterTargetMl: p.water_target_ml || 2000,
          meals: p.meals || [],
          workout: p.workout || { type: 'rest', durationMinutes: 0, intensity: 'light', exercises: [], postMealWalks: [] },
          supplements: p.supplements || [],
          doctorFlagRaised: p.doctor_flag_raised,
          doctorFlagReason: p.doctor_flag_reason,
          supplementNote: p.supplement_note,
        };
      }

      set({
        patient: {
          profile: mappedProfile,
          checkIns: mappedCheckIns,
          plans: [],
          progress: mappedCheckIns.map((ci: any) => ({ date: ci.date, weight: ci.weight, fbs: ci.fbs, waist: ci.waistCm })),
          supplements: [],
          unreadMessages: 0,
        },
        todayPlan: mappedTodayPlan,
        patientLoaded: true,
        patientLoadError: null,
      });
    } catch (err: any) {
      set({ patientLoaded: true, patientLoadError: err?.message || 'Failed to load patient data' });
    }
  },

  patient: EMPTY_PATIENT,
  doctorPatients: [],
  selectedPatient: null,
  todayPlan: null,

  updateCheckIn: (partial) => set(state => ({
    patient: {
      ...state.patient,
      checkIns: state.patient.checkIns.map((ci, i) =>
        i === state.patient.checkIns.length - 1 ? { ...ci, ...partial } : ci
      ),
    },
  })),

  submitCheckIn: async (ci) => {
    if (__DEV__) {
      const existing = get().patient.checkIns.find(c => c.date === ci.date);
      if (existing) console.warn(`[Store] Overwriting existing check-in for ${ci.date}`);
    }
    set(state => ({
      patient: {
        ...state.patient,
        checkIns: [...state.patient.checkIns.filter(c => c.date !== ci.date), ci],
      },
    }));
    await get().generatePlan();
  },

  generatePlan: async () => {
    const { patient } = get();
    const todayCI = patient.checkIns.find(c => c.date === todayStr());
    if (!todayCI) return;

    // Always fetch protocol from Supabase
    let protocol = null;
    try {
      protocol = await fetchMyProtocol();
    } catch {}

    const plan = generateDailyPlan(patient, todayCI, protocol);
    plan.supplements = (protocol?.supplements && protocol.supplements.length > 0)
      ? protocol.supplements
      : patient.supplements;
    set({ todayPlan: plan });
    set(state => ({
      patient: {
        ...state.patient,
        plans: [...state.patient.plans.filter(p => p.date !== plan.date), plan],
      },
    }));

    // Always persist plan to Supabase
    try {
      await savePlan(plan);
    } catch {}
  },

  selectPatient: (id) => {
    const found = get().doctorPatients.find(p => p.profile.id === id);
    set({ selectedPatient: found || null });
  },

  approvePatientPlan: (patientId) => {
    set(state => ({
      doctorPatients: state.doctorPatients.map(p =>
        p.profile.id === patientId
          ? { ...p, plans: p.plans.map(plan => ({ ...plan, doctorFlagRaised: false })) }
          : p
      ),
    }));
  },

  overrideDietType: (patientId, dietType) => {
    set(state => ({
      doctorPatients: state.doctorPatients.map(p =>
        p.profile.id === patientId
          ? { ...p, profile: { ...p.profile, assignedDietType: dietType as any } }
          : p
      ),
    }));
  },

  markSupplementTaken: (name, taken) => {
    set(state => ({
      patient: {
        ...state.patient,
        supplements: state.patient.supplements.map(s =>
          s.name === name ? { ...s, taken } : s
        ),
      },
    }));
  },

  refreshProgress: () => {
    const { patient } = get();
    const progress = patient.checkIns.map(ci => ({
      date: ci.date,
      weight: ci.weight,
      waist: ci.waistCm,
      hip: ci.hipCm,
      fbs: ci.fbs,
    }));
    set(state => ({ patient: { ...state.patient, progress } }));
  },
}));
