import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database client" },
        { status: 500 },
      );
    }

    // Get current user for security check
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get ALL users without any filtering
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, created_at")
      .order("created_at", { ascending: false });

    if (allUsersError) {
      console.error("Error fetching all users:", allUsersError);
      return NextResponse.json(
        { error: allUsersError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      users: allUsers || [],
      count: allUsers?.length || 0,
      currentUserId: currentUser.user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Debug users list error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 },
    );
  }
}
