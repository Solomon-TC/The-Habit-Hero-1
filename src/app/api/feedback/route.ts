import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET endpoint to fetch all feedback sorted by upvotes
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name) {
            return (await cookieStore.get(name))?.value;
          },
          async set(name, value, options) {
            await cookieStore.set({ name, value, ...options });
          },
          async remove(name, options) {
            await cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

    // Get the session to check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();

    // Fetch all feedback ordered by upvotes (descending)
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedback")
      .select(
        `
        id,
        title,
        feedback_type,
        content,
        upvotes,
        created_at,
        user_id,
        users:user_id (name, display_name, avatar_url)
      `,
      )
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 },
      );
    }

    // If user is authenticated, fetch their upvotes to mark which feedback they've upvoted
    let userUpvotes: string[] = [];
    if (sessionData.session) {
      const { data: upvotesData } = await supabase
        .from("feedback_upvotes")
        .select("feedback_id")
        .eq("user_id", sessionData.session.user.id);

      userUpvotes = upvotesData?.map((upvote) => upvote.feedback_id) || [];
    }

    return NextResponse.json({
      feedback: feedbackData,
      userUpvotes,
    });
  } catch (error: any) {
    console.error("Error in feedback GET endpoint:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// POST endpoint to submit new feedback
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name) {
            return (await cookieStore.get(name))?.value;
          },
          async set(name, value, options) {
            await cookieStore.set({ name, value, ...options });
          },
          async remove(name, options) {
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
        { error: "You must be logged in to submit feedback" },
        { status: 401 },
      );
    }

    // Parse the request body
    const body = await request.json();
    const { title, feedback_type, content } = body;

    // Validate required fields
    if (!title || !feedback_type || !content) {
      return NextResponse.json(
        { error: "Title, feedback type, and content are required" },
        { status: 400 },
      );
    }

    // Insert the feedback into the database
    const { data: feedbackData, error: insertError } = await supabase
      .from("feedback")
      .insert({
        user_id: sessionData.session.user.id,
        title,
        feedback_type,
        content,
        upvotes: 0,
      })
      .select();

    if (insertError) {
      console.error("Error inserting feedback:", insertError);
      return NextResponse.json(
        { error: "Failed to submit feedback" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Feedback submitted successfully",
      feedback: feedbackData[0],
    });
  } catch (error: any) {
    console.error("Error in feedback POST endpoint:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
