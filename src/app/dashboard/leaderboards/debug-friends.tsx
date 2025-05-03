import { createServerSupabaseClient } from "@/lib/supabase-server-actions";

export async function DebugFriends() {
  const supabase = await createServerSupabaseClient();

  // Get the current user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Debug Friends Data</h2>
        <p className="text-amber-500">
          Please sign in to view debug information
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

  // Fetch the user's friends using the get_friends function
  const { data: friends, error: friendsError } = await supabase.rpc(
    "get_friends_with_display_names",
    { user_id: currentUserId },
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Debug Friends Data</h2>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Current User:</h3>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
          {JSON.stringify(currentUser, null, 2)}
        </pre>
        {currentUserError && (
          <p className="text-red-500 mt-2">Error: {currentUserError.message}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Friends Data:</h3>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
          {JSON.stringify(friends, null, 2)}
        </pre>
        {friendsError && (
          <p className="text-red-500 mt-2">Error: {friendsError.message}</p>
        )}
      </div>
    </div>
  );
}
