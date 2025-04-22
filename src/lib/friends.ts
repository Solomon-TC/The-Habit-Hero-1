"use client";

import { createServerSupabaseClient } from "./supabase-server-actions";
import { createBrowserSupabaseClient } from "./supabase-browser";

// Create a stable client reference for consistent hydration
let cachedSupabaseClient: any = null;

async function getStableSupabaseClient() {
  // Always create a fresh client on the server to avoid hydration issues
  if (typeof window === "undefined") {
    return await createServerSupabaseClient();
  }

  // Client-side: Reuse the client to ensure stable references
  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createBrowserSupabaseClient();
  }
  return cachedSupabaseClient;
}

export async function searchUsers(query: string) {
  // Return empty results during SSR to prevent hydration mismatches
  if (typeof window === "undefined") {
    return { users: [] };
  }

  const supabase = await getStableSupabaseClient();
  if (!supabase) return { users: [] };

  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) return { users: [] };

    query = query.trim();
    console.log("[lib/friends] Search query:", query);

    // Create a Set to track unique user IDs across all search methods
    const uniqueUserIds = new Set<string>();
    const uniqueUsers: any[] = [];

    // Helper function to add unique users to our results
    const addUniqueUsers = (users: any[]) => {
      if (!users || users.length === 0) return;

      users.forEach((user) => {
        if (
          user &&
          user.id !== currentUser.user.id &&
          !uniqueUserIds.has(user.id)
        ) {
          uniqueUserIds.add(user.id);
          uniqueUsers.push(user);
        }
      });
    };

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

        addUniqueUsers(searchResults);

        console.log("[lib/friends] Final search results:", uniqueUsers.length);

        if (uniqueUsers.length > 0) {
          return { users: uniqueUsers };
        }
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

        addUniqueUsers(allUsers);

        console.log("[lib/friends] Final search results:", uniqueUsers.length);

        return { users: uniqueUsers };
      }
    } catch (error) {
      console.error("[lib/friends] Error fetching all users:", error);
    }
  } catch (e) {
    console.error("[lib/friends] Exception in searchUsers:", e);
  }

  return { users: [] };
}

