import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, Trophy, Star } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full mb-6">
                <Trophy className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  Gamified Habit Tracking
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
                Make Habits
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 block">
                  Fun & Rewarding
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Transform your daily routines into exciting quests. Earn points,
                unlock achievements, and level up your life with our gamified
                habit tracker.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center px-8 py-4 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
                >
                  Start Your Journey
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>

                <Link
                  href="#demo"
                  className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
                >
                  Try Demo
                </Link>
              </div>

              <div className="mt-16 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Free starter plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
              <div className="relative z-10 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2" />
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Daily Progress</h3>
                      <p className="text-sm text-gray-500">
                        You're on a 5-day streak! 🔥
                      </p>
                    </div>
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      Level 7
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center">
                        <div className="bg-green-500 p-2 rounded-md text-white mr-3">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Morning Meditation</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">+10 pts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center">
                        <div className="bg-green-500 p-2 rounded-md text-white mr-3">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Read 30 minutes</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">+15 pts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="bg-gray-200 p-2 rounded-md text-gray-500 mr-3">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Evening Workout</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-gray-300 mr-1" />
                        <span className="text-sm font-medium text-gray-500">
                          +20 pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-purple-800">
                        Progress to next badge
                      </span>
                      <span className="text-sm font-medium text-purple-800">
                        75%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-synthwave-neonPink h-2.5 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-300 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
