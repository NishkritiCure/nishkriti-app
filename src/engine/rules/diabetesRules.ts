
import type { ProtocolRule, ProtocolPhase, BiomarkerTarget, Protocol } from "../../types";

const rules: ProtocolRule[] = [
  {
    id:"DR001", metric:"FBS", condition:"Amber watch",
    threshold:"FBS 101–130 mg/dL", forNDays:3,
    dietAction:"Log and monitor. No plan change yet — trend watching.",
    workoutAction:"Add 15-min post-dinner walk if not already present.",
    severity:"low", notifyDoctor:false,
  },
  {
    id:"DR002", metric:"FBS", condition:"Above target — act",
    threshold:"FBS 131–180 mg/dL", forNDays:2,
    dietAction:"Reduce carbs by 20g. Remove fruit snack. Replace with protein or fat snack. Increase fibrous vegetables. Implement frozen carb technique for all rice. No carbs after 6:30pm.",
    workoutAction:"Mandatory 20-min post-dinner walk. Reduce workout intensity to moderate.",
    severity:"high", notifyDoctor:false,
  },
  {
    id:"DR003", metric:"FBS", condition:"High — act now",
    threshold:"FBS 181–250 mg/dL", forNDays:1,
    dietAction:"Shift to strict low-carb immediately. No carbs after 3pm. Only low-GI foods. Add fat-only snack if hunger (2 tbsp ghee / handful nuts).",
    workoutAction:"Post-meal walks after every meal. No HIIT. Moderate resistance only.",
    severity:"high", notifyDoctor:true, notifyReason:"FBS 181–250 for 3+ days requires protocol review",
  },
  {
    id:"DR004", metric:"FBS", condition:"Critical",
    threshold:"FBS above 250 mg/dL", forNDays:1,
    dietAction:"Hold autonomous plan changes. Flag to doctor immediately. Supportive nutrition only — dal, sabzi, minimal carbs.",
    workoutAction:"Suspend all intense exercise. Walking only.",
    severity:"critical", notifyDoctor:true, notifyReason:"FBS > 250 — DKA risk. Immediate physician review required.",
  },
  {
    id:"DR005", metric:"FBS", condition:"Hypoglycaemia",
    threshold:"FBS below 70 mg/dL", forNDays:1,
    dietAction:"Increase carbs by 20g immediately. Add mid-morning fruit. Complex carbs at every meal. No calorie deficit today.",
    workoutAction:"Suspend all exercise until FBS confirmed stable above 80 mg/dL.",
    severity:"critical", notifyDoctor:true, notifyReason:"FBS < 70 — hypoglycaemia risk. Immediate flag.",
  },
  {
    id:"DR006", metric:"FBS", condition:"On target",
    threshold:"FBS 70–100 mg/dL consistently", forNDays:5,
    dietAction:"Maintain current plan. Reversal is progressing.",
    workoutAction:"Maintain current plan. Can increase intensity by 1 level.",
    severity:"positive", notifyDoctor:false,
  },
  {
    id:"DR007", metric:"FBS", condition:"Reversal progressing",
    threshold:"FBS < 100 + 7-day average reducing by ≥15%", forNDays:7,
    dietAction:"Consider advancing to next phase. Slight carb increase permissible to test tolerance.",
    workoutAction:"Introduce resistance training progression. Phase 2 upgrade.",
    severity:"positive", notifyDoctor:true, notifyReason:"Phase advancement criteria met — physician approval needed.",
  },
  {
    id:"DR008", metric:"HbA1c", condition:"Reversal milestone",
    threshold:"HbA1c < 5.7% on labs", forNDays:1,
    dietAction:"Maintain current plan. Begin transition to maintenance phase. Liberalise diet carefully.",
    workoutAction:"Maintain workout. Add strength focus for body recomposition.",
    severity:"positive", notifyDoctor:true, notifyReason:"HbA1c < 5.7% — reversal confirmed. Physician review for medication.",
  },
  {
    id:"DR009", metric:"Weight", condition:"Plateau",
    threshold:"< 0.3kg change over 14 days", forNDays:14,
    dietAction:"Implement carb cycling if on low-carb. Introduce fat-only day 1× per week (2 tbsp ghee only). Re-check calorie intake.",
    workoutAction:"Increase daily steps target by 2000. Add HIIT 1× per week if Phase 2+.",
    severity:"medium", notifyDoctor:false,
  },
  {
    id:"DR010", metric:"Adherence", condition:"Poor",
    threshold:"< 65% compliance in 7 days", forNDays:7,
    dietAction:"Simplify to 3 fixed meals. Remove complex recipes. Focus on removing sugar and white rice only this week.",
    workoutAction:"Reduce to daily 20-min walking only. Build compliance before intensity.",
    severity:"low", notifyDoctor:false,
  },
  {
    id:"DR011", metric:"Energy", condition:"Consistently low",
    threshold:"Self-rated energy ≤ 2 for 3+ days", forNDays:3,
    dietAction:"Increase carbs by 15g. Check protein intake. Add B12-rich foods. Ensure adequate calories.",
    workoutAction:"Downgrade intensity. Yoga and walking only. No HIIT.",
    severity:"medium", notifyDoctor:false,
  },
  {
    id:"DR012", metric:"Post-meal walk", condition:"Missed",
    threshold:"Not walking after meals for 3+ days", forNDays:3,
    dietAction:"No diet change.",
    workoutAction:"Reinforce post-meal walk protocol. 15 min after lunch and dinner — most important single intervention.",
    severity:"medium", notifyDoctor:false,
  },
  {
    id:"DR013", metric:"Supplement", condition:"Metformin missed",
    threshold:"Metformin missed 2+ consecutive days", forNDays:2,
    dietAction:"No diet change.",
    workoutAction:"No change.",
    severity:"high", notifyDoctor:true, notifyReason:"Medication adherence flag — Metformin missed.",
  },
];

