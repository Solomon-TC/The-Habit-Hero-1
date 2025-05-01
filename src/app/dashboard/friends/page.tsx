import DashboardNavbar from "@/components/dashboard-navbar";
import FriendList from "@/components/friends/friend-list";
import FriendSearch from "@/components/friends/friend-search";
import FriendRequests from "@/components/friends/friend-requests";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function FriendsPage() {
  // Check authentication
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Friends</h1>
            </div>
            <p className="text-gray-600">
              Connect with friends and motivate each other on your habit
              journeys.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Friend Requests Section */}
            <div className="lg:col-span-3">
              <FriendRequests />
            </div>

            {/* Friend Search Section */}
            <div className="lg:col-span-1">
              <FriendSearch />
            </div>

            {/* Friend List Section */}
            <div className="lg:col-span-2">
              <FriendList />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
