import { createClient } from "@/utils/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Get all users
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .limit(100);

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
