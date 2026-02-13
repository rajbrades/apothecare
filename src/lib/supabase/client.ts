import { createBrowserClient } from "@supabase/ssr";

// Note: Database generic removed — incompatible with TypeScript 5.9 strict inference.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
