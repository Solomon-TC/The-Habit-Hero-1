import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server-actions";
import { awardXP } from "@/lib/xp";

export async function POST(request: NextRequest) {
  try {
    const { habitId, userId, count = 1, notes } = await request.json();

    if (!habitId || !userId) {
      return NextResponse.json(
        { error: "Habit ID and User ID are required" },
        { status: 400 },
      );
    }

    console.log(
      `Habit completion request received for habit ${habitId} by user ${userId}`,
    );

    // Create a service role client that bypasses RLS
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: "Failed to create service role client" },
        { status: 500 },
      );
    }

    // Check if the habit has already been completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingLogs, error: logsError } = await adminClient
      .from("habit_logs")
      .select("*")
      .eq("habit_id", habitId)
      .eq("user_id", userId)
      .gte("completed_at", today.toISOString());

    if (logsError) {
      console.error("Error checking existing logs:", logsError);
      // Continue anyway, don't block the completion
    } else if (existingLogs && existingLogs.length > 0) {
      console.log(
        `Habit ${habitId} already completed today, but allowing multiple completions`,
      );
      // We'll allow multiple completions per day, but log it
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
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    console.log(`Successfully created habit log entry: ${logData.id}`);

    // Get the habit to check streak and award XP
    const { data: habit, error: habitError } = await adminClient
      .from("habits")
      .select("*")
      .eq("id", habitId)
      .single();

    if (habitError) {
      console.error("Error fetching habit for streak update:", habitError);
      return NextResponse.json({ error: habitError.message }, { status: 500 });
    }

    console.log(`Retrieved habit data: ${habit.name} (ID: ${habit.id})`);

    // Update the streak
    const { error: updateError } = await adminClient
      .from("habits")
      .update({
        streak: habit.streak + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", habitId);

    if (updateError) {
      console.error("Error updating habit streak:", updateError);
      // Continue anyway to award XP
    } else {
      console.log(`Updated habit streak to ${habit.streak + 1}`);
    }

    // Award XP to the user
    const xpValue = habit.xp_value || 10; // Default to 10 XP if not set
    console.log(`Awarding ${xpValue} XP for completing habit ${habitId}`);

    // Check if user exists before awarding XP
    try {
      const { data: existingUser, error: existingUserError } = await adminClient
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingUserError && existingUserError.code === "PGRST116") {
        console.log(`Creating new user record for ${userId}`);
      }
    } catch (err) {
      console.log(`Error checking user existence: ${err}`);
    }

    const xpResult = await awardXP(userId, xpValue, "habit", habitId);
    console.log("XP award result:", xpResult);

    if (xpResult.error) {
      console.error("Error awarding XP:", xpResult.error);
      return NextResponse.json({
        success: true, // Still mark as success since the habit was completed
        logData,
        error: `Habit completed but XP not awarded: ${xpResult.error.message || "Unknown error"}`,
        xpGained: 0,
      });
    }

    console.log(
      `XP awarded successfully: ${xpValue}, Level up: ${xpResult.leveledUp}`,
    );

    return NextResponse.json({
      success: true,
      logData,
      leveledUp: xpResult.leveledUp,
      oldLevel: xpResult.oldLevel,
      newLevel: xpResult.newLevel,
      xpGained: xpValue,
      habitName: habit.name || "Habit",
    });
  } catch (error: any) {
    console.error("Error in habit completion API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
