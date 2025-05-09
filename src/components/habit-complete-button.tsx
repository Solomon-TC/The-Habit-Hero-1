"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface HabitCompleteButtonProps {
  habitId: string;
  userId: string;
  isCompleted: boolean;
  onComplete?: () => void;
}

export function HabitCompleteButton({
  habitId,
  userId,
  isCompleted,
  onComplete,
}: HabitCompleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  const handleComplete = async () => {
    if (completed || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/habits/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId,
          userId,
          count: 1,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Habit completion result:", result);

        // Check if XP was awarded
        if (result.xpGained) {
          console.log(`XP awarded: ${result.xpGained}`);
        }

        setCompleted(true);
        if (onComplete) onComplete();
      } else {
        console.error("Failed to complete habit");
      }
    } catch (error) {
      console.error("Error completing habit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleComplete}
      disabled={completed || loading}
      variant={completed ? "outline" : "default"}
      size="sm"
      className={
        completed
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-purple-600 hover:bg-purple-700"
      }
    >
      {loading ? (
        "Loading..."
      ) : completed ? (
        <span className="flex items-center gap-1">
          <Check className="h-4 w-4" /> Completed
        </span>
      ) : (
        "Complete"
      )}
    </Button>
  );
}
