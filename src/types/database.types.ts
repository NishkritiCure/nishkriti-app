// PLACEHOLDER — generated types will be written here by `pnpm run types:db`.
// TODO(phase-a): regenerate against the dev Supabase project once the schema is finalized.
//   Run: pnpm run types:db
// The shape below is intentionally permissive so the Supabase client compiles; any
// real query will need real generated types before phase-b lands.

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
