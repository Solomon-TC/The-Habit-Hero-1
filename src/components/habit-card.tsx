"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { HabitWithProgress } from "@/types/habit";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import HabitForm from "./habit-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { showGameToast } from "./level-up-toast";

interface HabitCardProps {
  habit: HabitWithProgress;
  userId: string;
}

export default function HabitCard({ habit, userId }: HabitCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localHabit, setLocalHabit] = useState<HabitWithProgress>(habit);

  const handleComplete = async () => {
    if (localHabit.isCompleted) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `Completing habit: ${localHabit.name} (${localHabit.id}) for user: ${userId}`,
      );

      // Use the server action to log completion and award XP
      const result = await fetch("/api/habits/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId: localHabit.id,
          userId: userId,
          count: 1,
        }),
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error(
          `Error response from server: ${result.status} ${errorText}`,
        );
        throw new Error(`Server error: ${result.status} ${errorText}`);
      }

      const data = await result.json();

      if (data.error) {
        console.error("Error completing habit:", data.error);
        setError(data.error);
        showGameToast({
          type: "habit",
          title: `Error: ${data.error}`,
          xpGained: 0,
        });
        return;
      }

      console.log("Habit completion result:", data);

      // Show game toast notification with explicit values
      const xpValue = data.xpGained || localHabit.xp_value || 10;
      console.log(
        `Triggering habit completion notification with ${xpValue} XP`,
      );

      showGameToast({
        type: "habit",
        title: `${localHabit.name} completed!`,
        xpGained: xpValue,
        leveledUp: data.leveledUp || false,
        newLevel: data.newLevel || 1,
      });

      console.log("Habit completion response:", data);

      // Update local state immediately for instant feedback
      const updatedHabit = {
        ...localHabit,
        progress: localHabit.progress + 1,
        isCompleted: localHabit.progress + 1 >= localHabit.target_count,
        lastCompletedAt: new Date().toISOString(),
      };

      setLocalHabit(updatedHabit);

      // Dispatch custom event for other components to update
      const habitUpdateEvent = new CustomEvent("habit-updated", {
        detail: { habit: updatedHabit },
      });
      window.dispatchEvent(habitUpdateEvent);
    } catch (error) {
      console.error("Error completing habit:", error);
      setError(error instanceof Error ? error.message : String(error));

      showGameToast({
        type: "habit",
        title: `Error completing habit`,
        xpGained: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", localHabit.id);

      if (error) {
        console.error("Error deleting habit:", error);
        throw error;
      }

      // Dispatch custom event for immediate UI update
      const habitDeleteEvent = new CustomEvent("habit-deleted", {
        detail: { habitId: localHabit.id },
      });
      window.dispatchEvent(habitDeleteEvent);

      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting habit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use the local habit state for rendering instead of the prop
  // Get the appropriate icon component
  const IconComponent = localHabit.icon ? Icon : Icon;

  // Calculate progress percentage
  const progressPercentage =
    (localHabit.progress / localHabit.target_count) * 100;

  // Determine card border color based on habit color or default to purple
  const borderColorClass = localHabit.color
    ? `border-${localHabit.color}-400`
    : "border-purple-400";
  const bgColorClass = localHabit.color
    ? `bg-${localHabit.color}-50`
    : "bg-purple-50";
  const iconColorClass = localHabit.color
    ? `text-${localHabit.color}-500`
    : "text-purple-500";

  return (
    <>
      <Card
        className={`overflow-hidden border-2 hover:${borderColorClass} transition-all`}
      >
        <CardHeader className={`pb-2 ${bgColorClass}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${bgColorClass}`}>
                <Icon
                  name={(localHabit.icon as any) || "activity"}
                  className={`h-5 w-5 ${iconColorClass}`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{localHabit.name}</h3>
                {localHabit.description && (
                  <p className="text-sm text-muted-foreground">
                    {localHabit.description}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Icon name="moreVertical" className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                  <Icon name="edit" className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Icon name="delete" className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex justify-between items-center mt-2">
            <Badge variant="outline" className="flex gap-1 items-center">
              <Icon name="flame" className="h-3 w-3 text-orange-500" />
              <span>Streak: {localHabit.streak}</span>
            </Badge>
            <Badge variant="outline">
              {localHabit.frequency.charAt(0).toUpperCase() +
                localHabit.frequency.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>
              {localHabit.progress} / {localHabit.target_count}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-gray-200" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: localHabit.target_count }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center ${i < localHabit.progress ? `bg-${localHabit.color || "purple"}-100 text-${localHabit.color || "purple"}-600` : "bg-gray-100 text-gray-400"}`}
              >
                {i < localHabit.progress ? (
                  <Icon name="check" className="h-4 w-4" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-500">Error: {error}</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button
            className={`${localHabit.color ? `bg-${localHabit.color}-600 hover:bg-${localHabit.color}-700` : "bg-purple-600 hover:bg-purple-700"}`}
            size="sm"
            onClick={handleComplete}
            disabled={isLoading || localHabit.isCompleted}
          >
            {isLoading ? (
              <Icon name="spinner" className="mr-1 h-4 w-4 animate-spin" />
            ) : localHabit.isCompleted ? (
              <>
                <Icon name="check" className="mr-1 h-4 w-4" />
                Completed
              </>
            ) : (
              "Complete"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Habit Form Dialog */}
      <HabitForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        userId={userId}
        habit={localHabit}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the habit "{localHabit.name}" and all
              of its tracking history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Icon name="spinner" className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
