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

interface HabitCardProps {
  habit: HabitWithProgress;
  userId: string;
}

export default function HabitCard({ habit, userId }: HabitCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleComplete = async () => {
    if (habit.isCompleted) return;

    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();

      // Create the log entry
      const { error: logError } = await supabase.from("habit_logs").insert({
        habit_id: habit.id,
        user_id: userId,
        count: 1,
        completed_at: new Date().toISOString(),
      });

      if (logError) {
        console.error("Error logging habit completion:", logError);
        throw logError;
      }

      // Update the streak
      const { error: updateError } = await supabase
        .from("habits")
        .update({
          streak: habit.streak + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", habit.id);

      if (updateError) {
        console.error("Error updating habit streak:", updateError);
      }

      router.refresh();
    } catch (error) {
      console.error("Error completing habit:", error);
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
        .eq("id", habit.id);

      if (error) {
        console.error("Error deleting habit:", error);
        throw error;
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting habit:", error);
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Get the appropriate icon component
  const IconComponent = habit.icon ? Icon : Icon;

  // Calculate progress percentage
  const progressPercentage = (habit.progress / habit.target_count) * 100;

  // Determine card border color based on habit color or default to purple
  const borderColorClass = habit.color
    ? `border-${habit.color}-400`
    : "border-purple-400";
  const bgColorClass = habit.color ? `bg-${habit.color}-50` : "bg-purple-50";
  const iconColorClass = habit.color
    ? `text-${habit.color}-500`
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
                  name={(habit.icon as any) || "activity"}
                  className={`h-5 w-5 ${iconColorClass}`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{habit.name}</h3>
                {habit.description && (
                  <p className="text-sm text-muted-foreground">
                    {habit.description}
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
              <span>Streak: {habit.streak}</span>
            </Badge>
            <Badge variant="outline">
              {habit.frequency.charAt(0).toUpperCase() +
                habit.frequency.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>
              {habit.progress} / {habit.target_count}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-gray-200" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: habit.target_count }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center ${i < habit.progress ? `bg-${habit.color || "purple"}-100 text-${habit.color || "purple"}-600` : "bg-gray-100 text-gray-400"}`}
              >
                {i < habit.progress ? (
                  <Icon name="check" className="h-4 w-4" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            disabled={isLoading}
          >
            <Icon name="refresh" className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <Button
            className={`${habit.color ? `bg-${habit.color}-600 hover:bg-${habit.color}-700` : "bg-purple-600 hover:bg-purple-700"}`}
            size="sm"
            onClick={handleComplete}
            disabled={isLoading || habit.isCompleted}
          >
            {isLoading ? (
              <Icon name="spinner" className="mr-1 h-4 w-4 animate-spin" />
            ) : habit.isCompleted ? (
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
        habit={habit}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the habit "{habit.name}" and all of
              its tracking history. This action cannot be undone.
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
