"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { HabitWithProgress } from "@/types/habit";
import HabitCard from "./habit-card";
import HabitForm from "./habit-form";
import { Icon } from "./icons";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface HabitListProps {
  habits: HabitWithProgress[];
  userId: string;
}

export default function HabitList({ habits, userId }: HabitListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "streak" | "name">(
    "newest",
  );
  const [filterBy, setFilterBy] = useState<"all" | "completed" | "incomplete">(
    "all",
  );

  // Filter and sort habits
  const filteredHabits = habits
    .filter((habit) => {
      // Apply search filter
      const matchesSearch = habit.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Apply completion filter
      const matchesCompletion =
        filterBy === "all" ||
        (filterBy === "completed" && habit.isCompleted) ||
        (filterBy === "incomplete" && !habit.isCompleted);

      return matchesSearch && matchesCompletion;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "streak":
          return b.streak - a.streak;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Your Habits</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Icon name="add" className="mr-2 h-4 w-4" /> Add New Habit
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
          />
          <Input
            placeholder="Search habits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filterBy}
            onValueChange={(value: any) => setFilterBy(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="streak">Highest Streak</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Habits grid */}
      {filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} userId={userId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Icon name="info" className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterBy !== "all"
              ? "No matching habits found"
              : "No habits yet"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm || filterBy !== "all"
              ? "Try adjusting your search or filters"
              : "Start tracking your habits to build consistency and achieve your goals."}
          </p>
          {!searchTerm && filterBy === "all" && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Icon name="add" className="mr-2 h-4 w-4" /> Create Your First
              Habit
            </Button>
          )}
        </div>
      )}

      {/* Add Habit Form Dialog */}
      <HabitForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        userId={userId}
        mode="create"
      />
    </div>
  );
}
