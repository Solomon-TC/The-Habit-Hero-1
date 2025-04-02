"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Activity, Award, Calendar, TrendingUp } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { createRealtimeSubscription } from "@/lib/real-time-updates";

interface StatsOverviewProps {
  initialStats?: {
    highestStreak: number;
    completedHabits: number;
    totalHabits: number;
    completionRate: number;
  };
  userId: string;
}

export default function StatsOverview({
  initialStats,
  userId,
}: StatsOverviewProps) {
  const [stats, setStats] = useState(
    initialStats || {
      highestStreak: 0,
      completedHabits: 0,
      totalHabits: 0,
      completionRate: 0,
    },
  );

  useEffect(() => {
    if (!userId) return;

    // Set up real-time subscriptions
    const supabase = createBrowserSupabaseClient();

    // Function to fetch the latest stats
    const fetchLatestStats = async () => {
      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all habits for the user
      const { data: habits = [] } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId);

      // Get all habit logs for today
      const { data: logs = [] } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("completed_at", today.toISOString());

      // Process habits with their logs
      const habitsWithProgress = habits.map((habit) => {
        const habitLogs = logs.filter((log) => log.habit_id === habit.id);

        const todayProgress = habitLogs.reduce(
          (sum, log) => sum + (log.count || 0),
          0,
        );
        const isCompleted = todayProgress >= habit.target_count;

        return {
          ...habit,
          isCompleted,
        };
      });

      // Calculate stats
      const completedHabits = habitsWithProgress.filter(
        (habit) => habit.isCompleted,
      ).length;
      const totalHabits = habitsWithProgress.length;
      const completionRate =
        totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
      const highestStreak =
        habitsWithProgress.length > 0
          ? Math.max(...habitsWithProgress.map((h) => h.streak || 0))
          : 0;

      // Update state with new stats
      setStats({
        highestStreak,
        completedHabits,
        totalHabits,
        completionRate,
      });
    };

    // Initial fetch
    fetchLatestStats();

    // Set up subscriptions for habits and habit_logs tables
    const habitsSubscription = createRealtimeSubscription(
      "habits",
      () => fetchLatestStats(),
      userId,
    );

    const habitLogsSubscription = createRealtimeSubscription(
      "habit_logs",
      () => fetchLatestStats(),
      userId,
    );

    // Clean up subscriptions
    return () => {
      habitsSubscription?.unsubscribe();
      habitLogsSubscription?.unsubscribe();
    };
  }, [userId, initialStats]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.highestStreak} days</div>
          <p className="text-xs text-muted-foreground">
            Keep going to increase your streak!
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Habits Completed
          </CardTitle>
          <Activity className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.completedHabits}/{stats.totalHabits}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalHabits - stats.completedHabits} remaining today
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
          <p className="text-xs text-muted-foreground">Today's progress</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Achievements</CardTitle>
          <Award className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">New badge unlocked!</p>
        </CardContent>
      </Card>
    </div>
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
