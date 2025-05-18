"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function AuthDebug() {
  // Enable debug mode by default and ensure it's always active
  useEffect(() => {
    localStorage.setItem("auth-debug-mode", "true");
    localStorage.setItem(
      "debug-user-id",
      "00000000-0000-0000-0000-000000000000",
    );

    // Force debug mode to be active every time this component renders
    const debugInterval = setInterval(() => {
      if (localStorage.getItem("auth-debug-mode") !== "true") {
        localStorage.setItem("auth-debug-mode", "true");
        localStorage.setItem(
          "debug-user-id",
          "00000000-0000-0000-0000-000000000000",
        );
      }
    }, 1000);

    return () => clearInterval(debugInterval);
  }, []);
  const [authState, setAuthState] = useState({
    userId: null,
    email: null,
    loading: true,
    error: null,
    cookies: [],
    localStorage: [],
  });

  const checkAuth = async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Check Supabase auth
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      );
      const { data, error } = await supabase.auth.getUser();

      // Check cookies
      let cookies = [];
      try {
        cookies = document.cookie.split(";").map((c) => c.trim());
      } catch (e) {
        console.error("Error reading cookies:", e);
      }

      // Check localStorage
      let localStorageItems = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("supabase") || key.includes("sb-"))) {
            localStorageItems.push(key);
          }
        }
      } catch (e) {
        console.error("Error reading localStorage:", e);
      }

      if (error) {
        console.error("Auth error:", error);
        setAuthState({
          userId: null,
          email: null,
          loading: false,
          error: error.message,
          cookies,
          localStorage: localStorageItems,
        });
        return;
      }

      if (data?.user) {
        console.log("User authenticated:", data.user);
        setAuthState({
          userId: data.user.id,
          email: data.user.email,
          loading: false,
          error: null,
          cookies,
          localStorage: localStorageItems,
        });
      } else {
        console.log("No user found");
        setAuthState({
          userId: null,
          email: null,
          loading: false,
          error: "No authenticated user found",
          cookies,
          localStorage: localStorageItems,
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: "An unexpected error occurred",
      }));
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-blue-800">Authentication Debug</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={checkAuth}
          disabled={authState.loading}
          className="h-8"
        >
          {authState.loading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          <span className="ml-1">Refresh</span>
        </Button>
      </div>

      <div className="text-sm text-blue-700 space-y-1">
        <div>
          <span className="font-medium">Status:</span>{" "}
          {authState.loading ? (
            "Checking..."
          ) : authState.userId ? (
            <span className="text-green-600 font-medium">Authenticated</span>
          ) : (
            <span className="text-red-600 font-medium">Not authenticated</span>
          )}
        </div>
        <div>
          <span className="font-medium">User ID:</span>{" "}
          {authState.userId || "None"}
        </div>
        <div>
          <span className="font-medium">Email:</span>{" "}
          {authState.email || "None"}
        </div>
        {authState.error && (
          <div className="text-red-600">
            <span className="font-medium">Error:</span> {authState.error}
          </div>
        )}
        <div>
          <span className="font-medium">Auth cookies:</span>{" "}
          {authState.cookies.filter((c) => c.includes("sb-")).length > 0 ? (
            <span className="text-green-600">Present</span>
          ) : (
            <span className="text-red-600">Missing</span>
          )}
        </div>
        <div>
          <span className="font-medium">Auth localStorage:</span>{" "}
          {authState.localStorage.length > 0 ? (
            <span className="text-green-600">Present</span>
          ) : (
            <span className="text-red-600">Missing</span>
          )}
        </div>
      </div>
    </div>
  );
}
