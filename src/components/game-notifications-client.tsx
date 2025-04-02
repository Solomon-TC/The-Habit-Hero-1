"use client";

import { showGameToast } from "./level-up-toast";

type NotificationType = "habit" | "milestone" | "goal" | "level_up";

interface GameNotificationsClientProps {
  type?: NotificationType;
  message?: string;
  xpAwarded?: number;
  leveledUp?: boolean;
  newLevel?: number;
  goalName?: string;
  milestoneName?: string;
  habitName?: string;
}

export function GameNotificationsClient({
  type,
  message,
  xpAwarded,
  leveledUp,
  newLevel,
  goalName,
  milestoneName,
  habitName,
}: GameNotificationsClientProps) {
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

    // Call showGameToast directly instead of using setTimeout
    showGameToast({
      type: toastType,
      title,
      xpGained: xpAwarded,
      leveledUp: leveledUp || false,
      newLevel: newLevel || 1,
    });
  }

  return null;
}
