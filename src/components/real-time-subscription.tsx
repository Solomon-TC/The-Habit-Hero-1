"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  SubscriptionCallback,
  SubscriptionType,
} from "@/lib/real-time-updates";

// Helper to check if we're on the client side
const isClientSide = typeof window !== "undefined";

// Create a React component that provides real-time subscription functionality
export function RealtimeSubscription({
  table,
  callback,
  userId,
  children,
}: {
  table: SubscriptionType;
  callback: SubscriptionCallback;
  userId?: string;
  children: React.ReactNode;
}) {
  // Now useState is called inside a proper React component
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isClientSide) return;

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const channelName = `${table}_${userId || "public"}`;

    // Set up the subscription
    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (insert, update, delete)
          schema: "public",
          table: table,
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
        },
        (payload) => {
          console.log(`Real-time update for ${table}:`, payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(
          `Subscription to ${table} ${status === "SUBSCRIBED" ? "established" : status}`,
        );
      });

    setChannel(subscription);

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (subscription) {
        console.log(`Unsubscribing from ${table}`);
        supabase.removeChannel(subscription);
      }
    };
  }, [table, callback, userId]);

  // Now we can safely use JSX syntax in a .tsx file
  return <>{children}</>;
}
