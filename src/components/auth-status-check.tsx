"use client";

import { useEffect, useState } from "react";
import { checkUserAuthentication } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

interface AuthStatusCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthStatusCheck({
  children,
  fallback,
}: AuthStatusCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const { authenticated } = await checkUserAuthentication();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First try to refresh auth via API
      await fetch("/api/auth/refresh");
      // Then check auth again
      await checkAuth();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-500 mb-6">
            Please sign in to access this content
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Sign In
            </Link>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Session"}
            </Button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
