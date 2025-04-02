import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { InfoIcon, UserCircle, Calendar, Settings, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { calculateLevelProgress, getXPForNextLevel } from "@/lib/xp";
import { SubscriptionCheck } from "@/components/subscription-check";
import StatsOverview from "@/components/stats-overview";
import HabitTracker from "@/components/habit-tracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserHabits } from "@/lib/habits";
import { getUserGoals } from "@/lib/goals";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DebugXPButton } from "@/components/debug-xp-button";
import LevelProgress from "@/components/level-progress";
import GameNotifications from "@/components/game-notifications";

import { ClientMilestoneForm } from "./client-milestone-form";

export default async function Dashboard() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Add a timestamp to force revalidation on each request
  const timestamp = Date.now();
  // Force cache invalidation for Supabase queries
  const cacheInvalidationKey = `?t=${timestamp}`;

  // Get user profile data with cache-busting query parameter to ensure fresh data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()
    .abortSignal(new AbortController().signal); // Force fresh data

  // Log the user data for debugging
  console.log(`User data fetched at ${new Date().toISOString()}:`, userData);

  // Calculate XP progress to next level using the utility functions
  const userLevel = userData?.level || 1;
  const userXP = userData?.xp || 0;

  // Get XP needed for next level
  const xpForNextLevel = getXPForNextLevel(userLevel);

  // Calculate level progress percentage
  const levelProgress = calculateLevelProgress(userXP, userLevel);

  // Calculate XP in current level for display
  let totalXPForCurrentLevel = 0;
  for (let i = 1; i < userLevel; i++) {
    totalXPForCurrentLevel += Math.floor(100 * Math.pow(1.5, i - 1));
  }
  const xpInCurrentLevel = userXP - totalXPForCurrentLevel;

  // Get user habits with progress directly from the server
  const { data: habits = [] } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get user goals with milestones
  const { data: goals = [] } = await getUserGoals(user.id);

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

  // Calculate stats for the overview
  const completedHabits = habitsWithProgress.filter(
    (habit) => habit.isCompleted,
  ).length;
  const totalHabits = habitsWithProgress.length;
  const completionRate =
    totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const highestStreak =
    habitsWithProgress.length > 0
      ? Math.max(...habitsWithProgress.map((h) => h.streak))
      : 0;

  return (
    <SubscriptionCheck>
      <GameNotifications />
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Welcome Section */}
          <header className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">
                Welcome,{" "}
                {userData?.name || user.email?.split("@")[0] || "Adventurer"}!
              </h1>
              <div className="flex gap-2">
                <Calendar className="text-purple-600" />
                <span className="font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg text-purple-800 flex gap-2 items-center border border-purple-200">
              <InfoIcon size="16" />
              <span>
                Track your habits, earn rewards, and build a better you!
              </span>
            </div>
          </header>

          {/* Stats Overview */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
            <StatsOverview
              initialStats={{
                highestStreak,
                completedHabits,
                totalHabits,
                completionRate,
              }}
              userId={user.id}
            />
            <div className="mt-4">
              <LevelProgress
                initialData={{
                  level: userLevel,
                  xp: userXP,
                  xpForNextLevel,
                  levelProgress,
                  xpInCurrentLevel,
                }}
                userId={user.id}
              />
            </div>
          </section>

          {/* Main Content - New Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Habits Card */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Habits</CardTitle>
                  <Link href="/dashboard/habits">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <HabitTracker habits={habitsWithProgress} userId={user.id} />
              </CardContent>
            </Card>

            {/* Goals Card */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Goals</CardTitle>
                  <Link href="/dashboard/goals">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">
                      You haven't set any goals yet
                    </p>
                    <Link href="/dashboard/goals/new">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        Create Your First Goal
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {goals.slice(0, 3).map((goal) => (
                      <Card
                        key={goal.id}
                        className="overflow-hidden hover:border-purple-200 transition-all"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">
                              {goal.title}
                            </CardTitle>
                            {goal.category && (
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                                {goal.category}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <Progress
                            value={goal.progress}
                            className="h-2 bg-gray-200"
                          />

                          {goal.milestones && goal.milestones.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">
                                {goal.milestones.find((m) => !m.is_completed)
                                  ? "Next milestone:"
                                  : "Milestones:"}
                              </p>
                              {goal.milestones.find((m) => !m.is_completed) ? (
                                <div className="milestone-wrapper">
                                  <ClientMilestoneForm
                                    milestoneId={
                                      goal.milestones.find(
                                        (m) => !m.is_completed,
                                      )?.id || ""
                                    }
                                    goalId={goal.id}
                                    userId={user.id}
                                    milestoneTitle={
                                      goal.milestones.find(
                                        (m) => !m.is_completed,
                                      )?.title || ""
                                    }
                                  />
                                </div>
                              ) : (
                                <p className="text-sm">
                                  All milestones completed!
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex justify-between mt-3">
                            <Link href={`/dashboard/goals/edit?id=${goal.id}`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <Link
                              href={`/dashboard/goals/milestones/new?goalId=${goal.id}`}
                            >
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                Add Milestone
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Achievements Card */}
          <Card className="mt-6 overflow-hidden">
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>
                Complete habits and earn badges as you progress on your journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="font-semibold">Streak Master</h3>
                <p className="text-sm text-center text-gray-600">
                  Maintain a 5-day streak
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="font-semibold">Early Bird</h3>
                <p className="text-sm text-center text-gray-600">
                  Complete a habit before 8am
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="font-semibold">Habit Champion</h3>
                <p className="text-sm text-center text-gray-600">
                  Complete all habits for a week
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hidden Tabs for Profile */}
          <div className="hidden">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full md:w-auto grid-cols-1 mb-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="text-purple-600" size={24} />
                      User Profile
                    </CardTitle>
                    <CardDescription>
                      Manage your account settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Full Name
                          </h3>
                          <p className="text-base">
                            {userData?.name || "Not set"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Email
                          </h3>
                          <p className="text-base">{user.email}</p>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 overflow-hidden">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Account Details
                        </h3>
                        <pre className="text-xs font-mono max-h-48 overflow-auto">
                          {JSON.stringify(user, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Debug XP Tools */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Debug Tools</h2>
            <DebugXPButton />
          </div>
        </div>
      </main>
    </SubscriptionCheck>
  );
}

function Flame(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function Activity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m23 6-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  );
}

function Award(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="7" />
      <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
}
