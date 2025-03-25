import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import MilestoneForm from "@/components/milestone-form";
import { getGoalById } from "@/lib/goals";

export default async function NewMilestonePage({
  searchParams,
}: {
  searchParams: { goalId: string };
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Properly await searchParams to fix the dynamic API error
  const params = await searchParams;
  const goalId = params.goalId;
  if (!goalId) {
    return redirect("/dashboard/goals");
  }

  // Verify the goal exists and belongs to the user
  const { data: goal } = await getGoalById(goalId);
  if (!goal || goal.user_id !== user.id) {
    return redirect("/dashboard/goals");
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header>
            <h1 className="text-3xl font-bold">Add Milestone</h1>
            <p className="text-gray-600">
              Add a milestone to track progress for:{" "}
              <strong>{goal.title}</strong>
            </p>
          </header>

          <MilestoneForm goalId={goalId} />
        </div>
      </main>
    </SubscriptionCheck>
  );
}
