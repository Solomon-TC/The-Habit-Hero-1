"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { refreshSessionComprehensive } from "@/lib/auth-helpers";

export default function AuthRefreshButton({
  variant = "outline",
  size = "default",
  onSuccess = null,
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStatus("Refreshing session...");

    try {
      // Use the comprehensive refresh utility
      const result = await refreshSessionComprehensive();

      if (result.success) {
        setStatus("Session refreshed successfully!");

        // If onSuccess callback is provided, call it
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess(result);
          return; // Don't reload if callback is provided
        }

        // Force a refresh of the current page
        router.refresh();

        // Also reload the page to ensure fresh state
        setTimeout(() => window.location.reload(), 300);
      } else {
        console.error("Session refresh failed:", result.errors);
        setStatus("Refresh failed. Reloading page...");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error("Error during session refresh:", error);
      setStatus("Error occurred. Reloading page...");
      // If comprehensive refresh fails, reload the page
      setTimeout(() => window.location.reload(), 1000);
    } finally {
      // This might not run due to the page reload
      setTimeout(() => {
        setIsRefreshing(false);
        setStatus(null);
      }, 2000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw
        className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
      />
      {isRefreshing ? "Refreshing..." : "Refresh Session"}
    </Button>
  );
}
