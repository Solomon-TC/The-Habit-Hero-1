"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  completeMilestone,
  uncompleteMilestone,
} from "@/lib/milestone-actions";
import { CheckCircle, Circle } from "lucide-react";
import { showGameToast } from "@/components/level-up-toast";
import { useMilestoneUpdates } from "@/lib/real-time-updates";

interface MilestoneActionsProps {
  milestoneId: string;
  goalId: string;
  userId: string;
  isCompleted: boolean;
  title: string;
  onUpdate: () => void;
}

export function MilestoneActions({
  milestoneId,
  goalId,
  userId,
  isCompleted,
  title,
  onUpdate,
}: MilestoneActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      if (isCompleted) {
        await uncompleteMilestone(milestoneId, goalId);
      } else {
        const result = await completeMilestone(milestoneId, goalId, userId);

        // Show toast notification
        if (result && result.xpAwarded) {
          showGameToast({
            type: "milestone",
            title: `Milestone completed: ${title}`,
            xpGained: result.xpAwarded,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel,
          });
        }
      }
      // No need to call onUpdate() - real-time updates will handle it
    } catch (error) {
      console.error("Error toggling milestone completion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleComplete}
      disabled={isLoading}
      className="h-8 w-8"
    >
      {isCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-gray-300" />
      )}
    </Button>
  );
}
