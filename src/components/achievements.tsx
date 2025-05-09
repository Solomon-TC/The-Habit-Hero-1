"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { AchievementWithProgress } from "@/types/achievement";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Star, Clock, Flame, Zap } from "lucide-react";

interface AchievementsProps {
  userId: string;
  limit?: number;
  showAll?: boolean;
}

export default function Achievements({
  userId,
  limit = 6,
  showAll = false,
}: AchievementsProps) {
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
            .select("*")
            .eq("user_id", userId);

        if (userAchievementsError) throw userAchievementsError;

        // Combine the data
        const achievementsWithProgress = allAchievements.map((achievement) => {
          const earned =
            userAchievements?.some(
              (ua) => ua.achievement_id === achievement.id,
            ) || false;
          const userAchievement = userAchievements?.find(
            (ua) => ua.achievement_id === achievement.id,
          );

          return {
            ...achievement,
            earned,
            earned_at: userAchievement?.earned_at,
            // For now, we'll set progress to 100 if earned, 0 if not
            // In a future enhancement, we could calculate actual progress
            progress: earned ? 100 : 0,
          };
        });

        // Sort by earned first, then by name
        const sortedAchievements = achievementsWithProgress.sort((a, b) => {
          if (a.earned && !b.earned) return -1;
          if (!a.earned && b.earned) return 1;
          return a.name.localeCompare(b.name);
        });

        setAchievements(
          showAll ? sortedAchievements : sortedAchievements.slice(0, limit),
        );
      } catch (err) {
        console.error("Error fetching achievements:", err);
        setError("Failed to load achievements");
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [userId, limit, showAll]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse text-purple-600">
          Loading achievements...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-800 p-4 rounded-lg">{error}</div>;
  }

  // Check if user has any earned achievements
  const earnedAchievements = achievements.filter(
    (achievement) => achievement.earned,
  );

  if (earnedAchievements.length === 0) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {achievements.map((achievement) => (
        <Card
          key={achievement.id}
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
                  <Progress
                    value={achievement.progress || 0}
                    className="h-1.5"
                  />
                  <div className="mt-2 text-xs text-purple-600">
                    +{achievement.xp_reward} XP when earned
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
