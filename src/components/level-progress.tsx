"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import { Star } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { createRealtimeSubscription } from "@/lib/real-time-updates";

interface LevelProgressProps {
  initialData?: {
    level: number;
    xp: number;
    xpForNextLevel: number;
    levelProgress: number;
    xpInCurrentLevel: number;
  };
  userId: string;
}

export default function LevelProgress({
  initialData,
  userId,
}: LevelProgressProps) {
  const [data, setData] = useState(
    initialData || {
      level: 1,
      xp: 0,
      xpForNextLevel: 100,
      levelProgress: 0,
      xpInCurrentLevel: 0,
    },
  );

  useEffect(() => {
    if (!userId) return;

    // Set up real-time subscriptions
    const supabase = createBrowserSupabaseClient();

    // Function to fetch the latest user data
    const fetchLatestUserData = async () => {
      // Get user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (!userData) return;

      // Calculate XP progress to next level
      const userLevel = userData?.level || 1;
      const userXP = userData?.xp || 0;

      // Calculate XP needed for next level
      const xpForNextLevel = await calculateXPForNextLevel(userLevel);

      // Calculate level progress percentage
      const levelProgress = await calculateLevelProgress(userXP, userLevel);
      console.log(
        `Level progress calculated: ${levelProgress}% (${userXP} XP, Level ${userLevel})`,
      );

      // Calculate XP in current level for display
      let totalXPForCurrentLevel = 0;
      for (let i = 1; i < userLevel; i++) {
        totalXPForCurrentLevel += Math.floor(100 * Math.pow(1.5, i - 1));
      }
      const xpInCurrentLevel = userXP - totalXPForCurrentLevel;

      setData({
        level: userLevel,
        xp: userXP,
        xpForNextLevel,
        levelProgress,
        xpInCurrentLevel,
      });
    };

    // Initial fetch
    fetchLatestUserData();

    // Set up subscription for users table
    const usersSubscription = createRealtimeSubscription(
      "users",
      () => fetchLatestUserData(),
      userId,
    );

    // Set up subscription for xp_logs table
    const xpLogsSubscription = createRealtimeSubscription(
      "xp_logs",
      () => fetchLatestUserData(),
      userId,
    );

    // Clean up subscriptions
    return () => {
      usersSubscription?.unsubscribe();
      xpLogsSubscription?.unsubscribe();
    };
  }, [userId, initialData]);

  // Helper functions for XP calculations
  async function calculateXPForNextLevel(
    currentLevel: number,
  ): Promise<number> {
    const baseXP = 100; // Base XP needed for level 2
    const growthFactor = 1.5; // How much more XP is needed for each level
    return Math.floor(baseXP * Math.pow(growthFactor, currentLevel - 1));
  }

  async function calculateLevelProgress(
    currentXP: number,
    currentLevel: number,
  ): Promise<number> {
    // Calculate total XP for current level
    let totalXPForCurrentLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
      totalXPForCurrentLevel += Math.floor(100 * Math.pow(1.5, i - 1));
    }

    // Calculate total XP for next level
    let totalXPForNextLevel = totalXPForCurrentLevel;
    totalXPForNextLevel += Math.floor(100 * Math.pow(1.5, currentLevel - 1));

    const xpInCurrentLevel = currentXP - totalXPForCurrentLevel;
    const xpRequiredForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;

    // Calculate progress percentage based on current level's XP
    const progress = Math.floor(
      (xpInCurrentLevel / xpRequiredForNextLevel) * 100,
    );

    console.log(
      `XP Progress: ${xpInCurrentLevel}/${xpRequiredForNextLevel} = ${progress}%`,
    );
    return Math.min(Math.max(progress, 0), 100); // Ensure progress is between 0 and 100
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Level {data.level}
        </CardTitle>
        <Star className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm mb-1">
          <span>XP: {data.xp}</span>
          <span>
            {data.xpInCurrentLevel}/{data.xpForNextLevel}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-yellow-500 h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${data.levelProgress}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {data.xpInCurrentLevel} / {data.xpForNextLevel} XP to level{" "}
          {data.level + 1}
        </p>
      </CardContent>
    </Card>
  );
}
