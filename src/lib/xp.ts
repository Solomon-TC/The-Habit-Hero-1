"use server";

import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "./supabase-server-actions";
import { createBrowserSupabaseClient } from "./supabase-browser";
import { revalidatePath } from "next/cache";

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
  // Use server-side Supabase client for more reliable database operations
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    console.error("Failed to create Supabase client");
    return { error: "Failed to create Supabase client" };
  }

  console.log(
    `Starting XP award process for user ${userId}, amount: ${amount}, source: ${source}`,
  );

  // Create a service role client first to ensure we can bypass RLS for all operations
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    console.error("Failed to create service role client");
    return { error: new Error("Failed to create service role client") };
  }

  try {
    // Use a database function to handle the XP award atomically
    // This will create the user if it doesn't exist and update XP in a single transaction
    const { data: transactionResult, error: transactionError } =
      await adminClient.rpc("award_xp_with_transaction", {
        p_user_id: userId,
        p_xp_amount: amount,
        p_source: source,
        p_source_id: sourceId,
        p_token_identifier: userId, // Using userId as token_identifier for simplicity
      });

    if (transactionError) {
      console.error("Error in XP award transaction:", transactionError);

      // If the function doesn't exist yet, fall back to the old method
      if (
        transactionError.message?.includes(
          'function "award_xp_with_transaction" does not exist',
        ) ||
        transactionError.message?.includes(
          'relation "users" is already member of publication',
        ) ||
        transactionError.message?.includes("publication") ||
        transactionError.message?.includes("already exists")
      ) {
        console.log(
          "Database function not found or other SQL error, falling back to manual XP award process",
          transactionError.message,
        );
        return await fallbackAwardXP(
          adminClient,
          userId,
          amount,
          source,
          sourceId,
        );
      }

      // Try the fallback method for any other errors as well
      console.log("Unexpected error in transaction, trying fallback method");
      return await fallbackAwardXP(
        adminClient,
        userId,
        amount,
        source,
        sourceId,
      );
    }

    if (!transactionResult || transactionResult.length === 0) {
      console.error(
        "Transaction returned no results, falling back to manual process",
      );
      return await fallbackAwardXP(
        adminClient,
        userId,
        amount,
        source,
        sourceId,
      );
    }

    // Check if the transaction result contains an error
    if (transactionResult[0]?.error === true) {
      console.error(
        "Transaction returned an error:",
        transactionResult[0]?.message,
        "- falling back to manual process",
      );
      return await fallbackAwardXP(
        adminClient,
        userId,
        amount,
        source,
        sourceId,
      );
    }

    console.log("Transaction result:", transactionResult);

    // Parse the transaction result
    const result = transactionResult[0];

    // Revalidate the dashboard page to reflect XP changes immediately
    revalidatePath("/dashboard");

    return {
      data: result.user_data,
      leveledUp: result.leveled_up,
      oldLevel: result.level_before,
      newLevel: result.level_after,
      xpGained: amount,
      newXP: result.new_xp,
    };
  } catch (error) {
    console.error("Unexpected error in XP award process:", error);
    // Fall back to the old method if there's an unexpected error
    return await fallbackAwardXP(adminClient, userId, amount, source, sourceId);
  }
}

/**
 * Fallback method for awarding XP when the database function is not available
 * This uses the original implementation with improved retry logic
 */
