import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { updateGoalProgress } from "@/lib/goals";

export async function POST(request: NextRequest) {
  try {
    const { goalId, progress, userId } = await request.json();

    if (!goalId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log(
      `[API] Goal complete request for goal ${goalId}, progress: ${progress}`,
    );

    // Update goal progress and potentially award XP
    const result = await updateGoalProgress(goalId, progress);

    if ("error" in result && result.error) {
      console.error(`[API] Error updating goal progress:`, result.error);
      return NextResponse.json(
        {
          error:
            typeof result.error === "string"
              ? result.error
              : "Error updating goal progress",
        },
        { status: 500 },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[API] Goal progress updated successfully:`, result);
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] Unexpected error in goal complete API:`, error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
