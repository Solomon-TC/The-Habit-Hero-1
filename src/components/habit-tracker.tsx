"use client";

import { HabitWithProgress } from "@/types/habit";
import HabitList from "./habit-list";

interface HabitTrackerProps {
  habits: HabitWithProgress[];
  userId: string;
}

export default function HabitTracker({ habits, userId }: HabitTrackerProps) {
  return <HabitList habits={habits} userId={userId} />;
}
