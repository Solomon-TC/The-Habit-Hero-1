import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const query = formData.get("query")?.toString().trim() || "";
    const searchType = formData.get("searchType")?.toString() || "";

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    // Search for users by ID using the text version of the function
    const { data: users, error } = await supabase.rpc(
      "search_user_by_id_text",
      {
        search_id: query,
      },
    );

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search users" },
      { status: 500 },
    );
  }
}
