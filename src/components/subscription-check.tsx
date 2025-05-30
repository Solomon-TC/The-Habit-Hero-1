import { redirect } from "next/navigation";
import { checkUserSubscription } from "@/app/actions";
import { createClient } from "../utils/supabase-server";

interface SubscriptionCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Force dynamic rendering for components that use this
export const dynamic = "force-dynamic";

export async function SubscriptionCheck({
  children,
  redirectTo = "/pricing",
}: SubscriptionCheckProps) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      // If we can't create a client, allow access rather than blocking users
      console.error("Failed to create Supabase client in SubscriptionCheck");
      return <div className="w-full">{children}</div>;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/sign-in");
      return null; // This line is unreachable but prevents TypeScript errors
    }

    try {
      // Check for active subscription directly from the database
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"]);

      // If there's an error checking the subscription, log it but don't block the user
      if (error) {
        console.error("Error checking subscription:", error);
        // Continue showing content if there's an error checking subscription
        return <div className="w-full">{children}</div>;
      }

      // If any active subscription is found, user has access
      if (Array.isArray(subscriptions) && subscriptions.length > 0) {
        return <div className="w-full">{children}</div>;
      }

      // Fallback to the original check in case the direct check failed
      const isSubscribed = await checkUserSubscription(user.id);
      if (isSubscribed) {
        return <div className="w-full">{children}</div>;
      }

      // If no active subscription is found, redirect to pricing page
      redirect(redirectTo);
      return null; // This line is unreachable but prevents TypeScript errors
    } catch (error) {
      console.error("Unexpected error in SubscriptionCheck:", error);
      // On error, allow access to prevent locking users out
      return <div className="w-full">{children}</div>;
    }
  } catch (error) {
    console.error("Top-level error in SubscriptionCheck:", error);
    // On error, allow access to prevent locking users out
    return <div className="w-full">{children}</div>;
  }
}
