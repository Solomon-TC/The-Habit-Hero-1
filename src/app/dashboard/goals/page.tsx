import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import GoalList from "@/components/goal-list";
import GoalSummary from "@/components/goal-summary";
import { getUserGoals } from "@/lib/goals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user goals with milestones
  const { data: goals = [] } = await getUserGoals(user.id);

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header>
            <h1 className="text-3xl font-bold">Your Goals</h1>
            <p className="text-gray-600">
              Set and track long-term goals to achieve your dreams.
            </p>
          </header>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Goals</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <GoalList goals={goals} userId={user.id} />
            </TabsContent>

            <TabsContent value="summary">
              <GoalSummary goals={goals} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
