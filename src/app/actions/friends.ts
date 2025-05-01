"use server";

import { createClient } from "../../supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-actions";

type User = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

/**
 * Search for users by their user ID
 */
export async function searchUsersAction(formData: FormData) {
  const query = formData.get("query")?.toString().trim() || "";
  const searchType = formData.get("searchType")?.toString() || "";

  if (!query) {
    return { users: [] };
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    console.log("Searching for user with ID:", query);

    // First try direct lookup by ID - this is the most reliable method
    try {
      // Try to get the user directly by ID
      const { data: directUser, error: directError } = await supabase
        .from("users")
        .select("id, name, full_name, email, avatar_url, level")
        .eq("id", query)
        .maybeSingle();

      console.log("Direct lookup result:", { directUser, directError });

      if (directUser && !directError) {
        console.log("Found user with direct lookup:", directUser);
        return { users: [directUser] };
      }
    } catch (directLookupError) {
      console.error("Error in direct lookup:", directLookupError);
    }

    // Then try the RPC function as a fallback
    try {
      const { data: users, error } = await supabase.rpc(
        "search_user_by_id_text",
        {
          search_id: query,
        },
      );

      console.log("RPC search results:", { query, users, error });

      if (!error && users && users.length > 0) {
        return { users };
      }
    } catch (rpcError) {
      console.error("Error in RPC search:", rpcError);
    }

    // As a last resort, try the auth.users table
    try {
      const { data: authUser, error: authError } =
        await supabase.auth.admin.getUserById(query);

      console.log("Auth lookup result:", { authUser, authError });

      if (authUser?.user) {
        console.log("Found user in auth table:", authUser);
        return {
          users: [
            {
              id: authUser.user.id,
              email: authUser.user.email,
              name: authUser.user.user_metadata?.name || null,
              full_name: authUser.user.user_metadata?.full_name || null,
              avatar_url: authUser.user.user_metadata?.avatar_url || null,
            },
          ],
        };
      }
    } catch (authLookupError) {
      console.error("Error in auth lookup:", authLookupError);
    }

    return { users: users || [] };
  } catch (error) {
    console.error("Error in searchUsersAction:", error);
    return { users: [] };
  }
}

/**
 * Send a friend request to another user
 */
export async function sendFriendRequestAction(formData: FormData) {
  const receiverId = formData.get("receiverId")?.toString();

  if (!receiverId) {
    return { success: false, error: "Receiver ID is required" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    // Get the current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if a friend request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("sender_id", user.id)
      .eq("receiver_id", receiverId)
      .maybeSingle();

    if (existingRequest) {
      return { success: false, error: "Friend request already sent" };
    }

    // Insert the friend request
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending",
    });

    if (error) {
      console.error("Error sending friend request:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in sendFriendRequestAction:", error);
    return { success: false, error: "Failed to send friend request" };
  }
}

/**
 * Respond to a friend request (accept or reject)
 */
export async function respondToFriendRequestAction(formData: FormData) {
  const requestId = formData.get("requestId")?.toString();
  const accept = formData.get("accept") === "true";

  if (!requestId) {
    return { success: false, error: "Request ID is required" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    // Get the current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get the friend request
    const { data: request, error: fetchError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("receiver_id", user.id)
      .single();

    if (fetchError || !request) {
      return { success: false, error: "Friend request not found" };
    }

    // Update the request status
    const status = accept ? "accepted" : "rejected";
    const { error: updateError } = await supabase
      .from("friend_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // If accepted, create friendship entries
    if (accept) {
      // Create bidirectional friendship entries
      const { error: friendshipError } = await supabase
        .from("friendships")
        .insert([
          { user_id: user.id, friend_id: request.sender_id },
          { user_id: request.sender_id, friend_id: user.id },
        ]);

      if (friendshipError) {
        return { success: false, error: friendshipError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in respondToFriendRequestAction:", error);
    return { success: false, error: "Failed to respond to friend request" };
  }
}

/**
 * Remove a friend
 */
export async function removeFriendAction(formData: FormData) {
  const friendId = formData.get("friendId")?.toString();

  if (!friendId) {
    return { success: false, error: "Friend ID is required" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    // Get the current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Delete both friendship entries (bidirectional)
    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in removeFriendAction:", error);
    return { success: false, error: "Failed to remove friend" };
  }
}
