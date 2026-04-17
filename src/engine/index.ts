export { generate } from './adaptiveEngine'
export { mergeEngineLayers } from './engineConfig'
export {
  calculateAge,
  calculateBMR,
  calculateMacros,
  calculateTDEE,
  determineEffectiveDietType,
  splitMacros,
} from './macroCalculator'
export { selectAllMeals, selectMealForSlot, patientSeededIndex } from './mealSelector'
export {
  computePostMealWalks,
  computeWaterTarget,
  determineDuration,
  determineIntensity,
  determineWorkoutType,
  isRestDay,
  selectExercises,
  selectWorkout,
} from './exerciseSelector'
export { buildDoctorReasoning, buildPatientReasoning, humanDietType } from './reasoningBuilder'
export {
  checkOperator,
  evaluateRules,
  getMetricValue,
  isDataSourceAvailable,
  renderTemplate,
  ruleAppliesToPatient,
  evaluateFbsRules,
  evaluatePostMealRules,
  evaluateBpRules,
  evaluateWeightRules,
  evaluateSymptomRules,
  evaluateAdherenceRules,
  evaluateEnergyRules,
  evaluateRequestRules,
  evaluateSpecialRules,
} from './ruleEvaluator'
export type * from './types'
