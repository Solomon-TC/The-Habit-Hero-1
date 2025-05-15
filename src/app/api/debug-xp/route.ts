import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Create a server-side Supabase client
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database client" },
        { status: 500 },
      );
    }

    // Get the current user
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the user's XP and level
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("xp, level")
      .eq("id", currentUser.user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Get the user's XP logs
    const { data: xpLogs, error: logsError } = await supabase
      .from("xp_logs")
      .select("*")
      .eq("user_id", currentUser.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: currentUser.user.id,
        xp: userData?.xp || 0,
        level: userData?.level || 1,
      },
      logs: xpLogs || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in debug-xp endpoint:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
