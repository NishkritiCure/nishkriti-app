import type {
  DietType,
  ExerciseLibraryRow,
  MealLibraryRow,
  MealSlot,
  SupplementLibraryRow,
} from '@/engine/types'

export function makeMeal(overrides: Partial<MealLibraryRow> = {}): MealLibraryRow {
  return {
    id: overrides.id ?? 'm-default',
    external_id: overrides.external_id ?? 'EXT-M-1',
    name: overrides.name ?? 'Paneer Bhurji',
    cuisine: overrides.cuisine ?? 'north_indian',
    diet_types: overrides.diet_types ?? (['low_carb', 'maintenance'] as DietType[]),
    is_veg: overrides.is_veg ?? true,
    is_egg: overrides.is_egg ?? false,
    has_dairy: overrides.has_dairy ?? true,
    calories: overrides.calories ?? 320,
    macros: overrides.macros ?? { carbs: 12, protein: 20, fat: 18, fibre: 3 },
    gi: overrides.gi ?? 'low',
    ingredients: overrides.ingredients ?? [
      { name: 'paneer', grams: 100 },
      { name: 'onion', grams: 30 },
    ],
    prep_note: overrides.prep_note ?? null,
    portability: overrides.portability ?? 'medium',
    slots: overrides.slots ?? (['breakfast', 'lunch'] as MealSlot[]),
  }
}

export function makeExercise(overrides: Partial<ExerciseLibraryRow> = {}): ExerciseLibraryRow {
  return {
    id: overrides.id ?? 'e-default',
    external_id: overrides.external_id ?? 'EXT-E-1',
    name: overrides.name ?? 'Bodyweight Squat',
    category: overrides.category ?? 'strength',
    muscle_groups: overrides.muscle_groups ?? ['legs', 'glutes'],
    equipment_required: overrides.equipment_required ?? [],
    difficulty: overrides.difficulty ?? 2,
    instructions: overrides.instructions ?? ['Stand hip-width apart.', 'Lower, stand.'],
    duration_default_min: overrides.duration_default_min ?? 10,
    video_url: overrides.video_url ?? null,
    locations: overrides.locations ?? ['home'],
    contraindications: overrides.contraindications ?? [],
  }
}

export function makeSupplement(
  overrides: Partial<SupplementLibraryRow> = {}
): SupplementLibraryRow {
  return {
    id: overrides.id ?? 's-default',
    external_id: overrides.external_id ?? 'EXT-S-1',
    name: overrides.name ?? 'Vitamin D3',
    purpose: overrides.purpose ?? 'bone health',
    typical_dose: overrides.typical_dose ?? '2000 IU',
    timing_default: overrides.timing_default ?? 'with breakfast',
    with_food: overrides.with_food ?? 'yes',
    contraindications: overrides.contraindications ?? [],
    evidence_level: overrides.evidence_level ?? 'moderate',
  }
}

