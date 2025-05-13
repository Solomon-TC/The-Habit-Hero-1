import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-actions";

export async function POST(request: NextRequest) {
  try {
    // Extract the feedback ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const feedbackId = pathParts[pathParts.length - 2]; // Get the ID from the path

    if (!feedbackId) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 },
      );
    }

    // Use our centralized server client that already handles cookies properly
    const supabase = await createServerSupabaseClient();

    // Get the session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { error: "You must be logged in to upvote feedback" },
        { status: 401 },
      );
    }

    const userId = sessionData.session.user.id;

    // Check if the user has already upvoted this feedback
    const { data: existingUpvote, error: checkError } = await supabase
      .from("feedback_upvotes")
      .select()
      .eq("feedback_id", feedbackId)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows returned
      console.error("Error checking existing upvote:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing upvote" },
        { status: 500 },
      );
    }

    // If the user has already upvoted, remove the upvote (toggle behavior)
    if (existingUpvote) {
      // Begin a transaction
      const { error: removeError } = await supabase.rpc("remove_upvote", {
        p_feedback_id: feedbackId,
        p_user_id: userId,
      });

      if (removeError) {
        console.error("Error removing upvote:", removeError);
        return NextResponse.json(
          { error: "Failed to remove upvote" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Upvote removed successfully",
        action: "removed",
      });
    } else {
      // If the user hasn't upvoted yet, add an upvote
      // Begin a transaction
      const { error: addError } = await supabase.rpc("add_upvote", {
        p_feedback_id: feedbackId,
        p_user_id: userId,
      });

      if (addError) {
        console.error("Error adding upvote:", addError);
        return NextResponse.json(
          { error: "Failed to add upvote" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Upvote added successfully",
        action: "added",
      });
    }
  } catch (error: any) {
    console.error("Error in upvote endpoint:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
