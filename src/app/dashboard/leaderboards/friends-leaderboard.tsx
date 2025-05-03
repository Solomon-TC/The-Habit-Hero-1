import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { LeaderboardTable } from "@/components/leaderboard-table";

export async function FriendsLeaderboard() {
  const supabase = await createServerSupabaseClient();

  // Get the current user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Friends Leaderboard</h2>
        <p className="text-amber-500">
          Please sign in to view your friends leaderboard
        </p>
      </div>
    );
  }

  // Fetch the current user's data
  const { data: currentUser, error: currentUserError } = await supabase
    .from("users")
    .select("id, name, display_name, avatar_url, level, xp")
    .eq("id", currentUserId)
    .single();

  if (currentUserError) {
    console.error("Error fetching current user data:", currentUserError);
  }

  // Get friend IDs using the get_friends function
  const { data: friendships, error: friendshipsError } = await supabase.rpc(
    "get_friends_with_display_names",
    { user_id: currentUserId },
  );

  if (friendshipsError) {
    console.error("Error fetching friendships:", friendshipsError);
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Friends Leaderboard</h2>
        <p className="text-red-500">Failed to load friends data</p>
      </div>
    );
  }

  // Extract friend IDs
  const friendIds =
    friendships?.map((friendship) => friendship.friend_id) || [];

  if (friendIds.length === 0) {
    // If no friends, just show current user
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Friends Leaderboard</h2>
        {currentUser ? (
          <LeaderboardTable users={[currentUser]} />
        ) : (
          <p className="text-gray-500">
            No friends found. Add friends to see them on your leaderboard!
          </p>
        )}
      </div>
    );
  }

  // Fetch complete user data for all friends directly from users table
  const { data: friendsData, error: friendsDataError } = await supabase
    .from("users")
    .select("id, name, display_name, avatar_url, level, xp")
    .in("id", friendIds);

  if (friendsDataError) {
    console.error("Error fetching friends data:", friendsDataError);
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Friends Leaderboard</h2>
        <p className="text-red-500">Failed to load friends data</p>
      </div>
    );
  }

  // Combine current user with friends
  let leaderboardData = [];

  if (currentUser) {
    leaderboardData = [currentUser, ...(friendsData || [])];
  } else {
    leaderboardData = friendsData || [];
  }

  // Sort by XP in descending order
  leaderboardData.sort((a, b) => {
    const xpA = typeof a.xp === "number" ? a.xp : 0;
    const xpB = typeof b.xp === "number" ? b.xp : 0;
    return xpB - xpA;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Friends Leaderboard</h2>
      {leaderboardData.length > 0 ? (
        <LeaderboardTable users={leaderboardData} />
      ) : (
        <p className="text-gray-500">
          No friends found. Add friends to see them on your leaderboard!
        </p>
      )}
    </div>
  );
}
