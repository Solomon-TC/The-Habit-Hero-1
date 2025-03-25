export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  progress: number;
  start_date: string;
  end_date: string | null;
  xp_value: number;
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  xp_value: number;
  created_at: string;
  updated_at: string;
}

export interface GoalFormData {
  title: string;
  description: string;
  category: string;
  start_date: Date;
  end_date: Date | null;
}

export interface MilestoneFormData {
  title: string;
  description: string;
  due_date: Date | null;
}
