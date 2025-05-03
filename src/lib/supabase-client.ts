import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// Create a singleton instance to avoid multiple instances
let supabaseClient: ReturnType<
  typeof createClientComponentClient<Database>
> | null = null;

// Track when the client was last initialized
let lastInitTime = 0;

export function getSupabaseClient() {
  const clientOptions = {
    options: {
      persistSession: true,
      autoRefreshToken: true,
      // Ensure cookies are used for storage with consistent settings
      cookieOptions: {
        name: "sb-auth-token",
        lifetime: 60 * 60 * 24 * 7, // 1 week
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // Ensure cookie is available across the entire site
      },
    },
  };

  if (typeof window === "undefined") {
    // Server-side - create a new client each time with the same options
    return createClientComponentClient<Database>(clientOptions);
  }

  // For client-side, we want to maintain a single instance to ensure consistent session handling
  if (!supabaseClient) {
    try {
      // Create a new client with explicit session persistence
      supabaseClient = createClientComponentClient<Database>(clientOptions);

      lastInitTime = Date.now();
      console.log("Supabase client initialized with persistent session");
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      // Return a new instance as fallback with the same persistence options
      return createClientComponentClient<Database>({
        options: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
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
