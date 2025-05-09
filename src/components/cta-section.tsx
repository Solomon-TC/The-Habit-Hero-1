"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CtaSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail("");
    }, 1000);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-synthwave-neonPurple/5 to-synthwave-neonBlue/5 z-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-synthwave-neonPurple/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-synthwave-neonBlue/20 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
          {/* Left side - Text content */}
          <div className="lg:w-1/2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-synthwave-neonPurple/10 text-synthwave-neonPurple text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Join 500K+ happy users</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-synthwave-neonPurple to-synthwave-neonBlue">
              Start Building Better Habits Today
            </h2>

            <p className="text-gray-600 mb-6 text-lg">
              Transform your daily routines into exciting challenges and see
              real results with our gamified habit tracking system.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-green-100">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span>Free 14-day trial, no credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-green-100">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span>Track unlimited habits with Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-green-100">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span>Cancel anytime, hassle-free</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-synthwave-neonPurple hover:bg-synthwave-neonPurple/90 shadow-lg shadow-synthwave-neonPurple/20"
              >
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-synthwave-neonPurple text-synthwave-neonPurple hover:bg-synthwave-neonPurple/10"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>

          {/* Right side - Sign up card */}
          <div className="lg:w-5/12">
            <Card className="border-0 shadow-xl bg-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-synthwave-neonPink/20 to-synthwave-neonPurple/20 rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-synthwave-neonBlue/20 to-transparent rounded-tr-full"></div>

              <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-synthwave-neonPurple" />
                  <span className="text-sm font-medium text-synthwave-neonPurple">
                    Exclusive Offer
                  </span>
                </div>
                <CardTitle className="text-2xl">Get Started Now</CardTitle>
                <CardDescription className="text-base">
                  Create your free account in seconds
                </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10">
                {isSubmitted ? (
                  <div className="p-6 bg-green-50 rounded-lg text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-green-800 text-lg">
                      Thanks for signing up!
                    </p>
                    <p className="text-green-700 mt-1">
                      Check your email for next steps.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synthwave-neonPurple/50 focus:border-synthwave-neonPurple"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-gradient-to-r from-synthwave-neonPurple to-synthwave-neonBlue hover:opacity-90 shadow-lg shadow-synthwave-neonPurple/20"
                    >
                      {isSubmitting ? "Processing..." : "Create Free Account"}
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-3">
                      By signing up, you agree to our Terms of Service and
                      Privacy Policy
                    </p>
                  </form>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Zap className="w-4 h-4 text-synthwave-neonPurple" />
                    <span>Join 500K+ users building better habits</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check(props: React.SVGProps<SVGSVGElement>) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
