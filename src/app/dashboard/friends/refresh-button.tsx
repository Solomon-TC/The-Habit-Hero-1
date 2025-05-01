"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First try to refresh auth via API
      const response = await fetch("/api/auth/refresh");
      await response.json();

      // Force a refresh of the current page
      router.refresh();

      // Also reload the page to ensure fresh state
      setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      console.error("Error refreshing:", error);
      // If API call fails, just reload the page
      window.location.reload();
    } finally {
      // This might not run due to the page reload
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="ml-auto"
    >
      <RefreshCw
        className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
      />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </Button>
  );
}
