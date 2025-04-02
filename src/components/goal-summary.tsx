import * as React from "react";
import { Goal } from "@/types/goal";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { showGameToast } from "./level-up-toast";

interface GoalSummaryProps {
  goals: Goal[];
}

export default function GoalSummary({ goals }: GoalSummaryProps) {
  // Calculate summary statistics
  const totalGoals = goals.length;
  const completedGoals = goals.filter((goal) => goal.progress === 100).length;
  const inProgressGoals = goals.filter(
    (goal) => goal.progress > 0 && goal.progress < 100,
  ).length;
  const notStartedGoals = goals.filter((goal) => goal.progress === 0).length;

  // Calculate average progress
  const averageProgress =
    totalGoals > 0
      ? Math.round(
          goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals,
        )
      : 0;

  // Get upcoming milestones
  const allMilestones = goals.flatMap((goal) =>
    (goal.milestones || []).map((milestone) => ({
      ...milestone,
      goalTitle: goal.title,
      goalId: goal.id,
    })),
  );

  // Filter for incomplete milestones with due dates
  const upcomingMilestones = allMilestones
    .filter((m) => !m.is_completed && m.due_date)
    .sort(
      (a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
    )
    .slice(0, 3); // Get the 3 most imminent milestones

  // Function to handle goal completion (for demonstration)
  const handleGoalComplete = (goalId: string, goalTitle: string) => {
    // Show game toast notification
    showGameToast({
      type: "goal",
      title: `Goal completed: ${goalTitle}`,
      xpGained: 50, // Default XP value for goals
      leveledUp: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedGoals}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inProgressGoals}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {notStartedGoals}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-1">
            <span>Average completion</span>
            <span>{averageProgress}%</span>
          </div>
          <Progress value={averageProgress} className="h-2" />
        </CardContent>
      </Card>

      {upcomingMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-3 p-2 rounded-md bg-gray-50"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className="font-medium">{milestone.title}</p>
                    <p className="text-sm text-gray-600">
                      Goal: {milestone.goalTitle}
                    </p>
                    {milestone.due_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
