"use client";

import {
  Trophy,
  Flame,
  Award,
  Star,
  Target,
  Clock,
  Calendar,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeatureTab {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  benefits: string[];
  badge?: string;
}

const featureTabs: FeatureTab[] = [
  {
    id: "points",
    title: "Points & Rewards",
    icon: <Trophy className="w-6 h-6" />,
    description:
      "Earn points for every completed habit and unlock exciting rewards",
    benefits: [
      "Instant gratification for completing tasks",
      "Redeem points for custom rewards",
      "Bonus points for consistency",
      "Weekly point summaries",
    ],
    badge: "Popular",
  },
  {
    id: "streaks",
    title: "Streaks & Combos",
    icon: <Flame className="w-6 h-6" />,
    description:
      "Build streaks and maintain your momentum with visual progress",
    benefits: [
      "Visual streak counters",
      "Combo multipliers for consecutive days",
      "Streak protection features",
      "Historical streak data",
    ],
  },
  {
    id: "badges",
    title: "Badges & Achievements",
    icon: <Award className="w-6 h-6" />,
    description: "Collect badges for milestones and special accomplishments",
    benefits: [
      "Unlock achievement badges",
      "Special milestone celebrations",
      "Shareable accomplishments",
      "Rare and exclusive badges",
    ],
  },
  {
    id: "leaderboards",
    title: "Leaderboards",
    icon: <Star className="w-6 h-6" />,
    description:
      "Compete with friends and climb the ranks for extra motivation",
    benefits: [
      "Weekly and monthly competitions",
      "Friend challenges",
      "Global and local leaderboards",
      "Custom competition categories",
    ],
  },
];

export default function FeatureTabs() {
  return (
    <Tabs defaultValue="points" className="w-full max-w-4xl mx-auto">
      <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-8">
        {featureTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2"
          >
            <span className="hidden md:inline-flex">{tab.icon}</span>
            <span>{tab.title}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {featureTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    {tab.icon}
                  </div>
                  <CardTitle className="text-2xl">{tab.title}</CardTitle>
                </div>
                {tab.badge && <Badge variant="purple">{tab.badge}</Badge>}
              </div>
              <CardDescription className="text-base mt-2">
                {tab.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tab.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="p-1 bg-green-100 text-green-600 rounded-full">
                      <Check className="w-4 h-4" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
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
