"use client";

import { useEffect } from "react";
import { showGameToast } from "./level-up-toast";

type NotificationType = "habit" | "milestone" | "goal" | "level_up";

interface GameNotificationProps {
  type?: NotificationType;
  message?: string;
  xpAwarded?: number;
  leveledUp?: boolean;
  newLevel?: number;
  goalName?: string;
  milestoneName?: string;
  habitName?: string;
}

export default function GameNotifications({
  type,
  message,
  xpAwarded,
  leveledUp,
  newLevel,
  goalName,
  milestoneName,
  habitName,
}: GameNotificationProps) {
  useEffect(() => {
    if (xpAwarded && xpAwarded > 0) {
      let toastType: "habit" | "milestone" | "goal" | "level" = "level";
      let title = message || "XP Gained!";

      if (type === "habit" || habitName) {
        toastType = "habit";
        title = habitName ? `Habit Completed: ${habitName}` : title;
      } else if (type === "milestone" || milestoneName) {
        toastType = "milestone";
        title = milestoneName ? `Milestone Achieved: ${milestoneName}` : title;
      } else if (type === "goal" || goalName) {
        toastType = "goal";
        title = goalName ? `Goal Accomplished: ${goalName}` : title;
      } else if (type === "level_up") {
        toastType = "level";
        title = "Level Up!";
      }

      showGameToast({
        type: toastType,
        title,
        xpGained: xpAwarded,
        leveledUp: leveledUp || false,
        newLevel: newLevel || 1,
      });
    }
  }, [
    xpAwarded,
    leveledUp,
    newLevel,
    goalName,
    milestoneName,
    habitName,
    type,
    message,
  ]);

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
