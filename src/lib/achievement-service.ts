"use server";

import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "./supabase-server-actions";
import {
  Achievement,
  AchievementType,
  UserAchievement,
} from "@/types/achievement";
import { revalidatePath } from "next/cache";

/**
 * Check if a user is eligible for any achievements and award them if they are
 * @param userId The user ID to check achievements for
 * @param context Additional context data for achievement checking
 */
export async function checkAchievements(
  userId: string,
  context?: {
    source?: string;
    sourceId?: string;
    level?: number;
    xp?: number;
    streak?: number;
    completedHabits?: number;
    totalHabits?: number;
    completedGoals?: number;
    totalGoals?: number;
    completedMilestones?: number;
    totalMilestones?: number;
    completionTime?: Date;
  },
) {
  console.log(
    `Checking achievements for user ${userId} with context:`,
    context,
  );

  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error("Failed to create Supabase client");
    return { error: "Failed to create Supabase client" };
  }

  try {
    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("*");

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError);
      return { error: achievementsError };
    }

    // Get user's already earned achievements
    const { data: userAchievements, error: userAchievementsError } =
      await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId);

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError);
      return { error: userAchievementsError };
    }

    // Get user data for additional checks
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return { error: userError };
    }

    // Filter out already earned achievements
    const earnedAchievementIds =
      userAchievements?.map((ua) => ua.achievement_id) || [];
    const unearnedAchievements =
      achievements?.filter(
        (achievement) => !earnedAchievementIds.includes(achievement.id),
      ) || [];

    console.log(
      `Found ${unearnedAchievements.length} unearned achievements to check`,
    );

    // Check each unearned achievement for eligibility
    const newlyEarnedAchievements: Achievement[] = [];
    const awardPromises: Promise<any>[] = [];

    for (const achievement of unearnedAchievements) {
      console.log(`Checking eligibility for achievement: ${achievement.name}`);

      const isEligible = await checkAchievementEligibility(
        achievement,
        userId,
        userData,
        context,
      );

      if (isEligible) {
        console.log(
          `User ${userId} is eligible for achievement: ${achievement.name}`,
        );
        newlyEarnedAchievements.push(achievement);

        // Award the achievement
        const awardPromise = awardAchievement(
          userId,
          achievement.id,
          achievement.xp_reward,
        );
        awardPromises.push(awardPromise);
      }
    }

    // Wait for all awards to be processed
    await Promise.all(awardPromises);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");

    return {
      earnedAchievements: newlyEarnedAchievements,
      count: newlyEarnedAchievements.length,
    };
  } catch (error) {
    console.error("Error checking achievements:", error);
    return { error };
  }
}

/**
 * Check if a user is eligible for a specific achievement
 */
async function checkAchievementEligibility(
  achievement: Achievement,
  userId: string,
  userData: any,
  context?: any,
): Promise<boolean> {
  if (!achievement.criteria) {
    return false;
  }

  const {
    type,
    threshold = 0,
    timeframe,
    specific_time,
    consecutive,
  } = achievement.criteria;
  const supabase = createServiceRoleClient();

  if (!supabase) {
    console.error("Failed to create Supabase client");
    return false;
  }

  try {
    switch (type) {
      case AchievementType.STREAK:
        // Check if the user has a streak of at least the threshold
        const streak = context?.streak || 0;
        return streak >= threshold;

      case AchievementType.COMPLETION:
        // Check if the user has completed at least the threshold percentage of habits
        const completedHabits = context?.completedHabits || 0;
        const totalHabits = context?.totalHabits || 0;
        if (totalHabits === 0) return false;

        const completionRate = (completedHabits / totalHabits) * 100;
        return completionRate >= threshold;

      case AchievementType.TOTAL_HABITS:
        // Check if the user has created at least the threshold number of habits
        // If context provides totalHabits, use that value directly
        if (context?.totalHabits !== undefined) {
          console.log(
            `Checking TOTAL_HABITS achievement with context value: ${context.totalHabits} >= ${threshold}`,
          );
          return context.totalHabits >= threshold;
        }

        // Otherwise query the database
        const { count: habitCount, error: habitError } = await supabase
          .from("habits")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (habitError) {
          console.error("Error counting habits:", habitError);
          return false;
        }

        console.log(
          `Checking TOTAL_HABITS achievement with DB count: ${habitCount} >= ${threshold}`,
        );
        return (habitCount || 0) >= threshold;

      case AchievementType.TOTAL_GOALS:
        // Check if the user has created at least the threshold number of goals
        const { count: goalCount, error: goalError } = await supabase
          .from("goals")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (goalError) {
          console.error("Error counting goals:", goalError);
          return false;
        }

        return (goalCount || 0) >= threshold;

      case AchievementType.EARLY_COMPLETION:
        // Check if the user completed a habit before the specific time
        if (!context?.completionTime || !specific_time) return false;

        const completionHour = context.completionTime.getHours();
        const completionMinute = context.completionTime.getMinutes();
        const [targetHour, targetMinute] = specific_time.split(":").map(Number);

        return (
          completionHour < targetHour ||
          (completionHour === targetHour && completionMinute <= targetMinute)
        );

      case AchievementType.MILESTONE_COMPLETION:
        // Check if the user has completed at least the threshold number of milestones
        const { count: milestoneCount, error: milestoneError } = await supabase
          .from("milestones")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_completed", true);

        if (milestoneError) {
          console.error("Error counting milestones:", milestoneError);
          return false;
        }

        return (milestoneCount || 0) >= threshold;

      case AchievementType.LEVEL_REACHED:
        // Check if the user has reached at least the threshold level
        const userLevel = context?.level || userData?.level || 1;
        return userLevel >= threshold;

      case AchievementType.XP_EARNED:
        // Check if the user has earned at least the threshold amount of XP
        const userXP = context?.xp || userData?.xp || 0;
        return userXP >= threshold;

      default:
        return false;
    }
  } catch (error) {
    console.error(
      `Error checking eligibility for achievement ${achievement.id}:`,
      error,
    );
    return false;
  }
}

