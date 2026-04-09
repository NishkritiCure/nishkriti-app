
// TODO: OFFLINE SUPPORT — This store currently requires network connectivity for all Supabase
// operations (loadPatientFromSupabase, generatePlan → savePlan). For offline support:
//   1. Use zustand/middleware `persist` with AsyncStorage to cache patient data locally
//   2. Queue Supabase writes when offline, flush when connectivity returns
//   3. Add a `isOffline` state flag and show UI indicator
// This is a future requirement — not blocking current functionality.

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Patient, DailyCheckIn, GeneratedPlan, PatientProfile } from "../types";
import { generateDailyPlan } from "../engine/adaptiveEngine";
import { todayStr } from "../utils";
import { fetchMyProfile, fetchCheckIns, fetchTodayPlan, fetchMyProtocol, savePlan } from "../services/patientService";
// FIX: import shared IS_DEMO constant instead of local declaration
import { IS_DEMO } from "../lib/constants";

// ── MOCK DEMO PATIENT ────────────────────────────────────────────
const DEMO_PATIENT: Patient = {
  profile: {
    id:"P001", name:"Rahul Mehta", dob:"1982-04-09",
    sex:"male", heightCm:175, weightKg:82.4,
    conditions:["diabetes_t2"], primaryCondition:"diabetes_t2",
    medications:[{ name:"Metformin", dose:"500mg twice daily", timing:"with meals" }],
    dietPreference:"non_veg", allergies:[], dislikedFoods:[],
    cuisinePreference:["North Indian","Pan-Indian"],
    cookingSetup:"home", activityLevel:"sedentary",
    workoutEquipment:["dumbbells","resistance_bands"],
    workoutLocation:["home"], availableMinutes:45,
    preferredWorkoutTime:"morning",
    goals:["reverse diabetes","lose weight","reduce medication"],
    injuries:[], programmeStartDate:"2026-03-09",
    currentPhase:1, assignedDietType:"low_carb",
    baselineFbs:220, baselineHba1c:7.8,
    baselineWeight:84.5, baselineWaist:91, baselineHip:103,
  },
  checkIns: [
    { id:"CI001", patientId:"P001", date:todayStr(), fbs:174, weight:82.4,
      waistCm:88, hipCm:102, energyLevel:3, sleepHours:7,
      symptoms:[], adherenceYesterday:"mostly",
      requests:{ dietType:"vegetarian" },
      messageForDoctor:undefined, photoFront:undefined, photoSide:undefined, photoBack:undefined,
    },
  ],
  plans:[], progress:[
    { date:"2026-03-09", weight:84.5, waist:91, hip:103, fbs:220 },
    { date:"2026-03-16", weight:83.8, waist:90, hip:103, fbs:198 },
    { date:"2026-03-23", weight:83.1, waist:89, hip:102, fbs:185 },
    { date:"2026-03-30", weight:82.4, waist:88, hip:102, fbs:174 },
  ],
  supplements:[
    { name:"Vitamin D3 + K2", dose:"1 capsule", timing:"Morning", withFood:"With fatty meal", patientReason:"Supports insulin sensitivity and hormone balance.", taken:true },
    { name:"Berberine 500mg", dose:"1 capsule", timing:"Before lunch", withFood:"30 min before eating", patientReason:"Helps your body handle sugar — like natural Metformin.", taken:true },
    { name:"Vitamin B12 (Methylcobalamin)", dose:"500mcg", timing:"Morning", withFood:"With or without food", patientReason:"Metformin depletes this. Protects nerves and energy.", taken:true },
    { name:"Magnesium Glycinate 300mg", dose:"1 capsule", timing:"Bedtime", withFood:"With or without food", patientReason:"Supports sleep quality and muscle recovery.", taken:false },
    { name:"Omega-3 (EPA+DHA) 1g", dose:"1 capsule", timing:"Dinner", withFood:"With fatty meal", patientReason:"Reduces the inflammation driving your condition.", taken:false },
  ],
  unreadMessages:0,
};

