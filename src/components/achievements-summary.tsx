"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { AchievementWithProgress } from "@/types/achievement";
import { Award, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

interface AchievementsSummaryProps {
  userId: string;
  limit?: number;
}

export default function AchievementsSummary({
  userId,
  limit = 3,
}: AchievementsSummaryProps) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const supabase = createBrowserSupabaseClient();

        // Get all achievements
        const { data: allAchievements, error: achievementsError } =
          await supabase.from("achievements").select("*");

        if (achievementsError) throw achievementsError;

        // Get user's earned achievements
        const { data: userAchievements, error: userAchievementsError } =
          await supabase
            .from("user_achievements")
            .select("*, achievements(*)")
            .eq("user_id", userId);

        if (userAchievementsError) throw userAchievementsError;

        // Format earned achievements
        const earnedAchievements =
          userAchievements?.map((ua) => {
            const achievement = ua.achievements;
            return {
              ...achievement,
              earned: true,
              earned_at: ua.earned_at,
              progress: 100,
            };
          }) || [];

        // Get unearned achievements
        const earnedIds = new Set(earnedAchievements.map((a) => a.id));
        const unearnedAchievements =
          allAchievements
            ?.filter((a) => !earnedIds.has(a.id))
            .map((a) => ({
              ...a,
              earned: false,
              progress: 0,
            })) || [];

        // Sort achievements: earned first (by date), then unearned
        const sortedAchievements = [
          ...earnedAchievements.sort(
            (a, b) =>
              new Date(b.earned_at || 0).getTime() -
              new Date(a.earned_at || 0).getTime(),
          ),
          ...unearnedAchievements,
        ].slice(0, limit);

        setAchievements(sortedAchievements);
      } catch (err) {
        console.error("Error fetching achievements:", err);
        setError("Failed to load achievements");
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [userId, limit]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-pulse text-purple-600">
          Loading achievements...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-2">{error}</div>;
  }

  // Check if user has any earned achievements
  const earnedAchievements = achievements.filter((a) => a.earned);
  const totalEarned = earnedAchievements.length;

  if (achievements.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Achievements Yet
        </h3>
        <p className="text-gray-500">
          Complete habits and goals to start earning achievements
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-600" />
          <span className="font-medium">
            {totalEarned} {totalEarned === 1 ? "Badge" : "Badges"} Earned
          </span>
        </div>
        <Link href="/dashboard/profile#achievements">
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700"
          >
            View All
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

interface AchievementCardProps {
  achievement: AchievementWithProgress;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const getAchievementIcon = (achievement: AchievementWithProgress) => {
    // Use the achievement's icon if available, otherwise determine based on category
    if (achievement.icon) {
      return <span className="text-2xl">{achievement.icon}</span>;
    }

    switch (achievement.category?.toLowerCase()) {
      case "streak":
        return <Flame className="h-6 w-6" />;
      case "completion":
        return <Trophy className="h-6 w-6" />;
      case "time":
        return <Clock className="h-6 w-6" />;
      case "level":
        return <Star className="h-6 w-6" />;
      case "xp":
        return <Zap className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-all ${achievement.earned ? "border-purple-300 shadow-md" : "border-gray-200"}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              achievement.earned
                ? `bg-${achievement.badge_color || "purple"}-100`
                : "bg-gray-100"
            }`}
          >
            <div
              className={`${achievement.earned ? `text-${achievement.badge_color || "purple"}-600` : "text-gray-400"}`}
            >
              {getAchievementIcon(achievement)}
            </div>
          </div>

          <h3 className="font-semibold mb-1">{achievement.name}</h3>

          <p className="text-sm text-gray-600 mb-3">
            {achievement.description}
          </p>

          {achievement.earned ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Earned{" "}
              {achievement.earned_at &&
                new Date(achievement.earned_at).toLocaleDateString()}
            </Badge>
          ) : (
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{achievement.progress || 0}%</span>
              </div>
              <Progress value={achievement.progress || 0} className="h-1.5" />
              <div className="mt-2 text-xs text-purple-600">
                +{achievement.xp_reward} XP when earned
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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

function Clock(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Star(props: React.SVGProps<SVGSVGElement>) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function Zap(props: React.SVGProps<SVGSVGElement>) {
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
