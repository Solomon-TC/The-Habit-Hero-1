import { createServerSupabaseClient } from "./supabase-server-actions";
import { createBrowserSupabaseClient } from "./supabase-browser";

/**
 * Award XP to a user
 * @param userId The user ID to award XP to
 * @param amount The amount of XP to award
 * @param source The source of the XP (habit, milestone, goal)
 * @param sourceId The ID of the source
 */
export async function awardXP(
  userId: string,
  amount: number,
  source: string,
  sourceId: string,
) {
  const supabase = createBrowserSupabaseClient();

  // First get the user's current XP
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("xp, level")
    .eq("id", userId)
    .single();

  if (userError) {
    console.error("Error fetching user XP:", userError);
    return { error: userError };
  }

  const currentXP = userData?.xp || 0;
  const currentLevel = userData?.level || 1;
  const newXP = currentXP + amount;

  // Calculate if this will cause a level up
  const totalXPForNextLevel = getTotalXPForLevel(currentLevel + 1);
  const willLevelUp = newXP >= totalXPForNextLevel;

  // Calculate the new level
  let newLevel = currentLevel;
  if (willLevelUp) {
    // Find the appropriate level for the new XP amount
    let level = currentLevel;
    while (newXP >= getTotalXPForLevel(level + 1)) {
      level++;
    }
    newLevel = level;
  }

  // Update the user's XP and level if needed
  const { data, error } = await supabase
    .from("users")
    .update({
      xp: newXP,
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user XP:", error);
    return { error };
  }

  // Get the updated user to confirm changes
  const { data: updatedUser, error: updateError } = await supabase
    .from("users")
    .select("xp, level")
    .eq("id", userId)
    .single();

  if (updateError) {
    console.error("Error fetching updated user:", updateError);
    return { data, leveledUp: false };
  }

  const leveledUp = updatedUser.level > currentLevel;

  // Log the XP award for debugging
  console.log(
    `XP awarded: ${amount} to user ${userId}. New XP: ${newXP}, Level: ${newLevel}, Leveled up: ${leveledUp}`,
  );

  return {
    data,
    leveledUp,
    oldLevel: currentLevel,
    newLevel: updatedUser.level,
    xpGained: amount,
    newXP: updatedUser.xp,
  };
}

/**
 * Get the XP required for the next level
 * @param currentLevel The user's current level
 */
export function getXPForNextLevel(currentLevel: number): number {
  const baseXP = 100; // Base XP needed for level 2
  const growthFactor = 1.5; // How much more XP is needed for each level

  let totalXPForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    totalXPForCurrentLevel += Math.floor(
      baseXP * Math.pow(growthFactor, i - 1),
    );
  }

  const xpForNextLevel = Math.floor(
    baseXP * Math.pow(growthFactor, currentLevel - 1),
  );

  return xpForNextLevel;
}

/**
 * Get the total XP required to reach a specific level
 * @param targetLevel The target level
 */
export function getTotalXPForLevel(targetLevel: number): number {
  const baseXP = 100; // Base XP needed for level 2
  const growthFactor = 1.5; // How much more XP is needed for each level

  let totalXP = 0;
  for (let i = 1; i < targetLevel; i++) {
    totalXP += Math.floor(baseXP * Math.pow(growthFactor, i - 1));
  }

  return totalXP;
}

/**
 * Calculate the progress percentage towards the next level
 * @param currentXP The user's current XP
 * @param currentLevel The user's current level
 */
export function calculateLevelProgress(
  currentXP: number,
  currentLevel: number,
): number {
  const totalXPForCurrentLevel = getTotalXPForLevel(currentLevel);
  const totalXPForNextLevel = getTotalXPForLevel(currentLevel + 1);

  const xpInCurrentLevel = currentXP - totalXPForCurrentLevel;
  const xpRequiredForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;

  const progress = Math.floor(
    (xpInCurrentLevel / xpRequiredForNextLevel) * 100,
  );
  return Math.min(Math.max(progress, 0), 100); // Ensure progress is between 0 and 100
}
