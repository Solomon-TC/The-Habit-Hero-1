"use client";

import { useState } from "react";
import {
  Check,
  Trophy,
  Star,
  Calendar,
  Clock,
  Target,
  Award,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

type HabitType = "exercise" | "meditation" | "reading" | "water" | "sleep";

interface HabitOption {
  id: HabitType;
  name: string;
  icon: React.ReactNode;
  description: string;
  points: number;
  frequency: string;
}

const habitOptions: HabitOption[] = [
  {
    id: "exercise",
    name: "Exercise",
    icon: <Target className="w-5 h-5" />,
    description: "Stay active with regular workouts",
    points: 20,
    frequency: "Daily",
  },
  {
    id: "meditation",
    name: "Meditation",
    icon: <Clock className="w-5 h-5" />,
    description: "Practice mindfulness daily",
    points: 15,
    frequency: "Daily",
  },
  {
    id: "reading",
    name: "Reading",
    icon: <Calendar className="w-5 h-5" />,
    description: "Read for 30 minutes",
    points: 15,
    frequency: "Daily",
  },
  {
    id: "water",
    name: "Drink Water",
    icon: <Clock className="w-5 h-5" />,
    description: "Drink 8 glasses of water",
    points: 10,
    frequency: "Daily",
  },
  {
    id: "sleep",
    name: "Sleep Schedule",
    icon: <Clock className="w-5 h-5" />,
    description: "Sleep 7-8 hours",
    points: 25,
    frequency: "Daily",
  },
];

export default function HabitDemo() {
  const [step, setStep] = useState<number>(1);
  const [selectedHabit, setSelectedHabit] = useState<HabitType | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [showReward, setShowReward] = useState<boolean>(false);

  const handleSelectHabit = (habitId: HabitType) => {
    setSelectedHabit(habitId);
    setStep(2);
  };

  const handleComplete = () => {
    setCompleted(true);
    setTimeout(() => {
      setShowReward(true);
    }, 1000);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedHabit(null);
    setCompleted(false);
    setShowReward(false);
  };

  const selectedHabitDetails = selectedHabit
    ? habitOptions.find((h) => h.id === selectedHabit)
    : null;

  return (
    <div id="demo" className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h3 className="text-xl font-semibold mb-2">Interactive Habit Demo</h3>
          <p className="opacity-90">See how our gamified habit tracker works</p>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div>
              <h4 className="text-lg font-medium mb-4">
                Select a habit to track:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {habitOptions.map((habit) => (
                  <Card
                    key={habit.id}
                    className={`cursor-pointer hover:border-purple-300 transition-all ${selectedHabit === habit.id ? "border-purple-500 ring-2 ring-purple-200" : ""}`}
                    onClick={() => handleSelectHabit(habit.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="bg-purple-100 p-2 rounded-md text-purple-600">
                          {habit.icon}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {habit.frequency}
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">
                        {habit.name}
                      </CardTitle>
                      <CardDescription>{habit.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0">
                      <div className="flex items-center text-sm text-purple-600">
                        <Star className="w-4 h-4 mr-1" />
                        <span>{habit.points} points per completion</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedHabitDetails && (
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center"
              >
                ← Back to habits
              </button>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{selectedHabitDetails.name}</CardTitle>
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedHabitDetails.frequency}
                    </div>
                  </div>
                  <CardDescription>
                    {selectedHabitDetails.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Trophy className="w-5 h-5 text-purple-500 mr-2" />
                        <span>Reward</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-medium">
                          {selectedHabitDetails.points} points
                        </span>
                      </div>
                    </div>

                    {completed ? (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="bg-green-100 p-2 rounded-full">
                            <Check className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                        <h4 className="font-medium text-green-800">
                          Habit Completed!
                        </h4>
                        {showReward && (
                          <div className="mt-4 animate-fade-in">
                            <div className="text-center p-4 bg-purple-100 rounded-lg border border-purple-200 mb-4">
                              <div className="flex justify-center mb-2">
                                <Award className="w-8 h-8 text-purple-600" />
                              </div>
                              <h4 className="font-medium text-purple-800 mb-1">
                                Reward Earned!
                              </h4>
                              <p className="text-sm text-purple-700">
                                +{selectedHabitDetails.points} points added to
                                your account
                              </p>
                              <div className="mt-3 text-xs text-purple-600">
                                Keep it up to earn streak bonuses!
                              </div>
                            </div>
                            <Button
                              onClick={handleReset}
                              className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                              Try Another Habit
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={handleComplete}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
