import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId")?.toString();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    console.log("Debug search for user with ID:", userId);

    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try all possible search methods and return detailed results
    const results = {};

    // Method 1: Direct UUID match
    try {
      const { data: directMatch, error: directError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .eq("id", userId)
        .limit(1);

      results.directMatch = {
        success: directMatch && directMatch.length > 0,
        error: directError?.message,
        data: directMatch && directMatch.length > 0 ? directMatch[0] : null,
      };
    } catch (error: any) {
      results.directMatch = {
        success: false,
        error: error.message,
        data: null,
      };
    }

    // Method 2: Text comparison exact match
    try {
      const { data: textMatch, error: textError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .filter("id::text", "eq", userId)
        .limit(1);

      results.textMatch = {
        success: textMatch && textMatch.length > 0,
        error: textError?.message,
        data: textMatch && textMatch.length > 0 ? textMatch[0] : null,
      };
    } catch (error: any) {
      results.textMatch = {
        success: false,
        error: error.message,
        data: null,
      };
    }

    // Method 3: Partial text match
    try {
      const { data: partialMatch, error: partialError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .filter("id::text", "ilike", `%${userId}%`)
        .limit(1);

      results.partialMatch = {
        success: partialMatch && partialMatch.length > 0,
        error: partialError?.message,
        data: partialMatch && partialMatch.length > 0 ? partialMatch[0] : null,
      };
    } catch (error: any) {
      results.partialMatch = {
        success: false,
        error: error.message,
        data: null,
      };
    }

    // Method 4: RPC function
    try {
      const { data: rpcMatch, error: rpcError } = await supabase.rpc(
        "search_user_by_id",
        { user_id_query: userId },
      );

      results.rpcMatch = {
        success: rpcMatch && rpcMatch.length > 0,
        error: rpcError?.message,
        data: rpcMatch && rpcMatch.length > 0 ? rpcMatch[0] : null,
      };
    } catch (error: any) {
      results.rpcMatch = {
        success: false,
        error: error.message,
        data: null,
      };
    }

    // Method 5: Auth admin getUserById - Commented out due to permission issues
    results.authMatch = {
      success: false,
      error: "Auth admin method disabled due to permission issues",
      data: null,
    };

    // Return all results for debugging
    return NextResponse.json({
      userId,
      results,
      firstSuccess:
        Object.values(results).find((r: any) => r.success)?.data || null,
    });
  } catch (error: any) {
    console.error("Unexpected error in debug ID search API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
