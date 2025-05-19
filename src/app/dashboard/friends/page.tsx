import DashboardNavbar from "@/components/dashboard-navbar";
import FriendList from "@/components/friends/friend-list";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import FriendActions from "@/components/friends/friend-actions";

export const dynamic = "force-dynamic";

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
          <header className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                <h1 className="text-3xl font-bold">Friends</h1>
              </div>
              <p className="text-gray-600">
                Connect with friends and motivate each other on your habit
                journeys.
              </p>
            </div>
            <FriendActions />
          </header>

          <div className="w-full">
            <FriendList />
          </div>
        </div>
      </main>
    </>
  );
}
