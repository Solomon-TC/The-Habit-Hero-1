import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabaseClient() {
  try {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name) {
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          },
          async set(name, value, options) {
            await cookieStore.set({ name, value, ...options });
          },
          async remove(name, options) {
            await cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );
  } catch (error) {
    console.error("Error creating server Supabase client:", error);
    return null;
  }
}

export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error("SUPABASE_SERVICE_KEY is not defined");
    return null;
  }

  try {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || "",

      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  } catch (error) {
    console.error("Error creating service role client:", error);
    return null;
  }
}

// For backward compatibility
export const createClient = createServerSupabaseClient;
