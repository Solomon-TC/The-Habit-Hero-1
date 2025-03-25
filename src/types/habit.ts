export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_count: number;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  streak: number;
  color?: string;
  icon?: string;
  xp_value: number;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  count: number;
  notes?: string;
}

export interface HabitWithProgress extends Habit {
  progress: number;
  logs?: HabitLog[];
  isCompleted?: boolean;
  lastCompletedAt?: string;
}

export const DEFAULT_HABIT_COLORS = [
  "purple",
  "blue",
  "green",
  "yellow",
  "red",
  "pink",
  "indigo",
  "teal",
];

export const DEFAULT_HABIT_ICONS = [
  "activity",
  "book",
  "coffee",
  "dumbbell",
  "heart",
  "music",
  "sun",
  "zap",
  "droplet",
  "brain",
];
