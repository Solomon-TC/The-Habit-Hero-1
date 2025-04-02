"use client";

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

type NotificationType = "habit" | "milestone" | "goal" | "level_up";

interface GameNotification {
  type: NotificationType;
  message: string;
  xp: number;
}

export default function GameNotifications() {
  // We'll simplify this component to avoid any potential issues
  // Instead of using a timer, we'll just return null
  return null;
}

// Helper function that can be used elsewhere if needed
export function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case "habit":
      return "Habit Completed!";
    case "milestone":
      return "Milestone Achieved!";
    case "goal":
      return "Goal Accomplished!";
    case "level_up":
      return "Level Up!";
    default:
      return "Notification";
  }
}
