"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <section className="py-20 bg-gradient-to-r from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Start Building Better Habits Today
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of users who have transformed their lives through
          gamified habit tracking.
        </p>

        <Card className="max-w-md mx-auto mb-8 border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Get Started Now</CardTitle>
            <CardDescription>
              Create your free account in seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="p-4 bg-green-50 rounded-lg text-green-800">
                <p className="font-medium">Thanks for signing up!</p>
                <p className="text-sm mt-1">Check your email for next steps.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2"
                >
                  {isSubmitting ? "Processing..." : "Get Started"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              Explore Dashboard
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
