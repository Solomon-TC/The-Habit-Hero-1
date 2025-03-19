import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    const supabase = await createServerSupabaseClient();

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (id) {
      // Get user by ID
      const { data: user, error } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json({ user });
    } else {
      // Get all users (limited)
      const { data: users, error } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .limit(50);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Filter out current user
      const filteredUsers = users.filter(
        (user) => user.id !== currentUser.user.id,
      );

      return NextResponse.json({ users: filteredUsers });
    }
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 },
    );
  }
}
