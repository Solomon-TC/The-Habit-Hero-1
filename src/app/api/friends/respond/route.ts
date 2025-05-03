import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const requestId = formData.get("requestId")?.toString();
    const accept = formData.get("accept") === "true";

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    // Get the current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get the friend request
    const { data: request, error: fetchError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("receiver_id", user.id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json(
        { success: false, error: "Friend request not found" },
        { status: 404 },
      );
    }

    // Update the request status
    const status = accept ? "accepted" : "rejected";
    const { error: updateError } = await supabase
      .from("friend_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    // If accepted, create friendship entries
    if (accept) {
      try {
        console.log(
          "API: Creating friendship entries between",
          user.id,
          "and",
          request.sender_id,
        );

        // Check if friendship already exists to avoid duplicates
        const { data: existingFriendship, error: checkError } = await supabase
          .from("friendships")
          .select("*")
          .or(
            `user_id.eq.${user.id},friend_id.eq.${request.sender_id},user_id.eq.${request.sender_id},friend_id.eq.${user.id}`,
          )
          .maybeSingle();

        if (checkError) {
          console.error("API: Error checking existing friendship:", checkError);
        }

        if (!existingFriendship) {
          // Create bidirectional friendship entries
          const { data: friendshipData, error: friendshipError } =
            await supabase
              .from("friendships")
              .insert([
                { user_id: user.id, friend_id: request.sender_id },
                { user_id: request.sender_id, friend_id: user.id },
              ])
              .select();

          console.log("API: Friendship creation result:", {
            friendshipData,
            friendshipError,
          });

          if (friendshipError) {
            console.error(
              "API: Failed to create friendship entries:",
              friendshipError,
            );
            return NextResponse.json(
              { success: false, error: friendshipError.message },
              { status: 500 },
            );
          }
        } else {
          console.log("API: Friendship already exists, skipping creation");
        }
      } catch (friendshipCreationError) {
        console.error(
          "API: Exception during friendship creation:",
          friendshipCreationError,
        );
        return NextResponse.json(
          { success: false, error: "Failed to create friendship entries" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in respond API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to respond to friend request",
      },
      { status: 500 },
    );
  }
}
