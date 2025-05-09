import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, Trophy, Star } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-synthwave-neonPurple/5 via-white to-synthwave-neonBlue/5">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-synthwave-neonPink rounded-full opacity-5 blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-synthwave-neonBlue rounded-full opacity-5 blur-3xl"></div>

      <div className="relative py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center px-4 py-2 bg-synthwave-neonPurple/10 text-synthwave-neonPurple rounded-full mb-4">
                <Trophy className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">The Habit Hero</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Level Up Your Life with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-synthwave-neonPurple to-synthwave-neonBlue block mt-1">
                  Gamified Habits
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Transform daily routines into exciting quests. Earn points,
                unlock achievements, and build lasting habits through the power
                of gamification.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center px-6 py-3 text-white bg-synthwave-neonPurple rounded-lg hover:bg-synthwave-neonPurple/90 transition-colors text-base font-medium shadow-lg shadow-synthwave-neonPurple/20 w-full sm:w-auto justify-center"
                >
                  Start Your Journey
                  <ArrowUpRight className="ml-2 w-4 h-4" />
                </Link>

                <Link
                  href="#demo"
                  className="inline-flex items-center px-6 py-3 text-synthwave-neonPurple bg-synthwave-neonPurple/10 rounded-lg hover:bg-synthwave-neonPurple/20 transition-colors text-base font-medium w-full sm:w-auto justify-center"
                >
                  Try Demo
                </Link>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-synthwave-neonPurple" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-synthwave-neonPurple" />
                  <span>Free starter plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-synthwave-neonPurple" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-sm lg:max-w-md">
              <div className="relative z-10 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-synthwave-neonPurple to-synthwave-neonBlue h-1" />
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-base font-semibold">
                        Daily Progress
                      </h3>
                      <p className="text-xs text-gray-500">
                        You're on a 5-day streak! 🔥
                      </p>
                    </div>
                    <div className="bg-synthwave-neonPurple/10 text-synthwave-neonPurple px-3 py-1 rounded-full text-xs font-medium">
                      Level 7
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center">
                        <div className="bg-green-500 p-1.5 rounded-md text-white mr-2">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm">
                          Morning Meditation
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-xs font-medium">+10 pts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center">
                        <div className="bg-green-500 p-1.5 rounded-md text-white mr-2">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm">
                          Read 30 minutes
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-xs font-medium">+15 pts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="bg-gray-200 p-1.5 rounded-md text-gray-500 mr-2">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm">
                          Evening Workout
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-gray-300 mr-1" />
                        <span className="text-xs font-medium text-gray-500">
                          +20 pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-synthwave-neonPurple/5 p-3 rounded-lg border border-synthwave-neonPurple/20">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-synthwave-neonPurple">
                        Progress to next badge
                      </span>
                      <span className="text-xs font-medium text-synthwave-neonPurple">
                        75%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-synthwave-neonPink h-2 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-synthwave-neonPink rounded-full opacity-20 blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-synthwave-neonBlue rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
