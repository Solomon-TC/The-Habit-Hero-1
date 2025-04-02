"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Goal } from "@/types/goal";
import GoalCard from "./goal-card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface GoalListProps {
  goals: Goal[];
  userId: string;
}

export default function GoalList({ goals, userId }: GoalListProps) {
  const [localGoals, setLocalGoals] = useState<Goal[]>(goals);

  // Initialize with the provided goals
  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  // Subscribe to real-time goal updates
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    // Create subscription for goals
    const goalChannel = supabase
      .channel(`goals_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            setLocalGoals((prev) => {
              const goalIndex = prev.findIndex((g) => g.id === payload.new.id);
              if (goalIndex >= 0) {
                // Update existing goal
                const updatedGoals = [...prev];
                updatedGoals[goalIndex] = {
                  ...updatedGoals[goalIndex],
                  ...payload.new,
                };
                return updatedGoals;
              } else if (payload.eventType === "INSERT") {
                // Add new goal
                return [...prev, { ...payload.new, milestones: [] }];
              }
              return prev;
            });
          } else if (payload.eventType === "DELETE") {
            // Remove deleted goal
            setLocalGoals((prev) =>
              prev.filter((g) => g.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(goalChannel);
    };
  }, [userId]);

  // Subscribe to milestone updates to update goal progress
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    // Create subscription for milestones
    const milestoneChannel = supabase
      .channel(`milestones_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "milestones",
        },
        (payload) => {
          if (payload.new && payload.new.goal_id) {
            // Find the goal this milestone belongs to
            setLocalGoals((prev) => {
              return prev.map((goal) => {
                if (goal.id === payload.new.goal_id) {
                  // Update the milestone in the goal's milestones array
                  const updatedMilestones = goal.milestones
                    ? [...goal.milestones]
                    : [];
                  const milestoneIndex = updatedMilestones.findIndex(
                    (m) => m.id === payload.new.id,
                  );

                  if (milestoneIndex >= 0) {
                    // Update existing milestone
                    updatedMilestones[milestoneIndex] = {
                      ...updatedMilestones[milestoneIndex],
                      ...payload.new,
                    };
                  } else if (payload.eventType === "INSERT") {
                    // Add new milestone
                    updatedMilestones.push(payload.new);
                  }

                  // Calculate new progress based on completed milestones
                  const completedCount = updatedMilestones.filter(
                    (m) => m.is_completed,
                  ).length;
                  const progress =
                    updatedMilestones.length > 0
                      ? Math.round(
                          (completedCount / updatedMilestones.length) * 100,
                        )
                      : 0;

                  return {
                    ...goal,
                    milestones: updatedMilestones,
                    progress,
                  };
                }
                return goal;
              });
            });
          } else if (
            payload.eventType === "DELETE" &&
            payload.old &&
            payload.old.goal_id
          ) {
            // Handle milestone deletion
            setLocalGoals((prev) => {
              return prev.map((goal) => {
                if (goal.id === payload.old.goal_id && goal.milestones) {
                  const updatedMilestones = goal.milestones.filter(
                    (m) => m.id !== payload.old.id,
                  );

                  // Recalculate progress
                  const completedCount = updatedMilestones.filter(
                    (m) => m.is_completed,
                  ).length;
                  const progress =
                    updatedMilestones.length > 0
                      ? Math.round(
                          (completedCount / updatedMilestones.length) * 100,
                        )
                      : 0;

                  return {
                    ...goal,
                    milestones: updatedMilestones,
                    progress,
                  };
                }
                return goal;
              });
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(milestoneChannel);
    };
  }, [userId]);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Goals</h2>
        <Link href="/dashboard/goals/new">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus size={18} className="mr-2" />
            Add Goal
          </Button>
        </Link>
      </div>

      {localGoals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first goal to start tracking your progress
          </p>
          <Link href="/dashboard/goals/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus size={18} className="mr-2" />
              Create Your First Goal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {localGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
