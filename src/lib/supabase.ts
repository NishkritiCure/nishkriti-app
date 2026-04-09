import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

const SUPABASE_URL     = process.env.EXPO_PUBLIC_SUPABASE_URL     ?? '';
const SUPABASE_ANON_KEY= process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Guard: do not create a real client when env vars are missing (DEMO_MODE).
// Downstream code that imports this module will get a dummy client that
// does nothing, so the module can be safely imported without throwing.
function createSafeClient(): SupabaseClient<Database> {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  // Return a lightweight proxy that throws helpful errors if actually used
  // while allowing the module to be imported safely in demo mode.
  console.warn('[supabase] No EXPO_PUBLIC_SUPABASE_URL set — running in DEMO MODE. Supabase calls will no-op.');
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'auth') {
        return new Proxy({}, {
          get() {
            return (..._args: any[]) =>
              Promise.resolve({ data: { user: null, session: null, subscription: { unsubscribe() {} } }, error: null });
          },
        });
      }
      if (prop === 'from' || prop === 'rpc') {
        return () => new Proxy({}, { get() { return (..._args: any[]) => Promise.resolve({ data: null, error: null }); } });
      }
      return undefined;
    },
  };
  return new Proxy({} as any, handler);
}

export const supabase = createSafeClient();

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
