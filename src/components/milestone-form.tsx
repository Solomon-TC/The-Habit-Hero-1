"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MilestoneFormData } from "@/types/goal";
import { createMilestone, updateMilestone } from "@/lib/milestone-actions";

interface MilestoneFormProps {
  goalId: string;
  initialData?: MilestoneFormData;
  milestoneId?: string;
  onSuccess?: () => void;
}

export default function MilestoneForm({
  goalId,
  initialData,
  milestoneId,
  onSuccess,
}: MilestoneFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MilestoneFormData>(
    initialData || {
      title: "",
      description: "",
      due_date: null,
    },
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? new Date(value) : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (milestoneId) {
        // Update existing milestone
        await updateMilestone(milestoneId, goalId, formData);
      } else {
        // Create new milestone
        await createMilestone(goalId, formData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/goals?id=${goalId}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the milestone");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white">
      <CardHeader>
        <CardTitle>
          {milestoneId ? "Edit Milestone" : "Add Milestone"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Milestone Title *
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What's this milestone about?"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what needs to be done"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="due_date" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              value={
                formData.due_date
                  ? formData.due_date.toISOString().split("T")[0]
                  : ""
              }
              onChange={handleDateChange}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : milestoneId
                ? "Update Milestone"
                : "Add Milestone"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