export function buildMealLibrary(): MealLibraryRow[] {
  return [
    makeMeal({
      id: 'm-poha',
      name: 'Poha',
      slots: ['breakfast'],
      diet_types: ['low_carb', 'maintenance', 'high_carb'],
      gi: 'medium',
      cuisine: 'north_indian',
      ingredients: [{ name: 'poha' }, { name: 'peanut' }],
      has_dairy: false,
    }),
    makeMeal({
      id: 'm-oats',
      name: 'Steel-cut Oats',
      slots: ['breakfast'],
      diet_types: ['low_carb', 'maintenance', 'high_protein'],
      gi: 'low',
      cuisine: 'continental',
      ingredients: [{ name: 'oats' }, { name: 'milk' }],
      has_dairy: true,
    }),
    makeMeal({
      id: 'm-apple',
      name: 'Apple + Almonds',
      slots: ['mid_morning'],
      diet_types: ['low_carb', 'maintenance', 'keto'],
      gi: 'low',
      cuisine: null,
      ingredients: [{ name: 'apple' }, { name: 'almond' }],
      macros: { carbs: 20, protein: 5, fat: 10, fibre: 4 },
      has_dairy: false,
    }),
    makeMeal({
      id: 'm-nuts',
      name: 'Mixed Nuts + Curd',
      slots: ['mid_morning'],
      diet_types: ['low_carb', 'keto', 'maintenance'],
      gi: 'low',
      cuisine: null,
      ingredients: [{ name: 'almond' }, { name: 'curd' }],
      macros: { carbs: 16, protein: 8, fat: 18, fibre: 3 },
      has_dairy: true,
    }),
    makeMeal({
      id: 'm-dal-roti',
      name: 'Dal + Roti',
      slots: ['lunch', 'dinner'],
      diet_types: ['low_carb', 'maintenance'],
      gi: 'medium',
      cuisine: 'north_indian',
      ingredients: [{ name: 'dal' }, { name: 'wheat_flour' }, { name: 'ghee' }],
      has_dairy: true,
    }),
    makeMeal({
      id: 'm-paneer-bhurji',
      name: 'Paneer Bhurji',
      slots: ['lunch', 'dinner', 'evening'],
      diet_types: ['low_carb', 'keto'],
      gi: 'low',
      cuisine: 'north_indian',
      ingredients: [{ name: 'paneer' }, { name: 'onion' }, { name: 'tomato' }],
      has_dairy: true,
    }),
    makeMeal({
      id: 'm-early-lemon',
      name: 'Warm Lemon Water',
      slots: ['early_morning'],
      diet_types: ['low_carb', 'keto', 'maintenance'],
      gi: 'low',
      cuisine: null,
      ingredients: [{ name: 'lemon' }, { name: 'water' }],
      has_dairy: false,
      macros: { carbs: 2, protein: 0, fat: 0, fibre: 0 },
      portability: 'high',
    }),
    makeMeal({
      id: 'm-evening-sprouts',
      name: 'Moong Sprouts Salad',
      slots: ['evening'],
      diet_types: ['low_carb', 'maintenance'],
      gi: 'low',
      cuisine: 'north_indian',
      ingredients: [{ name: 'moong' }, { name: 'lemon' }, { name: 'tomato' }],
      has_dairy: false,
      macros: { carbs: 14, protein: 10, fat: 3, fibre: 5 },
    }),
    makeMeal({
      id: 'm-travel-idli',
      name: 'Travel Idli Pack',
      slots: ['lunch', 'dinner'],
      diet_types: ['maintenance', 'high_carb'],
      gi: 'medium',
      cuisine: 'south_indian',
      ingredients: [{ name: 'idli' }, { name: 'chutney' }],
      has_dairy: false,
      portability: 'high',
    }),
  ]
}

export function buildExerciseLibrary(): ExerciseLibraryRow[] {
  return [
    makeExercise({
      id: 'e-squat',
      name: 'Bodyweight Squat',
      muscle_groups: ['legs'],
      difficulty: 2,
      locations: ['home', 'gym'],
    }),
    makeExercise({
      id: 'e-pushup',
      name: 'Push-Up',
      muscle_groups: ['chest', 'core'],
      difficulty: 2,
      locations: ['home', 'gym'],
    }),
    makeExercise({
      id: 'e-plank',
      name: 'Plank',
      muscle_groups: ['core', 'abs'],
      difficulty: 2,
      locations: ['home'],
    }),
    makeExercise({
      id: 'e-deadlift',
      name: 'Deadlift',
      muscle_groups: ['back', 'legs'],
      difficulty: 4,
      locations: ['gym'],
      equipment_required: ['barbell'],
    }),
    makeExercise({
      id: 'e-yoga',
      name: 'Sun Salutation',
      muscle_groups: ['core', 'back'],
      difficulty: 1,
      locations: ['home', 'outdoor'],
    }),
    makeExercise({
      id: 'e-walk',
      name: 'Brisk Walk',
      muscle_groups: ['legs'],
      difficulty: 1,
      locations: ['outdoor'],
      category: 'cardio',
    }),
  ]
}

export function buildSupplementLibrary(): SupplementLibraryRow[] {
  return [
    makeSupplement({ id: 's-b12', name: 'Vitamin B12', purpose: 'energy' }),
    makeSupplement({ id: 's-d3', name: 'Vitamin D3' }),
    makeSupplement({ id: 's-magnesium', name: 'Magnesium Glycinate', purpose: 'sleep' }),
  ]
}
