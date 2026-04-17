import type { Patient, Protocol } from '@/engine/types'

export function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'p-1',
    dob: '1990-01-01',
    sex: 'female',
    height_cm: 165,
    weight_kg: 70,
    activity_level: 'moderate',
    conditions: ['diabetes_t2'],
    primary_condition: 'diabetes_t2',
    diet_preference: 'veg',
    cuisine_preference: ['north_indian'],
    allergies: [],
    disliked_foods: [],
    workout_location: ['home'],
    workout_equipment: ['mat'],
    injuries: [],
    ...overrides,
  }
}

export function makeProtocol(overrides: Partial<Protocol> = {}): Protocol {
  return {
    id: 'pr-1',
    patient_id: 'p-1',
    condition: 'diabetes_t2',
    diet_type: 'low_carb',
    calorie_target: 1800,
    carbs_target_g: null,
    protein_target_g: null,
    fat_target_g: null,
    water_target_ml: null,
    ...overrides,
  }
}
