// Server-side Supabase client for server actions only
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// This file should only be imported in App Router Server Components or Server Actions
export const createServerSupabaseClient = async () => {
  // Create a server-side client
  let cookieStore;

  // Only import cookies on the server side
  if (typeof window === "undefined") {
    try {
      // Dynamic import to avoid client-side import of next/headers
      const { cookies } = await import("next/headers");
      // Store cookies() in a variable and await it before using
      try {
        cookieStore = await cookies();
      } catch (error) {
        console.error("Error getting cookies:", error);
        return null;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase environment variables");
        return null;
      }

      return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          async get(name: string) {
            try {
              // Ensure we're using the cookie store correctly
              const cookie = await cookieStore.get(name);
              return cookie?.value;
            } catch (error) {
              console.error("Error getting cookie:", error);
              return undefined;
            }
          },
          async set(name: string, value: string, options: any) {
            try {
              await cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error("Error setting cookie:", error);
            }
          },
          async remove(name: string, options: any) {
            try {
              await cookieStore.set({ name, value: "", ...options });
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
  } else {
    // Client-side implementation
    console.warn(
      "createServerSupabaseClient is being used on the client side. This is not recommended.",
    );

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase environment variables");
        return null;
      }

      return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            try {
              const cookies = document.cookie.split("; ");
              const cookie = cookies.find((c) => c.startsWith(`${name}=`));
              return cookie ? cookie.split("=")[1] : undefined;
            } catch (error) {
              console.error("Error getting cookie:", error);
              return undefined;
            }
          },
          set(name: string, value: string, options: any) {
            try {
              let cookie = `${name}=${value}`;
              if (options.expires) {
                cookie += `; expires=${options.expires.toUTCString()}`;
              }
              if (options.path) {
                cookie += `; path=${options.path}`;
              }
              if (options.domain) {
                cookie += `; domain=${options.domain}`;
              }
              if (options.secure) {
                cookie += `; secure`;
              }
              document.cookie = cookie;
            } catch (error) {
              console.error("Error setting cookie:", error);
            }
          },
          remove(name: string, options: any) {
            try {
              this.set(name, "", { ...options, expires: new Date(0) });
            } catch (error) {
              console.error("Error removing cookie:", error);
            }
          },
        },
      });
    } catch (error) {
      console.error("Error creating client-side Supabase client:", error);
      return null;
    }
  }
};

// Create a service role client that bypasses RLS
export const createServiceRoleClient = () => {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase service role environment variables");
      return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("Error creating service role client:", error);
    return null;
  }
};
