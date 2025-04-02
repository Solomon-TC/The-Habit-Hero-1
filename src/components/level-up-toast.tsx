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

export function showGameToast({
  type,
  title,
  xpGained = 0,
  leveledUp = false,
  newLevel = 1,
}: ShowGameToastProps) {
  // Define icon and colors based on type
  let icon;
  let bgColor = "bg-gradient-to-r from-green-50 to-green-100 border-green-200";

  switch (type) {
    case "habit":
      icon = <Check className="h-5 w-5 text-green-500" />;
      bgColor = "bg-gradient-to-r from-green-50 to-green-100 border-green-200";
      break;
    case "milestone":
      icon = <Star className="h-5 w-5 text-blue-500" />;
      bgColor = "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200";
      break;
    case "goal":
      icon = <Trophy className="h-5 w-5 text-purple-500" />;
      bgColor =
        "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200";
      break;
    case "level":
      icon = <TrendingUp className="h-5 w-5 text-amber-500" />;
      bgColor = "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      break;
  }

  toast({
    title: (
      <div className="flex items-center gap-2">
        {icon}
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
    className: bgColor,
    duration: 5000,
  });
}
