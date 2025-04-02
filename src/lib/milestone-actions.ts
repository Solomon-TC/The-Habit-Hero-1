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

  console.log(
    `[SERVER] Completing milestone ${milestoneId} for goal ${goalId} and user ${userId}`,
  );

  // Get the milestone to check its XP value
  const { data: milestone, error: fetchError } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (fetchError) {
    console.error("[SERVER] Error fetching milestone:", fetchError);
    return { error: fetchError };
  }

  console.log(`[SERVER] Found milestone: ${milestone.title}`);

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
    console.error("[SERVER] Error completing milestone:", error);
    return { error };
  }

  console.log(`[SERVER] Successfully marked milestone as completed`);

  // Award XP for completing the milestone
  // Use the milestone's XP value or default to 20
  const xpValue = milestone.xp_value || 20;
  console.log(
    `[SERVER] Awarding ${xpValue} XP for completing milestone ${milestoneId}`,
  );
  try {
    // Check if user exists before awarding XP
    try {
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingUserError && existingUserError.code === "PGRST116") {
        console.log(`[SERVER] Creating new user record for ${userId}`);
      }
    } catch (err) {
      console.log(`[SERVER] Error checking user existence: ${err}`);
    }

    const xpResult = await awardXP(userId, xpValue, "milestone", milestoneId);
    console.log(`[SERVER] XP award result for milestone:`, xpResult);
    if (xpResult.error) {
      console.error(
        `[SERVER] Error awarding XP for milestone:`,
        xpResult.error,
      );
    }

    // Recalculate the goal progress
    await calculateGoalProgress(goalId);

    // Return detailed information for notifications
    const result = {
      data,
      xpAwarded: xpValue,
      leveledUp: xpResult?.leveledUp || false,
      newLevel: xpResult?.newLevel || 1,
      milestoneName: milestone.title || "Milestone",
      type: "milestone",
    };

    console.log(`[SERVER] Returning milestone completion result:`, result);
    return result;
  } catch (error) {
    console.error(
      `[SERVER] Unexpected error awarding XP for milestone:`,
      error,
    );
    return {
      data,
      xpAwarded: xpValue,
      error: String(error),
      milestoneName: milestone.title || "Milestone",
      type: "milestone",
    };
  }
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
