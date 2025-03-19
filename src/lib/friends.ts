import { createServerSupabaseClient } from "./supabase-server-actions";
import { createClient } from "@/supabase/server";

export async function searchUsers(query: string) {
  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { users: [] };

  query = query.trim();
  console.log("[lib/friends] Search query:", query);

  // Try the simplified search function first
  try {
    const { data: searchResults, error } = await supabase.rpc(
      "simple_user_search",
      { search_query: query },
    );

    if (!error && searchResults && searchResults.length > 0) {
      console.log(
        "[lib/friends] Simple search successful:",
        searchResults.length,
      );

      // Filter out current user
      const filteredResults = searchResults.filter(
        (user) => user && user.id !== currentUser.user.id,
      );

      console.log(
        "[lib/friends] Final search results:",
        filteredResults.length,
      );
      return { users: filteredResults || [] };
    }
  } catch (error) {
    console.error("[lib/friends] Error in simple search:", error);
  }

  // Fallback: Get all users
  try {
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .limit(50);

    if (allUsers && allUsers.length > 0) {
      console.log("[lib/friends] Fallback to all users:", allUsers.length);

      // Filter out current user
      const filteredResults = allUsers.filter(
        (user) => user && user.id !== currentUser.user.id,
      );

      console.log(
        "[lib/friends] Final search results:",
        filteredResults.length,
      );
      return { users: filteredResults || [] };
    }
  } catch (error) {
    console.error("[lib/friends] Error fetching all users:", error);
  }

  return { users: [] };
}

export async function sendFriendRequest(receiverId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { success: false, error: "Not authenticated" };

  // Check if a request already exists
  const { data: existingRequest } = await supabase
    .from("friend_requests")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUser.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.user.id})`,
    )
    .maybeSingle();

  if (existingRequest) {
    return {
      success: false,
      error: "A friend request already exists between these users",
    };
  }

  // Check if they're already friends
  const { data: existingFriendship } = await supabase
    .from("friends")
    .select("*")
    .or(
      `and(user_id.eq.${currentUser.user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${currentUser.user.id})`,
    )
    .maybeSingle();

  if (existingFriendship) {
    return { success: false, error: "These users are already friends" };
  }

  // Create the friend request
  const { error } = await supabase.from("friend_requests").insert({
    sender_id: currentUser.user.id,
    receiver_id: receiverId,
    status: "pending",
  });

  if (error) {
    console.error("Error sending friend request:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean,
) {
  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { success: false, error: "Not authenticated" };

  console.log(
    "[lib/friends] Responding to friend request:",
    requestId,
    "accept:",
    accept,
  );

  // Get the request
  const { data: request } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .eq("receiver_id", currentUser.user.id)
    .single();

  if (!request) {
    console.error("[lib/friends] Friend request not found:", requestId);
    return { success: false, error: "Friend request not found" };
  }

  console.log("[lib/friends] Found request:", request);

  if (accept) {
    // Start a transaction to update the request and create friendship
    const { error: updateError } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (updateError) {
      console.error(
        "[lib/friends] Error updating friend request:",
        updateError,
      );
      return { success: false, error: updateError.message };
    }

    console.log(
      "[lib/friends] Creating friendship between",
      currentUser.user.id,
      "and",
      request.sender_id,
    );

    // Create two friendship records (one for each user)
    const { data: friendshipData, error: friendshipError } = await supabase
      .from("friends")
      .insert([
        { user_id: currentUser.user.id, friend_id: request.sender_id },
        { user_id: request.sender_id, friend_id: currentUser.user.id },
      ])
      .select();

    if (friendshipError) {
      console.error(
        "[lib/friends] Error creating friendship:",
        friendshipError,
      );
      return { success: false, error: friendshipError.message };
    }

    console.log(
      "[lib/friends] Friendship created successfully:",
      friendshipData,
    );
  } else {
    // Reject the request
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (error) {
      console.error("[lib/friends] Error rejecting friend request:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function getFriends() {
  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { friends: [] };

  console.log("[lib/friends] Getting friends for user:", currentUser.user.id);

  // Let's check the friends table directly to see what's there
  const { data: allFriendships, error: allFriendshipsError } = await supabase
    .from("friends")
    .select("*");

  console.log("[lib/friends] All friendships in table:", allFriendships);

  if (allFriendshipsError) {
    console.error(
      "[lib/friends] Error checking all friendships:",
      allFriendshipsError,
    );
  }

  const { data: friendConnections, error } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", currentUser.user.id);

  if (error) {
    console.error("[lib/friends] Error fetching friend connections:", error);
    return { friends: [] };
  }

  console.log(
    "[lib/friends] Friend connections for current user:",
    friendConnections,
  );

  if (!friendConnections || friendConnections.length === 0) {
    console.log("[lib/friends] No friend connections found");
    return { friends: [] };
  }

  const friendIds = friendConnections.map((f) => f.friend_id);
  console.log("[lib/friends] Friend IDs:", friendIds);

  const { data: friends, error: friendsError } = await supabase
    .from("users")
    .select("id, name, email, avatar_url, created_at")
    .in("id", friendIds);

  if (friendsError) {
    console.error("[lib/friends] Error fetching friends:", friendsError);
    return { friends: [] };
  }

  console.log("[lib/friends] Found friends:", friends?.length || 0);
  return { friends: friends || [] };
}

export async function getPendingFriendRequests() {
  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { requests: [] };

  const { data: requests, error } = await supabase
    .from("friend_requests")
    .select(
      `
      id,
      created_at,
      sender:sender_id(id, name, email, avatar_url)
    `,
    )
    .eq("receiver_id", currentUser.user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching friend requests:", error);
    return { requests: [] };
  }

  return { requests };
}

export async function removeFriend(friendId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { success: false, error: "Not authenticated" };

  // Delete both friendship records
  const { error } = await supabase
    .from("friends")
    .delete()
    .or(
      `and(user_id.eq.${currentUser.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.user.id})`,
    );

  if (error) {
    console.error("Error removing friend:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
