"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Milestone } from "@/types/goal";

interface MilestoneCheckboxProps {
  milestone: Milestone;
  goalId: string;
  userId: string;
}

export function MilestoneCheckbox({
  milestone,
  goalId,
  userId,
}: MilestoneCheckboxProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);

    try {
      await fetch(`/api/milestones/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone.id,
          goalId,
          userId,
        }),
      });

      router.refresh();
    } catch (error) {
      console.error("Error completing milestone:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        id={`milestone-${milestone.id}`}
        checked={milestone.is_completed}
        disabled={isLoading}
        onChange={() => {}} // React requires onChange handler for controlled inputs
        onClick={handleComplete}
      />
      <label htmlFor={`milestone-${milestone.id}`} className="text-sm">
        {milestone.title}
      </label>
    </div>
  );
}
