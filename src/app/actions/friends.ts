"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { revalidatePath } from "next/cache";

export async function searchUsersAction(formData: FormData) {
  const query = formData.get("query")?.toString().trim() || "";
  const searchType = formData.get("searchType")?.toString() || "";
  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { users: [] };

  console.log("Search query (raw):", query, "Search type:", searchType);

  // If searching by ID
  if (searchType === "id" && query) {
    try {
      // First try direct exact match
      const { data: directIdMatch, error: directError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .eq("id", query)
        .limit(1);

      if (!directError && directIdMatch && directIdMatch.length > 0) {
        console.log("Direct ID match successful:", directIdMatch.length);

        // Filter out current user
        const filteredResults = directIdMatch.filter(
          (user) => user && user.id !== currentUser.user.id,
        );

        if (filteredResults.length > 0) {
          console.log("Final direct ID match results:", filteredResults.length);
          return { users: filteredResults || [] };
        }
      }

      // Try text comparison for exact match
      const { data: textIdMatch, error: textError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .filter("id::text", "eq", query)
        .limit(1);

      if (!textError && textIdMatch && textIdMatch.length > 0) {
        console.log("Text ID match successful:", textIdMatch.length);

        // Filter out current user
        const filteredResults = textIdMatch.filter(
          (user) => user && user.id !== currentUser.user.id,
        );

        if (filteredResults.length > 0) {
          console.log("Final text ID match results:", filteredResults.length);
          return { users: filteredResults || [] };
        }
      }

      // Then try the RPC function
      const { data: userById, error } = await supabase.rpc(
        "search_user_by_id",
        { user_id_query: query },
      );

      if (!error && userById && userById.length > 0) {
        console.log("User ID search successful:", userById.length);

        // Filter out current user
        const filteredResults = userById.filter(
          (user) => user && user.id !== currentUser.user.id,
        );

        console.log("Final ID search results:", filteredResults.length);
        return { users: filteredResults || [] };
      }
    } catch (error) {
      console.error("Error in ID search:", error);
    }
  }

  // Try the simplified search function
  try {
    const { data: searchResults, error } = await supabase.rpc(
      "simple_user_search",
      { search_query: query },
    );

    if (!error && searchResults && searchResults.length > 0) {
      console.log("Simple search successful:", searchResults.length);

      // Filter out current user
      const filteredResults = searchResults.filter(
        (user) => user && user.id !== currentUser.user.id,
      );

      console.log("Final search results:", filteredResults.length);
      return { users: filteredResults || [] };
    }
  } catch (error) {
    console.error("Error in simple search:", error);
  }

  // Fallback: Get all users
  try {
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .limit(50);

    if (allUsers && allUsers.length > 0) {
      console.log("Fallback to all users:", allUsers.length);

      // Filter out current user
      const filteredResults = allUsers.filter(
        (user) => user && user.id !== currentUser.user.id,
      );

      console.log("Final search results:", filteredResults.length);
      return { users: filteredResults || [] };
    }
  } catch (error) {
    console.error("Error fetching all users:", error);
  }

  return { users: [] };
}

export async function sendFriendRequestAction(formData: FormData) {
  const receiverId = formData.get("receiverId")?.toString();
  if (!receiverId) return { success: false, error: "Receiver ID is required" };

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
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/friends");
  return { success: true };
}

export async function respondToFriendRequestAction(formData: FormData) {
  const requestId = formData.get("requestId")?.toString();
  const accept = formData.get("accept") === "true";

  if (!requestId) return { success: false, error: "Request ID is required" };

  const supabase = await createServerSupabaseClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) return { success: false, error: "Not authenticated" };

  // Get the request
  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .eq("receiver_id", currentUser.user.id)
    .single();

  if (requestError || !request) {
    console.error("Friend request not found:", requestError);
    return { success: false, error: "Friend request not found" };
  }

  if (accept) {
    try {
      // Start a transaction to update the request and create friendship
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating friend request:", updateError);
        return { success: false, error: updateError.message };
      }

      // Explicitly log the friendship creation attempt
      console.log("Creating friendship records between:", {
        user1: currentUser.user.id,
        user2: request.sender_id,
      });

      // First check if friendship records already exist to avoid duplicates
      const { data: existingFriendships } = await supabase
        .from("friends")
        .select("*")
        .or(
          `and(user_id.eq.${currentUser.user.id},friend_id.eq.${request.sender_id}),and(user_id.eq.${request.sender_id},friend_id.eq.${currentUser.user.id})`,
        );

      if (existingFriendships && existingFriendships.length > 0) {
        console.log("Friendship records already exist:", existingFriendships);
      } else {
        // Create two friendship records (one for each user)
        const { data: friendshipData, error: friendshipError } = await supabase
          .from("friends")
          .insert([
            {
              user_id: currentUser.user.id,
              friend_id: request.sender_id,
              created_at: new Date().toISOString(),
            },
            {
              user_id: request.sender_id,
              friend_id: currentUser.user.id,
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (friendshipError) {
          console.error("Error creating friendship:", friendshipError);
          return { success: false, error: friendshipError.message };
        }

        console.log("Friendship created successfully:", friendshipData);
      }
    } catch (error) {
      console.error("Unexpected error in friend request acceptance:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  } else {
    // Reject the request
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (error) {
      console.error("Error rejecting friend request:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/friends");
  return { success: true };
}

export async function removeFriendAction(formData: FormData) {
  const friendId = formData.get("friendId")?.toString();
  if (!friendId) return { success: false, error: "Friend ID is required" };

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
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/friends");
  return { success: true };
}
