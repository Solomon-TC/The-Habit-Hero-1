"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DEFAULT_HABIT_COLORS,
  DEFAULT_HABIT_ICONS,
  Habit,
} from "@/types/habit";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  habit?: Habit;
  mode: "create" | "edit";
}

export default function HabitForm({
  open,
  onOpenChange,
  userId,
  habit,
  mode,
}: HabitFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Habit>>({
    name: habit?.name || "",
    description: habit?.description || "",
    target_count: habit?.target_count || 1,
    frequency: habit?.frequency || "daily",
    color: habit?.color || "purple",
    icon: habit?.icon || "activity",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 1 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();

      if (mode === "create") {
        const { data: result, error } = await supabase
          .from("habits")
          .insert({
            ...formData,
            user_id: userId,
            streak: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error || !result) {
          console.error("Error creating habit:", error);
          throw new Error("Failed to create habit");
        }
      } else if (mode === "edit" && habit) {
        const { data: result, error } = await supabase
          .from("habits")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", habit.id)
          .select()
          .single();

        if (error || !result) {
          console.error("Error updating habit:", error);
          throw new Error("Failed to update habit");
        }
      }

      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving habit:", error);
      alert("There was an error saving your habit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the icon component based on the selected icon name
  const IconComponent = formData.icon
    ? Icons[formData.icon as keyof typeof Icons]
    : Icons.activity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create a new habit" : "Edit habit"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new habit to track in your dashboard."
              : "Update your habit details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Habit Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Morning Meditation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="e.g., 10 minutes of mindfulness meditation"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_count">Daily Target</Label>
                <Input
                  id="target_count"
                  name="target_count"
                  type="number"
                  min={1}
                  value={formData.target_count}
                  onChange={handleNumberChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    handleSelectChange("frequency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {Object.keys(Icons).map((iconName) => {
                  if (DEFAULT_HABIT_ICONS.includes(iconName)) {
                    const Icon = Icons[iconName as keyof typeof Icons];
                    return (
                      <Button
                        key={iconName}
                        type="button"
                        variant={
                          formData.icon === iconName ? "default" : "outline"
                        }
                        className="h-10 p-2"
                        onClick={() => handleSelectChange("icon", iconName)}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_HABIT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full bg-${color}-500 ${formData.color === color ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                    onClick={() => handleSelectChange("color", color)}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                  ? "Create Habit"
                  : "Update Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
