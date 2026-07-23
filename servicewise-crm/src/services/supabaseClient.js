import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey,
);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
  );
}

export const supabase = createClient(
  supabaseUrl ||
    "https://servicewise-placeholder.supabase.co",
  supabaseKey || "servicewise-placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the project .env file, then restart Vite.",
    );
  }
}

export default supabase;
