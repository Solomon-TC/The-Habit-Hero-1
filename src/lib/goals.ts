import { createServerSupabaseClient } from "./supabase-server-actions";
import { Goal, Milestone } from "@/types/goal";

export async function getUserGoals(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching goals:", error);
    return { data: [] };
  }

  // Fetch milestones for each goal
  const goalsWithMilestones = await Promise.all(
    goals.map(async (goal) => {
      const { data: milestones } = await supabase
        .from("milestones")
        .select("*")
        .eq("goal_id", goal.id)
        .order("created_at", { ascending: true });

      return {
        ...goal,
        milestones: milestones || [],
      };
    }),
  );

  return { data: goalsWithMilestones };
}

export async function getGoalById(goalId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: goal, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single();

  if (error) {
    console.error("Error fetching goal:", error);
    return { data: null, error };
  }

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: true });

  return {
    data: {
      ...goal,
      milestones: milestones || [],
    },
  };
}

export async function updateGoalProgress(goalId: string, progress: number) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("goals")
    .update({ progress, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .select()
    .single();

  if (error) {
    console.error("Error updating goal progress:", error);
    return { error };
  }

  return { data };
}

export async function calculateGoalProgress(goalId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: milestones, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("goal_id", goalId);

  if (error || !milestones || milestones.length === 0) {
    return 0;
  }

  const completedMilestones = milestones.filter((m) => m.is_completed).length;
  const progress = Math.round((completedMilestones / milestones.length) * 100);

  // Update the goal progress
  await updateGoalProgress(goalId, progress);

  return progress;
}
