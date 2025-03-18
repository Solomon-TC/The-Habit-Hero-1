"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoalFormData } from "@/types/goal";

interface GoalFormProps {
  userId: string;
  initialData?: GoalFormData;
  goalId?: string;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Career",
  "Finance",
  "Personal",
  "Relationships",
  "Wellness",
  "Other",
];

export default function GoalForm({
  userId,
  initialData,
  goalId,
  onSuccess,
}: GoalFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<GoalFormData>(
    initialData || {
      title: "",
      description: "",
      category: "Personal",
      start_date: new Date(),
      end_date: null,
    },
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
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
      const goalData = {
        user_id: userId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date ? formData.end_date.toISOString() : null,
        progress: 0,
      };

      let result;

      if (goalId) {
        // Update existing goal
        result = await supabase
          .from("goals")
          .update({
            ...goalData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", goalId);
      } else {
        // Create new goal
        result = await supabase
          .from("goals")
          .insert([
            {
              ...goalData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select();
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/goals");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white">
      <CardHeader>
        <CardTitle>{goalId ? "Edit Goal" : "Create New Goal"}</CardTitle>
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
              Goal Title *
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What do you want to achieve?"
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
              placeholder="Describe your goal in detail"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start_date" className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={
                  formData.start_date
                    ? formData.start_date.toISOString().split("T")[0]
                    : ""
                }
                onChange={handleDateChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-medium">
                Target End Date
              </label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={
                  formData.end_date
                    ? formData.end_date.toISOString().split("T")[0]
                    : ""
                }
                onChange={handleDateChange}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : goalId ? "Update Goal" : "Create Goal"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
