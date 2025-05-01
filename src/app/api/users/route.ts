import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    // Await cookies() before using it
    const cookieStore = await cookies();

    // Create a client with service role key for maximum access
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

    // If query parameter is provided, search for users
    if (query) {
      console.log(`API searching for users with query: ${query}`);

      // Check if query is a UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(query);

      let users = [];

      // First try to get users from auth.users table
      if (isUuid) {
        // For UUID, try to get the specific user
        const { data: authUser } =
          await serviceClient.auth.admin.getUserById(query);
        if (authUser?.user) {
          users = [
            {
              id: authUser.user.id,
              email: authUser.user.email,
              name: authUser.user.email?.split("@")[0] || "User",
              avatar_url: null,
            },
          ];
        }
      } else {
        // For email/name search, try to get matching users via admin API
        try {
          const { data: authUsers } =
            await serviceClient.auth.admin.listUsers();
          if (authUsers?.users) {
            const matchingUsers = authUsers.users.filter(
              (user) =>
                user.email &&
                user.email.toLowerCase().includes(query.toLowerCase()),
            );
            users = matchingUsers.map((user) => ({
              id: user.id,
              email: user.email,
              name: user.email?.split("@")[0] || "User",
              avatar_url: null,
            }));
          }
        } catch (authError) {
          console.log("Error searching auth users:", authError);
        }
      }

      // Also try to get users from public.users table
      const { data: publicUsers, error: publicError } = isUuid
        ? await serviceClient.rpc("search_user_by_id", { user_id: query })
        : await serviceClient
            .from("users")
            .select("id, name, email, avatar_url, display_name")
            .or(
              `email.ilike.%${query}%,name.ilike.%${query}%,display_name.ilike.%${query}%`,
            )
            .limit(20);

      if (publicError) {
        console.log("Error searching public.users:", publicError);
      } else if (publicUsers && publicUsers.length > 0) {
        // Add any users from public.users that aren't already in the list
        const existingIds = new Set(users.map((u) => u.id));
        publicUsers.forEach((user) => {
          if (!existingIds.has(user.id)) {
            users.push({
              id: user.id,
              name:
                user.name ||
                user.display_name ||
                user.email?.split("@")[0] ||
                "User",
              email: user.email || "",
              avatar_url: user.avatar_url,
            });
            existingIds.add(user.id);
          }
        });
      }

      console.log(`API found ${users.length} users matching query: ${query}`);
      return NextResponse.json({ users });
    }

    // If no query, return all users (limited)
    console.log("API fetching all users");

    // Try to get users from public.users table first
    const { data: publicUsers, error: publicError } = await serviceClient
      .from("users")
      .select("id, name, email, avatar_url, display_name")
      .limit(100);

    if (publicError) {
      console.log("Error fetching public.users:", publicError);
      return NextResponse.json({ error: publicError.message }, { status: 500 });
    }

    // Transform the data
    const users = publicUsers.map((user) => ({
      id: user.id,
      name:
        user.name || user.display_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      avatar_url: user.avatar_url,
    }));

    console.log(`API found ${users.length} total users`);
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error in users API:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 },
    );
  }
}
