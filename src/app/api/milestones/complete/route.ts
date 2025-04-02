import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { completeMilestone } from "@/lib/milestone-actions";

export async function POST(request: Request) {
  try {
    // Check content type and handle different formats
    const contentType = request.headers.get("content-type");
    let milestoneId, goalId, userId;

    if (contentType?.includes("application/json")) {
      const body = await request.json();
      milestoneId = body.milestoneId;
      goalId = body.goalId;
      userId = body.userId;
    } else {
      // Handle form data or other formats
      const formData = await request.formData();
      milestoneId = formData.get("milestoneId")?.toString();
      goalId = formData.get("goalId")?.toString();
      userId = formData.get("userId")?.toString();
    }

    if (!milestoneId || !goalId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to create Supabase client" },
        { status: 500 },
      );
    }

    // Verify the user has access to this milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select("id, goal_id")
      .eq("id", milestoneId)
      .single();

    if (milestoneError) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    // Verify the goal belongs to the user
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select("id, user_id")
      .eq("id", goalId)
      .single();

    if (goalError || goal.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to this goal" },
        { status: 403 },
      );
    }

    // Complete the milestone and get the result
    const result = await completeMilestone(milestoneId, goalId, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error completing milestone:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
