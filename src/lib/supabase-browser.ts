// Browser-side Supabase client (safe to use in Client Components)
import { createBrowserClient } from "@supabase/ssr";

export const createBrowserSupabaseClient = () => {
  if (typeof window === "undefined") {
    console.warn("createBrowserSupabaseClient called on the server");
    return null;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return null;
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Error creating browser Supabase client:", error);
    return null;
  }
};
