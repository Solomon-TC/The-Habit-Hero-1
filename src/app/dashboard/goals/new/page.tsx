import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import GoalForm from "@/components/goal-form";

export const dynamic = "force-dynamic";

export default async function NewGoalPage() {
  try {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return redirect("/sign-in?error=Failed+to+initialize+database+client");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/sign-in");
    }

    return (
      <SubscriptionCheck>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            <header>
              <h1 className="text-3xl font-bold">Create New Goal</h1>
              <p className="text-gray-600">
                Define a new goal to track your progress and achievements.
              </p>
            </header>

            <GoalForm userId={user.id} />
          </div>
        </main>
      </SubscriptionCheck>
    );
  } catch (error) {
    console.error("Error in NewGoalPage:", error);
    return redirect("/sign-in?error=Server+error");
  }
}
