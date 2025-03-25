"use client";

import { useState } from "react";
import { HabitWithProgress } from "@/types/habit";
import { logHabitCompletion } from "@/lib/habits";
import HabitList from "./habit-list";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { useLevelUpToast } from "./level-up-toast";

interface HabitTrackerProps {
  habits: HabitWithProgress[];
  userId: string;
}

export default function HabitTracker({ habits, userId }: HabitTrackerProps) {
  const [localHabits, setLocalHabits] = useState<HabitWithProgress[]>(habits);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    level: number;
    xp: number;
  } | null>(null);
  const { setLevelUpData } = useLevelUpToast();

  const handleComplete = async (habit: HabitWithProgress) => {
    if (habit.isCompleted) return;

    try {
      const result = await logHabitCompletion(habit.id, userId);

      // Update the local state
      setLocalHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id
            ? {
                ...h,
                progress: h.progress + 1,
                isCompleted: h.progress + 1 >= h.target_count,
                lastCompletedAt: new Date().toISOString(),
              }
            : h,
        ),
      );

      // Check if the user leveled up (this would come from the server in a real implementation)
      // For demo purposes, randomly show level up occasionally
      // Check if the user leveled up from the result
      if (result.leveledUp) {
        // Use both the local notification and the toast system
        setLevelUpInfo({
          level: result.newLevel,
          xp: result.xpGained || habit.xp_value || 10,
        });

        // Also trigger the toast notification
        setLevelUpData({
          newLevel: result.newLevel,
          xpGained: result.xpGained || habit.xp_value || 10,
        });

        // Clear the level up notification after 5 seconds
        setTimeout(() => setLevelUpInfo(null), 5000);
      }
    } catch (error) {
      console.error("Error completing habit:", error);
    }
  };

  // Render level up notification if present
  const renderLevelUpNotification = () => {
    if (!levelUpInfo) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-gradient-to-r from-yellow-100 to-purple-100 p-4 rounded-lg shadow-lg border border-yellow-300 z-50 animate-bounce">
        <div className="flex items-center gap-2 font-bold text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <span>Level Up!</span>
        </div>
        <p className="font-semibold">You reached level {levelUpInfo.level}!</p>
        <p className="text-sm text-gray-700">+{levelUpInfo.xp} XP gained</p>
      </div>
    );
  };

  const [showAddForm, setShowAddForm] = useState(false);

  // If we want to show a custom UI for habits
  if (localHabits.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Habits</h2>
          <Link href="/dashboard/habits">
            <Button variant="outline" size="sm">
              View All Habits
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You haven't created any habits yet
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowAddForm(true)}
            >
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
        <HabitForm
          open={showAddForm}
          onOpenChange={setShowAddForm}
          userId={userId}
          mode="create"
        />
        {renderLevelUpNotification()}
      </div>
    );
  }

  // Otherwise use the HabitList component
  return (
    <>
      <HabitList habits={localHabits} userId={userId} />
      {renderLevelUpNotification()}
    </>
  );
}
