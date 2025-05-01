import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const receiverId = formData.get("receiverId")?.toString();

    if (!receiverId) {
      return NextResponse.json(
        { success: false, error: "Receiver ID is required" },
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

    // Check if a friend request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("sender_id", user.id)
      .eq("receiver_id", receiverId)
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: "Friend request already sent" },
        { status: 400 },
      );
    }

    // Insert the friend request
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending",
    });

    if (error) {
      console.error("Error sending friend request:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in request API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send friend request",
      },
      { status: 500 },
    );
  }
}
