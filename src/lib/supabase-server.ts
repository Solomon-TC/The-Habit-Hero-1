import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabaseClient() {
  try {
    const cookieStore = cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return null;
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          try {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.error("Error getting cookie:", error);
            return undefined;
          }
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error("Error setting cookie:", error);
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.error("Error removing cookie:", error);
          }
        },
      },
    });
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not defined");
      return null;
    }

    return createSupabaseClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("Error creating service role client:", error);
    return null;
  }
}

// For backward compatibility
export const createClient = createServerSupabaseClient;
