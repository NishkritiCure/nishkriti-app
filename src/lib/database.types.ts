// Auto-generated from Supabase — regenerated 2026-04-10 after migration 003
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_check_ins: {
        Row: {
          adherence_yesterday: string | null
          check_in_date: string
          created_at: string | null
          energy_level: number | null
          fbs_mg_dl: number | null
          hip_cm: number | null
          id: string
          message_for_doctor: string | null
          patient_id: string
          photo_back_url: string | null
          photo_front_url: string | null
          photo_side_url: string | null
          requests: Json | null
          sleep_hours: number | null
          symptoms: string[] | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          adherence_yesterday?: string | null
          check_in_date?: string
          created_at?: string | null
          energy_level?: number | null
          fbs_mg_dl?: number | null
          hip_cm?: number | null
          id?: string
          message_for_doctor?: string | null
          patient_id: string
          photo_back_url?: string | null
          photo_front_url?: string | null
          photo_side_url?: string | null
          requests?: Json | null
          sleep_hours?: number | null
          symptoms?: string[] | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          adherence_yesterday?: string | null
          check_in_date?: string
          created_at?: string | null
          energy_level?: number | null
          fbs_mg_dl?: number | null
          hip_cm?: number | null
          id?: string
          message_for_doctor?: string | null
          patient_id?: string
          photo_back_url?: string | null
          photo_front_url?: string | null
          photo_side_url?: string | null
          requests?: Json | null
          sleep_hours?: number | null
          symptoms?: string[] | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          calorie_target: number | null
          carbs_target_g: number | null
          check_in_id: string | null
          created_at: string | null
          diet_type: string
          doctor_flag_raised: boolean | null
          doctor_flag_reason: string | null
          doctor_note: string | null
          doctor_reviewed_at: string | null
          fat_target_g: number | null
          flag_status: string | null
          id: string
          meals: Json
          patient_id: string
          plan_date: string
          protein_target_g: number | null
          reasoning: string | null
          rules_fired: Json | null
          status: string | null
          supplement_note: string | null
          supplements: Json | null
          water_target_ml: number | null
          workout: Json
        }
        Insert: {
          calorie_target?: number | null
          carbs_target_g?: number | null
          check_in_id?: string | null
          created_at?: string | null
          diet_type: string
          doctor_flag_raised?: boolean | null
          doctor_flag_reason?: string | null
          doctor_note?: string | null
          doctor_reviewed_at?: string | null
          fat_target_g?: number | null
          flag_status?: string | null
          id?: string
          meals?: Json
          patient_id: string
          plan_date?: string
          protein_target_g?: number | null
          reasoning?: string | null
          rules_fired?: Json | null
          status?: string | null
          supplement_note?: string | null
          supplements?: Json | null
          water_target_ml?: number | null
          workout?: Json
        }
        Update: {
          calorie_target?: number | null
          carbs_target_g?: number | null
          check_in_id?: string | null
          created_at?: string | null
          diet_type?: string
          doctor_flag_raised?: boolean | null
          doctor_flag_reason?: string | null
          doctor_note?: string | null
          doctor_reviewed_at?: string | null
          fat_target_g?: number | null
          flag_status?: string | null
          id?: string
          meals?: Json
          patient_id?: string
          plan_date?: string
          protein_target_g?: number | null
          reasoning?: string | null
          rules_fired?: Json | null
          status?: string | null
          supplement_note?: string | null
          supplements?: Json | null
          water_target_ml?: number | null
          workout?: Json
        }
        Relationships: []
      }
      doctors: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          clinic_city: string | null
          clinic_name: string | null
          created_at: string | null
          credential: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          registration: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          created_at?: string | null
          credential?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          registration?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          created_at?: string | null
          credential?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          registration?: string | null
        }
        Relationships: []
      }
      lab_results: {
        Row: { [key: string]: any }
        Insert: { patient_id: string; test_date: string; [key: string]: any }
        Update: { [key: string]: any }
        Relationships: []
      }
      // TODO: DB schema has `read_at` but doctorService queries `read_by_doctor` which doesn't
      // exist in this type. If the column exists in DB, regenerate types. If not, add a migration.
      messages: {
        Row: {
          attachments: string[] | null
          body: string
          created_at: string | null
          doctor_id: string
          id: string
          patient_id: string
          read_at: string | null
          sender_role: string
          urgency: string | null
          vitals_snapshot: Json | null
        }
        Insert: {
          attachments?: string[] | null
          body: string
          created_at?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          read_at?: string | null
          sender_role: string
          urgency?: string | null
          vitals_snapshot?: Json | null
        }
        Update: {
          attachments?: string[] | null
          body?: string
          created_at?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          read_at?: string | null
          sender_role?: string
          urgency?: string | null
          vitals_snapshot?: Json | null
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          activity_level: string | null
          allergies: string[] | null
          assigned_diet_type: string | null
          assigned_doctor_id: string | null
          auth_id: string | null
          available_minutes: number | null
          baseline_fbs: number | null
          baseline_hba1c: number | null
          baseline_hip: number | null
          baseline_waist: number | null
          baseline_weight: number | null
          conditions: string[]
          cooking_setup: string | null
          cuisine_preference: string[] | null
          current_phase: number | null
          diet_preference: string | null
          disliked_foods: string[] | null
          dob: string
          full_name: string
          goals: string[] | null
          height_cm: number
          id: string
          initial_password: string | null
          injuries: string[] | null
          last_active_at: string | null
          medications: Json | null
          onboarded_at: string | null
          phone: string | null
          preferred_workout_time: string | null
          primary_condition: string
          programme_start_date: string | null
          sex: string
          uhid: string | null
          weight_kg: number
          workout_equipment: string[] | null
          workout_location: string[] | null
        }
        Insert: {
          activity_level?: string | null
          allergies?: string[] | null
          assigned_diet_type?: string | null
          assigned_doctor_id?: string | null
          auth_id?: string | null
          available_minutes?: number | null
          baseline_fbs?: number | null
          baseline_hba1c?: number | null
          baseline_hip?: number | null
          baseline_waist?: number | null
          baseline_weight?: number | null
          conditions?: string[]
          cooking_setup?: string | null
          cuisine_preference?: string[] | null
          current_phase?: number | null
          diet_preference?: string | null
          disliked_foods?: string[] | null
          dob: string
          full_name: string
          goals?: string[] | null
          height_cm: number
          id?: string
          initial_password?: string | null
          injuries?: string[] | null
          last_active_at?: string | null
          medications?: Json | null
          onboarded_at?: string | null
          phone?: string | null
          preferred_workout_time?: string | null
          primary_condition: string
          programme_start_date?: string | null
          sex: string
          uhid?: string | null
          weight_kg: number
          workout_equipment?: string[] | null
          workout_location?: string[] | null
        }
        Update: {
          [key: string]: any
        }
        Relationships: []
      }
      patient_supplements: {
        Row: {
          created_at: string | null
          dose: string | null
          id: string
          is_active: boolean | null
          name: string
          patient_id: string
          patient_reason: string | null
          prescribed_by: string | null
          timing: string | null
          with_food: string | null
        }
        Insert: {
          created_at?: string | null
          dose?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          patient_id: string
          patient_reason?: string | null
          prescribed_by?: string | null
          timing?: string | null
          with_food?: string | null
        }
        Update: { [key: string]: any }
        Relationships: []
      }
      plan_audit: {
        Row: { [key: string]: any }
        Insert: { action: string; patient_id: string; [key: string]: any }
        Update: { [key: string]: any }
        Relationships: []
      }
      progress_entries: {
        Row: {
          bicep_l_cm: number | null
          bmi: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          created_at: string | null
          entry_date: string
          fbs_mg_dl: number | null
          hip_cm: number | null
          id: string
          neck_cm: number | null
          notes: string | null
          patient_id: string
          thigh_l_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          patient_id: string
          [key: string]: any
        }
        Update: { [key: string]: any }
        Relationships: []
      }
      protocols: {
        Row: {
          calorie_deficit: number | null
          calorie_target: number | null
          carbs_target_g: number | null
          condition: string
          created_at: string | null
          current_phase: number | null
          custom_rules: Json | null
          diet_type: string | null
          doctor_id: string | null
          exercise_duration_min: number | null
          exercise_frequency: string | null
          exercise_intensity: string | null
          exercise_notes: string | null
          exercise_type: string | null
          fat_target_g: number | null
          fbs_act_max: number | null
          fbs_amber_max: number | null
          fbs_green_max: number | null
          fbs_green_min: number | null
          id: string
          is_active: boolean | null
          medications: Json | null
          notes: string | null
          patient_id: string
          phase_name: string | null
          phases: Json | null
          protein_target_g: number | null
          supplements: Json | null
          techniques: Json | null
          updated_at: string | null
        }
        Insert: {
          condition: string
          patient_id: string
          [key: string]: any
        }
        Update: { [key: string]: any }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          id: string
          log_date: string
          patient_id: string
          supplement_id: string | null
          taken: boolean | null
          taken_at: string | null
        }
        Insert: {
          patient_id: string
          [key: string]: any
        }
        Update: { [key: string]: any }
        Relationships: []
      }
    }
    Views: {
      doctor_patient_summary: {
        Row: { [key: string]: any }
        Relationships: []
      }
      patient_fbs_trend: {
        Row: { [key: string]: any }
        Relationships: []
      }
    }
    Functions: {
      generate_uhid: { Args: Record<string, never>; Returns: string }
      get_doctor_dashboard: { Args: { doctor_auth_id: string }; Returns: Json }
      get_patient_fbs_history: { Args: { p_patient_id: string; p_days: number }; Returns: Json }
      flag_plan_for_doctor: { Args: { p_plan_id: string; p_reason: string }; Returns: void }
    }
    Enums: {
      condition_type: string
      diet_type: string
      flag_status: string
      severity_type: string
      sex_type: string
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
