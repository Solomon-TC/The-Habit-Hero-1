"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Star, Check, Trophy, TrendingUp } from "lucide-react";

interface LevelUpToastProps {
  newLevel: number;
  xpGained: number;
}

type ToastType = "habit" | "milestone" | "goal" | "level";

interface ShowGameToastProps {
  type: ToastType;
  title: string;
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
}

export function useLevelUpToast() {
  const [levelUpData, setLevelUpData] = useState<LevelUpToastProps | null>(
    null,
  );

  useEffect(() => {
    if (levelUpData) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Level Up!</span>
          </div>
        ),
        description: (
          <div className="mt-2">
            <p className="font-semibold text-lg">
              You reached level {levelUpData.newLevel}!
            </p>
            <p className="text-sm text-muted-foreground">
              +{levelUpData.xpGained} XP gained
            </p>
          </div>
        ),
        className:
          "bg-gradient-to-r from-yellow-50 to-purple-50 border-yellow-200",
        duration: 5000,
      });

      // Reset after showing toast
      setLevelUpData(null);
    }
  }, [levelUpData]);

  return { setLevelUpData };
}

export function LevelUpToast({ newLevel, xpGained }: LevelUpToastProps) {
  useEffect(() => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span>Level Up!</span>
        </div>
      ),
      description: (
        <div className="mt-2">
          <p className="font-semibold text-lg">You reached level {newLevel}!</p>
          <p className="text-sm text-muted-foreground">+{xpGained} XP gained</p>
        </div>
      ),
      className:
        "bg-gradient-to-r from-yellow-50 to-purple-50 border-yellow-200",
      duration: 5000,
    });
  }, [newLevel, xpGained]);

  return null;
}

import { showGameNotification } from "./game-notification";

export function showGameToast({
  type,
  title,
  xpGained = 0,
  leveledUp = false,
  newLevel = 1,
}: ShowGameToastProps) {
  // Log the notification call for debugging
  console.log(
    `Showing game notification: ${type} - ${title} - XP: ${xpGained}`,
  );

  try {
    // Use the new game notification system
    showGameNotification({
      type,
      title,
      xpGained,
      leveledUp,
      newLevel,
    });
    console.log("Game notification triggered successfully");
  } catch (error) {
    console.error("Error showing game notification:", error);
  }

  // Also use the toast system as a fallback for now
  // This can be removed once the new notification system is confirmed working
  try {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <span>{title}</span>
        </div>
      ),
      description: (
        <div className="mt-2">
          {xpGained > 0 && (
            <p className="text-sm font-medium text-amber-600">
              +{xpGained} XP gained
            </p>
          )}
          {leveledUp && (
            <p className="font-semibold text-lg mt-1 animate-pulse text-amber-600">
              You reached level {newLevel}!
            </p>
          )}
        </div>
      ),
      duration: 3000,
      variant: "default",
    });
    console.log("Toast notification triggered successfully");
  } catch (toastError) {
    console.error("Error showing toast notification:", toastError);
  }
}