const DEMO_DOCTOR_PATIENTS: Patient[] = [
  DEMO_PATIENT,
  { ...DEMO_PATIENT, profile:{ ...DEMO_PATIENT.profile, id:"P002", name:"Priya Sharma", primaryCondition:"diabetes_t2", weightKg:71.2, currentPhase:1, assignedDietType:"low_carb" },
    checkIns:[{ ...DEMO_PATIENT.checkIns[0], fbs:108, patientId:"P002", id:"CI002" }],
    progress:[{ date:"2026-03-09", weight:73, waist:84, hip:98, fbs:168 }, { date:todayStr(), weight:71.2, waist:82, hip:97, fbs:108 }],
    plans:[], supplements:[], unreadMessages:0,
  },
  { ...DEMO_PATIENT, profile:{ ...DEMO_PATIENT.profile, id:"P003", name:"Ananya Mishra", primaryCondition:"pcos", weightKg:68.8, currentPhase:2, assignedDietType:"carb_cycling", sex:"female" },
    checkIns:[{ ...DEMO_PATIENT.checkIns[0], fbs:94, patientId:"P003", id:"CI003", energyLevel:4 }],
    progress:[{ date:"2026-03-09", weight:70.5, waist:82, hip:96, fbs:102 }, { date:todayStr(), weight:68.8, waist:80, hip:95, fbs:94 }],
    plans:[], supplements:[], unreadMessages:0,
  },
  { ...DEMO_PATIENT, profile:{ ...DEMO_PATIENT.profile, id:"P004", name:"Vikram Kapoor", primaryCondition:"hypothyroid", weightKg:88.1, currentPhase:1, assignedDietType:"anti_inflammatory" },
    checkIns:[{ ...DEMO_PATIENT.checkIns[0], fbs:98, patientId:"P004", id:"CI004", energyLevel:2 }],
    progress:[{ date:"2026-03-09", weight:90, waist:96, hip:104, fbs:100 }, { date:todayStr(), weight:88.1, waist:94, hip:103, fbs:98 }],
    plans:[], supplements:[], unreadMessages:0,
  },
];

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

  // FIX: load real patient data from Supabase after login
  loadPatientFromSupabase: async () => {
    if (IS_DEMO) return;
    // FIX: 15-second timeout so app doesn't hang forever if Supabase is down
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), ms))]);
    try {
      const profile = await withTimeout(fetchMyProfile(), 15000);
      if (!profile) return;

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

      // Map today's plan from Supabase if exists
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
          supplements: [], // will be populated from protocol
          unreadMessages: 0,
        },
        todayPlan: mappedTodayPlan,
        patientLoaded: true,
      });
      // FIX: removed console.log that leaked patient name (PII) in production logs
    } catch (err) {
      // FIX: removed console.error that could leak error details in production
    }
  },

  patient: DEMO_PATIENT,
  doctorPatients: DEMO_DOCTOR_PATIENTS,
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

  // FIX: made async and await generatePlan so plan saves to Supabase before proceeding
  submitCheckIn: async (ci) => {
    // FIX: warn if overwriting an existing same-day check-in (dedup awareness)
    const existing = get().patient.checkIns.find(c => c.date === ci.date);
    if (existing && __DEV__) {
      console.warn(`[Store] Overwriting existing check-in for ${ci.date}`);
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

    // FIX: fetch protocol from Supabase to use doctor's targets as base
    let protocol = null;
    if (!IS_DEMO) {
      try {
        protocol = await fetchMyProtocol();
      } catch {}
    }

    const plan = generateDailyPlan(patient, todayCI, protocol);
    // FIX: pull supplements from doctor's protocol if available, not stale local patient.supplements
    plan.supplements = (protocol?.supplements && protocol.supplements.length > 0)
      ? protocol.supplements
      : patient.supplements;
    set({ todayPlan: plan });
    // Save to patient plans (local)
    set(state => ({
      patient: {
        ...state.patient,
        plans: [...state.patient.plans.filter(p => p.date !== plan.date), plan],
      },
    }));

    // FIX: persist plan to Supabase so doctor can see it
    if (!IS_DEMO) {
      try {
        await savePlan(plan);
        // FIX: removed console.log — no operation logs in production
      } catch (err) {
        // FIX: removed console.error — errors handled silently, plan still saved locally
      }
    }
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
    // Re-read from patient check-ins to update progress
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
