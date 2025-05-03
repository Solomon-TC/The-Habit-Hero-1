"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import FriendCard from "@/components/friend-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";
import Link from "next/link";

type Friend = {
  friend_id: string;
  name: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  level: number | null;
  xp: number | null;
  display_name: string | null;
};

type FriendData = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  level?: number | null;
  xp?: number | null;
  display_name?: string | null;
};

export default function FriendList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsData, setFriendsData] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = getSupabaseClient();

  // Check authentication status first
  const checkAuth = async () => {
    try {
      // First try to refresh the auth session via API
      try {
        const response = await fetch("/api/auth/refresh");
        const result = await response.json();

        if (result.success && (result.user || result.session)) {
          console.log("Auth refreshed via API:", result.user?.id);
          setUserId(result.user?.id);
          setAuthError(false);
          return result.user?.id;
        }
      } catch (refreshErr) {
        console.error("Error refreshing auth via API:", refreshErr);
        // Continue with local checks if API refresh fails
      }

      // Try to get session directly from Supabase
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionData?.session) {
        console.log("Session found:", sessionData.session.user.id);
        setUserId(sessionData.session.user.id);
        setAuthError(false);
        return sessionData.session.user.id;
      }

      // If session approach failed, try getting user directly
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userData?.user) {
        console.log("User authenticated:", userData.user.id);
        setUserId(userData.user.id);
        setAuthError(false);
        return userData.user.id;
      }

      // If we get here, we don't have authentication
      console.log("No authenticated user found");
      setAuthError(true);
      setUserId(null);
      return null;
    } catch (err) {
      console.error("Error checking authentication:", err);
      setAuthError(true);
      setUserId(null);
      return null;
    }
  };

  // Fetch friends list and their complete data
  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check authentication
      const currentUserId = await checkAuth();
      if (!currentUserId) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      // Call the RPC function with the user_id parameter
      const { data, error } = await supabase.rpc(
        "get_friends_with_display_names",
        { user_id: currentUserId }, // Pass the user_id parameter
        { count: "exact" },
      );

      // If the RPC function doesn't exist yet, fall back to direct query
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        error.message &&
        error.message.includes(
          "function get_friends_with_display_names() does not exist",
        )
      ) {
        console.log("Falling back to direct query on friendships table");

        // First query where user is the user_id
        const { data: userFriends, error: userFriendsError } = await supabase
          .from("friendships")
          .select(
            `
            friend_id,
            friend:friend_id(id, email, name, full_name, avatar_url, level, xp, display_name)
            `,
          )
          .eq("user_id", currentUserId);

        if (userFriendsError) {
          console.error("Error fetching user friends:", userFriendsError);
        }

        // Then query where user is the friend_id
        const { data: friendsOfUser, error: friendsOfUserError } =
          await supabase
            .from("friendships")
            .select(
              `
            user_id,
            friend:user_id(id, email, name, full_name, avatar_url, level, xp, display_name)
            `,
            )
            .eq("friend_id", currentUserId);

        if (friendsOfUserError) {
          console.error("Error fetching friends of user:", friendsOfUserError);
        }

        // Combine both results
        const userFriendsTransformed =
          userFriends?.map((item) => ({
            friend_id: item.friend_id,
            name: item.friend?.name || null,
            full_name: item.friend?.full_name || null,
            email: item.friend?.email || null,
            avatar_url: item.friend?.avatar_url || null,
            level: item.friend?.level || null,
            xp: item.friend?.xp || null,
            display_name: item.friend?.display_name || null,
          })) || [];

        const friendsOfUserTransformed =
          friendsOfUser?.map((item) => ({
            friend_id: item.user_id,
            name: item.friend?.name || null,
            full_name: item.friend?.full_name || null,
            email: item.friend?.email || null,
            avatar_url: item.friend?.avatar_url || null,
            level: item.friend?.level || null,
            xp: item.friend?.xp || null,
            display_name: item.friend?.display_name || null,
          })) || [];

        // Combine and deduplicate
        const allFriends = [
          ...userFriendsTransformed,
          ...friendsOfUserTransformed,
        ];
        const uniqueFriends = allFriends.filter(
          (friend, index, self) =>
            index === self.findIndex((f) => f.friend_id === friend.friend_id),
        );

        return setFriends(uniqueFriends);
      }

      if (error) {
        throw error;
      }

      const friendsList = data || [];
      setFriends(friendsList);

      // Extract friend IDs to fetch complete user data
      const friendIds = friendsList.map((friend) => friend.friend_id);

      if (friendIds.length > 0) {
        // Fetch complete user data for all friends directly from users table
        const { data: friendsData, error: friendsDataError } = await supabase
          .from("users")
          .select(
            "id, name, full_name, email, avatar_url, level, xp, display_name",
          )
          .in("id", friendIds);

        if (friendsDataError) {
          console.error("Error fetching friends data:", friendsDataError);
        } else {
          setFriendsData(friendsData || []);
        }
      } else {
        setFriendsData([]);
      }
    } catch (err: any) {
      console.error("Error fetching friends:", err);
      // Check if this is an auth error
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        err.message &&
        err.message.includes("Auth")
      ) {
        setAuthError(true);
      } else {
        // Handle case where err might be empty or not have expected properties
        const errorMessage =
          err &&
          typeof err === "object" &&
          ("message" in err || "details" in err || "hint" in err)
            ? err.message || err.details || err.hint
            : "Failed to load friends";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove friend handler
  const handleRemoveFriend = async (friendId: string) => {
    try {
      const formData = new FormData();
      formData.append("friendId", friendId);

      // Call the server action to remove friend
      const response = await fetch("/api/friends/remove", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to remove friend");
      }

      // Update local state
      setFriends(friends.filter((friend) => friend.friend_id !== friendId));
    } catch (err: any) {
      console.error("Error removing friend:", err);
      setError(err.message || "Failed to remove friend");
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First try to refresh auth via API
      const response = await fetch("/api/auth/refresh");
      const result = await response.json();

      console.log("Auth refresh result:", result);

      if (result.success) {
        // Force state update to trigger re-render
        setAuthError(false);
        if (result.user?.id) {
          setUserId(result.user.id);
        }
      }

      // Then fetch friends again
      await fetchFriends();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    // Check auth status immediately on component mount
    const initialLoad = async () => {
      // Try to refresh auth first
      try {
        const response = await fetch("/api/auth/refresh");
        const result = await response.json();

        if (result.success && result.user?.id) {
          console.log("Initial auth refresh successful:", result.user.id);
          setUserId(result.user.id);
          setAuthError(false);
        }
      } catch (err) {
        console.error("Error during initial auth refresh:", err);
      }

      // Then fetch friends
      await fetchFriends();
    };

    initialLoad();

    // Set up realtime subscription for friend changes
    const channel = supabase
      .channel("friend-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
        },
        () => {
          // Refresh friends list when changes occur
          fetchFriends();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading friends...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (authError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center py-8">
            <p className="text-amber-600 mb-4">
              Please sign in to view your friends list
            </p>
            <div className="flex gap-4">
              <Link
                href="/sign-in"
                className="text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md"
              >
                Sign In
              </Link>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh Session"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-40">
            <p className="text-red-500 mb-2">{error}</p>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Try Again"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Friends</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have any friends yet.</p>
            <p className="text-sm text-gray-400 mt-2 mb-4">
              Search for users to add friends!
            </p>
            <Link
              href="/dashboard/friends"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Find Friends
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {friends.map((friend) => {
              // Find the complete friend data from the users table
              const friendData = friendsData.find(
                (data) => data.id === friend.friend_id,
              );

              // Combine data from both sources, prioritizing the users table data
              const combinedData = {
                friendId: friend.friend_id,
                friendEmail: friendData?.email || friend.email,
                friendName:
                  friendData?.display_name ||
                  friendData?.name ||
                  friend.display_name ||
                  friend.name,
                friendData: friendData || {
                  id: friend.friend_id,
                  name: friend.name,
                  full_name: friend.full_name,
                  email: friend.email,
                  avatar_url: friend.avatar_url,
                  level: friend.level,
                  xp: friend.xp,
                  display_name: friend.display_name,
                },
              };

              return <FriendCard key={friend.friend_id} {...combinedData} />;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
