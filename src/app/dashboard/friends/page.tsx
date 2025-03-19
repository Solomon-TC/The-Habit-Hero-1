import { Suspense } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/client-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getFriends, getPendingFriendRequests } from "@/lib/friends";
import {
  respondToFriendRequestAction,
  removeFriendAction,
} from "@/app/actions/friends";
import { Flame, Check, X, Trophy } from "lucide-react";
import { FriendSearch } from "./client";
import { DebugSearch } from "./debug";
import { IdSearch } from "./id-search";
import { RefreshButton } from "./refresh-button";

async function FriendRequests() {
  const { requests } = await getPendingFriendRequests();

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

async function FriendsList() {
  const { friends } = await getFriends();

  console.log(
    "[FriendsList] Rendering friends list with",
    friends?.length || 0,
    "friends",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Friends</CardTitle>
        <CardDescription>
          Stay connected and motivate each other
        </CardDescription>
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

export default async function FriendsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Add a cache-busting timestamp to ensure the page is always fresh
  const timestamp = new Date().getTime();

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Friends</h1>
              <RefreshButton />
            </div>
            <p className="text-gray-600">
              Connect with friends and motivate each other on your habit
              journeys.
            </p>
            {/* Hidden timestamp to force re-render: {timestamp} */}
          </header>

          {/* Search and Add Friends */}
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
              <CardDescription>
                Search for friends by email or username
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FriendSearch />
            </CardContent>
          </Card>

          {/* ID Search Tool */}
          <IdSearch />

          {/* Debug Tool - Comment out in production */}
          {/* <DebugSearch /> */}

          {/* Friend Requests */}
          <Suspense fallback={<div>Loading friend requests...</div>}>
            <FriendRequests />
          </Suspense>

          {/* Friends List */}
          <Suspense fallback={<div>Loading friends...</div>}>
            <FriendsList />
          </Suspense>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
