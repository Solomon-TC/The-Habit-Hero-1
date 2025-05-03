import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { LeaderboardTable } from "@/components/leaderboard-table";

export async function GlobalLeaderboard() {
  const supabase = await createServerSupabaseClient();

  // Fetch top 100 users ordered by XP (descending)
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, display_name, avatar_url, level, xp")
    .order("xp", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching global leaderboard:", error);
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Global Leaderboard</h2>
        <p className="text-red-500">Failed to load leaderboard data</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Global Leaderboard</h2>
      <LeaderboardTable users={users || []} />
    </div>
  );
}
