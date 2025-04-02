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

import { awardXP } from "./xp";

export async function updateGoalProgress(goalId: string, progress: number) {
  const supabase = await createServerSupabaseClient();

  // Get the goal to check if it's completed
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single();

  if (goalError) {
    console.error("Error fetching goal:", goalError);
    return { error: goalError };
  }

  const wasCompleted = goal.progress === 100;
  const isNowCompleted = progress === 100;

  // Update the goal progress
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

  // Award XP if the goal is newly completed
  if (!wasCompleted && isNowCompleted) {
    const xpValue = goal.xp_value || 50; // Default to 50 XP if not set
    console.log(`Awarding ${xpValue} XP for completing goal ${goalId}`);
    try {
      // Check if user exists before awarding XP
      try {
        const { data: existingUser, error: existingUserError } = await supabase
          .from("users")
          .select("id")
          .eq("id", goal.user_id)
          .single();

        if (existingUserError && existingUserError.code === "PGRST116") {
          console.log(`Creating new user record for ${goal.user_id}`);
        }
      } catch (err) {
        console.log(`Error checking user existence: ${err}`);
      }

      const xpResult = await awardXP(goal.user_id, xpValue, "goal", goalId);
      console.log(`XP award result for goal:`, xpResult);
      if (xpResult.error) {
        console.error(`Error awarding XP for goal:`, xpResult.error);
        return {
          data,
          xpAwarded: xpValue,
          error: xpResult.error,
          goalName: goal.title || "Goal",
          type: "goal",
        };
      }

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

      return {
        data,
        xpAwarded: xpValue,
        leveledUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel,
        goalName: goal.title || "Goal",
        type: "goal",
      };
    } catch (error) {
      console.error(`Unexpected error awarding XP for goal:`, error);
      return {
        data,
        xpAwarded: xpValue,
        error: String(error),
        goalName: goal.title || "Goal",
        type: "goal",
      };
    }
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
