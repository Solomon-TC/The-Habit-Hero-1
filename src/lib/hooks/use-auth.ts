"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<
    typeof createBrowserClient
  > | null>(null);

  // Initialize Supabase client once
  useEffect(() => {
    // Don't attempt to initialize on server
    if (typeof window === "undefined") {
      console.warn("Supabase client initialization skipped on server");
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase environment variables");
        setError("Missing Supabase configuration");
        setIsLoading(false);
        return;
      }

      // Check if debug mode is enabled
      const isDebugMode = localStorage.getItem("auth-debug-mode") === "true";
      setDebugMode(isDebugMode);

      // Create client with proper error handling
      const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
      setSupabase(client);
      console.log("Supabase client initialized successfully");

      // Immediately check if we have a session cookie
      const hasSessionCookie =
        document.cookie.includes("sb-") ||
        localStorage.getItem("supabase.auth.token") ||
        localStorage.getItem("sb-access-token") ||
        localStorage.getItem("sb-refresh-token");

      if (hasSessionCookie) {
        console.log("Found existing auth cookies/tokens");
      } else {
        console.log("No auth cookies/tokens found");
      }
    } catch (err) {
      console.error("Error initializing Supabase client:", err);
      setError("Failed to initialize authentication");
      setIsLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        console.error("No Supabase client available");
        setError("Authentication service unavailable");
        setUserId(null);
        setIsLoading(false);
        return;
      }

      // Check if debug mode is enabled and a test user ID exists
      if (debugMode) {
        const testUserId = localStorage.getItem("debug-user-id");
        if (testUserId) {
          console.log("Debug mode active: Using test user ID", testUserId);
          setUserId(testUserId);
          setIsLoading(false);
          return;
        }
      }

      // Try to get session first (most reliable)
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionData?.session) {
          console.log("Session found:", sessionData.session.user.id);
          setUserId(sessionData.session.user.id);

          // Verify user exists in public.users table
          try {
            const { data: userData, error: userDbError } = await supabase
              .from("users")
              .select("id")
              .eq("id", sessionData.session.user.id)
              .single();

            if (userDbError || !userData) {
              console.log(
                "User not found in public.users table, creating record",
              );
              // Create user record if it doesn't exist
              await supabase.from("users").upsert({
                id: sessionData.session.user.id,
                email: sessionData.session.user.email,
                name: sessionData.session.user.email?.split("@")[0] || "User",
                display_name:
                  sessionData.session.user.email?.split("@")[0] || "User",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                level: 1,
                xp: 0,
              });
            }
          } catch (userCheckError) {
            console.error(
              "Error checking/creating user record:",
              userCheckError,
            );
            // Continue even if this fails
          }

          setIsLoading(false);
          return;
        }

        if (sessionError) {
          console.log("Session error:", sessionError.message);
          // Try to refresh the session via API
          try {
            const response = await fetch("/api/auth/refresh");
            const data = await response.json();

            if (data.success && data.user) {
              console.log("Session refreshed via API:", data.user.id);
              setUserId(data.user.id);
              setIsLoading(false);
              return;
            }
          } catch (refreshError) {
            console.error("Error refreshing session via API:", refreshError);
          }
        }
      } catch (sessionErr) {
        console.error("Error getting session:", sessionErr);
      }

      // If session approach failed, try getting user directly
      try {
        const { data, error: userError } = await supabase.auth.getUser();

        if (data?.user) {
          console.log("User authenticated:", data.user.id);
          setUserId(data.user.id);

          // Verify user exists in public.users table
          try {
            const { data: userData, error: userDbError } = await supabase
              .from("users")
              .select("id")
              .eq("id", data.user.id)
              .single();

            if (userDbError || !userData) {
              console.log(
                "User not found in public.users table, creating record",
              );
              // Create user record if it doesn't exist
              await supabase.from("users").upsert({
                id: data.user.id,
                email: data.user.email,
                name: data.user.email?.split("@")[0] || "User",
                display_name: data.user.email?.split("@")[0] || "User",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                level: 1,
                xp: 0,
              });
            }
          } catch (userCheckError) {
            console.error(
              "Error checking/creating user record:",
              userCheckError,
            );
            // Continue even if this fails
          }
        } else {
          // No user found or error occurred
          if (userError) {
            // Only log the error, don't set it as user-facing error
            console.log(
              "Auth getUser error (expected if not logged in):",
              userError.message,
            );
          } else {
            console.log("No authenticated user found");
          }
          setUserId(null);
        }
      } catch (authErr) {
        console.error("Error in auth.getUser():", authErr);
        // Don't set error state for auth errors - just treat as logged out
        setUserId(null);
      }
    } catch (err) {
      console.error("Unexpected error in auth check:", err);
      setError("An unexpected error occurred");
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, debugMode]);

  // Run auth check when supabase client is available
  useEffect(() => {
    if (supabase) {
      checkAuth();
    }
  }, [supabase, checkAuth]);

  // Enable debug mode function
  const enableDebugMode = useCallback(
    (testUserId: string = "00000000-0000-0000-0000-000000000000") => {
      localStorage.setItem("auth-debug-mode", "true");
      localStorage.setItem("debug-user-id", testUserId);
      setDebugMode(true);
      setUserId(testUserId);
      setError(null);
      setIsLoading(false);
    },
    [checkAuth],
  );

  // Disable debug mode function
  const disableDebugMode = useCallback(() => {
    localStorage.removeItem("auth-debug-mode");
    localStorage.removeItem("debug-user-id");
    setDebugMode(false);
    checkAuth();
  }, [checkAuth]);

  return {
    userId,
    isLoading,
    error,
    checkAuth,
    debugMode,
    enableDebugMode,
    disableDebugMode,
  };
}
