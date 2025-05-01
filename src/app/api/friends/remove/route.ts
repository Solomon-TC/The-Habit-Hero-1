import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const friendId = formData.get("friendId")?.toString();

    if (!friendId) {
      return NextResponse.json(
        { success: false, error: "Friend ID is required" },
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

    // Delete both friendship entries (bidirectional)
    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in remove friend API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove friend" },
      { status: 500 },
    );
  }
}
