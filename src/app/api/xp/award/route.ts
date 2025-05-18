import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { awardXP } from "@/lib/xp";

export async function POST(request: NextRequest) {
  try {
    let userId, amount, reason, sourceId;
    try {
      const body = await request.json();
      userId = body.userId;
      amount = body.amount;
      reason = body.reason;
      sourceId = body.sourceId;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!userId || !amount || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Authenticate the user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to award XP to themselves
    if (sessionData.session.user.id !== userId) {
      return NextResponse.json(
        { error: "You can only award XP to yourself" },
        { status: 403 },
      );
    }

    // Award the XP
    const result = await awardXP(userId, amount, reason, sourceId);

    if ("error" in result && result.error) {
      return NextResponse.json(
        {
          error:
            typeof result.error === "string"
              ? result.error
              : "Error awarding XP",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in XP award endpoint:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
