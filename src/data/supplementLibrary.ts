export interface Supplement {
  name: string;
  dose: string;
  timing: string;
  withFood: string;
  patientReason: string;
  clinicianNote: string;
  conditions: string[];
  priority: 'essential' | 'recommended' | 'optional';
  refillDays: number; // approximate days per bottle
}

export const SUPPLEMENT_LIBRARY: Supplement[] = [
  // ── UNIVERSAL ─────────────────────────────────────────────────────────────
  {
    name: "Vitamin D3 + K2",
    dose: "1 capsule (5000 IU D3 + 100mcg K2)",
    timing: "Morning",
    withFood: "With a fatty meal (egg, ghee, nuts)",
    patientReason: "Supports insulin sensitivity, hormone balance, and immune function. Most Indians are deficient.",
    clinicianNote: "D3 deficiency is near-universal in India. K2 prevents calcium from depositing in arteries. Test 25-OH-D before prescribing — target 50–80 ng/mL.",
    conditions: ["diabetes_t2", "pcos", "hypothyroid", "hypertension", "obesity", "pre_diabetes", "osteoporosis"],
    priority: "essential",
    refillDays: 90,
  },
  {
    name: "Omega-3 (EPA+DHA) 1g",
    dose: "1 capsule (1g EPA+DHA combined)",
    timing: "Dinner",
    withFood: "With fatty meal — improves absorption",
    patientReason: "Reduces inflammation that drives your condition. Supports brain, heart, and joint health.",
    clinicianNote: "Anti-inflammatory. EPA > DHA ratio preferred for metabolic conditions. 2g/day for hypertriglyceridemia.",
    conditions: ["diabetes_t2", "pcos", "hypertension", "obesity", "fatty_liver", "dyslipidemia", "ra", "pre_diabetes"],
    priority: "essential",
    refillDays: 90,
  },
  {
    name: "Magnesium Glycinate 300mg",
    dose: "1 capsule (300mg elemental Mg)",
    timing: "Bedtime",
    withFood: "With or without food",
    patientReason: "Supports deep sleep, muscle recovery, and insulin sensitivity. Magnesium is depleted by stress and sugar.",
    clinicianNote: "Glycinate form for superior absorption and no laxative effect. Helps with insulin receptor sensitivity. Check serum Mg — most are sub-optimal.",
    conditions: ["diabetes_t2", "pcos", "hypertension", "stress", "sleep", "pre_diabetes", "menopause"],
    priority: "essential",
    refillDays: 60,
  },
  // ── DIABETES / PRE-DIABETES ───────────────────────────────────────────────
  {
    name: "Berberine 500mg",
    dose: "1 capsule (500mg)",
    timing: "Before lunch",
    withFood: "30 min before eating — critical for timing",
    patientReason: "Helps your body handle sugar more effectively. Acts like a natural form of Metformin. Clinical evidence is strong.",
    clinicianNote: "HbA1c reduction 0.5–1.5%. AMPK activation pathway. May reduce need for Metformin. Do not combine with Metformin without monitoring — additive effect. Monitor renal function.",
    conditions: ["diabetes_t2", "pcos", "pre_diabetes", "obesity"],
    priority: "essential",
    refillDays: 30,
  },
  {
    name: "Vitamin B12 (Methylcobalamin) 500mcg",
    dose: "1 tablet (500mcg sublingual)",
    timing: "Morning",
    withFood: "Empty stomach for sublingual — dissolve under tongue",
    patientReason: "Metformin depletes B12 over time. This protects your nerves and keeps your energy levels healthy.",
    clinicianNote: "Methylcobalamin preferred over cyanocobalamin — better neurological bioavailability. Monitor B12 levels annually in patients on Metformin. Neuropathy risk at B12 < 300 pg/mL.",
    conditions: ["diabetes_t2", "pre_diabetes", "anaemia"],
    priority: "essential",
    refillDays: 90,
  },
  {
    name: "Alpha Lipoic Acid 300mg",
    dose: "1 capsule (300mg)",
    timing: "Before breakfast",
    withFood: "30 min before meal on empty stomach",
    patientReason: "Powerful antioxidant that protects your nerves and helps your cells use insulin better.",
    clinicianNote: "ALA reduces oxidative stress and improves insulin-mediated glucose uptake. Evidence for diabetic neuropathy prevention. Titrate from 150mg if GI intolerance.",
    conditions: ["diabetes_t2", "pre_diabetes"],
    priority: "recommended",
    refillDays: 60,
  },
  // ── PCOS ──────────────────────────────────────────────────────────────────
  {
    name: "Myo-Inositol + D-Chiro Inositol (40:1)",
    dose: "2g Myo + 50mg D-Chiro (powder sachet)",
    timing: "Morning",
    withFood: "Mixed in water before breakfast",
    patientReason: "The most evidence-based supplement for PCOS. Helps insulin work properly, supports ovulation, and reduces testosterone.",
    clinicianNote: "Cochrane-reviewed. 40:1 Myo:DCI ratio matches physiological ratio. Comparable to Metformin for PCOS insulin resistance. Restores menstrual regularity in ~6 months. Combine with folate.",
    conditions: ["pcos"],
    priority: "essential",
    refillDays: 30,
  },
  {
    name: "N-Acetyl Cysteine (NAC) 600mg",
    dose: "1 capsule (600mg)",
    timing: "With lunch",
    withFood: "With meal — reduces nausea",
    patientReason: "Reduces oxidative stress, supports liver health, and helps balance hormones in PCOS.",
    clinicianNote: "NAC improves antioxidant status and insulin sensitivity. Evidence for PCOS: LH/FSH normalisation, menstrual regularity. Also benefits fatty liver component of metabolic PCOS.",
    conditions: ["pcos", "fatty_liver", "stress"],
    priority: "recommended",
    refillDays: 60,
  },
  {
    name: "Evening Primrose Oil 1000mg",
    dose: "1 capsule (1000mg)",
    timing: "Dinner",
    withFood: "With fatty meal",
    patientReason: "Contains GLA which helps reduce inflammation, support hormone production, and improve skin in PCOS.",
    clinicianNote: "GLA precursor to anti-inflammatory prostaglandins. Reduces prostaglandin E2. Avoid from ovulation onwards if trying to conceive — may inhibit implantation.",
    conditions: ["pcos", "skin", "menopause"],
    priority: "recommended",
    refillDays: 60,
  },
  // ── HYPOTHYROID ───────────────────────────────────────────────────────────
  {
    name: "Selenium (Selenomethionine) 200mcg",
    dose: "1 capsule (200mcg)",
    timing: "Lunch",
    withFood: "With meal",
    patientReason: "Selenium is needed to convert thyroid hormone T4 into the active form T3. Most Indians are deficient in selenium.",
    clinicianNote: "Selenomethionine preferred. Supports deiodinase enzyme (T4→T3 conversion). Reduces TPO antibodies in Hashimoto's. Do not exceed 400mcg/day — selenium toxicity risk.",
    conditions: ["hypothyroid"],
    priority: "essential",
    refillDays: 90,
  },
  {
    name: "Zinc Picolinate 30mg",
    dose: "1 capsule (30mg)",
    timing: "Dinner",
    withFood: "With food — reduces nausea on empty stomach",
    patientReason: "Zinc supports thyroid hormone production and immune function. Helps convert T4 to T3.",
    clinicianNote: "Zinc picolinate has superior bioavailability. Take away from iron supplements (compete for absorption). Recheck thyroid panel after 90 days.",
    conditions: ["hypothyroid", "pcos", "testosterone", "immunity"],
    priority: "recommended",
    refillDays: 90,
  },
  {
    name: "Ashwagandha (KSM-66) 300mg",
    dose: "1 capsule (300mg KSM-66 extract)",
    timing: "Bedtime",
    withFood: "With warm milk or food",
    patientReason: "Adaptogen that helps your body manage stress, supports thyroid function, and improves sleep quality and energy.",
    clinicianNote: "KSM-66 has clinical evidence for TSH reduction in subclinical hypothyroidism. Reduces cortisol. Contraindicated in autoimmune thyroid disease (Hashimoto's) — can aggravate. Confirm diagnosis before prescribing.",
    conditions: ["hypothyroid", "stress", "testosterone", "sleep"],
    priority: "recommended",
    refillDays: 60,
  },
  // ── HYPERTENSION ──────────────────────────────────────────────────────────
  {
    name: "CoQ10 (Ubiquinol) 100mg",
    dose: "1 capsule (100mg Ubiquinol form)",
    timing: "Lunch",
    withFood: "With fatty meal — fat-soluble",
    patientReason: "CoQ10 supports your heart muscle directly and may reduce blood pressure. Statins deplete CoQ10.",
    clinicianNote: "Ubiquinol (reduced form) superior to ubiquinone for absorption. Meta-analysis shows ~11 mmHg SBP reduction. Essential if patient is on statins. 200-300mg for statin users.",
    conditions: ["hypertension", "dyslipidemia", "testosterone"],
    priority: "recommended",
    refillDays: 60,
  },
  // ── GENERAL METABOLIC ─────────────────────────────────────────────────────
  {
    name: "Probiotic (Multi-strain, 10B CFU)",
    dose: "1 capsule",
    timing: "Morning",
    withFood: "Before breakfast on empty stomach",
    patientReason: "Your gut microbiome directly affects your hormone levels, blood sugar, and inflammation. A probiotic helps restore balance.",
    clinicianNote: "Multi-strain preferred. Lactobacillus acidophilus, Bifidobacterium longum, L. rhamnosus GG. Evidence for insulin sensitivity and HbA1c reduction. Refrigerate after opening.",
    conditions: ["diabetes_t2", "pcos", "obesity", "gut_ibs", "fatty_liver", "pre_diabetes"],
    priority: "recommended",
    refillDays: 30,
  },
  {
    name: "Vitamin B-Complex (Activated)",
    dose: "1 capsule",
    timing: "Morning",
    withFood: "With breakfast",
    patientReason: "B vitamins support energy production, nerve health, and hormone balance. Stress and poor diet deplete them quickly.",
    clinicianNote: "Activated forms (methylfolate, methylcobalamin, P5P) only — avoid synthetic forms. Supports MTHFR variants common in Indian population. Essential for PCOS and hypothyroid.",
    conditions: ["diabetes_t2", "pcos", "hypothyroid", "stress", "pre_diabetes"],
    priority: "recommended",
    refillDays: 60,
  },
  // ── IRON (ANAEMIA) ────────────────────────────────────────────────────────
  {
    name: "Iron Bisglycinate 25mg + Vitamin C",
    dose: "1 capsule (25mg elemental iron + 50mg Vit C)",
    timing: "Breakfast",
    withFood: "With food — reduces GI side effects",
    patientReason: "Gentle form of iron that doesn't cause constipation. Vitamin C is added to improve absorption. Essential if you have iron deficiency anaemia.",
    clinicianNote: "Bisglycinate form has 4× superior absorption vs ferrous sulphate with fewer GI side effects. Take away from thyroxine (4hr gap), calcium, and coffee. Recheck Hb after 8 weeks.",
    conditions: ["anaemia", "pcos"],
    priority: "essential",
    refillDays: 60,
  },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
export function getSupplementsForCondition(condition: string): Supplement[] {
  return SUPPLEMENT_LIBRARY
    .filter(s => s.conditions.includes(condition))
    .sort((a, b) => {
      const order = { essential: 0, recommended: 1, optional: 2 };
      return order[a.priority] - order[b.priority];
    });
}

export function getEssentialSupplements(condition: string): Supplement[] {
  return getSupplementsForCondition(condition).filter(s => s.priority === 'essential');
}
