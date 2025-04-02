"use client";

import { ReactNode } from "react";
import { RealtimeSubscription } from "@/lib/real-time-updates";
import type {
  SubscriptionCallback,
  SubscriptionType,
} from "@/lib/real-time-updates";

// A wrapper component to use in place of direct hook calls
export function RealTimeWrapper({
  table,
  callback,
  userId,
  children,
}: {
  table: SubscriptionType;
  callback: SubscriptionCallback;
  userId?: string;
  children: ReactNode;
}) {
  return (
    <RealtimeSubscription table={table} callback={callback} userId={userId}>
      {children}
    </RealtimeSubscription>
  );
}

// Specific wrappers for different subscription types
export function HabitUpdatesWrapper({
  userId,
  onUpdate,
  children,
}: {
  userId: string;
  onUpdate: (data: any) => void;
  children: ReactNode;
}) {
  return (
    <RealtimeSubscription
      table="habits"
      callback={(payload) => onUpdate(payload)}
      userId={userId}
    >
      {children}
    </RealtimeSubscription>
  );
}

export function HabitLogUpdatesWrapper({
  userId,
  onUpdate,
  children,
}: {
  userId: string;
  onUpdate: (data: any) => void;
  children: ReactNode;
}) {
  return (
    <RealtimeSubscription
      table="habit_logs"
      callback={(payload) => onUpdate(payload)}
      userId={userId}
    >
      {children}
    </RealtimeSubscription>
  );
}

export function GoalUpdatesWrapper({
  userId,
  onUpdate,
  children,
}: {
  userId: string;
  onUpdate: (data: any) => void;
  children: ReactNode;
}) {
  return (
    <RealtimeSubscription
      table="goals"
      callback={(payload) => onUpdate(payload)}
      userId={userId}
    >
      {children}
    </RealtimeSubscription>
  );
}

export function MilestoneUpdatesWrapper({
  userId,
  onUpdate,
  children,
}: {
  userId: string;
  onUpdate: (data: any) => void;
  children: ReactNode;
}) {
  return (
    <RealtimeSubscription
      table="milestones"
      callback={(payload) => onUpdate(payload)}
      userId={userId}
    >
      {children}
    </RealtimeSubscription>
  );
}

export function XPUpdatesWrapper({
  userId,
  onUpdate,
  children,
}: {
  userId: string;
  onUpdate: (data: any) => void;
  children: ReactNode;
}) {
  return (
    <RealtimeSubscription
      table="users"
      callback={(payload) => {
        if (payload.new && payload.new.id === userId) {
          onUpdate(payload.new);
        }
      }}
      userId={userId}
    >
      {children}
    </RealtimeSubscription>
  );
}
