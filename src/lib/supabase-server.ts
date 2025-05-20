import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Initialize global flag if it doesn't exist
if (typeof global.isPrerendering === "undefined") {
  global.isPrerendering = false;
}

export async function createServerSupabaseClient() {
  try {
    // Skip client creation during static build phase, prerendering, or when cookies are not available
    if (
      process.env.NEXT_PHASE === "phase-production-build" ||
      (typeof window === "undefined" &&
        process.env.NODE_ENV === "production" &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      process.env.NEXT_RUNTIME === "edge" ||
      // Additional check for prerendering context
      global.isPrerendering
    ) {
      console.log(
        "Skipping Supabase client creation during static build or prerendering",
      );
      return {
        auth: {
          getUser: async () => ({ data: { user: null } }),
          getSession: async () => ({ data: { session: null } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null }),
              maybeSingle: async () => ({ data: null }),
              limit: () => ({ data: [] }),
              order: () => ({ data: [] }),
              data: [],
            }),
            order: () => ({ data: [] }),
            limit: () => ({ data: [] }),
            data: [],
          }),
        }),
        functions: {
          invoke: async () => ({ data: null }),
        },
      };
    }

    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (error) {
      console.log("Cookies not available, likely during prerendering");
      global.isPrerendering = true;
      return {
        auth: {
          getUser: async () => ({ data: { user: null } }),
          getSession: async () => ({ data: { session: null } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null }),
              maybeSingle: async () => ({ data: null }),
              limit: () => ({ data: [] }),
              order: () => ({ data: [] }),
              data: [],
            }),
            order: () => ({ data: [] }),
            limit: () => ({ data: [] }),
            data: [],
          }),
        }),
        functions: {
          invoke: async () => ({ data: null }),
        },
      };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return {
        auth: {
          getUser: async () => ({ data: { user: null } }),
          getSession: async () => ({ data: { session: null } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null }),
              maybeSingle: async () => ({ data: null }),
              limit: () => ({ data: [] }),
              order: () => ({ data: [] }),
              data: [],
            }),
            order: () => ({ data: [] }),
            limit: () => ({ data: [] }),
            data: [],
          }),
        }),
        functions: {
          invoke: async () => ({ data: null }),
        },
      };
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        async get(name) {
          try {
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.error("Error getting cookie:", error);
            return undefined;
          }
        },
        async set(name, value, options) {
          try {
            await cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error("Error setting cookie:", error);
          }
        },
        async remove(name, options) {
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
    return {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        getSession: async () => ({ data: { session: null } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null }),
            maybeSingle: async () => ({ data: null }),
            limit: () => ({ data: [] }),
            order: () => ({ data: [] }),
            data: [],
          }),
          order: () => ({ data: [] }),
          limit: () => ({ data: [] }),
          data: [],
        }),
      }),
      functions: {
        invoke: async () => ({ data: null }),
      },
    };
  }
}

export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error("SUPABASE_SERVICE_KEY is not defined");
    return {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        getSession: async () => ({ data: { session: null } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null }),
            maybeSingle: async () => ({ data: null }),
            limit: () => ({ data: [] }),
            order: () => ({ data: [] }),
            data: [],
            eq: () => ({
              single: async () => ({ data: null }),
              maybeSingle: async () => ({ data: null }),
              limit: () => ({ data: [] }),
              order: () => ({ data: [] }),
              gte: () => ({ data: [] }),
              data: [],
            }),
            gte: () => ({ data: [] }),
          }),
          order: () => ({ data: [] }),
          limit: () => ({ data: [] }),
          data: [],
        }),
      }),
      functions: {
        invoke: async () => ({ data: null }),
      },
    };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not defined");
      return {
        auth: {
          getUser: async () => ({ data: { user: null } }),
          getSession: async () => ({ data: { session: null } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null }),
              maybeSingle: async () => ({ data: null }),
              limit: () => ({ data: [] }),
              order: () => ({ data: [] }),
              data: [],
              eq: () => ({
                single: async () => ({ data: null }),
                maybeSingle: async () => ({ data: null }),
                limit: () => ({ data: [] }),
                order: () => ({ data: [] }),
                gte: () => ({ data: [] }),
                data: [],
              }),
              gte: () => ({ data: [] }),
            }),
            order: () => ({ data: [] }),
            limit: () => ({ data: [] }),
            data: [],
          }),
        }),
        functions: {
          invoke: async () => ({ data: null }),
        },
      };
    }

    return createSupabaseClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("Error creating service role client:", error);
    return {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        getSession: async () => ({ data: { session: null } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null }),
            maybeSingle: async () => ({ data: null }),
            limit: () => ({ data: [] }),
            order: () => ({ data: [] }),
            data: [],
            eq: () => ({
              single: async () => ({ data: null }),
              maybeSingle: async () => ({ data: null }),
              limit: () => ({ data: [] }),
              order: () => ({ data: [] }),
              gte: () => ({ data: [] }),
              data: [],
            }),
            gte: () => ({ data: [] }),
          }),
          order: () => ({ data: [] }),
          limit: () => ({ data: [] }),
          data: [],
        }),
      }),
      functions: {
        invoke: async () => ({ data: null }),
      },
    };
  }
}

// For backward compatibility
export const createClient = createServerSupabaseClient;
