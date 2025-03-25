"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Check, X, Trophy } from "lucide-react";
import { getFriends, getPendingFriendRequests } from "@/lib/friends";
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
} from "@/components/client-card";

function FriendRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Function to manually refresh the requests list
  const refreshRequests = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    async function loadRequests() {
      try {
        // Force a small delay to ensure DB operations have completed
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

  // Function to manually refresh the friends list
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
        // Force a small delay to ensure DB operations have completed
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const { friends: friendsList } = await getFriends();
        console.log("[FriendsList] Loaded friends:", friendsList);

        if (friendsList && friendsList.length > 0) {
          setFriends(friendsList);
          setError(null);
        } else {
          console.log("[FriendsList] No friends found, retrying...");
          // Try one more time after a delay
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const { friends: retryFriendsList } = await getFriends();
          console.log("[FriendsList] Retry loaded friends:", retryFriendsList);
          setFriends(retryFriendsList || []);
          setError(null);
        }
      } catch (e) {
        console.error("[FriendsList] Error loading friends:", e);
        setError("Failed to load friends. Please try again.");
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

  console.log(
    "[FriendsList] Rendering friends list with",
    friends?.length || 0,
    "friends",
  );

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
          <div className="space-y-4">
            {friends.map((friend: any) => {
              // Calculate a fake streak based on user id for demo purposes
              const fakeStreak =
                (parseInt(friend.id.substring(0, 8), 16) % 30) + 1;
              const isOnline = Math.random() > 0.5; // Random online status for demo

              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage
                          src={
                            friend.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name || "unknown"}`
                          }
                          alt={friend.name || "Unknown User"}
                        />
                        <AvatarFallback>
                          {friend.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-300"}`}
                      ></span>
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {friend.name || "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {isOnline ? "Online now" : "Last seen recently"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="flex gap-1 items-center bg-orange-50 text-orange-700 border-orange-200"
                    >
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span>{fakeStreak} day streak</span>
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Trophy className="mr-2 h-4 w-4" />
                        Challenge
                      </Button>
                      <form action={removeFriendAction}>
                        <input
                          type="hidden"
                          name="friendId"
                          value={friend.id}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
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

export function ClientFriendComponents() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh both components
  const refreshAll = () => {
    console.log("[ClientFriendComponents] Refreshing all components");
    setRefreshTrigger((prev) => prev + 1);
  };

  // Removed auto-refresh to prevent constant refreshing
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log("[ClientFriendComponents] Auto-refreshing components");
  //     refreshAll();
  //   }, 5000);
  //
  //   return () => clearInterval(interval);
  // }, []);

  // Only refresh once when the component mounts
  useEffect(() => {
    console.log("[ClientFriendComponents] Initial load, refreshing components");
    // Add a small delay before initial load to ensure auth is ready
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
