import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";
import { awardXP } from "@/lib/xp";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user data from the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Get recent XP logs
    const { data: xpLogs, error: logsError } = await supabase
      .from("xp_logs")
      .select("*")
      .eq("user_id", currentUser.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Award test XP using the awardXP function
    const testXpAmount = 5;
    const xpResult = await awardXP(
      currentUser.user.id,
      testXpAmount,
      "debug",
      "test",
    );

    // Get the updated user data
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.user.id)
      .single();

    // XP logging is now handled by the awardXP function
    const logError = xpResult.error;

    return NextResponse.json({
      user: userData,
      xpLogs: xpLogs || [],
      testXpAdded: testXpAmount,
      updatedUser: updatedUser || null,
      errors: {
        userError: userError?.message,
        logsError: logsError?.message,
        updateError: updateError?.message,
        logError: logError?.message,
      },
    });
  } catch (error: any) {
    console.error("Error in debug XP API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
