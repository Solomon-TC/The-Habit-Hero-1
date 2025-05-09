"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Award, Trophy } from "lucide-react";
import { showGameToast } from "./level-up-toast";

type NotificationType =
  | "habit"
  | "milestone"
  | "goal"
  | "level_up"
  | "achievement";

interface GameNotificationProps {
  userId?: string;
  type?: NotificationType;
  message?: string;
  xpAwarded?: number;
  leveledUp?: boolean;
  newLevel?: number;
  goalName?: string;
  milestoneName?: string;
  habitName?: string;
  achievementName?: string;
}

export default function GameNotifications({
  userId,
  type,
  message,
  xpAwarded,
  leveledUp,
  newLevel,
  goalName,
  milestoneName,
  habitName,
  achievementName,
}: GameNotificationProps) {
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());

  // Check for new achievements when component mounts and periodically
  useEffect(() => {
    if (!userId) return;

    const checkNewAchievements = async () => {
      try {
        const supabase = createBrowserSupabaseClient();

        // Get the time of the last check
        const fiveMinutesAgo = new Date(
          Date.now() - 5 * 60 * 1000,
        ).toISOString();

        // Get user's recent achievements (last 5 minutes)
        const { data: newAchievements, error } = await supabase
          .from("user_achievements")
          .select("*, achievements(name, description, xp_reward)")
          .eq("user_id", userId)
          .gt("earned_at", fiveMinutesAgo)
          .order("earned_at", { ascending: false });

        if (error) {
          console.error("Error fetching recent achievements:", error);
          return;
        }

        if (newAchievements && newAchievements.length > 0) {
          console.log(
            `Found ${newAchievements.length} new achievements to display`,
            newAchievements,
          );

          // Show notifications for new achievements
          newAchievements.forEach((achievement) => {
            if (achievement.achievements) {
              showGameToast({
                type: "achievement",
                title: `Achievement Unlocked: ${achievement.achievements.name}`,
                xpGained: achievement.achievements.xp_reward || 0,
                leveledUp: false,
              });
            }
          });
        }

        setLastCheckTime(new Date());
      } catch (error) {
        console.error("Error checking for new achievements:", error);
      }
    };

    // Check immediately on mount
    checkNewAchievements();

    // Also set up a polling interval to check for new achievements
    const intervalId = setInterval(checkNewAchievements, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [userId]);

  // Handle direct notification props
  useEffect(() => {
    if (xpAwarded && xpAwarded > 0) {
      let toastType: "habit" | "milestone" | "goal" | "level" | "achievement" =
        "level";
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
      } else if (type === "achievement" || achievementName) {
        toastType = "achievement";
        title = achievementName
          ? `Achievement Unlocked: ${achievementName}`
          : "New Achievement!";
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
    achievementName,
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
    case "achievement":
      return "Achievement Unlocked!";
    case "level_up":
      return "Level Up!";
    default:
      return "Notification";
  }
}

export function GameNotificationContainer() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };

    fetchUser();
  }, []);

  if (!userId) return null;

  return <GameNotifications userId={userId} />;
}
