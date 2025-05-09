"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HabitCompleteButton } from "@/components/habit-complete-button";
import { useState } from "react";

interface HabitWithProgress {
  id: string;
  name: string;
  target_count: number;
  progress: number;
  streak: number;
  isCompleted: boolean;
}

interface ClientHabitCardProps {
  habit: HabitWithProgress;
  userId: string;
}

export function ClientHabitCard({ habit, userId }: ClientHabitCardProps) {
  const [localProgress, setLocalProgress] = useState(habit.progress);
  const [localIsCompleted, setLocalIsCompleted] = useState(habit.isCompleted);

  const handleComplete = () => {
    setLocalProgress(Math.min(localProgress + 1, habit.target_count));
    if (localProgress + 1 >= habit.target_count) {
      setLocalIsCompleted(true);
    }
  };

  return (
    <Card
      key={habit.id}
      className="overflow-hidden hover:border-purple-200 transition-all"
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="text-base font-medium">{habit.name}</div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${localIsCompleted ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}`}
          >
            {localIsCompleted ? "Completed" : "In Progress"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>
            {localProgress} / {habit.target_count}
          </span>
        </div>
        <Progress
          value={(localProgress / habit.target_count) * 100}
          className="h-2 bg-gray-200"
        />
        <div className="flex justify-between mt-3">
          <Link href={`/dashboard/habits?edit=${habit.id}`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <HabitCompleteButton
            habitId={habit.id}
            userId={userId}
            isCompleted={localIsCompleted}
            onComplete={handleComplete}
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">
              Streak: {habit.streak}
            </span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Flame(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
