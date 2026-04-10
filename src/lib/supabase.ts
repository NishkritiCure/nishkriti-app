import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL     ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase environment variables are not configured. ' +
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function isDoctor(): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;
  const { data } = await supabase.from('doctors').select('id').eq('auth_id', uid).single();
  return !!data;
}

export async function getPatientId(): Promise<string | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;
  const { data } = await supabase.from('patient_profiles').select('id').eq('auth_id', uid).single();
  return data?.id ?? null;
}

export async function getDoctorId(): Promise<string | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;
  const { data } = await supabase.from('doctors').select('id').eq('auth_id', uid).single();
  return data?.id ?? null;
}
