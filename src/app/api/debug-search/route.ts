import { createServerSupabaseClient } from "@/lib/supabase-server-actions";
import { NextRequest, NextResponse } from "next/server";

interface SearchResults {
  exactMatch?: {
    data: any;
    error: string | null;
  };
  ilikeMatch?: {
    data: any;
    error: string | null;
  };
  patternMatch?: {
    data: any;
    error: string | null;
  };
  usernameMatch?: {
    data: any;
    error: string | null;
  };
  rawSqlMatch?: {
    data: any;
    error: string | null;
    note?: string;
  };
  allUsers?: {
    data: any[];
    error: string | null;
    count: number;
  };
  rpcResults?: {
    data: any;
    error: string | null;
    count: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database client" },
        { status: 500 },
      );
    }

    // Get current user for security check
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try multiple search strategies and return all results
    const results: SearchResults = {};

    // Get ALL users without any filtering
    const { data: allUsersRaw, error: allUsersError } = await supabase
      .from("users")
      .select("*");

    if (allUsersError) {
      console.error("Error fetching all users:", allUsersError);
      return NextResponse.json(
        { error: allUsersError.message },
        { status: 500 },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`Found ${allUsersRaw?.length || 0} total users in database`);
    }

    // 1. Exact match with eq
    const { data: exactMatch, error: exactError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("email", email);

    results.exactMatch = {
      data: exactMatch,
      error: exactError ? exactError.message : null,
    };

    // 2. Case insensitive match with ilike
    const { data: ilikeMatch, error: ilikeError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .ilike("email", email);

    results.ilikeMatch = {
      data: ilikeMatch,
      error: ilikeError ? ilikeError.message : null,
    };

    // 3. Pattern match with ilike %
    const { data: patternMatch, error: patternError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .ilike("email", `%${email}%`);

    results.patternMatch = {
      data: patternMatch,
      error: patternError ? patternError.message : null,
    };

    // 4. Username part match if it's an email
    if (email.includes("@")) {
      const emailParts = email.split("@");
      const username = emailParts[0];

      const { data: usernameMatch, error: usernameError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .ilike("email", `%${username}%`);

      results.usernameMatch = {
        data: usernameMatch,
        error: usernameError ? usernameError.message : null,
      };
    }

    // 5. Raw SQL query as a last resort
    const { data: rawSqlMatch, error: rawSqlError } = await supabase.rpc(
      "direct_email_search",
      { email_query: email },
    );

    results.rawSqlMatch = {
      data: rawSqlMatch,
      error: rawSqlError ? rawSqlError.message : null,
      note: "This will only work if you've created the direct_email_search function in your database",
    };

    // 6. Get all users for debugging (limited to 100)
    // Format the data to only include the fields we need
    const formattedAllUsers =
      allUsersRaw
        ?.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        }))
        .slice(0, 100) || [];

    results.allUsers = {
      data: formattedAllUsers,
      error: null,
      count: allUsersRaw?.length || 0,
    };

    return NextResponse.json({
      query: email,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Debug search error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database client" },
        { status: 500 },
      );
    }

    const { data: currentUser } = await supabase.auth.getUser();

    if (!currentUser.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try multiple search strategies and return all results
    const results: SearchResults = {};

    // Get ALL users without any filtering - using direct SQL query to bypass any potential ORM issues
    const { data: allUsersRaw, error: allUsersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (allUsersError) {
      console.error("Error fetching all users:", allUsersError);
      return NextResponse.json(
        { error: allUsersError.message },
        { status: 500 },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`Found ${allUsersRaw?.length || 0} total users in database`);
      console.log(
        "All user emails:",
        allUsersRaw?.map((user) => user.email),
      );
    }

    // Check if the specific email we're looking for exists
    const specificEmail = "solomoncapellspam@gmail.com";
    const specificUser = allUsersRaw.find(
      (user) => user.email === specificEmail,
    );
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `Specific user '${specificEmail}' exists:`,
        !!specificUser,
        specificUser || "Not found",
      );
    }

    // Filter out current user for search results
    const filteredUsers = allUsersRaw
      ? allUsersRaw.filter((user) => user.id !== currentUser.user.id)
      : [];

    // 1. Exact match with eq
    const exactMatch = filteredUsers.filter(
      (user) => user.email && user.email.toLowerCase() === query.toLowerCase(),
    );

    results.exactMatch = {
      data: exactMatch,
      error: null,
    };

    // 2. Pattern match with ilike %
    const patternMatch = filteredUsers.filter(
      (user) =>
        user.email && user.email.toLowerCase().includes(query.toLowerCase()),
    );

    results.patternMatch = {
      data: patternMatch,
      error: null,
    };

    // 3. Username part match if it's an email
    if (query.includes("@")) {
      const emailParts = query.split("@");
      const username = emailParts[0];

      const usernameMatch = filteredUsers.filter(
        (user) =>
          user.email &&
          user.email.toLowerCase().includes(username.toLowerCase()),
      );

      results.usernameMatch = {
        data: usernameMatch,
        error: null,
      };
    }

    // 4. Get all users for debugging (limited to 100)
    // Format the data to only include the fields we need
    const formattedAllUsers = allUsersRaw
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      }))
      .slice(0, 100);

    results.allUsers = {
      data: formattedAllUsers,
      error: null,
      count: allUsersRaw ? allUsersRaw.length : 0,
    };

    // 5. Try the RPC function
    try {
      const { data: rpcResults, error: rpcError } = await supabase.rpc(
        "direct_email_search",
        { email_query: query },
      );

      results.rpcResults = {
        data: rpcResults,
        error: rpcError ? rpcError.message : null,
        count: rpcResults?.length || 0,
      };
    } catch (rpcError: any) {
      results.rpcResults = {
        data: [],
        error: rpcError.message || "RPC function error",
        count: 0,
      };
    }

    return NextResponse.json({
      query,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Debug search error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 },
    );
  }
}
