"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Star } from "lucide-react";

interface LevelUpToastProps {
  newLevel: number;
  xpGained: number;
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
