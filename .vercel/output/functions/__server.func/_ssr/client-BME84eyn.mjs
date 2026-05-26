import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
function createSupabaseClient() {
  const SUPABASE_URL = "https://mtxytfhltajnrjfcvkci.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eHl0ZmhsdGFqbnJqZmN2a2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjM2OTAsImV4cCI6MjA5NTAzOTY5MH0.saQqQWU3p83zIfQGdGFALol5JJZTtE5q1Re0KZbfqc4";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
let _supabase;
const supabase = new Proxy(
  {},
  {
    get(_, prop, receiver) {
      if (!_supabase) _supabase = createSupabaseClient();
      return Reflect.get(_supabase, prop, receiver);
    },
  },
);
export { supabase as s };
