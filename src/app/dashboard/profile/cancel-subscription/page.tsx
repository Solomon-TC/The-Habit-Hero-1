"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/ssr";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import AuthRefreshButton from "@/components/auth-refresh-button";
import {
  refreshSessionComprehensive,
  checkAuthentication,
} from "@/lib/auth-helpers";
import { useAuthSession } from "@/components/auth-session-provider";

export default function CancelSubscriptionPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRefreshAttempted, setSessionRefreshAttempted] = useState(false);

  // Initialize Supabase client only on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        {
          cookies: {
            get(name) {
              const cookies = document.cookie.split("; ");
              const cookie = cookies.find((c) => c.startsWith(`${name}=`));
              return cookie ? cookie.split("=")[1] : undefined;
            },
            set(name, value, options) {
              let cookie = `${name}=${value}`;
              if (options?.expires)
                cookie += `; expires=${options.expires.toUTCString()}`;
              if (options?.path) cookie += `; path=${options.path}`;
              if (options?.domain) cookie += `; domain=${options.domain}`;
              if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
              if (options?.secure) cookie += `; secure`;
              document.cookie = cookie;
            },
            remove(name, options) {
              const newOptions = { ...options, expires: new Date(0) };
              this.set(name, "", newOptions);
            },
          },
        },
      );
      setSupabase(client);
    }
  }, []);

  // Use the global auth session
  const { isAuthenticated, user, accessToken, refreshSession } =
    useAuthSession();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // If isLoading, wait for it to complete
      if (isLoading) return;

      // If not authenticated, try a direct refresh first
      if (isAuthenticated === false) {
        // Try to refresh the session directly
        const success = await refreshSession();

        // If refresh succeeded, we're done
        if (success && user) {
          console.log("✅ Authentication restored via refresh");
          return;
        }

        // If refresh failed, show error and redirect
        setError("You must be logged in to cancel your subscription");

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/sign-in?redirect=/dashboard/profile");
        }, 2000);
      } else if (isAuthenticated === true && user) {
        console.log(
          "✅ User authenticated via global session provider:",
          user.id,
        );
      }
    };

    checkAuth();
  }, [isAuthenticated, user, isLoading, router, refreshSession]);

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Make sure Supabase client is initialized
      if (!supabase) {
        throw new Error(
          "Supabase client is not initialized. Please refresh the page and try again.",
        );
      }

      console.log("🔄 Starting subscription cancellation process...");

      // First check if we already have authentication from the global provider
      if (!isAuthenticated || !user || !accessToken) {
        console.log(
          "⚠️ Not authenticated via global provider, attempting refresh...",
        );

        // Try to refresh the session
        const refreshSuccessful = await refreshSession();

        if (!refreshSuccessful || !user) {
          // Don't log error to console, just handle it gracefully
          throw new Error("You must be logged in to cancel your subscription");
        }
      }

      console.log(
        "✅ User authenticated successfully for cancellation:",
        user.id,
      );

      // Get the user's subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (subscriptionError) {
        console.error("Subscription fetch error:", subscriptionError);
        throw new Error("Error fetching subscription");
      }

      if (!subscription) {
        throw new Error("No active subscription found");
      }

      console.log("Found subscription:", subscription.stripe_id);

      // Double-check we have a valid access token
      if (!accessToken) {
        console.error(
          "❌ No access token available after successful authentication",
        );
        throw new Error(
          "Authentication token is missing. Please sign in again.",
        );
      }

      console.log("✅ Valid access token obtained for API call");

      // Use the Supabase client to invoke the function instead of fetch directly
      // This ensures proper authentication handling
      const { data: functionData, error: functionError } =
        await supabase.functions.invoke(
          "supabase-functions-cancel-subscription",
          {
            body: { subscription_id: subscription.stripe_id },
          },
        );

      // For debugging
      console.log("Edge function response:", { functionData, functionError });

      // Set up response variables to maintain compatibility with the rest of the code
      const response = { ok: !functionError };

      // We already have functionError and functionData from the invoke call above
      // Just need to format the error message if there is one
      if (functionError) {
        console.error("Function error details:", functionError);
      }

      if (functionError) {
        console.error("Function invocation error:", functionError);
        throw new Error(
          "Error calling cancellation service: " + functionError.message,
        );
      }

      // Use the function data
      const responseData = functionData || {};

      // Update the local subscription record
      await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("stripe_id", subscription.stripe_id);

      // Redirect back to profile page
      router.push("/dashboard/profile?canceled=true");
    } catch (err: any) {
      setError(
        err.message || "An error occurred while canceling your subscription",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push("/dashboard/profile");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Cancel Subscription</CardTitle>
          <CardDescription>
            Are you sure you want to cancel your subscription?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Your subscription will remain active until the end of your current
              billing period. After that, you will lose access to premium
              features.
            </p>

            {error && (
              <div className="bg-red-50 p-4 rounded-md flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>

                {error.includes("logged in") || error.includes("sign in") ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 mb-2">
                      Try refreshing your session:
                    </p>
                    <AuthRefreshButton />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleGoBack} disabled={isLoading}>
            Go back
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Confirm Cancellation"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
