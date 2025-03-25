"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLevelUpToast } from "@/components/level-up-toast";
import { Star } from "lucide-react";

export default function LevelSystemDemo() {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const { setLevelUpData } = useLevelUpToast();

  // XP required for each level (increases with each level)
  const getXpForNextLevel = (currentLevel: number) => currentLevel * 100;

  // Calculate progress percentage
  const xpForNextLevel = getXpForNextLevel(level);
  const progressPercentage = Math.min(100, (xp / xpForNextLevel) * 100);

  const earnXp = (amount: number) => {
    const newXp = xp + amount;
    setXp(newXp);

    // Check if leveled up
    if (newXp >= xpForNextLevel) {
      const newLevel = level + 1;
      setLevel(newLevel);
      setXp(newXp - xpForNextLevel);

      // Show level up toast
      setLevelUpData({
        newLevel,
        xpGained: amount,
      });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Star className="h-6 w-6 text-purple-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {level}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg">Level {level}</h3>
          <p className="text-sm text-gray-500">
            {xp}/{xpForNextLevel} XP
          </p>
        </div>
      </div>

      <Progress value={progressPercentage} className="h-2 mb-4" />

      <div className="space-y-3">
        <Button
          onClick={() => earnXp(10)}
          variant="outline"
          className="w-full justify-between"
        >
          <span>Complete Daily Habit</span>
          <span className="text-green-600">+10 XP</span>
        </Button>

        <Button
          onClick={() => earnXp(25)}
          variant="outline"
          className="w-full justify-between"
        >
          <span>Achieve Milestone</span>
          <span className="text-green-600">+25 XP</span>
        </Button>

        <Button
          onClick={() => earnXp(50)}
          variant="outline"
          className="w-full justify-between"
        >
          <span>Complete Goal</span>
          <span className="text-green-600">+50 XP</span>
        </Button>
      </div>
    </div>
  );
}
