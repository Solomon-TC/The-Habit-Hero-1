import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Comprehensive session refresh utility that tries multiple methods to ensure a valid session
 * @returns Object containing session data, user data, and success status
 */
export async function refreshSessionComprehensive() {
  // Use the singleton client to maintain consistent session state
  const supabase = createClientComponentClient({
    options: {
      persistSession: true,
      autoRefreshToken: true,
      // Explicitly set cookie options to ensure proper storage
      cookieOptions: {
        name: "sb-auth-token",
        lifetime: 60 * 60 * 24 * 7, // 1 week
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  });
  let sessionData = null;
  let userData = null;
  let success = false;
  let errors = [];

  try {
    // Step 1: Try to get the session directly
    const { data: directSession, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      errors.push({ method: "direct-session", error: sessionError });
    } else if (directSession?.session) {
      console.log("✅ Direct session found");
      sessionData = directSession;
      success = true;
    } else {
      console.log("❌ No direct session found, trying refresh...");
    }

    // Step 2: If no session, try client-side refresh
    if (!success) {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        errors.push({ method: "client-refresh", error: refreshError });
        console.log("❌ Client refresh failed:", refreshError.message);
      } else if (refreshData?.session) {
        console.log("✅ Session refreshed via client");
        sessionData = refreshData;
        success = true;
      }
    }

    // Step 3: If still no session, try API refresh
    if (!success) {
      try {
        console.log("🔄 Attempting API refresh...");
        const response = await fetch("/api/auth/refresh", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        const apiResult = await response.json();
        console.log("API refresh result:", apiResult);

        if (apiResult.success) {
          // Get the session again after API refresh
          const { data: postApiSession, error: postApiError } =
            await supabase.auth.getSession();

          if (postApiError) {
            errors.push({ method: "post-api-session", error: postApiError });
          } else if (postApiSession?.session) {
            console.log("✅ Session obtained after API refresh");
            sessionData = postApiSession;
            success = true;
          }
        } else {
          errors.push({
            method: "api-refresh",
            error: apiResult.error || "API refresh failed",
          });
        }
      } catch (apiError) {
        errors.push({ method: "api-refresh-exception", error: apiError });
        console.error("❌ API refresh exception:", apiError);
      }
    }

    // Step 4: If we have a session, get the user data
    if (success && sessionData?.session) {
      const { data: user, error: userError } = await supabase.auth.getUser();

      if (userError) {
        errors.push({ method: "get-user", error: userError });
        console.error("❌ Error getting user data:", userError.message);
      } else if (user?.user) {
        console.log("✅ User data retrieved successfully");
        userData = user;
      }
    }

    return {
      success,
      sessionData,
      userData,
      errors: errors.length > 0 ? errors : null,
      accessToken: sessionData?.session?.access_token || null,
    };
  } catch (error) {
    console.error("❌ Comprehensive session refresh failed:", error);
    return {
      success: false,
      sessionData: null,
      userData: null,
      errors: [{ method: "comprehensive", error }],
      accessToken: null,
    };
  }
}

/**
 * Check if the user is authenticated and return user data
 * @returns Object containing authentication status and user data
 */
export async function checkAuthentication() {
  // First try to get the session directly - this is faster and more reliable
  const supabase = createClientComponentClient({
    options: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  try {
    // Try to get the session directly first
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (!sessionError && sessionData?.session?.access_token) {
      // We have a valid session, get the user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!userError && userData?.user) {
        return {
          isAuthenticated: true,
          user: userData.user,
          session: sessionData.session,
          accessToken: sessionData.session.access_token,
          errors: null,
        };
      }
    }

    // If direct session check failed, try the comprehensive refresh
    const refreshResult = await refreshSessionComprehensive();

    return {
      isAuthenticated: refreshResult.success && !!refreshResult.userData?.user,
      user: refreshResult.userData?.user || null,
      session: refreshResult.sessionData?.session || null,
      accessToken: refreshResult.accessToken,
      errors: refreshResult.errors,
    };
  } catch (error) {
    console.error("Error in checkAuthentication:", error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      accessToken: null,
      errors: [{ method: "check-authentication", error }],
    };
  }
}