async function fallbackAwardXP(
  adminClient: any,
  userId: string,
  amount: number,
  source: string,
  sourceId: string,
) {
  // First check if the user already exists using the admin client
  let existingUser = null;
  let userCreated = false;

  // Try to get the existing user first with retry logic
  let existingUserData = null;
  let checkError = null;

  // Add retry logic for the initial user fetch with exponential backoff
  // Increased max attempts from 5 to 8
  for (let attempt = 0; attempt < 8; attempt++) {
    const result = await adminClient
      .from("users")
      .select("id, xp, level, token_identifier")
      .eq("id", userId)
      .maybeSingle();

    existingUserData = result.data;
    checkError = result.error;

    if (!checkError && existingUserData) {
      console.log(`Found user on attempt ${attempt + 1}:`, existingUserData);
      break;
    }

    // Wait before retrying with exponential backoff
    if (attempt < 7) {
      // Don't wait after the last attempt
      // Increased max backoff time from 1000ms to 2000ms
      const backoffTime = Math.min(2000, 150 * Math.pow(2, attempt));
      console.log(
        `User not found on attempt ${attempt + 1}, waiting ${backoffTime}ms before retry`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  if (!checkError && existingUserData) {
    console.log("User already exists, using existing data:", existingUserData);
    existingUser = existingUserData;
  } else {
    // If it's a PGRST116 error or any other error, try to create the user
    console.log(
      `User ${userId} not found in users table, will create new user record`,
    );

    // Create a new user record with retry logic
    // Increased max attempts from 3 to 5
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // Double check if the user was created in the meantime
        const { data: doubleCheckUser } = await adminClient
          .from("users")
          .select("id, xp, level, token_identifier")
          .eq("id", userId)
          .maybeSingle();

        if (doubleCheckUser) {
          console.log(
            `User ${userId} was found on attempt ${attempt + 1}, using existing data`,
          );
          existingUser = doubleCheckUser;
          break;
        }

        // Create the user if not found
        const { data: newUser, error: createError } = await adminClient
          .from("users")
          .insert({
            id: userId,
            xp: 0,
            level: 1,
            token_identifier: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          // If we get a duplicate key error, the user was created in a race condition
          if (createError.code === "23505") {
            console.log(
              `User ${userId} was created by another process during insert, fetching data`,
            );
            // Increased wait time before fetching after race condition
            await new Promise((resolve) => setTimeout(resolve, 300));

            const { data: raceUser, error: raceError } = await adminClient
              .from("users")
              .select("id, xp, level, token_identifier")
              .eq("id", userId)
              .single();

            if (!raceError && raceUser) {
              existingUser = raceUser;
              userCreated = true;
              break;
            } else {
              console.log(
                `Attempt ${attempt + 1}: Race condition detected but failed to fetch user: ${raceError?.message}`,
              );
              // Wait a short time before retrying with increased backoff
              await new Promise((resolve) =>
                setTimeout(resolve, 200 * (attempt + 1)),
              );
            }
          } else {
            console.error(
              `Attempt ${attempt + 1}: Error creating user record:`,
              createError,
            );
            // Wait before retrying with increased backoff
            await new Promise((resolve) =>
              setTimeout(resolve, 200 * (attempt + 1)),
            );
          }
        } else {
          console.log(
            `Created new user record on attempt ${attempt + 1}:`,
            newUser,
          );
          existingUser = newUser;
          userCreated = true;
          break;
        }
      } catch (error) {
        console.error(
          `Attempt ${attempt + 1}: Unexpected error during user creation:`,
          error,
        );
        // Wait before retrying with increased backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 200 * (attempt + 1)),
        );
      }
    }

    // Final check to ensure we have a user
    if (!existingUser) {
      console.error(
        `Failed to create or find user ${userId} after multiple attempts`,
      );
      return {
        error: new Error(
          `Failed to create or find user ${userId} after multiple attempts`,
        ),
      };
    }
  }

  // Now we have the user data, either from existing record or newly created
  const userData = existingUser;

  // If we just created the user, wait a moment to ensure database consistency
  if (userCreated) {
    // Increase the wait time to ensure better consistency
    const consistencyWaitTime = 800; // Increased from 500ms to 800ms
    console.log(
      `User was just created, waiting ${consistencyWaitTime}ms for database consistency`,
    );
    await new Promise((resolve) => setTimeout(resolve, consistencyWaitTime));

    // Double-check that the user exists after waiting with retry logic
    let confirmUser = null;
    let confirmError = null;

    // Increased max attempts from 3 to 5
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await adminClient
        .from("users")
        .select("id, xp, level")
        .eq("id", userId)
        .maybeSingle();

      confirmUser = result.data;
      confirmError = result.error;

      if (!confirmError && confirmUser) {
        console.log(
          `User confirmed on verification attempt ${attempt + 1}:`,
          confirmUser,
        );
        break;
      }

      // Wait before retrying with exponential backoff
      if (attempt < 4) {
        // Don't wait after the last attempt
        // Increased backoff time
        const backoffTime = 300 * Math.pow(2, attempt);
        console.log(
          `User verification failed on attempt ${attempt + 1}, waiting ${backoffTime}ms before retry`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }

    if (confirmError || !confirmUser) {
      console.error(
        "User still not found after creation and waiting with retries:",
        confirmError,
      );
      return {
        error: new Error(
          "User creation confirmed but user still not found after multiple verification attempts",
        ),
      };
    }

    console.log(
      "User creation confirmed after waiting and verification:",
      confirmUser,
    );
  }

  const currentXP = userData?.xp || 0;
  const currentLevel = userData?.level || 1;
  const newXP = currentXP + amount;

  // Calculate if this will cause a level up
  const totalXPForNextLevel = _getTotalXPForLevel(currentLevel + 1);
  const willLevelUp = newXP >= totalXPForNextLevel;

  // Calculate the new level
  let newLevel = currentLevel;
  if (willLevelUp) {
    // Find the appropriate level for the new XP amount
    let level = currentLevel;
    while (newXP >= _getTotalXPForLevel(level + 1)) {
      level++;
    }
    newLevel = level;
  }

  console.log(
    `Updating user ${userId} XP: ${currentXP} -> ${newXP}, Level: ${currentLevel} -> ${newLevel}`,
  );

  // Update the user's XP and level if needed
  const updateData = {
    xp: newXP,
    level: newLevel,
    updated_at: new Date().toISOString(),
  };

  console.log(`Updating user ${userId} with data:`, updateData);

  // Update the user's XP and level with enhanced retry logic
  let data = null;
  let error = null;

  // Increased max attempts from 5 to 8
  for (let attempt = 0; attempt < 8; attempt++) {
    // Use admin client for more reliable updates
    const result = await adminClient
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select();

    data = result.data;
    error = result.error;

    if (!error) {
      console.log(`Successfully updated user XP on attempt ${attempt + 1}`);
      break;
    }

    console.log(`Attempt ${attempt + 1}: Error updating user XP:`, error);

    // Wait before retrying with exponential backoff
    if (attempt < 7) {
      // Don't wait after the last attempt
      // Increased max backoff time
      const backoffTime = Math.min(3000, 250 * Math.pow(2, attempt));
      console.log(`Waiting ${backoffTime}ms before retry`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  if (error) {
    console.error("Error updating user XP:", error);
    return { error };
  }

  // Get the updated user to confirm changes with enhanced retry logic
  let updatedUser = null;
  let updateError = null;

  // Increased max attempts from 5 to 8
  for (let attempt = 0; attempt < 8; attempt++) {
    // Use admin client for more reliable reads
    const result = await adminClient
      .from("users")
      .select("xp, level")
      .eq("id", userId)
      .single();

    updatedUser = result.data;
    updateError = result.error;

    if (!updateError && updatedUser) {
      console.log(
        `Successfully fetched updated user on attempt ${attempt + 1}:`,
        updatedUser,
      );
      break;
    }

    console.log(
      `Attempt ${attempt + 1}: Error fetching updated user:`,
      updateError,
    );

    // Wait before retrying with exponential backoff
    if (attempt < 7) {
      // Don't wait after the last attempt
      // Increased max backoff time
      const backoffTime = Math.min(3000, 250 * Math.pow(2, attempt));
      console.log(`Waiting ${backoffTime}ms before retry`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  if (updateError || !updatedUser) {
    console.error(
      "Error fetching updated user after multiple attempts:",
      updateError,
    );
    // If we can't get the updated user, use the data from the update operation
    // and assume no level up occurred
    return { data, leveledUp: false };
  }

  const leveledUp = updatedUser.level > currentLevel;

  // Log the XP award for debugging
  console.log(
    `XP awarded: ${amount} to user ${userId}. New XP: ${updatedUser.xp}, Level: ${updatedUser.level}, Leveled up: ${leveledUp}`,
  );

  // Log XP award to the database for history with enhanced retry logic
  let logError = null;

  // Increased max attempts from 5 to 8
  for (let attempt = 0; attempt < 8; attempt++) {
    // Use admin client for more reliable inserts
    const result = await adminClient.from("xp_logs").insert({
      user_id: userId,
      amount,
      source,
      source_id: sourceId,
      created_at: new Date().toISOString(),
      level_before: currentLevel,
      level_after: updatedUser.level,
    });

    logError = result.error;

    if (!logError) {
      console.log(`Successfully logged XP award on attempt ${attempt + 1}`);
      break;
    }

    console.log(`Attempt ${attempt + 1}: Error logging XP award:`, logError);

    // Wait before retrying with exponential backoff
    if (attempt < 7) {
      // Don't wait after the last attempt
      // Increased max backoff time
      const backoffTime = Math.min(2000, 200 * Math.pow(2, attempt));
      console.log(`Waiting ${backoffTime}ms before retry`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  if (logError) {
    console.error("Error logging XP award after multiple attempts:", logError);
    // Continue even if logging fails
  }

  // Revalidate the dashboard page to reflect XP changes immediately
  revalidatePath("/dashboard");

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
 * Client-side wrapper for the awardXP function
 * This allows client components to call the server action
 */
export async function awardXPFromClient(
  userId: string,
  amount: number,
  source: string,
  sourceId: string,
) {
  try {
    return await awardXP(userId, amount, source, sourceId);
  } catch (error) {
    console.error("Error awarding XP from client:", error);
    return { error };
  }
}

// Helper functions (not exported, so they don't need to be async)
function _getXPForNextLevel(currentLevel: number): number {
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

function _getTotalXPForLevel(targetLevel: number): number {
  const baseXP = 100; // Base XP needed for level 2
  const growthFactor = 1.5; // How much more XP is needed for each level

  let totalXP = 0;
  for (let i = 1; i < targetLevel; i++) {
    totalXP += Math.floor(baseXP * Math.pow(growthFactor, i - 1));
  }

  return totalXP;
}

function _calculateLevelProgress(
  currentXP: number,
  currentLevel: number,
): number {
  const totalXPForCurrentLevel = _getTotalXPForLevel(currentLevel);
  const totalXPForNextLevel = _getTotalXPForLevel(currentLevel + 1);

  const xpInCurrentLevel = currentXP - totalXPForCurrentLevel;
  const xpRequiredForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;

  const progress = Math.floor(
    (xpInCurrentLevel / xpRequiredForNextLevel) * 100,
  );
  return Math.min(Math.max(progress, 0), 100); // Ensure progress is between 0 and 100
}

/**
 * Get the XP required for the next level
 * @param currentLevel The user's current level
 */
export async function getXPForNextLevel(currentLevel: number): Promise<number> {
  return _getXPForNextLevel(currentLevel);
}

/**
 * Get the total XP required to reach a specific level
 * @param targetLevel The target level
 */
export async function getTotalXPForLevel(targetLevel: number): Promise<number> {
  return _getTotalXPForLevel(targetLevel);
}

/**
 * Calculate the progress percentage towards the next level
 * @param currentXP The user's current XP
 * @param currentLevel The user's current level
 */
export async function calculateLevelProgress(
  currentXP: number,
  currentLevel: number,
): Promise<number> {
  return _calculateLevelProgress(currentXP, currentLevel);
}
