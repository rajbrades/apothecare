import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

// Note: Supabase's generated Database generic is incompatible with TypeScript 5.9
// strict inference (all table operations resolve to `never`). We return an untyped
// client; runtime behaviour is unaffected.

export async function createClient(): Promise<AnySupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// Service role client for admin operations (audit logs, etc.)
// Uses standalone client — no cookie dependency, bypasses RLS intentionally.
let serviceClient: AnySupabaseClient | null = null;

export function createServiceClient(): AnySupabaseClient {
  if (!serviceClient) {
    serviceClient = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }
  return serviceClient;
}
