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
import { FriendSearch } from "./client";
import { DebugSearch } from "./debug";
import { DebugFriends } from "./debug-friends";
import { IdSearch } from "./id-search";
import { RefreshButton } from "./refresh-button";
import { ClientFriendComponents } from "./client-components";

// Server component wrapper
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

          {/* Debug Tools */}
          <DebugFriends />

          {/* Friend Requests and Friends List */}
          <ClientFriendComponents />
        </div>
      </main>
    </SubscriptionCheck>
  );
}
