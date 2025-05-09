"use client";

import { useState } from "react";
import {
  Trophy,
  Flame,
  Award,
  Star,
  ChevronRight,
  ChevronLeft,
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
import { Button } from "@/components/ui/button";

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
  const [activeTab, setActiveTab] = useState("points");
  const [mobileView, setMobileView] = useState(false);

  // Find the current tab index
  const currentTabIndex = featureTabs.findIndex((tab) => tab.id === activeTab);

  // Navigate to previous tab
  const prevTab = () => {
    const newIndex =
      currentTabIndex > 0 ? currentTabIndex - 1 : featureTabs.length - 1;
    setActiveTab(featureTabs[newIndex].id);
  };

  // Navigate to next tab
  const nextTab = () => {
    const newIndex =
      currentTabIndex < featureTabs.length - 1 ? currentTabIndex + 1 : 0;
    setActiveTab(featureTabs[newIndex].id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4">
            {featureTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <span className="inline-flex">{tab.icon}</span>
                <span>{tab.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {featureTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <Card className="border-0 shadow-md bg-gradient-to-r from-white to-purple-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-synthwave-neonPurple/20 to-synthwave-neonBlue/20 text-synthwave-neonPurple rounded-lg">
                        {tab.icon}
                      </div>
                      <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-synthwave-neonPurple to-synthwave-neonBlue">
                        {tab.title}
                      </CardTitle>
                    </div>
                    {tab.badge && (
                      <Badge className="bg-synthwave-neonPurple hover:bg-synthwave-neonPurple/90">
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    {tab.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {tab.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm"
                      >
                        <div className="p-1 bg-synthwave-neonPurple/20 text-synthwave-neonPurple rounded-full flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-synthwave-neonPurple to-synthwave-neonBlue">
            {featureTabs[currentTabIndex].title}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTab}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextTab}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-md bg-gradient-to-r from-white to-purple-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-synthwave-neonPurple/20 to-synthwave-neonBlue/20 text-synthwave-neonPurple rounded-lg">
                  {featureTabs[currentTabIndex].icon}
                </div>
                {featureTabs[currentTabIndex].badge && (
                  <Badge className="bg-synthwave-neonPurple hover:bg-synthwave-neonPurple/90">
                    {featureTabs[currentTabIndex].badge}
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-base mt-2">
              {featureTabs[currentTabIndex].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {featureTabs[currentTabIndex].benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm"
                >
                  <div className="p-1 bg-synthwave-neonPurple/20 text-synthwave-neonPurple rounded-full flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dot indicators */}
        <div className="flex justify-center mt-4 gap-1">
          {featureTabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-2 rounded-full transition-all ${activeTab === tab.id ? "w-4 bg-synthwave-neonPurple" : "w-2 bg-gray-300"}`}
              aria-label={`Go to ${tab.title}`}
            />
          ))}
        </div>
      </div>
    </div>
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
