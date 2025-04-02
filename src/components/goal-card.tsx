"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser-client";
import { Goal, Milestone } from "@/types/goal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Pencil,
  Trash2,
  Plus,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { showGameToast } from "./level-up-toast";

interface GoalCardProps {
  goal: Goal;
  onDelete?: () => void;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  // Add click handler for the entire card to navigate to edit page
  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if the click wasn't on a button or other interactive element
    if (
      !(e.target as HTMLElement).closest("button") &&
      !(e.target as HTMLElement).closest("a")
    ) {
      router.push(`/dashboard/goals/edit?id=${goal.id}`);
    }
  };
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [showMilestones, setShowMilestones] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>(
    goal.milestones || [],
  );
  const [goalProgress, setGoalProgress] = useState(goal.progress);

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this goal? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true);

      const { error } = await supabase.from("goals").delete().eq("id", goal.id);

      if (error) {
        console.error("Error deleting goal:", error);
        alert("Failed to delete goal. Please try again.");
        setIsDeleting(false);
        return;
      }

      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
      }
    }
  };

  const toggleMilestoneCompletion = async (
    milestone: Milestone,
    event?: React.MouseEvent,
  ) => {
    // Prevent event propagation to avoid navigation when clicking on milestone checkbox
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const newStatus = !milestone.is_completed;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      console.error("User ID not found");
      return;
    }

    console.log(
      `[CLIENT] Toggle milestone completion: ${milestone.id}, new status: ${newStatus}`,
    );

    try {
      if (newStatus) {
        // If completing the milestone, use the server endpoint to award XP
        console.log(
          `[CLIENT] Attempting to complete milestone: ${milestone.id} for goal: ${goal.id}`,
        );
        const response = await fetch(`/api/milestones/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            milestoneId: milestone.id,
            goalId: goal.id,
            userId: userId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("[CLIENT] Milestone completion result:", result);

          // Show notification for XP gained
          if (result.xpAwarded) {
            const xpValue = result.xpAwarded || 20;
            console.log(
              `[CLIENT] Triggering milestone notification with ${xpValue} XP`,
            );

            // Multiple notification methods for redundancy
            try {
              console.log(
                "[CLIENT] Calling showGameToast for milestone completion",
              );
              showGameToast({
                type: "milestone",
                title: `Milestone Achieved: ${milestone.title}`,
                xpGained: xpValue,
                leveledUp: result.leveledUp || false,
                newLevel: result.newLevel || 1,
              });
              console.log("[CLIENT] showGameToast called successfully");
            } catch (toastError) {
              console.error(
                "[CLIENT] Error showing game toast for milestone:",
                toastError,
              );
            }

            // Fallback notification using alert
            setTimeout(() => {
              try {
                console.log("[CLIENT] Showing fallback alert notification");
                window.alert(
                  `Milestone Achieved: ${milestone.title}\n+${xpValue} XP gained${result.leveledUp ? `\nYou reached level ${result.newLevel || 1}!` : ""}`,
                );
              } catch (alertError) {
                console.error(
                  "[CLIENT] Error showing alert notification:",
                  alertError,
                );
              }
            }, 500);
          }
        } else {
          const errorText = await response.text();
          console.error(
            "[CLIENT] Error completing milestone via API:",
            errorText,
          );
        }
      } else {
        // If uncompleting, just update the database directly
        console.log(`[CLIENT] Uncompleting milestone: ${milestone.id}`);
        const { error } = await supabase
          .from("milestones")
          .update({
            is_completed: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", milestone.id);

        if (error) {
          console.error("[CLIENT] Error updating milestone:", error);
          return;
        }
      }
    } catch (error) {
      console.error(
        "[CLIENT] Unexpected error in toggleMilestoneCompletion:",
        error,
      );
    }

    // Update local state
    const updatedMilestones = milestones.map((m) =>
      m.id === milestone.id ? { ...m, is_completed: newStatus } : m,
    );
    setMilestones(updatedMilestones);

    // Calculate progress locally
    const completedCount = updatedMilestones.filter(
      (m) => m.is_completed,
    ).length;
    const newProgress = Math.round(
      (completedCount / updatedMilestones.length) * 100,
    );
    setGoalProgress(newProgress);

    try {
      // Update goal progress in database
      console.log(
        `[CLIENT] Updating goal progress: ${goal.id} to ${newProgress}%`,
      );

      // Use the API endpoint for goal progress updates to ensure proper XP handling
      if (newProgress === 100 && goalProgress !== 100) {
        console.log(
          `[CLIENT] Goal is now completed (100%), using API endpoint`,
        );

        try {
          const response = await fetch(`/api/goals/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              goalId: goal.id,
              progress: newProgress,
              userId: userId,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("[CLIENT] Goal completion result:", result);

            // Show notification for XP gained
            if (result.xpAwarded) {
              const xpValue = result.xpAwarded || 50;
              console.log(
                `[CLIENT] Triggering goal notification with ${xpValue} XP`,
              );

              // Multiple notification methods for redundancy
              try {
                console.log(
                  "[CLIENT] Calling showGameToast for goal completion",
                );
                showGameToast({
                  type: "goal",
                  title: `Goal Accomplished: ${goal.title}`,
                  xpGained: xpValue,
                  leveledUp: result.leveledUp || false,
                  newLevel: result.newLevel || 1,
                });
                console.log(
                  "[CLIENT] Goal completion toast shown successfully",
                );
              } catch (toastError) {
                console.error(
                  "[CLIENT] Error showing game toast for goal completion:",
                  toastError,
                );
              }

              // Fallback notification using alert
              setTimeout(() => {
                try {
                  console.log(
                    "[CLIENT] Showing fallback alert notification for goal",
                  );
                  window.alert(
                    `Goal Accomplished: ${goal.title}\n+${xpValue} XP gained${result.leveledUp ? `\nYou reached level ${result.newLevel || 1}!` : ""}`,
                  );
                } catch (alertError) {
                  console.error(
                    "[CLIENT] Error showing alert notification for goal:",
                    alertError,
                  );
                }
              }, 500);
            }
          } else {
            const errorText = await response.text();
            console.error("[CLIENT] Error completing goal via API:", errorText);

            // Fallback to direct update if API fails
            const { error: progressError } = await supabase
              .from("goals")
              .update({
                progress: newProgress,
                updated_at: new Date().toISOString(),
              })
              .eq("id", goal.id);

            if (progressError) {
              console.error(
                "[CLIENT] Error updating goal progress directly:",
                progressError,
              );
            }
          }
        } catch (error) {
          console.error(
            "[CLIENT] Error handling goal completion via API:",
            error,
          );

          // Fallback to direct update if API call fails
          const { error: progressError } = await supabase
            .from("goals")
            .update({
              progress: newProgress,
              updated_at: new Date().toISOString(),
            })
            .eq("id", goal.id);

          if (progressError) {
            console.error(
              "[CLIENT] Error updating goal progress directly:",
              progressError,
            );
          }
        }
      } else {
        // For non-completion updates, use direct database update
        const { error: progressError } = await supabase
          .from("goals")
          .update({
            progress: newProgress,
            updated_at: new Date().toISOString(),
          })
          .eq("id", goal.id);

        if (progressError) {
          console.error(
            "[CLIENT] Error updating goal progress:",
            progressError,
          );
        }
      }
    } catch (error) {
      console.error(
        "[CLIENT] Error updating goal progress in database:",
        error,
      );
    }

    router.refresh();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      Health: "bg-green-100 text-green-800",
      Fitness: "bg-blue-100 text-blue-800",
      Learning: "bg-indigo-100 text-indigo-800",
      Career: "bg-yellow-100 text-yellow-800",
      Finance: "bg-emerald-100 text-emerald-800",
      Personal: "bg-purple-100 text-purple-800",
      Relationships: "bg-pink-100 text-pink-800",
      Wellness: "bg-teal-100 text-teal-800",
      Other: "bg-gray-100 text-gray-800",
    };

    return colors[category || "Other"] || colors.Other;
  };

  return (
    <Card
      className="overflow-hidden border-2 hover:border-purple-200 transition-all cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 bg-purple-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{goal.title}</CardTitle>
            <CardDescription>{goal.description}</CardDescription>
          </div>
          <div
            className={`text-xs font-medium px-2.5 py-0.5 rounded ${getCategoryColor(goal.category)}`}
          >
            {goal.category || "Other"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{goalProgress}%</span>
        </div>
        <Progress value={goalProgress} className="h-2 bg-gray-200" />
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Start Date</p>
            <p>{formatDate(goal.start_date)}</p>
          </div>
          <div>
            <p className="text-gray-500">Target Date</p>
            <p>{formatDate(goal.end_date)}</p>
          </div>
        </div>

        {/* Milestones section */}
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center p-2 text-sm"
            onClick={() => setShowMilestones(!showMilestones)}
          >
            <span>Milestones ({milestones.length})</span>
            {showMilestones ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </Button>

          {showMilestones && (
            <div className="mt-2 space-y-2">
              {milestones.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No milestones yet. Add one to track your progress.
                </p>
              ) : (
                milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50"
                  >
                    <button
                      onClick={(e) => toggleMilestoneCompletion(milestone, e)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {milestone.is_completed ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <Circle size={18} className="text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${milestone.is_completed ? "line-through text-gray-500" : ""}`}
                      >
                        {milestone.title}
                      </p>
                      {milestone.description && (
                        <p className="text-xs text-gray-600">
                          {milestone.description}
                        </p>
                      )}
                      {milestone.due_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {formatDate(milestone.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={() =>
                  router.push(
                    `/dashboard/goals/milestones/new?goalId=${goal.id}`,
                  )
                }
              >
                <Plus size={16} className="mr-1" />
                Add Milestone
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/goals/edit?id=${goal.id}`)}
          >
            <Pencil size={16} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} className="mr-1" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          size="sm"
          onClick={() =>
            router.push(`/dashboard/goals/milestones/new?goalId=${goal.id}`)
          }
        >
          <Plus size={16} className="mr-1" />
          Add Milestone
        </Button>
      </CardFooter>
    </Card>
  );
}
