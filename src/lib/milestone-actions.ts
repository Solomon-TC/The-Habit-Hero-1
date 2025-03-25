"use server";

import { createServerSupabaseClient } from "./supabase-server-actions";
import { calculateGoalProgress } from "./goals";
import { MilestoneFormData } from "@/types/goal";
import { awardXP } from "./xp";

export async function createMilestone(
  goalId: string,
  formData: MilestoneFormData,
) {
  const supabase = await createServerSupabaseClient();

  const milestoneData = {
    goal_id: goalId,
    title: formData.title,
    description: formData.description,
    due_date: formData.due_date
      ? new Date(formData.due_date).toISOString()
      : null,
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await supabase
    .from("milestones")
    .insert([milestoneData])
    .select();

  if (result.error) {
    throw new Error(result.error.message);
  }

  // Recalculate goal progress
  await calculateGoalProgress(goalId);

  return result.data[0];
}

export async function updateMilestone(
  milestoneId: string,
  goalId: string,
  formData: MilestoneFormData,
) {
  const supabase = await createServerSupabaseClient();

  const milestoneData = {
    goal_id: goalId,
    title: formData.title,
    description: formData.description,
    due_date: formData.due_date
      ? new Date(formData.due_date).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const result = await supabase
    .from("milestones")
    .update(milestoneData)
    .eq("id", milestoneId)
    .select();

  if (result.error) {
    throw new Error(result.error.message);
  }

  // Recalculate goal progress
  await calculateGoalProgress(goalId);

  return result.data[0];
}

export async function completeMilestone(
  milestoneId: string,
  goalId: string,
  userId: string,
) {
  // Force cache invalidation by adding a timestamp
  const timestamp = Date.now();
  const supabase = await createServerSupabaseClient();

  // Get the milestone to check its XP value
  const { data: milestone, error: fetchError } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (fetchError) {
    console.error("Error fetching milestone:", fetchError);
    return { error: fetchError };
  }

  // Update the milestone to completed
  const { data, error } = await supabase
    .from("milestones")
    .update({
      is_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId)
    .select();

  if (error) {
    console.error("Error completing milestone:", error);
    return { error };
  }

  // Award XP for completing the milestone
  // Use a fixed XP value for milestones
  const xpValue = 20; // Fixed XP value for milestones
  const xpResult = await awardXP(userId, xpValue, "milestone", milestoneId);

  // Recalculate the goal progress
  await calculateGoalProgress(goalId);

  return {
    data,
    xpAwarded: xpValue,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
  };
}

export async function uncompleteMilestone(milestoneId: string, goalId: string) {
  const supabase = await createServerSupabaseClient();

  // Update the milestone to not completed
  const { data, error } = await supabase
    .from("milestones")
    .update({
      is_completed: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId)
    .select();

  if (error) {
    console.error("Error uncompleting milestone:", error);
    return { error };
  }

  // Recalculate the goal progress
  await calculateGoalProgress(goalId);

  return { data };
}
