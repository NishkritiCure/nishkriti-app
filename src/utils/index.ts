
export function calcBMI(weightKg: number, heightCm: number): number {
  const hM = heightCm / 100;
  return Math.round((weightKg / (hM * hM)) * 10) / 10;
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#4A90B8' };
  if (bmi < 23)   return { label: 'Healthy',     color: '#3EDBA5' };
  if (bmi < 27.5) return { label: 'Overweight',  color: '#E8B84B' };
  return                  { label: 'Obese',       color: '#D97B72' };
}

// Mifflin-St Jeor BMR
export function calcBMR(weightKg: number, heightCm: number, ageYears: number, sex: 'male'|'female'|'other'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function calcTDEE(bmr: number, activityLevel: string): number {
  const m: Record<string, number> = {
    sedentary: 1.2, lightly_active: 1.375,
    moderately_active: 1.55, very_active: 1.725,
  };
  return Math.round(bmr * (m[activityLevel] ?? 1.375));
}

// US Navy body fat estimate
export function calcBodyFat(sex: 'male'|'female'|'other', heightCm: number, waistCm: number, neckCm: number, hipCm?: number): number | null {
  try {
    if (sex === 'male') {
      return Math.round(495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450);
    } else if (hipCm) {
      return Math.round(495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450);
    }
    return null;
  } catch { return null; }
}

export function calcWHR(waistCm: number, hipCm: number): number {
  return Math.round((waistCm / hipCm) * 100) / 100;
}

export function getAge(dob: string): number {
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function todayStr(): string {
  return formatDate(new Date());
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export function macroCalsFromGrams(carbs: number, protein: number, fat: number): number {
  return Math.round(carbs * 4 + protein * 4 + fat * 9);
}

export function macrosFromTDEE(tdee: number, dietType: string): { carbs: number; protein: number; fat: number; cals: number } {
  const cals = Math.round(tdee - 350); // default moderate deficit
  const splits: Record<string, [number, number, number]> = {
    keto:             [0.05, 0.30, 0.65],
    low_carb:         [0.18, 0.35, 0.47],
    carb_cycling:     [0.25, 0.32, 0.43], // medium day
    high_carb:        [0.52, 0.25, 0.23],
    high_protein:     [0.22, 0.40, 0.38],
    anti_inflammatory:[0.22, 0.26, 0.52],
    high_probiotic:   [0.26, 0.26, 0.48],
    frozen_carb:      [0.20, 0.30, 0.50],
    calorie_deficit:  [0.35, 0.30, 0.35],
    maintenance:      [0.42, 0.25, 0.33],
  };
  const [cp, pp, fp] = splits[dietType] ?? splits.low_carb;
  return {
    cals,
    carbs:   Math.round((cals * cp) / 4),
    protein: Math.round((cals * pp) / 4),
    fat:     Math.round((cals * fp) / 9),
  };
}

export function pluralise(n: number, word: string): string {
  return `${n} ${word}${n !== 1 ? 's' : ''}`;
}

export function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}
