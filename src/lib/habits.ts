"use server";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server-actions";
import { Habit, HabitLog, HabitWithProgress } from "@/types/habit";
import { revalidatePath } from "next/cache";
import { awardXP } from "./xp";

export async function getUserHabits(
  userId: string,
): Promise<HabitWithProgress[]> {
  const supabase = createBrowserSupabaseClient();

  // Get all habits for the user
  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching habits:", error);
    return [];
  }

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all habit logs for the user's habits from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("completed_at", thirtyDaysAgo.toISOString())
    .order("completed_at", { ascending: false });

  if (logsError) {
    console.error("Error fetching habit logs:", logsError);
    return habits.map((habit) => ({ ...habit, progress: 0 }));
  }

  // Process habits with their logs
  return habits.map((habit) => {
    const habitLogs = logs.filter((log) => log.habit_id === habit.id);

    // Check if habit was completed today
    const todayLogs = habitLogs.filter((log) => {
      const completedDate = new Date(log.completed_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });

    const todayProgress = todayLogs.reduce((sum, log) => sum + log.count, 0);
    const isCompleted = todayProgress >= habit.target_count;
    const lastCompletedAt =
      habitLogs.length > 0 ? habitLogs[0].completed_at : undefined;

    return {
      ...habit,
      progress: todayProgress,
      logs: habitLogs,
      isCompleted,
      lastCompletedAt,
    };
  });
}

export async function createHabit(
  habit: Partial<Habit>,
): Promise<Habit | null> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("habits")
    .insert(habit)
    .select()
    .single();

  if (error) {
    console.error("Error creating habit:", error);
    return null;
  }

  // Achievement system has been removed

  return data;
}

export async function updateHabit(
  id: string,
  updates: Partial<Habit>,
): Promise<Habit | null> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("habits")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating habit:", error);
    return null;
  }

  return data;
}

export async function deleteHabit(id: string): Promise<boolean> {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.from("habits").delete().eq("id", id);

  if (error) {
    console.error("Error deleting habit:", error);
    return false;
  }

  return true;
}

export async function logHabitCompletion(
  habitId: string,
  userId: string,
  count: number = 1,
  notes?: string,
) {
  // Force cache invalidation by adding a timestamp
  const timestamp = Date.now();

  // Create a service role client that bypasses RLS
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    console.error("Failed to create service role client");
    return null;
  }

  // Create the log entry using service role to bypass RLS
  const { data: logData, error: logError } = await adminClient
    .from("habit_logs")
    .insert({
      habit_id: habitId,
      user_id: userId,
      count,
      notes,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (logError) {
    console.error("Error logging habit completion:", logError);
    return null;
  }

  // Get the habit to check streak and award XP
  const { data: habit, error: habitError } = await adminClient
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .single();

  if (habitError) {
    console.error("Error fetching habit for streak update:", habitError);
    return logData;
  }

  // Update the streak based on last completion date
  // If more than 24 hours have passed since the last completion, reset streak to 1
  // Otherwise, increment the streak

  // Get the most recent habit log to check the last completion time
  const { data: lastLog, error: lastLogError } = await adminClient
    .from("habit_logs")
    .select("completed_at")
    .eq("habit_id", habitId)
    .order("completed_at", { ascending: false })
    .limit(1);

  if (lastLogError) {
    console.error("Error fetching last habit log:", lastLogError);
  }

  let newStreak = 1; // Default to 1 for first completion or reset

  if (lastLog && lastLog.length > 0) {
    const lastCompletionDate = new Date(lastLog[0].completed_at);
    const currentDate = new Date();
    const hoursDifference =
      (currentDate.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60);

    // If less than 24 hours have passed, increment the streak
    // Otherwise, reset to 1 (which is our default)
    if (hoursDifference < 24) {
      newStreak = habit.streak + 1;
    }

    console.log(
      `Hours since last completion: ${hoursDifference}, new streak: ${newStreak}`,
    );
  }

  const { error: updateError } = await adminClient
    .from("habits")
    .update({
      streak: newStreak,
      updated_at: new Date().toISOString(),
    })
    .eq("id", habitId);

  if (updateError) {
    console.error("Error updating habit streak:", updateError);
  }

  // Award XP to the user
  const xpValue = habit.xp_value || 10; // Default to 10 XP if not set
  console.log(`Awarding ${xpValue} XP for completing habit ${habitId}`);

  // Use the server-side awardXP function for better reliability
  try {
    const xpResult = await awardXP(userId, xpValue, "habit", habitId);
    console.log(`XP award result for habit:`, xpResult);

    if (xpResult.error) {
      console.error(`Error awarding XP for habit:`, xpResult.error);
      return {
        ...logData,
        error: xpResult.error,
        xpGained: 0,
        habitName: habit.name || "Habit",
      };
    }

    // Achievement system has been removed

    if (xpResult.leveledUp) {
      // Could trigger a notification or animation here
      console.log(
        `User leveled up from ${xpResult.oldLevel} to ${xpResult.newLevel}!`,
      );
    } else {
      console.log(
        `XP awarded: ${xpValue}, New XP: ${xpResult.newXP}, Level: ${xpResult.newLevel}`,
      );
    }

    // Return the log data along with level up information
    return {
      ...logData,
      leveledUp: xpResult.leveledUp,
      oldLevel: xpResult.oldLevel,
      newLevel: xpResult.newLevel,
      xpGained: xpValue,
      habitName: habit.name || "Habit",
    };
  } catch (error) {
    console.error(`Unexpected error awarding XP for habit:`, error);
    return {
      ...logData,
      error: String(error),
      xpGained: 0,
      habitName: habit.name || "Habit",
    };
  }
}

/**
 * Client-side wrapper for logHabitCompletion
 * This allows client components to call the server action
 */
export async function logHabitCompletionFromClient(
  habitId: string,
  userId: string,
  count: number = 1,
  notes?: string,
) {
  try {
    return await logHabitCompletion(habitId, userId, count, notes);
  } catch (error) {
    console.error("Error logging habit completion from client:", error);
    return null;
  }
}

export async function getHabitLogs(
  habitId: string,
  limit: number = 30,
): Promise<HabitLog[]> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching habit logs:", error);
    return [];
  }

  return data;
}
