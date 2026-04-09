// ── Shared constants ─────────────────────────────────────────────────────────

// FIX: demo mode detection — single source of truth instead of per-file declarations
export const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL;

// FIX: default doctor ID — used as fallback when getDoctorId() hasn't resolved yet.
// This should be replaced with a proper env variable or removed once multi-doctor is supported.
export const DEFAULT_DOCTOR_ID = 'c1d4a81a-9d10-4e70-acfd-e223fe4b8e90';
