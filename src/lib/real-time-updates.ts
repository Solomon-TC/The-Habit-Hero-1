"use client";

import { createBrowserSupabaseClient } from "./supabase-browser";
import { RealtimeChannel } from "@supabase/supabase-js";

// Types for the subscription handlers
export type SubscriptionCallback = (payload: any) => void;
export type SubscriptionType =
  | "habits"
  | "habit_logs"
  | "goals"
  | "milestones"
  | "users"
  | "xp_logs";

// Helper to check if we're on the client side
const isClientSide = typeof window !== "undefined";

// Create a non-hook function for real-time subscriptions
export function createRealtimeSubscription(
  table: SubscriptionType,
  callback: SubscriptionCallback,
  userId?: string,
) {
  if (!isClientSide) return null;

  const supabase = createBrowserSupabaseClient();
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

  return subscription;
}

// RealtimeSubscription component has been moved to src/components/real-time-subscription.tsx
// Export it from there to maintain backward compatibility
export { RealtimeSubscription } from "../components/real-time-subscription";

// Instead of hooks, export functions that create subscriptions
// These will be used by the hooks in the components
export function createXPUpdatesSubscription(
  userId: string,
  onUpdate: (data: any) => void,
) {
  return createRealtimeSubscription(
    "users",
    (payload) => {
      if (payload.new && payload.new.id === userId) {
        onUpdate(payload.new);
      }
    },
    userId,
  );
}

export function createHabitUpdatesSubscription(
  userId: string,
  onUpdate: (data: any) => void,
) {
  return createRealtimeSubscription(
    "habits",
    (payload) => {
      onUpdate(payload);
    },
    userId,
  );
}

export function createHabitLogUpdatesSubscription(
  userId: string,
  onUpdate: (data: any) => void,
) {
  return createRealtimeSubscription(
    "habit_logs",
    (payload) => {
      onUpdate(payload);
    },
    userId,
  );
}

export function createGoalUpdatesSubscription(
  userId: string,
  onUpdate: (data: any) => void,
) {
  return createRealtimeSubscription(
    "goals",
    (payload) => {
      onUpdate(payload);
    },
    userId,
  );
}

export function createMilestoneUpdatesSubscription(
  userId: string,
  onUpdate: (data: any) => void,
) {
  return createRealtimeSubscription(
    "milestones",
    (payload) => {
      onUpdate(payload);
    },
    userId,
  );
}

// For backward compatibility, we'll keep the hook names but implement them in the components
export const useXPUpdates = null;
export const useHabitUpdates = null;
export const useHabitLogUpdates = null;
export const useGoalUpdates = null;
export const useMilestoneUpdates = null;
export const useRealtimeSubscription = null;
