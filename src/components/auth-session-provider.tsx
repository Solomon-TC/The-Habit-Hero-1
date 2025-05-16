"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { checkAuthentication } from "@/lib/auth-helpers";

type AuthSessionContextType = {
  isAuthenticated: boolean;
  user: any | null;
  session: any | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<boolean>;
};

const AuthSessionContext = createContext<AuthSessionContextType>({
  isAuthenticated: false,
  user: null,
  session: null,
  accessToken: null,
  loading: true,
  error: null,
  refreshSession: async () => false,
});

export function useAuthSession() {
  return useContext(AuthSessionContext);
}

// Create a reusable function for Supabase client initialization
const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      options: {
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );
};

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = async () => {
    try {
      // Only show loading state for initial authentication
      if (!isAuthenticated) {
        setLoading(true);
      }
      setError(null);

      // Create a client with explicit persistence options
      const supabase = createSupabaseClient();

      // First try to get the session directly to avoid unnecessary refreshes
      const { data: directSession } = await supabase.auth.getSession();

      // If we have a valid session already, use it
      if (directSession?.session?.access_token) {
        console.log("✅ Valid session found directly");
        setIsAuthenticated(true);
        setUser(directSession.session.user);
        setSession(directSession.session);
        setAccessToken(directSession.session.access_token);
        return true;
      }

      // If no valid session, proceed with comprehensive check
      const {
        isAuthenticated: authStatus,
        user: userData,
        session: sessionData,
        accessToken: token,
        errors,
      } = await checkAuthentication();

      // Always update the authentication state to ensure consistency
      setIsAuthenticated(authStatus);
      if (userData) setUser(userData);
      if (sessionData) setSession(sessionData);
      if (token) setAccessToken(token);

      // Log the authentication state for debugging
      console.log(
        `Auth state updated: authenticated=${authStatus}, userId=${userData?.id || "none"}`,
      );
      } catch (authError) {
        console.error("Error checking authentication:", authError);
        return false;
      }

      // Only show errors if we're not authenticated and have actual errors
      // This prevents showing errors during background refreshes
      if (!authStatus && errors && !isAuthenticated) {
        // Silently handle authentication failures without console errors
        setError("Failed to authenticate. Please sign in again.");
        return false;
      }

      // If we were previously authenticated but now we're not, and there are no errors,
      // this might be a temporary network issue - don't update state
      if (isAuthenticated && !authStatus && !errors) {
        console.warn(
          "Session refresh failed but no errors reported - might be temporary",
        );
        return true; // Return true to prevent logout on temporary issues
      }

      return authStatus;
    } catch (err) {
      console.error("Error refreshing session:", err);

      // Only show errors and reset state for critical failures
      // For transient errors, maintain the current state
      if (
        !isAuthenticated ||
        err.toString().includes("fatal") ||
        err.toString().includes("expired")
      ) {
        setError("An unexpected error occurred");
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
        setAccessToken(null);
        return false;
      }

      // For non-critical errors during background refresh, maintain current state
      return isAuthenticated;
    } finally {
      setLoading(false);
    }
  };

  // Initial authentication check and session persistence
  useEffect(() => {
    const initSession = async () => {
      // First try to get the session directly using the Supabase client
      const supabase = createSupabaseClient();

      const { data: sessionData } = await supabase.auth.getSession();

      // If we have a valid session, use it immediately to prevent flicker
      if (sessionData?.session?.access_token) {
        setIsAuthenticated(true);
        setUser(sessionData.session.user);
        setSession(sessionData.session);
        setAccessToken(sessionData.session.access_token);
        setLoading(false);
        console.log("✅ Initial session found directly");
      }

      // Still run the full refresh to ensure everything is in sync
      const success = await refreshSession();

      // If initial refresh fails, try again after a short delay
      if (!success) {
        setTimeout(async () => {
          await refreshSession();
        }, 2000);
      }
    };

    initSession();

    // Set up more frequent refresh (every 2 minutes instead of 4)
    const intervalId = setInterval(
      () => {
        refreshSession();
      },
      2 * 60 * 1000,
    );

    // Add event listeners for visibility changes to refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also refresh on network reconnection
    window.addEventListener("online", refreshSession);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", refreshSession);
    };
  }, []);

  const value = {
    isAuthenticated,
    user,
    session,
    accessToken,
    loading,
    error,
    refreshSession,
  };

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
