"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Icon } from "./icons";
import { Progress } from "./ui/progress";
import { Trophy, Star, Activity } from "lucide-react";

interface FriendCardProps {
  friendId: string;
  friendEmail?: string;
  friendName?: string;
  friendData?: any; // Direct data from the database query
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

interface FriendStats {
  totalHabits: number;
  completedHabits: number;
  highestStreak: number;
  totalGoals: number;
  completedGoals: number;
}

export default function FriendCard({
  friendId,
  friendEmail,
  friendName,
  friendData: initialFriendData,
}: FriendCardProps) {
  console.log("FriendCard initialFriendData:", initialFriendData);
  console.log("FriendCard props:", { friendId, friendEmail, friendName });

  // Ensure we have a valid display name
  const getValidDisplayName = (data: any): string => {
    if (data.display_name && data.display_name !== data.id)
      return data.display_name;
    if (data.name && data.name !== data.id && !data.name.includes("-"))
      return data.name;
    if (data.full_name) return data.full_name;
    if (data.email && data.email.includes("@")) return data.email.split("@")[0];
    return `User ${(data.id || friendId).substring(0, 8)}`;
  };

  const displayName = initialFriendData
    ? getValidDisplayName(initialFriendData)
    : friendName || `User ${friendId.substring(0, 8)}`;

  const [friendData, setFriendData] = useState<FriendData | null>(
    initialFriendData
      ? {
          id: initialFriendData.id || friendId,
          name: displayName,
          full_name: initialFriendData.full_name,
          email: initialFriendData.email || friendEmail || "",
          level: initialFriendData.level || 1,
          xp: initialFriendData.xp || 0,
          avatar_url: initialFriendData.avatar_url,
        }
      : null,
  );

  // Log the initial data to help debug
  useEffect(() => {
    if (initialFriendData) {
      console.log("FriendCard initialFriendData detailed:", {
        id: initialFriendData.id,
        name: initialFriendData.name,
        full_name: initialFriendData.full_name,
        email: initialFriendData.email,
        level: initialFriendData.level,
        xp: initialFriendData.xp,
      });
    }
  }, [initialFriendData]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<FriendStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("FriendCard useEffect running with props:", {
      friendId,
      friendName,
      friendEmail,
    });
    console.log("Initial friend data:", initialFriendData);

    if (initialFriendData) {
      console.log("Using initial friend data from props:", initialFriendData);

      let extractedData = { ...initialFriendData };
      if (
        initialFriendData.users &&
        typeof initialFriendData.users === "object"
      ) {
        console.log(
          "Found nested users object in FriendCard:",
          initialFriendData.users,
        );
        extractedData = {
          ...extractedData,
          ...initialFriendData.users,
        };
      }

      console.log(`FriendCard raw name data for ${friendId}:`, {
        friendName,
        extractedName: extractedData.name,
        extractedFullName: extractedData.full_name,
        extractedEmail: extractedData.email,
      });

      const hasValidPropName =
        friendName &&
        friendName.trim() !== "" &&
        !friendName.includes("-") &&
        friendName.length < 30 &&
        friendName !== friendId;

      const hasValidName =
        extractedData.name &&
        extractedData.name !== "null" &&
        extractedData.name !== "undefined" &&
        extractedData.name.trim() !== "" &&
        !extractedData.name.includes("-") &&
        extractedData.name.length < 30 &&
        extractedData.name !== friendId;

      const hasValidFullName =
        extractedData.full_name &&
        extractedData.full_name !== "null" &&
        extractedData.full_name !== "undefined" &&
        extractedData.full_name.trim() !== "";

      const hasValidEmail =
        extractedData.email &&
        extractedData.email !== "null" &&
        extractedData.email !== "undefined" &&
        extractedData.email.trim() !== "";

      let displayName = `User ${friendId.substring(0, 8)}`;

      if (hasValidPropName) {
        displayName = friendName;
        console.log("Using valid prop name:", displayName);
      } else if (hasValidName) {
        displayName = extractedData.name;
        console.log("Using valid extracted name:", displayName);
      } else if (hasValidFullName) {
        displayName = extractedData.full_name;
        console.log("Using valid full name:", displayName);
      } else if (hasValidEmail) {
        const emailParts = extractedData.email.split("@");
        if (emailParts.length > 0 && emailParts[0].trim() !== "") {
          displayName = emailParts[0];
          console.log("Using email username as name:", displayName);
        }
      }

      console.log(`FriendCard resolved name for ${friendId}:`, displayName);

      const friendDataObj = {
        id: extractedData.id || friendId,
        name: displayName,
        full_name: extractedData.full_name,
        email: extractedData.email || friendEmail || "",
        level: extractedData.level || 1,
        xp: extractedData.xp || 0,
        avatar_url: extractedData.avatar_url,
      };
      console.log("Setting friend data from props:", friendDataObj);
      setFriendData(friendDataObj);
      setIsLoading(false);
      return;
    }

    const fetchFriendData = async () => {
      if (!friendId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createBrowserSupabaseClient();
        console.log("Fetching friend data for ID:", friendId);

        const userChannel = supabase
          .channel(`user_${friendId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "users",
              filter: `id=eq.${friendId}`,
            },
            (payload) => {
              console.log("User data updated:", payload.new);
              if (payload.new) {
                const userData = payload.new as any;
                setFriendData({
                  id: userData.id,
                  name:
                    userData.name ||
                    userData.full_name ||
                    `User ${friendId.substring(0, 8)}`,
                  full_name: userData.full_name,
                  email: userData.email || friendEmail || "",
                  level: userData.level || 1,
                  xp: userData.xp || 0,
                  avatar_url: userData.avatar_url,
                });
              }
            },
          )
          .subscribe();

        // Simple direct query for user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            "id, name, full_name, email, avatar_url, level, xp, display_name",
          )
          .eq("id", friendId)
          .maybeSingle();

        if (userError) throw userError;

        // If no user data found, create a minimal record
        if (!userData) {
          console.log("No user data found, creating minimal record");
          const { data: authUser } = await supabase
            .from("auth.users")
            .select("email")
            .eq("id", friendId)
            .maybeSingle();

          const email = authUser?.email || friendEmail || "";
          const displayName = email
            ? email.split("@")[0]
            : `User ${friendId.substring(0, 8)}`;

          // Create a minimal user record
          const userData = {
            id: friendId,
            name: displayName,
            display_name: displayName,
            email: email,
            level: 1,
            xp: 0,
          };

          // Try to insert this user into the database
          try {
            await supabase.from("users").insert({
              id: friendId,
              name: displayName,
              display_name: displayName,
              email: email,
              level: 1,
              xp: 0,
            });
          } catch (err) {
            console.error("Error creating user record:", err);
          }
        }

        console.log("Resolved display name:", userData.display_name);

        console.log(
          "Friend display name:",
          userData.display_name,
          "from data:",
          userData,
        );

        const displayData = {
          ...userData,
          name: userData.display_name,
          level: userData.level || 1,
          xp: userData.xp || 0,
        };

        console.log("Setting friend data:", displayData);
        setFriendData(displayData);

        if (
          userData.display_name.startsWith("User ") &&
          userData.display_name.length <= 15
        ) {
          console.log(
            `FriendCard detected default name ${userData.display_name}, attempting direct fetch`,
          );
          try {
            const { data: directUserData } = await supabase
              .from("users")
              .select("id, name, full_name, email")
              .eq("id", friendId)
              .single();

            console.log(
              `FriendCard direct fetch for ${friendId} returned:`,
              directUserData,
            );

            if (
              directUserData &&
              (directUserData.name || directUserData.full_name)
            ) {
              setFriendData((prev) => ({
                ...prev,
                name:
                  directUserData.name || directUserData.full_name || prev.name,
                full_name:
                  directUserData.full_name ||
                  directUserData.name ||
                  prev.full_name,
              }));
            }
          } catch (err) {
            console.error(
              `Error in FriendCard direct fetch for ${friendId}:`,
              err,
            );
          }
        }

        const habitsChannel = supabase
          .channel(`habits_${friendId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "habits",
              filter: `user_id=eq.${friendId}`,
            },
            () => {
              refreshHabitsData(supabase, friendId);
            },
          )
          .subscribe();

        await refreshHabitsData(supabase, friendId);

        const logsChannel = supabase
          .channel(`habit_logs_${friendId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "habit_logs",
              filter: `user_id=eq.${friendId}`,
            },
            () => {
              refreshAchievements(supabase, friendId);
            },
          )
          .subscribe();

        await refreshAchievements(supabase, friendId);

        return () => {
          supabase.removeChannel(userChannel);
          supabase.removeChannel(habitsChannel);
          supabase.removeChannel(logsChannel);
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : JSON.stringify(err);
        console.error("Unexpected error fetching friend data:", errorMessage);
        setError(`Unexpected error: ${errorMessage}`);

        setFriendData({
          id: friendId,
          name: friendName || `User ${friendId.substring(0, 8)}`,
          email: friendEmail || "",
          level: 1,
          xp: 0,
          avatar_url: null,
        });
        setAchievements([]);
        setStats({
          totalHabits: 0,
          completedHabits: 0,
          highestStreak: 0,
          totalGoals: 0,
          completedGoals: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    const refreshHabitsData = async (supabase: any, userId: string) => {
      try {
        const { data: habits, error: habitsError } = await supabase
          .from("habits")
          .select("id, streak")
          .eq("user_id", userId);

        const { data: goals, error: goalsError } = await supabase
          .from("goals")
          .select("id, progress")
          .eq("user_id", userId);

        if (habitsError) {
          console.error("Error fetching habits:", habitsError);
          return;
        }

        if (goalsError) {
          console.error("Error fetching goals:", goalsError);
          return;
        }

        const totalHabits = habits?.length || 0;
        const highestStreak = habits
          ? Math.max(0, ...habits.map((h) => h.streak || 0))
          : 0;
        const totalGoals = goals?.length || 0;
        const completedGoals = goals
          ? goals.filter((g) => g.progress === 100).length
          : 0;

        setStats({
          totalHabits,
          completedHabits: 0,
          highestStreak,
          totalGoals,
          completedGoals,
        });
      } catch (error) {
        console.error("Error refreshing habits data:", error);
      }
    };

    const refreshAchievements = async (supabase: any, userId: string) => {
      try {
        const { data: habitLogs, error: habitError } = await supabase
          .from("habit_logs")
          .select("id, habit_id, completed_at, xp_awarded")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(3);

        if (habitError) {
          console.error("Error fetching habit logs:", habitError);
          setAchievements([]);
          return;
        }

        if (habitLogs && habitLogs.length > 0) {
          const habitAchievements = await Promise.all(
            habitLogs.map(async (log) => {
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

          setAchievements(habitAchievements);
        } else {
          setAchievements([]);
        }
      } catch (error) {
        console.error("Error refreshing achievements:", error);
        setAchievements([]);
      }
    };

    if (friendId) {
      fetchFriendData();
    }
  }, [friendId, friendName, friendEmail, initialFriendData]);

  const levelProgress = friendData
    ? calculateLevelProgress(friendData.xp, friendData.level)
    : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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

  if (isLoading) {
    return (
      <Card className="w-full bg-white">
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
      <Card className="w-full border-red-100 bg-white">
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
      <Card className="w-full border-red-100 bg-white">
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
    <Card className="w-full hover:border-purple-200 transition-all bg-white">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 border-2 border-purple-100">
              {friendData.avatar_url ? (
                <img
                  src={`${friendData.avatar_url}?t=${new Date().getTime()}`}
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
            <div>
              <CardTitle className="text-lg">
                {friendData.name &&
                friendData.name !== friendData.id &&
                !friendData.name.includes("-")
                  ? friendData.name
                  : friendData.email && friendData.email.includes("@")
                    ? friendData.email.split("@")[0]
                    : `User ${friendId.substring(0, 8)}`}
              </CardTitle>
              {friendData.email && friendData.email !== friendData.name && (
                <p className="text-xs text-gray-500">{friendData.email}</p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-800 font-semibold"
          >
            Level {friendData.level || 1}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-purple-800">Level Progress</span>
            <span className="font-medium">{Math.round(levelProgress)}%</span>
          </div>
          <Progress value={levelProgress} className="h-2.5 bg-gray-200" />
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-purple-50 p-2 rounded-md text-center">
              <div className="flex justify-center mb-1">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">Habits</p>
              <p className="font-semibold text-sm">{stats.totalHabits}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-md text-center">
              <div className="flex justify-center mb-1">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Streak</p>
              <p className="font-semibold text-sm">{stats.highestStreak}</p>
            </div>
            <div className="bg-amber-50 p-2 rounded-md text-center">
              <div className="flex justify-center mb-1">
                <Trophy className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xs text-gray-600">Goals</p>
              <p className="font-semibold text-sm">
                {stats.completedGoals}/{stats.totalGoals}
              </p>
            </div>
          </div>
        )}

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

function calculateLevelProgress(
  currentXP: number,
  currentLevel: number,
): number {
  const baseXP = 100;
  const growthFactor = 1.5;

  let totalXPForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    totalXPForCurrentLevel += Math.floor(
      baseXP * Math.pow(growthFactor, i - 1),
    );
  }

  let totalXPForNextLevel = totalXPForCurrentLevel;
  totalXPForNextLevel += Math.floor(
    baseXP * Math.pow(growthFactor, currentLevel - 1),
  );

  const xpInCurrentLevel = currentXP - totalXPForCurrentLevel;
  const xpRequiredForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;

  const progress = Math.floor(
    (xpInCurrentLevel / xpRequiredForNextLevel) * 100,
  );
  return Math.min(Math.max(progress, 0), 100);
}
