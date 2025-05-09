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
  Dumbbell,
  BookOpen,
  Droplets,
  Moon,
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
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

type HabitType = "exercise" | "meditation" | "reading" | "water" | "sleep";

interface HabitOption {
  id: HabitType;
  name: string;
  icon: React.ReactNode;
  description: string;
  points: number;
  frequency: string;
  color: string;
}

const habitOptions: HabitOption[] = [
  {
    id: "exercise",
    name: "Exercise",
    icon: <Dumbbell className="w-5 h-5" />,
    description: "Stay active with regular workouts",
    points: 20,
    frequency: "Daily",
    color: "purple",
  },
  {
    id: "meditation",
    name: "Meditation",
    icon: <Clock className="w-5 h-5" />,
    description: "Practice mindfulness daily",
    points: 15,
    frequency: "Daily",
    color: "blue",
  },
  {
    id: "reading",
    name: "Reading",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Read for 30 minutes",
    points: 15,
    frequency: "Daily",
    color: "green",
  },
  {
    id: "water",
    name: "Drink Water",
    icon: <Droplets className="w-5 h-5" />,
    description: "Drink 8 glasses of water",
    points: 10,
    frequency: "Daily",
    color: "cyan",
  },
  {
    id: "sleep",
    name: "Sleep Schedule",
    icon: <Moon className="w-5 h-5" />,
    description: "Sleep 7-8 hours",
    points: 25,
    frequency: "Daily",
    color: "indigo",
  },
];

export default function HabitDemo() {
  const [step, setStep] = useState<number>(1);
  const [selectedHabit, setSelectedHabit] = useState<HabitType | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleSelectHabit = (habitId: HabitType) => {
    setSelectedHabit(habitId);
    setStep(2);
  };

  const handleComplete = () => {
    setProgress(100);
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
    setProgress(0);
  };

  const selectedHabitDetails = selectedHabit
    ? habitOptions.find((h) => h.id === selectedHabit)
    : null;

  return (
    <div
      id="demo"
      className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
    >
      <div className="p-4 sm:p-6 bg-gradient-to-r from-synthwave-neonPink to-synthwave-neonBlue text-white">
        <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
          Interactive Habit Demo
        </h3>
        <p className="text-sm sm:text-base opacity-90">
          See how our gamified habit tracker works
        </p>
      </div>

      <div className="p-3 sm:p-4 md:p-6">
        {step === 1 && (
          <div>
            <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
              Select a habit to track:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {habitOptions.map((habit) => (
                <Card
                  key={habit.id}
                  className={`cursor-pointer hover:border-synthwave-neonPink/50 transition-all ${selectedHabit === habit.id ? "border-synthwave-neonPink ring-2 ring-synthwave-neonPink/30" : ""}`}
                  onClick={() => handleSelectHabit(habit.id)}
                >
                  <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                    <div className="flex justify-between items-start">
                      <div
                        className={`bg-${habit.color}-100 p-1.5 sm:p-2 rounded-md text-${habit.color}-500`}
                      >
                        {habit.icon}
                      </div>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {habit.frequency}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg mt-2">
                      {habit.name}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {habit.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="flex items-center text-xs sm:text-sm text-synthwave-neonPink">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span>{habit.points} points per completion</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedHabitDetails && (
          <div className="w-full max-w-md mx-auto">
            <button
              onClick={() => setStep(1)}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 mb-4 sm:mb-6 flex items-center"
            >
              ← Back to habits
            </button>

            <Card>
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-base sm:text-lg">
                    {selectedHabitDetails.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {selectedHabitDetails.frequency}
                  </Badge>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  {selectedHabitDetails.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span>Progress</span>
                    <span>{completed ? "1" : "0"} / 1</span>
                  </div>
                  <Progress value={progress} className="h-1.5 sm:h-2" />

                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-synthwave-neonPink mr-1.5 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Reward</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mr-1" />
                      <span className="text-xs sm:text-sm font-medium">
                        {selectedHabitDetails.points} points
                      </span>
                    </div>
                  </div>

                  {completed ? (
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-100 text-center">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="bg-green-100 p-1.5 sm:p-2 rounded-full">
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                      </div>
                      <h4 className="text-sm sm:text-base font-medium text-green-800">
                        Habit Completed!
                      </h4>
                      {showReward && (
                        <div className="mt-3 sm:mt-4 animate-fade-in">
                          <div className="text-center p-3 sm:p-4 bg-synthwave-neonPink/10 rounded-lg border border-synthwave-neonPink/30 mb-3 sm:mb-4">
                            <div className="flex justify-center mb-1.5 sm:mb-2">
                              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-synthwave-neonPink" />
                            </div>
                            <h4 className="text-sm sm:text-base font-medium text-synthwave-neonPink mb-0.5 sm:mb-1">
                              Reward Earned!
                            </h4>
                            <p className="text-xs sm:text-sm text-synthwave-neonPink/90">
                              +{selectedHabitDetails.points} points added to
                              your account
                            </p>
                            <div className="mt-2 sm:mt-3 text-xs text-synthwave-neonPink/80">
                              Keep it up to earn streak bonuses!
                            </div>
                          </div>
                          <Button
                            onClick={handleReset}
                            className="w-full bg-synthwave-neonPink hover:bg-synthwave-neonPink/80 shadow-lg shadow-synthwave-neonPink/20 text-xs sm:text-sm py-1.5 sm:py-2"
                          >
                            Try Another Habit
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={handleComplete}
                      className="w-full bg-synthwave-neonPink hover:bg-synthwave-neonPink/80 shadow-lg shadow-synthwave-neonPink/20 text-xs sm:text-sm py-1.5 sm:py-2"
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

        @media (max-width: 640px) {
          #demo .card-title {
            font-size: 1rem;
          }
          #demo .card-description {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
