import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET /api/auth/refresh - Endpoint to refresh the auth session
export async function GET(request: NextRequest) {
  try {
    // Await cookies() before using it
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // First try to get the session directly
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionData?.session) {
      // We have a valid session, return the user info
      return NextResponse.json({
        success: true,
        session: true,
        user: {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email,
        },
      });
    }

    // If no session, try to get the user directly
    const { data: userData, error: userError } = await supabase.auth.getUser();

    // If we have a user but no session, try to refresh the session
    if (userData?.user) {
      try {
        const result = await supabase.auth.refreshSession();

        if (result.data?.session) {
          return NextResponse.json({
            success: true,
            session: true,
            user: {
              id: result.data.session.user.id,
              email: result.data.session.user.email,
            },
            refreshed: true,
          });
        }
      } catch (refreshErr) {
        console.log("Could not refresh session, but user exists");
      }

      // Return the user even if refresh failed
      return NextResponse.json({
        success: true,
        session: false,
        user: {
          id: userData.user.id,
          email: userData.user.email,
        },
        refreshFailed: true,
      });
    }

    // Handle case where we couldn't get a user or session
    if (userError || sessionError) {
      const error = userError || sessionError;
      // Don't treat this as an error if it's just an auth session missing error
      if (
        error &&
        error.message &&
        error.message.includes("Auth session missing")
      ) {
        return NextResponse.json(
          {
            success: false,
            session: false,
            user: null,
            requiresSignIn: true,
            message: "Auth session missing - please sign in",
          },
          { status: 200 },
        ); // Return 200 as this is an expected state
      }

      console.error("Error getting user/session:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get user",
          details: error ? error.message : "Unknown error",
        },
        { status: 401 },
      );
    }

    // No user found but no error either
    return NextResponse.json({
      success: false,
      session: false,
      user: null,
      requiresSignIn: true,
    });
  } catch (err) {
    console.error("Error in auth refresh API:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
