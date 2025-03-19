"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force a refresh of the current page
    router.refresh();
    // Reset the refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
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
