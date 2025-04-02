"use client";

import { useState, useEffect, useCallback } from "react";
import { HabitWithProgress } from "@/types/habit";
import { logHabitCompletion } from "@/lib/habits";
import HabitList from "./habit-list";
import HabitForm from "./habit-form";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { useLevelUpToast, showGameToast } from "./level-up-toast";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

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
  const [userXP, setUserXP] = useState<{ xp: number; level: number } | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = useState(false);

  // Memoize callback functions to prevent them from changing on every render
  const habitUpdateCallback = useCallback((payload) => {
    if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
      // Update the local habits when a habit is updated
      setLocalHabits((prev) => {
        const habitIndex = prev.findIndex((h) => h.id === payload.new.id);
        if (habitIndex >= 0) {
          // Update existing habit
          const updatedHabits = [...prev];
          updatedHabits[habitIndex] = {
            ...updatedHabits[habitIndex],
            ...payload.new,
          };
          return updatedHabits;
        } else if (payload.eventType === "INSERT") {
          // Add new habit
          return [...prev, { ...payload.new, progress: 0, isCompleted: false }];
        }
        return prev;
      });
    } else if (payload.eventType === "DELETE") {
      // Remove deleted habit
      setLocalHabits((prev) => prev.filter((h) => h.id !== payload.old.id));
    }
  }, []);

  const habitLogCallback = useCallback((payload) => {
    if (payload.eventType === "INSERT") {
      // Update the progress of the corresponding habit
      setLocalHabits((prev) => {
        return prev.map((habit) => {
          if (habit.id === payload.new.habit_id) {
            const newProgress =
              (habit.progress || 0) + (payload.new.count || 1);
            const isCompleted = newProgress >= habit.target_count;
            return {
              ...habit,
              progress: newProgress,
              isCompleted,
              lastCompletedAt: payload.new.completed_at,
            };
          }
          return habit;
        });
      });
    }
  }, []);

  const xpUpdateCallback = useCallback(
    (userData) => {
      // Update user XP and level
      setUserXP((prevXP) => {
        // Only update if the data is different to prevent unnecessary renders
        if (
          !prevXP ||
          prevXP.xp !== userData.xp ||
          prevXP.level !== userData.level
        ) {
          // Check if user leveled up
          if (prevXP && userData.level > prevXP.level) {
            const levelUpData = {
              level: userData.level,
              xp: userData.xp - prevXP.xp,
            };

            setLevelUpInfo(levelUpData);

            setLevelUpData({
              newLevel: userData.level,
              xpGained: userData.xp - prevXP.xp,
            });

            // Clear the level up notification after 5 seconds
            setTimeout(() => setLevelUpInfo(null), 5000);
          }

          return {
            xp: userData.xp || 0,
            level: userData.level || 1,
          };
        }
        return prevXP;
      });
    },
    [setLevelUpData],
  );

  // Subscribe to real-time updates using useEffect with memoized callbacks
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    // Create subscription for habits
    const habitChannel = supabase
      .channel(`habits_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "habits",
          filter: `user_id=eq.${userId}`,
        },
        habitUpdateCallback,
      )
      .subscribe((status) => {
        console.log(`Habit subscription status: ${status}`);
      });

    // Listen for custom habit update events (for immediate UI updates)
    const handleHabitUpdate = (event: CustomEvent) => {
      const updatedHabit = event.detail.habit;
      if (updatedHabit) {
        setLocalHabits((prev) =>
          prev.map((h) => (h.id === updatedHabit.id ? updatedHabit : h)),
        );
      }
    };

    window.addEventListener(
      "habit-updated",
      handleHabitUpdate as EventListener,
    );

    return () => {
      supabase.removeChannel(habitChannel);
      window.removeEventListener(
        "habit-updated",
        handleHabitUpdate as EventListener,
      );
    };
  }, [userId, habitUpdateCallback]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    // Create subscription for habit logs
    const logChannel = supabase
      .channel(`habit_logs_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "habit_logs",
          filter: `user_id=eq.${userId}`,
        },
        habitLogCallback,
      )
      .subscribe((status) => {
        console.log(`Habit logs subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(logChannel);
    };
  }, [userId, habitLogCallback]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    // Create subscription for user XP updates
    const xpChannel = supabase
      .channel(`users_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            xpUpdateCallback(payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(xpChannel);
    };
  }, [userId, xpUpdateCallback]);

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

      // Always show a notification for XP gained
      if (result && result.xpGained) {
        // Trigger the game toast notification
        showGameToast({
          type: "habit",
          title: `Habit Completed: ${habit.name || "Habit"}`,
          xpGained: result.xpGained,
          leveledUp: result.leveledUp || false,
          newLevel: result.newLevel || 1,
        });
      }

      // Check if the user leveled up from the result
      if (result && result.leveledUp) {
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
        {showAddForm && (
          <HabitForm userId={userId} onClose={() => setShowAddForm(false)} />
        )}
        {renderLevelUpNotification()}
      </div>
    );
  }

  // Otherwise use the HabitList component
  return (
    <>
      <div className="w-full overflow-auto">
        <HabitList habits={localHabits} userId={userId} />
      </div>
      {renderLevelUpNotification()}
    </>
  );
}
