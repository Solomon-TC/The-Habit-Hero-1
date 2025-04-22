"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Check, X, Trophy, Star, Activity } from "lucide-react";

function getDisplayName(
  userData: any,
  fallbackName?: string | null,
  userId?: string,
): string {
  if (
    userData?.name &&
    userData.name !== "null" &&
    userData.name !== "undefined" &&
    userData.name.trim() !== "" &&
    !userData.name.includes("-") &&
    userData.name.length < 30 &&
    userData.name !== userId
  ) {
    return userData.name;
  }

  if (
    userData?.full_name &&
    userData.full_name !== "null" &&
    userData.full_name !== "undefined" &&
    userData.full_name.trim() !== ""
  ) {
    return userData.full_name;
  }

  if (
    userData?.email &&
    userData.email !== "null" &&
    userData.email !== "undefined" &&
    userData.email.trim() !== ""
  ) {
    const emailParts = userData.email.split("@");
    if (emailParts.length > 0 && emailParts[0].trim() !== "") {
      return emailParts[0];
    }
  }

  if (
    fallbackName &&
    fallbackName.trim() !== "" &&
    !fallbackName.includes("-") &&
    fallbackName.length < 30
  ) {
    return fallbackName;
  }

  return userId ? `User ${userId.substring(0, 8)}` : "Unknown User";
}

import { getFriends, getPendingFriendRequests } from "@/lib/friends";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import {
  respondToFriendRequestAction,
  removeFriendAction,
} from "@/app/actions/friends";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import FriendCard from "@/components/friend-card";

function FriendRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refreshRequests = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    async function loadRequests() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { requests: friendRequests } = await getPendingFriendRequests();
        setRequests(friendRequests || []);
        setError(null);
      } catch (error) {
        console.error("Error loading friend requests:", error);
        setError("Failed to load friend requests. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [refreshKey]);

  if (loading) {
    return <div className="p-4 text-center">Loading friend requests...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <Button onClick={refreshRequests} className="ml-2" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
        <CardDescription>Pending requests from other users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request: any) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  {request.sender ? (
                    <AvatarImage
                      src={
                        request.sender.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.sender.name || "unknown"}`
                      }
                      alt={request.sender.name || "Unknown User"}
                    />
                  ) : (
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=unknown`}
                      alt="Unknown User"
                    />
                  )}
                  <AvatarFallback>
                    {request.sender?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {request.sender?.name || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {request.sender?.email || "No email available"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <form action={respondToFriendRequestAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="accept" value="false" />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </form>
                <form action={respondToFriendRequestAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="accept" value="true" />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FriendsList() {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refreshFriends = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    async function loadFriends() {
      try {
        console.log("[FriendsList] Loading friends...");
        setLoading(true);

        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          console.error("User not authenticated");
          setError("Not authenticated. Please sign in again.");
          return;
        }

        console.log("Current user ID:", userData.user.id);

        // Use the direct get_friends function
        const { data: directFriends, error: directError } = await supabase.rpc(
          "get_friends",
          { user_id: userData.user.id },
        );

        if (directError) {
          console.error("Error using get_friends function:", directError);

          // Fallback to direct query
          const { data: friendships, error: friendshipsError } = await supabase
            .from("friends")
            .select("friend_id")
            .eq("user_id", userData.user.id);

          if (friendshipsError) {
            console.error("Error fetching friendships:", friendshipsError);
            throw friendshipsError;
          }

          if (!friendships || friendships.length === 0) {
            console.log("No friends found");
            setFriends([]);
            setLoading(false);
            return;
          }

          // Get user details for each friend
          const friendIds = friendships.map((f) => f.friend_id);
          const { data: friendUsers, error: usersError } = await supabase
            .from("users")
            .select(
              "id, name, full_name, email, avatar_url, level, xp, display_name",
            )
            .in("id", friendIds);

          if (usersError) {
            console.error("Error fetching friend user details:", usersError);
            throw usersError;
          }

          // Format the data to match the expected structure
          const fallbackFriends = friendships.map((friend) => {
            const userData =
              friendUsers?.find((u) => u.id === friend.friend_id) || {};
            const displayName =
              userData.display_name ||
              userData.name ||
              userData.full_name ||
              (userData.email
                ? userData.email.split("@")[0]
                : `User ${friend.friend_id.substring(0, 8)}`);

            return {
              friend_id: friend.friend_id,
              name: displayName,
              full_name: userData.full_name,
              email: userData.email,
              avatar_url: userData.avatar_url,
              level: userData.level || 1,
              xp: userData.xp || 0,
              display_name: displayName,
            };
          });

          setFriends(
            fallbackFriends.map((friend) => ({
              friend_id: friend.friend_id,
              users: {
                id: friend.friend_id,
                name: friend.name,
                full_name: friend.full_name,
                email: friend.email,
                avatar_url: friend.avatar_url,
                level: friend.level,
                xp: friend.xp,
                display_name: friend.display_name,
              },
            })),
          );
          setLoading(false);
          return;
        }

        console.log("Fetched friend IDs:", directFriends);

        if (!directFriends || directFriends.length === 0) {
          console.log("No friends found");
          setFriends([]);
          setLoading(false);
          return;
        }

        // Get user details for each friend
        const friendIds = directFriends.map((f) => f.friend_id);
        const { data: friendUsers, error: usersError } = await supabase
          .from("users")
          .select(
            "id, name, full_name, email, avatar_url, level, xp, display_name",
          )
          .in("id", friendIds);

        if (usersError) {
          console.error("Error fetching friend user details:", usersError);
          throw usersError;
        }

        console.log("Fetched friend user details:", friendUsers);

        // Format the data to match the expected structure
        const formattedFriends = directFriends.map((friend) => {
          const userData =
            friendUsers?.find((u) => u.id === friend.friend_id) || {};
          const displayName =
            userData.display_name ||
            userData.name ||
            userData.full_name ||
            (userData.email
              ? userData.email.split("@")[0]
              : `User ${friend.friend_id.substring(0, 8)}`);

          return {
            friend_id: friend.friend_id,
            users: {
              id: friend.friend_id,
              name: displayName,
              full_name: userData.full_name,
              email: userData.email,
              avatar_url: userData.avatar_url,
              level: userData.level || 1,
              xp: userData.xp || 0,
              display_name: displayName,
            },
          };
        });

        setFriends(formattedFriends);
        setError(null);
      } catch (e) {
        console.error("[FriendsList] Error loading friends:", e);
        setError(
          "Failed to load friends: " +
            (e instanceof Error ? e.message : String(e)),
        );
      } finally {
        setLoading(false);
      }
    }
    loadFriends();
  }, [refreshKey]);

  if (loading) {
    return <div className="p-4 text-center">Loading friends...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <Button onClick={refreshFriends} className="ml-2" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Friends</CardTitle>
            <CardDescription>
              Stay connected and motivate each other
            </CardDescription>
          </div>
          <Button
            onClick={refreshFriends}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {friends && friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends
              .filter((friend) => friend && friend.friend_id)
              .map((friend: any) => {
                const uniqueKey = friend.friend_id || `friend-${Math.random()}`;

                const userData = friend.users || {};
                console.log("Raw userData from query:", userData);

                let updatedUserData = { ...userData };

                console.log(
                  `Friend ID ${friend.friend_id} raw userData:`,
                  updatedUserData,
                );

                if (updatedUserData && typeof updatedUserData === "object") {
                  if (
                    updatedUserData.users &&
                    typeof updatedUserData.users === "object"
                  ) {
                    console.log(
                      "Found nested users object:",
                      updatedUserData.users,
                    );
                    updatedUserData = {
                      ...updatedUserData,
                      ...updatedUserData.users,
                    };
                  }
                }

                let friendName =
                  updatedUserData.display_name ||
                  updatedUserData.name ||
                  updatedUserData.full_name;

                if (
                  !friendName ||
                  friendName === friend.friend_id ||
                  friendName.includes("-")
                ) {
                  if (
                    updatedUserData.email &&
                    updatedUserData.email.includes("@")
                  ) {
                    const emailParts = updatedUserData.email.split("@");
                    if (emailParts.length > 0 && emailParts[0].trim() !== "") {
                      friendName = emailParts[0];
                    }
                  } else {
                    friendName = `User ${friend.friend_id.substring(0, 8)}`;
                  }
                }
                console.log(
                  `Friend name from database for ${friend.friend_id}:`,
                  friendName,
                );

                console.log("Friend data being passed to FriendCard:", {
                  friendId: friend.friend_id,
                  friendName: friendName,
                  userData: updatedUserData,
                });

                const formattedFriendData = {
                  id: updatedUserData.id || friend.friend_id,
                  name: friendName,
                  full_name: updatedUserData.full_name,
                  email: updatedUserData.email || "",
                  level: updatedUserData.level || 1,
                  xp: updatedUserData.xp || 0,
                  avatar_url: updatedUserData.avatar_url,
                };

                console.log("Formatted friend data with name:", {
                  id: formattedFriendData.id,
                  name: formattedFriendData.name,
                  friendName: friendName,
                  isUUID: friendName.includes("-") && friendName.length > 30,
                });

                if (friendName.startsWith("User ") && friendName.length <= 15) {
                  console.log(
                    `Detected default name ${friendName}, attempting direct fetch`,
                  );
                  (async () => {
                    try {
                      const supabase = createBrowserSupabaseClient();
                      const { data: directUserData } = await supabase
                        .from("users")
                        .select("id, name, full_name, email")
                        .eq("id", friend.friend_id)
                        .single();

                      console.log(
                        `Direct fetch for ${friend.friend_id} returned:`,
                        directUserData,
                      );

                      if (
                        directUserData &&
                        (directUserData.name || directUserData.full_name)
                      ) {
                        refreshFriends();
                      }
                    } catch (err) {
                      console.error(
                        `Error in direct fetch for ${friend.friend_id}:`,
                        err,
                      );
                    }
                  })();
                }

                console.log(
                  `Formatted friend data for ${friend.friend_id}:`,
                  formattedFriendData,
                );

                return (
                  <FriendCard
                    key={uniqueKey}
                    friendId={friend.friend_id}
                    friendName={friendName}
                    friendEmail={updatedUserData.email}
                    friendData={formattedFriendData}
                  />
                );
              })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">
              You don't have any friends yet. Search for users to connect with!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function calculateLevelProgress(
  currentXP: number,
  currentLevel: number,
): number {
  const baseXP = 100;
  const growthFactor = 1.5;

  let totalXPForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    totalXPForCurrentLevel += Math.floor(
      baseXP * Math.pow(growthFactor, i - 1),
    );
  }

  let totalXPForNextLevel = totalXPForCurrentLevel;
  totalXPForNextLevel += Math.floor(
    baseXP * Math.pow(growthFactor, currentLevel - 1),
  );

  const xpInCurrentLevel = currentXP - totalXPForCurrentLevel;
  const xpRequiredForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;

  const progress = Math.floor(
    (xpInCurrentLevel / xpRequiredForNextLevel) * 100,
  );
  return Math.min(Math.max(progress, 0), 100);
}

export function ClientFriendComponents() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshAll = () => {
    console.log("[ClientFriendComponents] Refreshing all components");
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    console.log("[ClientFriendComponents] Initial load, refreshing components");
    const timer = setTimeout(() => {
      refreshAll();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <FriendRequests key={`requests-${refreshTrigger}`} />
      <FriendsList key={`friends-${refreshTrigger}`} />
    </>
  );
}
