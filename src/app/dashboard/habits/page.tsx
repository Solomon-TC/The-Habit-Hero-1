import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import HabitTracker from "@/components/habit-tracker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HabitsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user habits with progress directly from the server
  const { data: habits = [] } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all habit logs for the user's habits from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: logs = [] } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("completed_at", thirtyDaysAgo.toISOString())
    .order("completed_at", { ascending: false });

  // Process habits with their logs
  const habitsWithProgress = habits.map((habit) => {
    const habitLogs = logs.filter((log) => log.habit_id === habit.id);

    // Check if habit was completed today
    const todayLogs = habitLogs.filter((log) => {
      const completedDate = new Date(log.completed_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });

    const todayProgress = todayLogs.reduce(
      (sum, log) => sum + (log.count || 0),
      0,
    );
    const isCompleted = todayProgress >= habit.target_count;
    const lastCompletedAt =
      habitLogs.length > 0 ? habitLogs[0].completed_at : undefined;

    return {
      ...habit,
      progress: todayProgress,
      logs: habitLogs,
      isCompleted,
      lastCompletedAt,
    };
  });

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Your Habits</h1>
            <p className="text-gray-600">
              Track and manage your daily habits to build a better you.
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Habit Tracker</CardTitle>
              <CardDescription>
                Track your daily habits and build consistency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HabitTracker habits={habitsWithProgress} userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
