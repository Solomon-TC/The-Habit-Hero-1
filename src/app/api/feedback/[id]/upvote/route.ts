import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const feedbackId = context.params.id;
    if (!feedbackId) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 },
      );
    }

    // Use cookies() directly instead of storing in a variable
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name) {
            const cookieStore = await cookies();
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          },
          async set(name, value, options) {
            const cookieStore = await cookies();
            await cookieStore.set({ name, value, ...options });
          },
          async remove(name, options) {
            const cookieStore = await cookies();
            await cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

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
