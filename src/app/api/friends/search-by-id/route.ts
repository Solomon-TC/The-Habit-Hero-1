import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId")?.toString();
    const exactId = formData.get("exactId")?.toString();
    const isExactSearch = request.nextUrl.searchParams.get("exact") === "true";

    const searchId = exactId || userId;

    if (!searchId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    console.log(
      "Searching for user with ID:",
      searchId,
      "Exact search:",
      isExactSearch,
    );

    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Direct query for exact ID match - skipping auth.admin due to permission issues
    if (isExactSearch || exactId) {
      console.log("Performing exact search for ID:", searchId);
      // Skip auth.admin.getUserById due to permission issues
    }

    // Direct query for exact ID match in users table
    const { data: directMatch, error: directError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("id", searchId)
      .single();

    if (directMatch) {
      console.log("Found user via direct match in users table:", directMatch);
      return NextResponse.json({ users: [directMatch] });
    }

    // Try direct query with UUID format
    try {
      // First try exact match with eq after casting to text
      const { data: exactTextMatch, error: exactTextError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .filter("id::text", "eq", searchId)
        .limit(1);

      if (exactTextMatch && exactTextMatch.length > 0) {
        console.log("Found user via exact text match:", exactTextMatch[0]);
        return NextResponse.json({ users: exactTextMatch });
      }

      // If no exact match, try partial match
      const { data: uuidMatch, error: uuidError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .filter("id::text", "ilike", `%${searchId}%`)
        .limit(5);

      if (uuidMatch && uuidMatch.length > 0) {
        console.log("Found user via UUID partial match:", uuidMatch[0]);
        return NextResponse.json({ users: uuidMatch });
      }
    } catch (uuidError) {
      console.error("Error in UUID search:", uuidError);
    }

    // Fallback to the RPC function
    const { data: userById, error } = await supabase.rpc("search_user_by_id", {
      user_id_query: searchId,
    });

    if (error) {
      console.error("Error in ID search API:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (userById && userById.length > 0) {
      console.log("Found user via RPC function:", userById[0]);
      return NextResponse.json({ users: userById });
    }

    console.log("No user found with ID:", searchId);
    return NextResponse.json({ users: [] });
  } catch (error: any) {
    console.error("Unexpected error in ID search API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
