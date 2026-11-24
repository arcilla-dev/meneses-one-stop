import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file into a "use client" component —
// the service role key bypasses RLS entirely and must never reach the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
{
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);