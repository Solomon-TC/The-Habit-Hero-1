export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  badge_color?: string;
  xp_reward: number;
  created_at?: string;
  updated_at?: string;
  criteria?: AchievementCriteria;
  category?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  created_at?: string;
  updated_at?: string;
  achievement?: Achievement; // For joined queries
}

export interface AchievementCriteria {
  type: AchievementType;
  threshold?: number;
  timeframe?: number; // in days
  specific_time?: string; // for time-based achievements like "early bird"
  consecutive?: boolean; // for streak-based achievements
}

export enum AchievementType {
  STREAK = "streak",
  COMPLETION = "completion",
  TOTAL_HABITS = "total_habits",
  TOTAL_GOALS = "total_goals",
  EARLY_COMPLETION = "early_completion",
  MILESTONE_COMPLETION = "milestone_completion",
  LEVEL_REACHED = "level_reached",
  XP_EARNED = "xp_earned",
}

export interface AchievementWithProgress extends Achievement {
  earned: boolean;
  progress?: number; // percentage of completion
  earned_at?: string;
}
