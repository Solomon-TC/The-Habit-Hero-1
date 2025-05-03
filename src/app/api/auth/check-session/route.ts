import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
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

    // Get the session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        { authenticated: false, error: sessionError.message },
        { status: 401 },
      );
    }

    if (!sessionData.session) {
      return NextResponse.json(
        { authenticated: false, message: "No active session" },
        { status: 200 },
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email,
      },
    });
  } catch (error: any) {
    console.error("Error checking session:", error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 },
    );
  }
}
