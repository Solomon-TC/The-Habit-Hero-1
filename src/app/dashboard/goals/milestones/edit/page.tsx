import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import MilestoneForm from "@/components/milestone-form";

export default async function EditMilestonePage({
  searchParams,
}: {
  searchParams: { id: string; goalId: string };
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { id: milestoneId, goalId } = searchParams;
  if (!milestoneId || !goalId) {
    return redirect("/dashboard/goals");
  }

  // Get milestone data
  const { data: milestone, error } = await supabase
    .from("milestones")
    .select("*, goals!inner(user_id)")
    .eq("id", milestoneId)
    .single();

  if (error || !milestone || milestone.goals.user_id !== user.id) {
    return redirect("/dashboard/goals");
  }

  // Format the data for the form
  const formData = {
    title: milestone.title,
    description: milestone.description || "",
    due_date: milestone.due_date ? new Date(milestone.due_date) : null,
  };

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header>
            <h1 className="text-3xl font-bold">Edit Milestone</h1>
            <p className="text-gray-600">
              Update milestone details to track your progress.
            </p>
          </header>

          <MilestoneForm
            goalId={goalId}
            initialData={formData}
            milestoneId={milestoneId}
          />
        </div>
      </main>
    </SubscriptionCheck>
  );
}
