import * as React from "react";
import Link from "next/link";
import { Goal } from "@/types/goal";
import GoalCard from "./goal-card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface GoalListProps {
  goals: Goal[];
  userId: string;
}

export default function GoalList({ goals, userId }: GoalListProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Goals</h2>
        <Link href="/dashboard/goals/new">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus size={18} className="mr-2" />
            Add Goal
          </Button>
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first goal to start tracking your progress
          </p>
          <Link href="/dashboard/goals/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus size={18} className="mr-2" />
              Create Your First Goal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
