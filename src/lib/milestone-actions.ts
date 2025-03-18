"use server";

import { createServerSupabaseClient } from "./supabase-server-actions";
import { calculateGoalProgress } from "./goals";
import { MilestoneFormData } from "@/types/goal";

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
