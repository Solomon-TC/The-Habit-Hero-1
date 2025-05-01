import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// Create a singleton instance to avoid multiple instances
let supabaseClient: ReturnType<
  typeof createClientComponentClient<Database>
> | null = null;

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Server-side - create a new client each time
    return createClientComponentClient<Database>();
  }

  // Client-side - use singleton pattern
  if (!supabaseClient) {
    try {
      supabaseClient = createClientComponentClient<Database>();
      console.log("Supabase client initialized");
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      // Return a new instance as fallback
      return createClientComponentClient<Database>();
    }
  }

  return supabaseClient;
}

// Helper function to check if a user is authenticated
export async function checkUserAuthentication() {
  const supabase = getSupabaseClient();

  try {
    // Try session first
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      return { authenticated: true, userId: sessionData.session.user.id };
    }

    // Try getUser as fallback
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      return { authenticated: true, userId: userData.user.id };
    }

    // No authentication found
    return { authenticated: false, userId: null };
  } catch (error) {
    console.error("Error checking authentication:", error);
    return { authenticated: false, userId: null, error };
  }
}
