import type { DailyCheckIn, GeneratedPlan, Patient, MealSlot, TreatmentPlan } from "../types";
import { DIABETES_PROTOCOL }     from "./rules/diabetesRules";
import { PCOS_PROTOCOL }         from "./rules/pcosRules";
import { HYPOTHYROID_PROTOCOL }  from "./rules/hypothyroidRules";
import { HYPERTENSION_PROTOCOL } from "./rules/hypertensionRules";
import { OBESITY_PROTOCOL }      from "./rules/obesityRules";
import { DYSLIPIDEMIA_PROTOCOL } from "./rules/dyslipidemiaRules";
import { DIET_LIBRARY, filterBySlot, filterByDietType, filterVeg } from "../data/dietLibrary";
import { EXERCISE_LIBRARY, filterByLocation, filterByEquipment, filterByDifficulty } from "../data/exerciseLibrary";
import { calcBMR, calcTDEE, macrosFromTDEE, getAge } from "../utils";

// ── PROTOCOL REGISTRY ────────────────────────────────────────────────────────
const PROTOCOLS: Record<string, any> = {
  diabetes_t2:  DIABETES_PROTOCOL,
  pre_diabetes: DIABETES_PROTOCOL,   // same rules, tighter targets
  pcos:         PCOS_PROTOCOL,
  hypothyroid:  HYPOTHYROID_PROTOCOL,
  hypertension: HYPERTENSION_PROTOCOL,
  obesity:      OBESITY_PROTOCOL,
  dyslipidemia: DYSLIPIDEMIA_PROTOCOL,
};

