import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const receiverId = formData.get("receiverId")?.toString();

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if a request already exists
    const { data: existingRequest } = await supabase
      .from("friend_requests")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUser.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.user.id})`,
      )
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: "A friend request already exists between these users" },
        { status: 400 },
      );
    }

    // Check if they're already friends
    const { data: existingFriendship } = await supabase
      .from("friends")
      .select("*")
      .or(
        `and(user_id.eq.${currentUser.user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${currentUser.user.id})`,
      )
      .maybeSingle();

    if (existingFriendship) {
      return NextResponse.json(
        { error: "These users are already friends" },
        { status: 400 },
      );
    }

    // Create the friend request
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: currentUser.user.id,
      receiver_id: receiverId,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending friend request:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 },
    );
  }
}
