
export type Condition =
  | 'diabetes_t2' | 'pcos' | 'hypothyroid' | 'hypertension'
  | 'obesity' | 'pre_diabetes' | 'dyslipidemia' | 'ra'
  | 'gut_ibs' | 'fatty_liver' | 'skin' | 'menopause'
  | 'gout' | 'stress' | 'sleep' | 'anaemia' | 'testosterone'
  | 'osteoporosis' | 'post_covid';

export type DietType =
  | 'keto' | 'low_carb' | 'carb_cycling' | 'high_carb'
  | 'high_protein' | 'anti_inflammatory' | 'high_probiotic'
  | 'frozen_carb' | 'calorie_deficit' | 'maintenance';

export type Severity = 'positive' | 'low' | 'medium' | 'high' | 'critical';

export type MealSlot = 'early_morning' | 'breakfast' | 'mid_morning' | 'lunch' | 'evening' | 'dinner' | 'bedtime';

export interface Ingredient {
  name: string;
  grams: number;
  measure: string;
  note?: string;
  highlight?: 'normal' | 'skip' | 'optional' | 'important';
}

export interface MealItem {
  id: string;
  name: string;
  cuisine: string;
  slot: MealSlot;
  dietTypes: DietType[];
  isVeg: boolean;
  isEgg: boolean;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fibre: number;
  gi: 'low' | 'medium' | 'high';
  ingredients: Ingredient[];
  prepNote: string;
  portability: 'high' | 'medium' | 'low';
}

export interface ExerciseItem {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'hiit' | 'yoga' | 'flexibility' | 'resistance_band';
  muscleGroups: string[];
  equipment: string[];
  location: ('home' | 'gym' | 'outdoor')[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  defaultSets: number;
  defaultReps: string;
  restSeconds: number;
  tempoNote?: string;
  cueText: string;
  mistakeNote: string;
  calsPer10Min: number;
  avoidIf: string[];
  postMealSuitable: boolean;
  gifUrl?: string;
  videoUrl?: string;
}

export interface ProtocolRule {
  id: string;
  metric: string;
  condition: string;
  threshold: string;
  forNDays: number;
  dietAction: string;
  workoutAction: string;
  severity: Severity;
  notifyDoctor: boolean;
  notifyReason?: string;
}

export interface ProtocolPhase {
  phase: number;
  name: string;
  durationWeeks: string;
  biomarkerTarget: string;
  weightTarget: string;
  dietFocus: string;
  workoutFocus: string;
  advanceWhen: string;
  notes: string;
}

export interface BiomarkerTarget {
  name: string;
  green: string;
  amber: string;
  orange: string;
  red: string;
  unit: string;
  frequency: string;
  notes: string;
}

export interface Protocol {
  condition: Condition;
  rules: ProtocolRule[];
  phases: ProtocolPhase[];
  targets: BiomarkerTarget[];
}

// ── Treatment Plan (doctor-created, stored in protocols table) ──

export interface TreatmentPhase {
  name: string;
  description: string;
  dietFocus: string;
  exerciseFocus: string;
  expectedDurationWeeks: number;
  advancementCriteria: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  condition: Condition;
  isActive: boolean;
  // Diet
  dietType: DietType;
  calorieTarget: number;
  carbsTargetG: number;
  proteinTargetG: number;
  fatTargetG: number;
  calorieDeficit: number;
  // Exercise
  exerciseType: string;
  exerciseDurationMin: number;
  exerciseIntensity: 'light' | 'moderate' | 'hard';
  exerciseFrequency: string;
  exerciseNotes: string;
  // Phases
  phases: TreatmentPhase[];
  currentPhase: number;
  phaseName: string;
  // Medications & supplements
  medications: { name: string; dose: string; timing: string }[];
  supplements: { name: string; dose: string; timing: string; reason: string }[];
  // Notes
  notes: string;
  // Techniques & custom rules
  techniques: Record<string, boolean>;
  customRules: Record<string, any>;
  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  dob: string;
  sex: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  conditions: Condition[];
  primaryCondition: Condition;
  medications: { name: string; dose: string; timing: string }[];
  dietPreference: 'veg' | 'egg' | 'non_veg' | 'vegan' | 'jain';
  allergies: string[];
  dislikedFoods: string[];
  cuisinePreference: string[];
  cookingSetup: 'home' | 'tiffin' | 'restaurant' | 'canteen';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  workoutEquipment: ('none' | 'dumbbells' | 'resistance_bands' | 'full_gym' | 'yoga_mat')[];
  workoutLocation: ('home' | 'gym' | 'outdoor')[];
  availableMinutes: number;
  preferredWorkoutTime: 'morning' | 'afternoon' | 'evening';
  goals: string[];
  injuries: string[];
  programmeStartDate: string;
  currentPhase: number;
  assignedDietType: DietType;
  // Baseline measurements
  baselineFbs: number;
  baselineHba1c?: number;
  baselineWeight: number;
  baselineWaist: number;
  baselineHip: number;
}

export interface DailyCheckIn {
  id: string;
  patientId: string;
  date: string;
  fbs: number;
  weight: number;
  waistCm?: number;
  hipCm?: number;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  sleepHours?: number;
  symptoms: string[];
  adherenceYesterday: 'full' | 'mostly' | 'partial' | 'none';
  adherenceMissed?: string;
  requests: DailyRequest;
  messageForDoctor?: string;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
}

export interface DailyRequest {
  dietType?: 'vegetarian' | 'non_veg' | 'vegan' | null;
  cuisineRequest?: string;
  skipMeal?: MealSlot;
  eatingOut?: boolean;
  eatingOutCuisine?: string;
  travelDay?: boolean;
  workoutLocation?: 'home' | 'gym' | 'outdoor' | 'skip';
  workoutFocus?: string;
  workoutMinutes?: number;
  workoutIntensity?: 'light' | 'moderate' | 'hard';
}

export interface GeneratedPlan {
  patientId: string;
  date: string;
  reasoning: string;
  rulesFired: { ruleId: string; message: string }[];
  dietType: DietType;
  calorieTarget: number;
  carbsTarget: number;
  proteinTarget: number;
  fatTarget: number;
  waterTargetMl: number;
  meals: { slot: MealSlot; item: MealItem; adjustments?: string }[];
  workout: {
    type: string;
    durationMinutes: number;
    intensity: string;
    exercises: ExerciseItem[];
    postMealWalks: { after: MealSlot; minutes: number; reason: string }[];
  };
  supplements: {
    name: string; dose: string; timing: string; withFood: string; patientReason: string; taken?: boolean;
  }[];
  doctorFlagRaised?: boolean;
  doctorFlagReason?: string;
  supplementNote?: string;
}

export interface ProgressEntry {
  date: string;
  weight: number;
  waist?: number;
  hip?: number;
  neck?: number;
  chest?: number;
  thighL?: number;
  thighR?: number;
  bicepL?: number;
  bicepR?: number;
  calfL?: number;
  calfR?: number;
  bmi?: number;
  bodyFatPct?: number;
  fbs: number;
  hba1c?: number;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
}

export interface Patient {
  profile: PatientProfile;
  checkIns: DailyCheckIn[];
  plans: GeneratedPlan[];
  progress: ProgressEntry[];
  supplements: GeneratedPlan['supplements'];
  unreadMessages: number;
}
