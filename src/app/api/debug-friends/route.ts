import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get friends data
    const { data: friends, error: friendsError } = await supabase
      .from("friends")
      .select(
        "friend_id, users!friends_friend_id_fkey(id, email, name, level, xp)",
      )
      .eq("user_id", currentUser.user.id);

    if (friendsError) {
      console.error("Error fetching friends:", friendsError);
      return NextResponse.json(
        { error: friendsError.message || "Error fetching friends" },
        { status: 500 },
      );
    }

    // Get friend requests
    const { data: friendRequests, error: requestsError } = await supabase
      .from("friend_requests")
      .select(
        "id, from_user_id, created_at, users!friend_requests_from_user_id_fkey(id, email, name, level, xp)",
      )
      .eq("to_user_id", currentUser.user.id)
      .eq("status", "pending");

    if (requestsError) {
      console.error("Error fetching friend requests:", requestsError);
    }

    return NextResponse.json({
      userId: currentUser.user.id,
      friends: friends || [],
      friendRequests: friendRequests || [],
      friendsCount: friends?.length || 0,
      requestsCount: friendRequests?.length || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error in debug friends API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
