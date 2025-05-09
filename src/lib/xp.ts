// XP calculation functions
import { createServiceRoleClient } from "./supabase-server-actions";

/**
 * Calculate the XP required for the next level
 * @param currentLevel The user's current level
 * @returns The XP required to reach the next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

/**
 * Calculate the progress percentage towards the next level
 * @param totalXP The user's total XP
 * @param currentLevel The user's current level
 * @returns The percentage progress towards the next level (0-100)
 */
export function calculateLevelProgress(
  totalXP: number,
  currentLevel: number,
): number {
  // Calculate total XP required to reach the current level
  let totalXPForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    totalXPForCurrentLevel += Math.floor(100 * Math.pow(1.5, i - 1));
  }

  // Calculate XP in the current level
  const xpInCurrentLevel = totalXP - totalXPForCurrentLevel;

  // Calculate XP needed for next level
  const xpForNextLevel = getXPForNextLevel(currentLevel);

  // Calculate progress percentage
  return Math.min(100, Math.floor((xpInCurrentLevel / xpForNextLevel) * 100));
}

/**
 * Calculate the total XP required to reach a specific level
 * @param targetLevel The target level
 * @returns The total XP required to reach the target level
 */
export function getTotalXPForLevel(targetLevel: number): number {
  let totalXP = 0;
  for (let i = 1; i < targetLevel; i++) {
    totalXP += getXPForNextLevel(i);
  }
  return totalXP;
}

/**
 * Calculate the level based on total XP
 * @param totalXP The user's total XP
 * @returns The user's level based on their XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpRequired = 0;

  while (true) {
    xpRequired += getXPForNextLevel(level);
    if (totalXP < xpRequired) {
      break;
    }
    level++;
  }

  return level;
}

/**
 * Award XP to a user
 * @param userId The user's ID
 * @param amount The amount of XP to award
 * @param reason The reason for awarding XP
 * @param sourceId Optional source ID for the XP award
 * @returns An object containing the updated user data
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  sourceId?: string,
) {
  try {
    const supabase = createServiceRoleClient();
    if (!supabase) {
      console.error("Failed to create Supabase client");
      return { error: "Failed to create Supabase client" };
    }

    // Get the user's current XP and level
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, xp, level")
      .eq("id", userId)
      .single();

    if (userError) {
      // If the user doesn't exist yet, create them
      if (userError.code === "PGRST116") {
        // Create a new user record
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: userId,
            xp: 0,
            level: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating new user record:", createError);
          return { error: createError.message };
        }

        userData = newUser;
      } else {
        console.error("Error fetching user data:", userError);
        return { error: userError.message };
      }
    }

    // If we still don't have user data, return an error
    if (!userData) {
      return { error: "User not found and could not be created" };
    }

    // Calculate the new XP and level
    const oldXP = userData.xp || 0;
    const oldLevel = userData.level || 1;
    const newXP = oldXP + amount;

    // Calculate the new level based on the new XP
    const newLevel = calculateLevelFromXP(newXP);
    const leveledUp = newLevel > oldLevel;

    // Update the user's XP and level
    const { error: updateError } = await supabase
      .from("users")
      .update({
        xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user XP:", updateError);
      return { error: updateError.message };
    }

    // Log the XP award
    const { error: logError } = await supabase.from("xp_logs").insert({
      user_id: userId,
      amount,
      reason: reason || "general", // Ensure reason has a default value
      source_id: sourceId,
      source: sourceId ? "external" : "system", // Provide a default value for source
      level_before: oldLevel,
      level_after: newLevel,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error("Error logging XP award:", logError);
      // Continue anyway since the XP was awarded successfully
    }

    return {
      success: true,
      updatedUser: {
        id: userId,
        xp: newXP,
        level: newLevel,
      },
      xpAwarded: amount,
      reason,
      sourceId,
      newXP,
      oldXP,
      newLevel,
      oldLevel,
      leveledUp,
    };
  } catch (error) {
    console.error("Unexpected error in awardXP:", error);
    return { error: String(error) };
  }
}
