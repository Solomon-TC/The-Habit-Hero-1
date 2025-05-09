"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Star, Check, Trophy, TrendingUp, Award, Zap } from "lucide-react";

interface LevelUpToastProps {
  newLevel: number;
  xpGained: number;
}

type ToastType = "habit" | "milestone" | "goal" | "level" | "achievement";

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

  // Define icon and color based on type
  let Icon;
  let bgColor = "bg-gradient-to-r from-yellow-50 to-purple-50";
  let borderColor = "border-yellow-200";

  switch (type) {
    case "habit":
      Icon = Check;
      bgColor = "bg-gradient-to-r from-green-50 to-teal-50";
      borderColor = "border-green-200";
      break;
    case "milestone":
      Icon = Trophy;
      bgColor = "bg-gradient-to-r from-blue-50 to-indigo-50";
      borderColor = "border-blue-200";
      break;
    case "goal":
      Icon = TrendingUp;
      bgColor = "bg-gradient-to-r from-indigo-50 to-purple-50";
      borderColor = "border-indigo-200";
      break;
    case "achievement":
      Icon = Award;
      bgColor = "bg-gradient-to-r from-purple-50 to-pink-50";
      borderColor = "border-purple-200";
      break;
    case "level":
    default:
      Icon = Star;
      break;
  }

  try {
    // Use the toast system
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span>{title}</span>
        </div>
      ),
      description: (
        <div className="mt-2">
          {xpGained > 0 && (
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-600">
                +{xpGained} XP gained
              </p>
            </div>
          )}
          {leveledUp && (
            <p className="font-semibold text-lg mt-1 animate-pulse text-amber-600">
              You reached level {newLevel}!
            </p>
          )}
        </div>
      ),
      className: `${bgColor} ${borderColor}`,
      duration: 5000,
    });
    console.log("Toast notification triggered successfully");
  } catch (toastError) {
    console.error("Error showing toast notification:", toastError);
  }
}