/**
 * Award an achievement to a user
 * @param userId The user ID to award the achievement to
 * @param achievementId The achievement ID to award
 * @param xpReward The XP reward for the achievement
 */
export async function awardAchievement(
  userId: string,
  achievementId: string,
  xpReward: number,
) {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error("Failed to create Supabase client");
    return { error: "Failed to create Supabase client" };
  }

  try {
    // Check if the user already has this achievement
    const { data: existingAchievement, error: checkError } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing achievement:", checkError);
      return { error: checkError };
    }

    // If the user already has this achievement, don't award it again
    if (existingAchievement) {
      return { alreadyAwarded: true };
    }

    // Award the achievement
    const now = new Date().toISOString();
    const { data: userAchievement, error: insertError } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        earned_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error awarding achievement:", insertError);
      return { error: insertError };
    }

    console.log(
      `Successfully awarded achievement ${achievementId} to user ${userId}`,
    );

    // Get the achievement details for the notification
    const { data: achievement, error: achievementError } = await supabase
      .from("achievements")
      .select("*")
      .eq("id", achievementId)
      .single();

    if (achievementError) {
      console.error("Error fetching achievement details:", achievementError);
      // Continue anyway since we've already awarded the achievement
    }

    // Award XP for the achievement if specified
    if (xpReward > 0) {
      // Import dynamically to avoid circular dependencies
      const { awardXP } = await import("./xp");
      await awardXP(userId, xpReward, "achievement", achievementId);
    }

    return {
      awarded: true,
      achievement,
      userAchievement,
    };
  } catch (error) {
    console.error("Error awarding achievement:", error);
    return { error };
  }
}

/**
 * Get a user's achievements with progress information
 * @param userId The user ID to get achievements for
 */
export async function getUserAchievements(userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error("Failed to create Supabase client");
    return { error: "Failed to create Supabase client" };
  }

  try {
    // Get all achievements
    const { data: allAchievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("*")
      .order("name");

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError);
      return { error: achievementsError };
    }

    // Get user's earned achievements
    const { data: userAchievements, error: userAchievementsError } =
      await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId);

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError);
      return { error: userAchievementsError };
    }

    // Map achievements with earned status
    const achievementsWithProgress = allAchievements.map(
      (achievement: Achievement) => {
        const userAchievement = userAchievements?.find(
          (ua: UserAchievement) => ua.achievement_id === achievement.id,
        );

        return {
          ...achievement,
          earned: !!userAchievement,
          earned_at: userAchievement?.earned_at,
          // For now, we'll set progress to 100 if earned, 0 if not
          progress: userAchievement ? 100 : 0,
        };
      },
    );

    return { data: achievementsWithProgress };
  } catch (error) {
    console.error("Error getting user achievements:", error);
    return { error };
  }
}
