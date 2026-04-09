
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Patient, DailyCheckIn, GeneratedPlan, PatientProfile } from "../types";
import { generateDailyPlan } from "../engine/adaptiveEngine";
import { todayStr } from "../utils";

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

  submitCheckIn: (ci) => {
    set(state => ({
      patient: {
        ...state.patient,
        checkIns: [...state.patient.checkIns.filter(c => c.date !== ci.date), ci],
      },
    }));
    get().generatePlan();
  },

  generatePlan: () => {
    const { patient } = get();
    const todayCI = patient.checkIns.find(c => c.date === todayStr());
    if (!todayCI) return;
    const plan = generateDailyPlan(patient, todayCI);
    // Attach supplements
    plan.supplements = patient.supplements;
    set({ todayPlan: plan });
    // Save to patient plans
    set(state => ({
      patient: {
        ...state.patient,
        plans: [...state.patient.plans.filter(p => p.date !== plan.date), plan],
      },
    }));
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
