"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Icon } from "./icons";
import { Progress } from "./ui/progress";

interface FriendCardProps {
  friendId: string;
  friendEmail?: string;
  friendName?: string;
}

interface FriendData {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  level: number;
  xp: number;
  avatar_url?: string | null;
}

interface Achievement {
  id: string;
  type: "habit" | "milestone" | "goal";
  title: string;
  completed_at: string;
  xp_awarded: number;
}

export default function FriendCard({
  friendId,
  friendEmail,
  friendName,
}: FriendCardProps) {
  const [friendData, setFriendData] = useState<FriendData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriendData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createBrowserSupabaseClient();
        console.log("Fetching friend data for ID:", friendId);

        // First, try to ensure the friend user exists
        try {
          await supabase.rpc("ensure_friend_user_exists", {
            friend_id: friendId,
          });
        } catch (err) {
          console.log("Note: ensure_friend_user_exists may not exist yet", err);
        }

        // Try multiple methods to get user data in sequence until one works
        let effectiveUserData = null;
        let lastError = null;

        // 1. Try direct query first as it's most reliable
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            "id, name, full_name, email, level, xp, avatar_url, created_at",
          )
          .eq("id", friendId)
          .maybeSingle();

        if (!userError && userData) {
          console.log("Direct query successful:", userData);
          effectiveUserData = userData;
        } else {
          lastError = userError;
          console.log("Direct query failed:", userError);

          // 2. Try get_user_by_id function
          const { data: getUserData, error: getUserError } = await supabase.rpc(
            "get_user_by_id",
            { user_id: friendId },
          );

          if (!getUserError && getUserData && getUserData.length > 0) {
            console.log("get_user_by_id successful:", getUserData);
            effectiveUserData = getUserData[0];
          } else {
            lastError = getUserError;
            console.log("get_user_by_id failed:", getUserError);

            // 3. Try search_user_by_id function as last resort
            try {
              const { data: searchUserData, error: searchUserError } =
                await supabase.rpc("search_user_by_id", { user_id: friendId });

              if (
                !searchUserError &&
                searchUserData &&
                searchUserData.length > 0
              ) {
                console.log("search_user_by_id successful:", searchUserData);
                effectiveUserData = searchUserData[0];
              } else {
                lastError = searchUserError;
                console.log("search_user_by_id failed:", searchUserError);
              }
            } catch (searchErr) {
              console.log("search_user_by_id exception:", searchErr);
              lastError = searchErr;
            }
          }
        }

        console.log("Final effective user data:", effectiveUserData);

        if (!effectiveUserData) {
          console.warn("No user data found for friend ID:", friendId);

          // Create fallback data from props with better defaults
          setFriendData({
            id: friendId,
            name: friendName || "Friend", // Use "Friend" instead of "Unknown"
            email: friendEmail || "",
            level: 1,
            xp: 0,
            avatar_url: null,
          });
          setAchievements([]);
          setIsLoading(false);
          return;
        }

        // Use full_name if available, otherwise fall back to name or email
        const displayName =
          effectiveUserData.full_name ||
          effectiveUserData.name ||
          friendName ||
          "Unknown";

        const displayData = {
          ...effectiveUserData,
          name: displayName,
        };

        console.log("Setting friend data:", displayData);
        setFriendData(displayData);

        // Only fetch achievements if we have valid user data
        if (effectiveUserData && effectiveUserData.id) {
          // Fetch recent achievements (completed habits, milestones, goals)
          // First, fetch recent habit completions
          const { data: habitLogs, error: habitError } = await supabase
            .from("habit_logs")
            .select("id, habit_id, completed_at, xp_awarded")
            .eq("user_id", effectiveUserData.id)
            .order("completed_at", { ascending: false })
            .limit(3);

          if (habitError) {
            console.error(
              "Error fetching habit logs:",
              habitError.message || JSON.stringify(habitError),
            );
            setAchievements([]);
          } else {
            // Get habit details for each log
            const habitAchievements = await Promise.all(
              (habitLogs || []).map(async (log) => {
                const { data: habit } = await supabase
                  .from("habits")
                  .select("name")
                  .eq("id", log.habit_id)
                  .single();

                return {
                  id: log.id,
                  type: "habit" as const,
                  title: habit?.name || "Habit completed",
                  completed_at: log.completed_at,
                  xp_awarded: log.xp_awarded || 10,
                };
              }),
            );

            // Combine all achievements and sort by date
            const allAchievements = [...habitAchievements]
              .sort(
                (a, b) =>
                  new Date(b.completed_at).getTime() -
                  new Date(a.completed_at).getTime(),
              )
              .slice(0, 3);

            setAchievements(allAchievements);
          }
        } else {
          setAchievements([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : JSON.stringify(err);
        console.error("Unexpected error fetching friend data:", errorMessage);
        setError(`Unexpected error: ${errorMessage}`);
        setAchievements([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (friendId) {
      fetchFriendData();
    }
  }, [friendId, friendName, friendEmail]);

  // Calculate level progress
  const levelProgress = friendData
    ? calculateLevelProgress(friendData.xp, friendData.level)
    : 0;

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get icon and color based on achievement type
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "habit":
        return { icon: "check", color: "text-green-500" };
      case "milestone":
        return { icon: "star", color: "text-blue-500" };
      case "goal":
        return { icon: "trophy", color: "text-purple-500" };
      default:
        return { icon: "award", color: "text-amber-500" };
    }
  };

  // Order of rendering conditions is important
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-100">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <p className="text-sm mt-2">
              {friendName || friendEmail || friendId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!friendData) {
    return (
      <Card className="w-full border-red-100">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Could not load friend data</p>
            <p className="text-sm mt-2">
              {friendName || friendEmail || friendId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:border-purple-200 transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
              {friendData.avatar_url ? (
                <img
                  src={friendData.avatar_url}
                  alt={`${friendData.name}'s avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friendData.name || friendData.email || friendId}`}
                  alt={`${friendData.name}'s avatar`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <CardTitle className="text-lg">
              {friendData.name !== "Unknown"
                ? friendData.name
                : friendData.email || "Friend"}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-purple-50">
            Level {friendData.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Level Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Level Progress</span>
            <span>{Math.round(levelProgress)}%</span>
          </div>
          <Progress value={levelProgress} className="h-2 bg-gray-200" />
        </div>

        {/* Recent Achievements */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">
            Recent Achievements
          </h4>
          {achievements.length > 0 ? (
            achievements.map((achievement) => {
              const { icon, color } = getAchievementIcon(achievement.type);
              return (
                <div
                  key={achievement.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Icon name={icon} className={`h-4 w-4 ${color}`} />
                  <span className="flex-1 truncate">{achievement.title}</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(achievement.completed_at)}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-50 text-amber-700"
                  >
                    +{achievement.xp_awarded} XP
                  </Badge>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 italic">
              No recent achievements
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate level progress
function calculateLevelProgress(
  currentXP: number,
  currentLevel: number,
): number {
  const baseXP = 100; // Base XP needed for level 2
  const growthFactor = 1.5; // How much more XP is needed for each level

  // Calculate total XP for current level
  let totalXPForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    totalXPForCurrentLevel += Math.floor(
      baseXP * Math.pow(growthFactor, i - 1),
    );
  }

  // Calculate total XP for next level
  let totalXPForNextLevel = totalXPForCurrentLevel;
  totalXPForNextLevel += Math.floor(
    baseXP * Math.pow(growthFactor, currentLevel - 1),
  );

  // Calculate progress percentage
  const xpInCurrentLevel = currentXP - totalXPForCurrentLevel;
  const xpRequiredForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;

  const progress = Math.floor(
    (xpInCurrentLevel / xpRequiredForNextLevel) * 100,
  );
  return Math.min(Math.max(progress, 0), 100); // Ensure progress is between 0 and 100
}
