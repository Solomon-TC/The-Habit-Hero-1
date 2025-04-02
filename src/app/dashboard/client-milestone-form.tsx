"use client";

import { useRouter } from "next/navigation";

interface MilestoneFormProps {
  milestoneId: string;
  goalId: string;
  userId: string;
  milestoneTitle: string;
}

export function ClientMilestoneForm({
  milestoneId,
  goalId,
  userId,
  milestoneTitle,
}: MilestoneFormProps) {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("milestoneId", milestoneId);
    formData.append("goalId", goalId);
    formData.append("userId", userId);

    try {
      await fetch("/api/milestones/complete", {
        method: "POST",
        body: formData,
      });

      router.refresh();
    } catch (error) {
      console.error("Error completing milestone:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="milestoneId" value={milestoneId} />
        <input type="hidden" name="goalId" value={goalId} />
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          className="h-4 w-4 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500"
        ></button>
      </form>
      <span className="text-sm">{milestoneTitle}</span>
    </div>
  );
}
