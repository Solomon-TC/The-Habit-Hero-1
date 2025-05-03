import { GlobalLeaderboard } from "./global-leaderboard";
import { FriendsLeaderboard } from "./friends-leaderboard";
import DashboardNavbar from "@/components/dashboard-navbar";

export default function LeaderboardsPage() {
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-synthwave-neonPurple">
            Leaderboards
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Global Leaderboard */}
            <GlobalLeaderboard />

            {/* Friends Leaderboard */}
            <FriendsLeaderboard />
          </div>
        </div>
      </main>
    </>
  );
}