// ── RULE EVALUATION ──────────────────────────────────────────────────────────
function evaluateRules(patient: Patient, checkIn: DailyCheckIn) {
  const protocol = PROTOCOLS[patient.profile.primaryCondition];
  if (!protocol) return [];

  const fired: { ruleId: string; message: string; severity: string; notifyDoctor: boolean; dietAction: string; workoutAction: string }[] = [];
  const recent = [...patient.checkIns]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 21);

  for (const rule of protocol.rules) {
    // ── DIABETES / PRE-DIABETES ──
    if (rule.id === "DR001" && checkIn.fbs >= 101 && checkIn.fbs <= 130) {
      const n = recent.filter(c => c.fbs >= 101 && c.fbs <= 130).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — amber zone (101–130) for ${n} days`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "DR002" && checkIn.fbs >= 131 && checkIn.fbs <= 180) {
      const n = recent.filter(c => c.fbs >= 131 && c.fbs <= 180).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — above target (131–180) for ${n} days`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "DR003" && checkIn.fbs > 180 && checkIn.fbs <= 250) {
      fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — significantly elevated (>180)`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "DR004" && checkIn.fbs > 250) {
      fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — CRITICAL (>250). DKA risk.`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "DR005" && checkIn.fbs < 70) {
      fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — HYPOGLYCAEMIA (<70)`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "DR006" && checkIn.fbs >= 70 && checkIn.fbs <= 100) {
      const n = recent.filter(c => c.fbs >= 70 && c.fbs <= 100).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `FBS on target (${checkIn.fbs}) for ${n} days. Excellent!`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "DR009") {
      const weights = recent.slice(0, 14).map(c => c.weight).filter(Boolean) as number[];
      if (weights.length >= 7 && Math.abs(weights[0] - weights[weights.length - 1]) < 0.3) {
        fired.push({ ruleId: rule.id, message: `Weight plateau — change < 0.3 kg over ${weights.length} days`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
      }
    }
    if (rule.id === "DR011" && checkIn.energyLevel <= 2) {
      const n = recent.filter(c => c.energyLevel <= 2).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `Low energy (${checkIn.energyLevel}/5) for ${n} days`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }

    // ── PCOS ──
    if (rule.id === "PC001" && checkIn.fbs >= 101 && checkIn.fbs <= 130) {
      const n = recent.filter(c => c.fbs >= 101 && c.fbs <= 130).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — insulin resistance pattern`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "PC002" && checkIn.fbs >= 131 && checkIn.fbs <= 180) {
      fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — elevated, PCOS protocol activated`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "PC003" && checkIn.fbs > 180) {
      fired.push({ ruleId: rule.id, message: `FBS ${checkIn.fbs} — critical for PCOS management`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "PC020") {
      const weights = recent.slice(0, 21).map(c => c.weight).filter(Boolean) as number[];
      if (weights.length >= 7 && Math.abs(weights[0] - weights[weights.length - 1]) < 0.3) {
        fired.push({ ruleId: rule.id, message: `PCOS weight plateau — common, needs cycling strategy`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
      }
    }
    if (rule.id === "PC030" && checkIn.energyLevel <= 2) {
      const n = recent.filter(c => c.energyLevel <= 2).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `PCOS fatigue pattern — low energy ${n} days`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }

    // ── HYPOTHYROID ──
    if (rule.id === "HT010" && checkIn.energyLevel <= 2) {
      const n = recent.filter(c => c.energyLevel <= 2).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `Hypothyroid fatigue — persistent low energy ${n} days`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "HT020") {
      const weights = recent.slice(0, 21).map(c => c.weight).filter(Boolean) as number[];
      if (weights.length >= 7 && Math.abs(weights[0] - weights[weights.length - 1]) < 0.2) {
        fired.push({ ruleId: rule.id, message: `Hypothyroid plateau — weight stalled for ${weights.length} days`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
      }
    }

    // ── HYPERTENSION ──
    if (rule.id === "HN020" && checkIn.energyLevel <= 2) {
      const n = recent.filter(c => c.energyLevel <= 2).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `Low energy + hypertension — stress/cortisol link`, severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "HN010" && checkIn.requests?.eatingOut) {
      fired.push({ ruleId: rule.id, message: `Eating out flagged — sodium risk for BP`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }


    // ── OBESITY ──
    if (rule.id === 'OB002') {
      const weights = recent.slice(0, 14).map((ci: any) => ci.weight).filter(Boolean) as number[];
      if (weights.length >= 7 && Math.abs(weights[0] - weights[weights.length - 1]) < 0.3) {
        fired.push({ ruleId: rule.id, message: 'Weight plateau — 14+ days of minimal change', severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
      }
    }
    if (rule.id === 'OB004') {
      const weights = recent.slice(0, 7).map((ci: any) => ci.weight).filter(Boolean) as number[];
      if (weights.length >= 2 && weights[weights.length - 1] - weights[0] < -1.5) {
        fired.push({ ruleId: rule.id, message: 'Rapid weight loss — possible muscle catabolism', severity: rule.severity, notifyDoctor: rule.notifyDoctor, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
      }
    }
    if (rule.id === 'OB010' && checkIn.energyLevel <= 2) {
      const n = recent.filter((ci: any) => ci.energyLevel <= 2).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: `Fatigue on deficit —  days low energy`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === 'OB020' && checkIn.requests?.eatingOut) {
      fired.push({ ruleId: rule.id, message: 'Eating out — obesity protocol guidance applied', severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }

    // ── OBESITY ──
    if (rule.id === 'OB001' || rule.id === 'OB002') {
      const weights = recent.slice(0, rule.forNDays + 2).map(c => c.weight).filter(Boolean) as number[];
      if (weights.length >= 7) {
        const weeklyLoss = Math.abs(weights[0] - weights[weights.length-1]) / (weights.length / 7);
        if (rule.id === 'OB001' && weeklyLoss < 0.2) {
          fired.push({ ruleId: rule.id, message: 'Weight loss < 0.2 kg/week — tightening plan', severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
        }
        if (rule.id === 'OB002' && Math.abs(weights[0] - weights[weights.length-1]) < 0.3) {
          fired.push({ ruleId: rule.id, message: 'Extended plateau — diet break recommended', severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
        }
      }
    }
    if (rule.id === 'OB010' && checkIn.energyLevel <= 2) {
      const n = recent.filter(c => c.energyLevel <= 2).length;
      if (n >= rule.forNDays) fired.push({ ruleId: rule.id, message: 'Fatigue on calorie deficit', severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }

    // ── OBESITY ──
    if (rule.id === "OB002" || rule.id === "OB003") {
      const weights = recent.slice(0, 21).map(c => c.weight).filter(Boolean) as number[];
      const daysNeeded = rule.id === "OB003" ? 21 : 14;
      if (weights.length >= 7) {
        const change = Math.abs(weights[0] - weights[weights.length - 1]);
        if (change < 0.3) {
          fired.push({ ruleId: rule.id, message: `Weight plateau — < 0.3 kg change for ${weights.length} days`, severity: rule.severity, notifyDoctor: rule.notifyDoctor ?? false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
        }
      }
    }
    if (rule.id === "OB004") {
      const weights = recent.slice(0, 7).map(c => c.weight).filter(Boolean) as number[];
      if (weights.length >= 2 && (weights[weights.length-1] - weights[0]) > 1.2) {
        fired.push({ ruleId: rule.id, message: `Rapid loss > 1.2 kg in 7 days — muscle loss risk`, severity: rule.severity, notifyDoctor: rule.notifyDoctor ?? false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
      }
    }
    if (rule.id === "OB010" && checkIn.energyLevel <= 2) {
      const n = recent.filter(c => c.energyLevel <= 2).length;
      if (n >= 3) fired.push({ ruleId: rule.id, message: `Fatigue — calorie deficit may be too aggressive`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }
    if (rule.id === "OB020" && checkIn.fbs >= 101 && checkIn.fbs <= 130) {
      const n = recent.filter(c => c.fbs >= 101 && c.fbs <= 130).length;
      if (n >= 3) fired.push({ ruleId: rule.id, message: `Insulin resistance pattern with obesity`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
    }

    // ── DYSLIPIDEMIA ──
    if (rule.id === "DL010") {
      const weights = recent.slice(0, 30).map(c => c.weight).filter(Boolean) as number[];
      if (weights.length >= 2 && (weights[weights.length-1] - weights[0]) >= 3) {
        fired.push({ ruleId: rule.id, message: `Weight loss ≥ 3 kg — lipid profile improving`, severity: rule.severity, notifyDoctor: false, dietAction: rule.dietAction, workoutAction: rule.workoutAction });
      }
    }

        // ── UNIVERSAL ──
    if (rule.id.match(/DR011|PC030|HT010|HN020/) && checkIn.energyLevel <= 2) {
      // already handled above per condition
    }
  }

  // Deduplicate and sort by severity
  const seen = new Set<string>();
  const unique = fired.filter(r => { if (seen.has(r.ruleId)) return false; seen.add(r.ruleId); return true; });
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, positive: 4 };
  return unique.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
}

// ── MACRO ADJUSTMENTS ────────────────────────────────────────────────────────
function adjustMacros(base: ReturnType<typeof macrosFromTDEE>, rules: ReturnType<typeof evaluateRules>, checkIn: DailyCheckIn) {
  let { carbs, protein, fat, cals } = base;

  for (const r of rules) {
    if (["DR002", "DR003", "PC002"].includes(r.ruleId)) {
      carbs = Math.max(20, carbs - 20);
      cals  = Math.round(carbs * 4 + protein * 4 + fat * 9);
    }
    if (["DR004"].includes(r.ruleId)) {
      carbs = 30; // near-zero — only essential
    }
    if (["DR005"].includes(r.ruleId)) {
      carbs = carbs + 20; // hypoglycaemia — must raise carbs
    }
    if (["DR011", "PC030", "HT010"].includes(r.ruleId)) {
      carbs = carbs + 15; // fatigue — raise carbs slightly
      cals  = Math.round(carbs * 4 + protein * 4 + fat * 9);
    }
  }

  // Vegetarian day — adjust selection, not macros (handled in meal selection)
  return { carbs, protein, fat, cals };
}

// ── REASONING TEXT ───────────────────────────────────────────────────────────
function buildReasoning(checkIn: DailyCheckIn, rules: ReturnType<typeof evaluateRules>, condition: string): string {
  const parts: string[] = [];

  // Primary FBS or condition message
  if (checkIn.fbs !== undefined) {
    if (checkIn.fbs > 250) {
      parts.push(`Your blood sugar is critically elevated at ${checkIn.fbs} mg/dL. Your doctor has been notified. Follow the emergency guidance and contact your physician today.`);
    } else if (checkIn.fbs > 180) {
      parts.push(`FBS today (${checkIn.fbs} mg/dL) is significantly above your 70–100 target. Carbohydrates are reduced, fruit snack removed, no carbs after 3pm, and post-meal walks added. These are temporary — plan returns to normal when your numbers come back in range.`);
    } else if (checkIn.fbs >= 131) {
      parts.push(`FBS today (${checkIn.fbs} mg/dL) is above your 70–100 target. Carbs reduced by 20g, no carbs after 6:30pm, post-meal walk added after lunch.`);
    } else if (checkIn.fbs >= 101) {
      parts.push(`FBS ${checkIn.fbs} mg/dL — slightly above target (70–100). No plan change today, but we're watching this trend. Avoid sugar and refined carbs.`);
    } else if (checkIn.fbs < 70) {
      parts.push(`FBS ${checkIn.fbs} mg/dL is below the safe minimum. Carbohydrates have been increased today and exercise is paused. Your doctor has been notified. Have a small carb snack immediately.`);
    } else {
      parts.push(`FBS ${checkIn.fbs} mg/dL — on target. Your plan continues as normal today. Great consistency.`);
    }
  }

  // Condition-specific additions
  if (condition === "pcos" || condition === "hypothyroid") {
    if (checkIn.energyLevel <= 2) {
      parts.push(`Energy is low today — workout intensity is reduced and carbs are slightly increased to support recovery.`);
    }
  }
  if (condition === "hypertension" && checkIn.requests?.eatingOut) {
    parts.push(`You're eating out today. Sodium is a major BP trigger — see the eating-out guidance below each meal for specific instructions.`);
  }

  // Requests
  if (checkIn.requests?.dietType === "vegetarian") {
    parts.push(`Vegetarian day — all meals are plant-based today.`);
  }
  if (checkIn.requests?.travelDay) {
    parts.push(`Travel day noted — portable meal options selected.`);
  }
  if (checkIn.energyLevel <= 2 && !parts.some(p => p.includes("Energy is low"))) {
    parts.push(`Energy is low today (${checkIn.energyLevel}/5). Workout intensity reduced. Prioritise rest and recovery.`);
  }
  if (checkIn.energyLevel >= 4) {
    parts.push(`Great energy today (${checkIn.energyLevel}/5) — workout is at full intensity.`);
  }

  return parts.join(" ");
}

