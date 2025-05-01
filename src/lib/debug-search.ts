"use client";

import { getSupabaseClient } from "./supabase-client";

export async function debugSearchById(userId: string) {
  console.log("Debug search for user ID:", userId);
  const supabase = getSupabaseClient();

  try {
    // Method 1: Direct RPC call
    console.log("Method 1: Using RPC function");
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "search_user_by_id_text",
      { search_id: userId },
    );
    console.log("RPC result:", { data: rpcData, error: rpcError });

    // Method 2: Direct query
    console.log("Method 2: Direct query");
    const { data: directData, error: directError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId);
    console.log("Direct query result:", {
      data: directData,
      error: directError,
    });

    // Method 3: Auth API
    console.log("Method 3: Auth API");
    try {
      const { data: authData, error: authError } =
        await supabase.auth.admin.getUserById(userId);
      console.log("Auth API result:", { data: authData, error: authError });
    } catch (e) {
      console.log("Auth API error:", e);
    }

    return { rpcData, directData };
  } catch (error) {
    console.error("Debug search error:", error);
    return { error };
  }
}