const phases: ProtocolPhase[] = [
  {
    phase:1, name:"Sugar Shutdown", durationWeeks:"Weeks 1–6",
    biomarkerTarget:"FBS < 130 mg/dL",
    weightTarget:"0.3–0.5 kg/week",
    dietFocus:"Strict low-carb. Frozen carb technique mandatory for all rice. Methi water every morning. No sugar, no white rice, no maida. 1 roti max. Berberine + magnesium from day 1.",
    workoutFocus:"Daily 30-min post-dinner walk. Resistance training 2× per week (machines, bodyweight). No HIIT yet. 8000 steps/day.",
    advanceWhen:"FBS averaging < 130 for 7 days AND weight reducing",
    notes:"Most patients see dramatic FBS improvement in 10–14 days. Celebrate this — it sustains motivation.",
  },
  {
    phase:2, name:"Metabolic Reversal", durationWeeks:"Weeks 7–20",
    biomarkerTarget:"FBS < 110 mg/dL",
    weightTarget:"0.3–0.5 kg/week",
    dietFocus:"Introduce carb cycling. Low day (60g): 4 days/week. Medium (100g): 2 days. High (150g): 1 day on heavy workout. Frozen carb on all high days. Gut health: daily curd/chaas.",
    workoutFocus:"Resistance 3× per week. Zone 2 cardio 4× per week. Post-meal walks all 3 meals. 10000 steps/day. HIIT 1× per week from week 10.",
    advanceWhen:"FBS averaging < 110 for 14 days AND HbA1c trending down",
    notes:"Introduce fat-only day (2 tbsp ghee only) once per week in week 12 if plateau.",
  },
  {
    phase:3, name:"Reversal Confirmation", durationWeeks:"Weeks 21–36",
    biomarkerTarget:"FBS 70–100 mg/dL",
    weightTarget:"0.2–0.3 kg/week",
    dietFocus:"Advanced carb cycling. Keto 2 weeks on/1 week moderate rotation if FBS not below 100. Intermittent eating window 14:10. Maximum food quality.",
    workoutFocus:"Strength-dominant training. Progressive overload via tempo and sets. HIIT 2× per week. 10000 steps daily.",
    advanceWhen:"FBS consistently below 100 without medication for 30 days AND HbA1c < 5.7%",
    notes:"HbA1c lab required at week 24. Physician initiates medication taper conversation if targets met.",
  },
  {
    phase:4, name:"Reversal Maintenance", durationWeeks:"Month 9+",
    biomarkerTarget:"FBS 70–100 mg/dL sustained",
    weightTarget:"Maintain ±1 kg",
    dietFocus:"Flexible whole foods. Anti-inflammatory maintained. Frozen carb as habit. No sugar/maida permanently. 80/20 rule on social occasions.",
    workoutFocus:"3–4× per week. Strength + cardio. Monthly check-ins. 8000+ steps/day.",
    advanceWhen:"3 consecutive months FBS < 100 off medication",
    notes:"Annual HbA1c + full metabolic panel. Quarterly Nishkriti check-in.",
  },
];

const targets: BiomarkerTarget[] = [
  { name:"FBS (fasting blood sugar)", green:"70–100 mg/dL", amber:"101–130 mg/dL", orange:"131–180 mg/dL", red:">180 mg/dL", unit:"mg/dL", frequency:"Daily (morning)", notes:"Nishkriti target 70–100. Stricter than ADA. Tight control = faster reversal." },
  { name:"HbA1c", green:"< 5.7% (reversal)", amber:"5.7–6.4% (pre-diabetic)", orange:"6.5–7.5%", red:">7.5%", unit:"%", frequency:"Every 3 months", notes:"Below 5.7% = reversal confirmed. Primary Nishkriti success milestone." },
  { name:"Post-meal glucose (2hr)", green:"< 140 mg/dL", amber:"140–160 mg/dL", orange:"160–200 mg/dL", red:">200 mg/dL", unit:"mg/dL", frequency:"3× per week minimum", notes:"Best measured 2 hrs after first bite. Post-meal walk target: keep below 140." },
  { name:"Body weight", green:"Reducing 0.3–0.5 kg/week", amber:"Plateau >14 days", orange:"Gaining weight", red:"Gaining >1 kg/week", unit:"kg", frequency:"Daily", notes:"Weight loss reduces insulin resistance directly." },
  { name:"Waist circumference", green:"<90cm (M) / <80cm (F)", amber:"90–95 (M) / 80–85 (F)", orange:"95–102 (M) / 85–90 (F)", red:">102/90 cm", unit:"cm", frequency:"Weekly", notes:"Visceral fat is the primary driver of T2DM insulin resistance." },
];

export const DIABETES_PROTOCOL: Protocol = {
  condition: 'diabetes_t2',
  rules,
  phases,
  targets,
};