// ── MEAL SELECTION ───────────────────────────────────────────────────────────
function selectMeals(patient: Patient, checkIn: DailyCheckIn, dietType: string, rules: ReturnType<typeof evaluateRules>) {
  const isVeg = checkIn.requests?.dietType === "vegetarian" || patient.profile.dietPreference === "veg";
  const isPortable = checkIn.requests?.travelDay;
  const isCritical = rules.some(r => ["DR003","DR004","PC003"].includes(r.ruleId));
  const isHypo = rules.some(r => r.ruleId === "DR005");

  // Effective diet type based on rules
  let effectiveDietType = dietType;
  if (rules.some(r => r.ruleId === "DR004")) effectiveDietType = "keto";
  if (rules.some(r => r.ruleId === "DR003")) effectiveDietType = "keto";
  if (rules.some(r => r.ruleId === "DR002")) effectiveDietType = "low_carb";

  const slots: MealSlot[] = ["early_morning", "breakfast", "mid_morning", "lunch", "evening", "dinner"];
  const meals: GeneratedPlan["meals"] = [];

  for (const slot of slots) {
    let candidates = filterBySlot(DIET_LIBRARY, slot);
    candidates = filterByDietType(candidates, effectiveDietType);
    if (isVeg) candidates = filterVeg(candidates, true);
    if (isPortable) candidates = candidates.filter(c => c.portability !== "low");

    // For high FBS: remove high-GI items from breakfast
    if (isCritical && slot === "breakfast") {
      candidates = candidates.filter(c => c.gi !== "high");
    }
    // For hypoglycaemia: add carbs at breakfast
    if (isHypo && slot === "mid_morning") {
      candidates = DIET_LIBRARY.filter(c => c.slot === "mid_morning" && c.carbs > 15);
    }

    // Skip mid_morning fruit if FBS elevated
    const skipMidMorningFruit = rules.some(r => ["DR002","DR003","DR004","PC002","PC003"].includes(r.ruleId));
    if (skipMidMorningFruit && slot === "mid_morning") {
      candidates = candidates.filter(c => !c.name.toLowerCase().includes("fruit") && !c.name.toLowerCase().includes("banana") && !c.name.toLowerCase().includes("apple"));
    }

    if (candidates.length === 0) {
      // Fallback to any item in slot
      candidates = filterBySlot(DIET_LIBRARY, slot);
      if (isVeg) candidates = filterVeg(candidates, true);
    }

    if (candidates.length === 0) continue;

    // Pick based on hash of date for reproducibility (same plan same day)
    const dateHash = checkIn.date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const idx = (dateHash + slots.indexOf(slot) * 7) % candidates.length;
    const item = candidates[idx];

    let adjustments: string | undefined;
    if (slot === "mid_morning" && skipMidMorningFruit) {
      adjustments = "Fruit removed today — FBS elevated. Nuts/curd only.";
    }
    if (slot === "dinner" && rules.some(r => ["DR002","DR003"].includes(r.ruleId))) {
      adjustments = "No roti tonight — no carbs after 6:30pm with elevated FBS.";
    }

    meals.push({ slot, item, adjustments });
  }

  return meals;
}

