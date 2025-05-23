import { Metadata } from "next";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import GoalForm from "@/components/goal-form";
import { getGoalById } from "@/lib/goals";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Goal - Habit Hero",
  description: "Edit your goal details",
};

type SearchParams = { [key: string]: string | string[] | undefined };

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<SearchParams>;
}

export default async function EditGoalPage(props: PageProps) {
  try {
    const params = await props.params;
    const resolvedSearchParams = await props.searchParams;
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

    const goalId =
      typeof resolvedSearchParams.id === "string"
        ? resolvedSearchParams.id
        : Array.isArray(resolvedSearchParams.id)
          ? resolvedSearchParams.id[0]
          : undefined;
    if (!goalId) {
      return redirect("/dashboard/goals");
    }

    // Get goal data
    const { data: goal } = await getGoalById(goalId);

    // Verify the goal belongs to the user
    if (!goal || goal.user_id !== user.id) {
      return redirect("/dashboard/goals");
    }

    // Format the data for the form
    const formData = {
      title: goal.title,
      description: goal.description || "",
      category: goal.category || "Other",
      start_date: new Date(goal.start_date),
      end_date: goal.end_date ? new Date(goal.end_date) : null,
    };

    return (
      <SubscriptionCheck>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            <header>
              <h1 className="text-3xl font-bold">Edit Goal</h1>
              <p className="text-gray-600">
                Update your goal details and track your progress.
              </p>
            </header>

            <GoalForm userId={user.id} initialData={formData} goalId={goalId} />
          </div>
        </main>
      </SubscriptionCheck>
    );
  } catch (error) {
    console.error("Error in EditGoalPage:", error);
    return redirect("/sign-in?error=Server+error");
  }
}
