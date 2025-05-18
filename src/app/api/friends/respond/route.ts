import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-actions";

export async function POST(request: NextRequest) {
  try {
    const formData: FormData = await request.formData();
    const requestId = formData.get("requestId")?.toString();
    const accept = formData.get("accept") === "true";

    // Validate the request ID
    if (!requestId || requestId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 },
      );
    }

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database client" },
        { status: 500 },
      );
    }

    // Get the current user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { error: "You must be logged in to respond to friend requests" },
        { status: 401 },
      );
    }

    const currentUserId = sessionData.session.user.id;

    // Get the friend request
    const { data: friendRequest, error: requestError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("recipient_id", currentUserId) // Ensure the current user is the recipient
      .single();

    if (requestError) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 },
      );
    }

    if (accept) {
      // Accept the request - create friendship entries for both users
      const { error: acceptError } = await supabase.from("friendships").insert([
        {
          user_id: currentUserId,
          friend_id: friendRequest.sender_id,
          created_at: new Date().toISOString(),
        },
        {
          user_id: friendRequest.sender_id,
          friend_id: currentUserId,
          created_at: new Date().toISOString(),
        },
      ]);

      if (acceptError) {
        return NextResponse.json(
          { error: "Failed to accept friend request" },
          { status: 500 },
        );
      }
    }

    // Delete the request regardless of accept/reject
    const { error: deleteError } = await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to process friend request" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      action: accept ? "accepted" : "rejected",
    });
  } catch (error: any) {
    console.error("Error responding to friend request:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
