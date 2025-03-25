import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Habit, HabitLog, HabitWithProgress } from "@/types/habit";

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

import { awardXP } from "./xp";

export async function logHabitCompletion(
  habitId: string,
  userId: string,
  count: number = 1,
  notes?: string,
) {
  // Force cache invalidation by adding a timestamp
  const timestamp = Date.now();
  const supabase = createBrowserSupabaseClient();

  // Create the log entry
  const { data: logData, error: logError } = await supabase
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
  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .single();

  if (habitError) {
    console.error("Error fetching habit for streak update:", habitError);
    return logData;
  }

  // Update the streak
  // This is a simple implementation - in a real app, you'd want to check if the streak should be maintained or reset
  // based on the frequency and last completion date
  const { error: updateError } = await supabase
    .from("habits")
    .update({
      streak: habit.streak + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", habitId);

  if (updateError) {
    console.error("Error updating habit streak:", updateError);
  }

  // Award XP to the user
  const xpValue = habit.xp_value || 10; // Default to 10 XP if not set
  const xpResult = await awardXP(userId, xpValue, "habit", habitId);

  if (xpResult.leveledUp) {
    // Could trigger a notification or animation here
    console.log(
      `User leveled up from ${xpResult.oldLevel} to ${xpResult.newLevel}!`,
    );
  }

  // Return the log data along with level up information
  return {
    ...logData,
    leveledUp: xpResult.leveledUp,
    oldLevel: xpResult.oldLevel,
    newLevel: xpResult.newLevel,
    xpGained: xpValue,
  };
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
