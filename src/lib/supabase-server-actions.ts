// Server-side Supabase client for server actions only
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// This file should only be imported in App Router Server Components or Server Actions
export const createServerSupabaseClient = async () => {
  // Create a server-side client
  let cookieStore;

  // Only import cookies on the server side
  if (typeof window === "undefined") {
    // Dynamic import to avoid client-side import of next/headers
    const { cookies } = await import("next/headers");
    // Store cookies() in a variable and await it before using
    cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            // Ensure we're using the cookie store correctly
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          },
          async set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          async remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );
  } else {
    // Client-side implementation
    console.warn(
      "createServerSupabaseClient is being used on the client side. This is not recommended.",
    );

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookies = document.cookie.split("; ");
            const cookie = cookies.find((c) => c.startsWith(`${name}=`));
            return cookie ? cookie.split("=")[1] : undefined;
          },
          set(name: string, value: string, options: any) {
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
          },
          remove(name: string, options: any) {
            this.set(name, "", { ...options, expires: new Date(0) });
          },
        },
      },
    );
  }
};

// Create a service role client that bypasses RLS
export const createServiceRoleClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase service role credentials");
    return null;
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
};
