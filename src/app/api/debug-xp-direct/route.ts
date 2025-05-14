import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";
import { awardXP } from "@/lib/xp";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database client" },
        { status: 500 },
      );
    }

    // Get the current user
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get original user data for comparison
    const { data: originalUserData } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.user.id)
      .maybeSingle();

    console.log("Original user data before XP award:", originalUserData);

    // Use the improved awardXP function instead of direct database operations
    const testXpAmount = 10;
    const result = await awardXP(
      currentUser.user.id,
      testXpAmount,
      "debug-direct",
      "test-direct",
    );

    if (result.error) {
      console.error("Error awarding XP:", result.error);
      return NextResponse.json(
        { error: result.error.message || "Error awarding XP" },
        { status: 500 },
      );
    }

    // Get the updated user data to confirm changes
    const { data: updatedUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching updated user data:", fetchError);
    }

    // Return detailed information about the XP award
    return NextResponse.json({
      originalUser: originalUserData || null,
      updatedUser: updatedUser || result.data || null,
      xpAdded: testXpAmount,
      leveledUp: result.leveledUp,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      newXP: result.newXP,
      transactionResult: result,
      errors: {
        fetchError: fetchError?.message,
      },
    });
  } catch (error: any) {
    console.error("Unexpected error in debug XP API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