export async function sendFriendRequest(receiverId: string) {
  const supabase = await getStableSupabaseClient();
  if (!supabase)
    return { success: false, error: "Failed to initialize Supabase client" };

  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user)
      return { success: false, error: "Not authenticated" };

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
  } catch (e) {
    console.error("[lib/friends] Exception in sendFriendRequest:", e);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean,
) {
  const supabase = await getStableSupabaseClient();
  if (!supabase)
    return { success: false, error: "Failed to initialize Supabase client" };

  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user)
      return { success: false, error: "Not authenticated" };

    console.log(
      "[lib/friends] Responding to friend request:",
      requestId,
      "accept:",
      accept,
    );

    // Get the request
    const { data: request, error: requestError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("receiver_id", currentUser.user.id)
      .single();

    if (requestError || !request) {
      console.error(
        "[lib/friends] Friend request not found:",
        requestId,
        requestError,
      );
      return { success: false, error: "Friend request not found" };
    }

    // Prevent self-referential friendships
    if (request.sender_id === currentUser.user.id) {
      console.error("[lib/friends] Cannot accept request from self");
      return { success: false, error: "Cannot accept request from self" };
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

      // Check if friendship already exists to avoid duplicates
      const { data: existingFriendship, error: checkError } = await supabase
        .from("friends")
        .select("*")
        .or(
          `and(user_id.eq.${currentUser.user.id},friend_id.eq.${request.sender_id}),and(user_id.eq.${request.sender_id},friend_id.eq.${currentUser.user.id})`,
        )
        .maybeSingle();

      if (checkError) {
        console.error(
          "[lib/friends] Error checking existing friendship:",
          checkError,
        );
      }

      if (existingFriendship) {
        console.log(
          "[lib/friends] Friendship already exists:",
          existingFriendship,
        );
      } else {
        try {
          // First record: current user -> friend
          const { error: error1 } = await supabase.from("friends").insert({
            user_id: currentUser.user.id,
            friend_id: request.sender_id,
            created_at: new Date().toISOString(),
          });

          if (error1) {
            console.error(
              "[lib/friends] Error creating first friendship record:",
              error1,
            );
          } else {
            console.log(
              "[lib/friends] First friendship record created successfully",
            );
          }

          // Second record: friend -> current user
          const { error: error2 } = await supabase.from("friends").insert({
            user_id: request.sender_id,
            friend_id: currentUser.user.id,
            created_at: new Date().toISOString(),
          });

          if (error2) {
            console.error(
              "[lib/friends] Error creating second friendship record:",
              error2,
            );
          } else {
            console.log(
              "[lib/friends] Second friendship record created successfully",
            );
          }

          if (error1 && error2) {
            return {
              success: false,
              error: "Failed to create friendship records",
            };
          }
        } catch (e) {
          console.error(
            "[lib/friends] Exception creating friendship records:",
            e,
          );
          return {
            success: false,
            error: "Exception creating friendship records",
          };
        }
      }
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
  } catch (e) {
    console.error("[lib/friends] Exception in respondToFriendRequest:", e);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getFriends() {
  // Return empty results during SSR to prevent hydration mismatches
  if (typeof window === "undefined") {
    return { friends: [] };
  }

  try {
    const supabase = await getStableSupabaseClient();
    if (!supabase) {
      console.error("[lib/friends] Failed to initialize Supabase client");
      return { friends: [] };
    }

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      console.log("[lib/friends] No authenticated user found");
      return { friends: [] };
    }

    console.log("[lib/friends] Getting friends for user:", currentUser.user.id);

    // Direct query to get all friendships for the current user
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friends")
      .select("*")
      .eq("user_id", currentUser.user.id);

    if (friendshipsError) {
      console.error(
        "[lib/friends] Error fetching friendships:",
        friendshipsError,
      );
      return { friends: [] };
    }

    console.log("[lib/friends] Found friendships:", friendships?.length || 0);

    if (!friendships || friendships.length === 0) {
      return { friends: [] };
    }

    // Extract friend IDs
    const friendIds = friendships.map((f) => f.friend_id);
    console.log("[lib/friends] Friend IDs:", friendIds);

    // If we have friend IDs but no corresponding users, create placeholder users
    try {
      await supabase.rpc("ensure_friend_users_exist");
    } catch (error) {
      console.error("[lib/friends] Error ensuring friend users exist:", error);
      // Continue anyway, as the function might not exist in all environments
    }

    // Try to ensure all friend users exist
    try {
      for (const friendId of friendIds) {
        await supabase.rpc("ensure_friend_user_exists", {
          friend_id: friendId,
        });
      }
    } catch (error) {
      console.error("[lib/friends] Error ensuring friend users exist:", error);
      // Continue anyway, as the function might not exist in all environments
    }

    // Run the function to ensure all friend users exist with proper names
    try {
      await supabase.rpc("ensure_friend_users_exist");
      console.log(
        "[lib/friends] Ensured all friend users exist with proper names",
      );
    } catch (error) {
      console.log(
        "[lib/friends] Error running ensure_friend_users_exist:",
        error,
      );
      // Continue anyway as this is just a helper
    }

    // Get friend user details with full_name included
    // First try the get_user_by_id function for each friend to ensure they exist
    for (const friendId of friendIds) {
      try {
        const { data: userData } = await supabase.rpc("get_user_by_id", {
          input_user_id: friendId,
        });
        console.log(
          `[lib/friends] User data for friend ${friendId}:`,
          userData,
        );
      } catch (error) {
        console.log(`Error ensuring friend ${friendId} exists:`, error);
      }
    }

    // Then get all friend data with explicit field selection to ensure we get all needed fields
    const { data: friends, error: friendsError } = await supabase
      .from("users")
      .select(
        "id, name, full_name, email, avatar_url, level, xp, created_at, updated_at, display_name",
      )
      .in("id", friendIds);

    console.log("[lib/friends] Friend IDs for query:", friendIds);
    console.log("[lib/friends] Raw friends query result:", friends);

    if (friendsError) {
      console.error(
        "[lib/friends] Error fetching friend details:",
        friendsError,
      );
      return { friends: [] };
    }

    // If we still don't have friends data, create placeholder objects
    if (!friends || friends.length === 0) {
      console.log("[lib/friends] Creating placeholder friend objects");
      const placeholderFriends = friendships.map((f) => ({
        id: f.friend_id,
        name: `Friend ${f.friend_id.substring(0, 8)}`,
        email: `user_${f.friend_id.substring(0, 8)}@example.com`,
        avatar_url: null,
        created_at: f.created_at,
      }));
      console.log(
        "[lib/friends] Placeholder friends:",
        placeholderFriends.length,
      );
      return { friends: placeholderFriends };
    }

    // Process friends data to ensure valid names
    const processedFriends = friends.map((friend) => {
      // Log each friend's data for debugging
      console.log(`[lib/friends] Processing friend ${friend.id}:`, {
        name: friend.name,
        full_name: friend.full_name,
        email: friend.email,
      });

      // Use display_name if available, otherwise try to get a proper display name
      if (
        friend.display_name &&
        friend.display_name !== "null" &&
        friend.display_name !== "undefined" &&
        friend.display_name.trim() !== ""
      ) {
        // Use the display_name directly
        friend.name = friend.display_name;
      } else {
        // Check if name is a UUID or invalid
        const isNameInvalid =
          !friend.name ||
          friend.name === "null" ||
          friend.name === "undefined" ||
          friend.name.trim() === "" ||
          friend.name.includes("-") ||
          friend.name.length > 30 ||
          friend.name === friend.id;

        // Try to get a proper display name
        if (isNameInvalid) {
          // Try to use full_name first
          if (
            friend.full_name &&
            friend.full_name !== "null" &&
            friend.full_name !== "undefined" &&
            friend.full_name.trim() !== ""
          ) {
            friend.name = friend.full_name;
          }
          // Try to use email username next
          else if (
            friend.email &&
            friend.email !== "null" &&
            friend.email !== "undefined" &&
            friend.email.trim() !== ""
          ) {
            const emailParts = friend.email.split("@");
            if (emailParts.length > 0 && emailParts[0].trim() !== "") {
              friend.name = emailParts[0];
            }
          }
          // Last resort: use a generic name with the user ID
          else {
            friend.name = `Friend ${friend.id.substring(0, 8)}`;
          }
        }

        // Update the display_name field for consistency
        friend.display_name = friend.name;
      }

      // Try to use the database function if available
      try {
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          (async () => {
            const { data } = await supabase.rpc("get_user_display_name", {
              user_id: friend.id,
            });
            if (data) {
              friend.name = data;
              console.log(`[lib/friends] Updated name from function: ${data}`);
            }
          })();
        }
      } catch (e) {
        console.log(
          "[lib/friends] Error getting display name from function:",
          e,
        );
      }

      return friend;
    });

    console.log(
      "[lib/friends] Processed friend details:",
      processedFriends.length,
    );
    return { friends: processedFriends };
  } catch (e) {
    console.error("[lib/friends] Exception in getFriends:", e);
    return { friends: [] };
  }
}

export async function getPendingFriendRequests() {
  // Return empty results during SSR to prevent hydration mismatches
  if (typeof window === "undefined") {
    return { requests: [] };
  }

  try {
    const supabase = await getStableSupabaseClient();
    if (!supabase) return { requests: [] };

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) return { requests: [] };

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

    return { requests: requests || [] };
  } catch (e) {
    console.error("[lib/friends] Exception in getPendingFriendRequests:", e);
    return { requests: [] };
  }
}

export async function removeFriend(friendId: string) {
  try {
    const supabase = await getStableSupabaseClient();
    if (!supabase)
      return { success: false, error: "Failed to initialize Supabase client" };

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user)
      return { success: false, error: "Not authenticated" };

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
  } catch (e) {
    console.error("[lib/friends] Exception in removeFriend:", e);
    return { success: false, error: "An unexpected error occurred" };
  }
}