// ── WORKOUT SELECTION ────────────────────────────────────────────────────────
function selectWorkout(patient: Patient, checkIn: DailyCheckIn, rules: ReturnType<typeof evaluateRules>): GeneratedPlan["workout"] {
  const isCritical = rules.some(r => ["DR004","PC003"].includes(r.ruleId));
  const isLowEnergy = checkIn.energyLevel <= 2;
  const isFbs180 = checkIn.fbs > 180;
  const isHypo = rules.some(r => r.ruleId === "DR005");

  // Suspend all exercise
  if (isHypo || isCritical) {
    return {
      type: "Rest Day",
      durationMinutes: 0,
      intensity: "rest",
      exercises: [],
      postMealWalks: [{ after: "lunch", minutes: 10, reason: "Light movement only — blood sugar must stabilise first." }],
    };
  }

  const location = checkIn.requests?.workoutLocation ?? patient.profile.workoutLocation[0] ?? "home";
  const equipment = patient.profile.workoutEquipment;
  const focus = checkIn.requests?.workoutFocus ?? "full body";

  // Filter exercises
  let exercises = filterByLocation(EXERCISE_LIBRARY, location);
  exercises = filterByEquipment(exercises, equipment);

  // Intensity cap based on energy and FBS
  const maxDifficulty = isFbs180 || isLowEnergy ? 2 : checkIn.energyLevel >= 4 ? 4 : 3;
  exercises = filterByDifficulty(exercises, maxDifficulty);

  // Focus filter
  if (focus === "core") {
    exercises = exercises.filter(e => e.muscleGroups.some(m => m.includes("core") || m.includes("abs")));
  }

  // Pick 3 exercises
  const dateHash = checkIn.date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...exercises].sort((a, b) => (a.id.charCodeAt(0) + dateHash) % 7 - (b.id.charCodeAt(0) + dateHash) % 7);
  const selected = shuffled.slice(0, 3);

  const intensity = isLowEnergy ? "light" : isFbs180 ? "moderate" : checkIn.energyLevel >= 4 ? "high" : "moderate";
  const duration = isLowEnergy ? 25 : isFbs180 ? 35 : 45;
  const workoutType = focus === "core" ? "Core Focus" :
    location === "gym" ? "Gym Resistance" :
    location === "home" ? "Home Resistance" : "Full Body Resistance";

  // Post-meal walks
  const postMealWalks: GeneratedPlan["workout"]["postMealWalks"] = [];
  if (checkIn.fbs > 130) {
    postMealWalks.push({ after: "lunch", minutes: 15, reason: `FBS ${checkIn.fbs} — post-meal walk reduces glucose spike by up to 30%.` });
  }
  if (checkIn.fbs > 180) {
    postMealWalks.push({ after: "dinner", minutes: 20, reason: "FBS significantly elevated — evening walk helps overnight glucose clearance." });
  }
  if (!postMealWalks.length && patient.profile.conditions.includes("hypertension")) {
    postMealWalks.push({ after: "dinner", minutes: 15, reason: "Post-dinner walk supports blood pressure management." });
  }

  return { type: workoutType, durationMinutes: duration, intensity, exercises: selected, postMealWalks };
}

