import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Count users in the database
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error counting users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get a sample of users for debugging
    const { data: sampleUsers, error: sampleError } = await supabase
      .from("users")
      .select("id, name, email")
      .limit(5);

    if (sampleError) {
      console.error("Error fetching sample users:", sampleError);
    }

    return NextResponse.json({
      count,
      sampleUsers: sampleUsers || [],
      message: "User count retrieved successfully",
    });
  } catch (error) {
    console.error("Unexpected error in debug-users-count:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