// ── WATER TARGET ─────────────────────────────────────────────────────────────
function calcWaterTarget(checkIn: DailyCheckIn, condition: string): number {
  let base = 2000; // ml
  if (checkIn.fbs > 150) base += 500; // higher glucose = higher water need
  if (checkIn.energyLevel >= 4) base += 250; // active day
  if (condition === "hypertension") base += 250; // hydration helps BP
  return base;
}

// ── SUPPLEMENT NOTES ─────────────────────────────────────────────────────────
function conditionSupplementNote(condition: string, rules: ReturnType<typeof evaluateRules>): string {
  const notes: Record<string, string> = {
    diabetes_t2:  "Take Berberine 30 min before lunch. Metformin reduces B12 — ensure you take your methylcobalamin.",
    pre_diabetes: "Berberine before meals helps. Take Vitamin D3 with a fatty meal. Magnesium glycinate at bedtime.",
    pcos:         "Berberine and Inositol before meals. Vitamin D3 with fatty meal. Evening primrose with dinner.",
    hypothyroid:  "Thyroxine 30–60 min before breakfast on empty stomach. No calcium or coffee within 4 hours of thyroxine.",
    hypertension: "Magnesium glycinate at bedtime. Omega-3 with dinner. CoQ10 with any meal.",
    obesity:      "Protein supplement if dietary target not met. Vitamin D3 if BMI > 30. Magnesium for sleep quality.",
    dyslipidemia: "Omega-3 (EPA+DHA) 2g with dinner. Psyllium husk 1 tsp before meals. CoQ10 if on statins.",
  };
  return notes[condition] ?? "";
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────
// FIX: accept optional treatmentPlan — when present, use doctor's targets as base instead of auto-calc
export function generateDailyPlan(patient: Patient, checkIn: DailyCheckIn, treatmentPlan?: TreatmentPlan | null): GeneratedPlan {
  const { profile } = patient;
  const condition = profile.primaryCondition;

  // Macros — use doctor's treatment plan targets if available, otherwise auto-calculate
  let baseMacros: { carbs: number; protein: number; fat: number; cals: number };
  let dietType: string;

  if (treatmentPlan && treatmentPlan.calorieTarget > 0) {
    // FIX: doctor-driven plan — use the exact targets the doctor set
    baseMacros = {
      cals: treatmentPlan.calorieTarget,
      carbs: treatmentPlan.carbsTargetG,
      protein: treatmentPlan.proteinTargetG,
      fat: treatmentPlan.fatTargetG,
    };
    dietType = treatmentPlan.dietType || profile.assignedDietType;
  } else {
    // Fallback: auto-calculate from BMR/TDEE (backwards compatible)
    const age    = getAge(profile.dob);
    const bmr    = calcBMR(profile.weightKg, profile.heightCm, age, profile.sex as any);
    const tdee   = calcTDEE(bmr, profile.activityLevel);
    const protocol = PROTOCOLS[condition];
    dietType = protocol?.phases?.[profile.currentPhase - 1]?.dietType ?? profile.assignedDietType;
    baseMacros = macrosFromTDEE(tdee, dietType);
  }

  // Rules
  const rules = evaluateRules(patient, checkIn);

  // Adjusted macros
  const { carbs, protein, fat, cals } = adjustMacros(baseMacros, rules, checkIn);

  // Plan components
  const meals   = selectMeals(patient, checkIn, dietType, rules);
  const workout = selectWorkout(patient, checkIn, rules);
  const water   = calcWaterTarget(checkIn, condition);
  const reasoning  = buildReasoning(checkIn, rules, condition);
  const suppNote   = conditionSupplementNote(condition, rules);
  const doctorFlag = rules.some(r => r.notifyDoctor);

  return {
    patientId:      profile.id,
    date:           checkIn.date,
    reasoning,
    rulesFired:     rules.map(r => ({ ruleId: r.ruleId, message: r.message })),
    dietType:       dietType as any,
    calorieTarget:  cals,
    carbsTarget:    carbs,
    proteinTarget:  protein,
    fatTarget:      fat,
    waterTargetMl:  water,
    meals,
    workout,
    supplements:    patient.supplements,
    supplementNote: suppNote,
    doctorFlagRaised: doctorFlag,
    doctorFlagReason: doctorFlag ? rules.find(r => r.notifyDoctor)?.message : undefined,
  };
}
