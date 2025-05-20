import Hero from "@/components/hero";
import NavbarWrapper from "./navbar-wrapper";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  CheckCircle2,
  Zap,
  Trophy,
  Star,
  Flame,
  Award,
  Target,
  ArrowUpRight,
} from "lucide-react";
import HabitDemo from "@/components/habit-demo";
import FeatureTabs from "@/components/feature-tabs";
import TestimonialCarousel from "@/components/testimonial-carousel";
import CtaSection from "@/components/cta-section";

// Import dynamic config to prevent static optimization
import "./config";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) || { data: { user: null } };

  // Define default plans
  // Ensure we have a fallback if supabase is null
  if (!supabase) {
    console.log("Supabase client is null, using default data");
  }

  const plans = [
    {
      id: "price_basic",
      name: "Basic",
      amount: 0,
      interval: "month",
      popular: false,
      features: ["Track up to 5 habits", "Basic statistics", "7-day streaks"],
    },
    {
      id: "price_premium",
      name: "Premium",
      amount: 999,
      interval: "month",
      popular: true,
      features: [
        "Unlimited habits",
        "Advanced analytics",
        "Unlimited streaks",
        "Priority support",
      ],
    },
    {
      id: "price_pro",
      name: "Pro",
      amount: 1999,
      interval: "month",
      popular: false,
      features: [
        "Everything in Premium",
        "Team challenges",
        "API access",
        "Custom badges",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <NavbarWrapper />
      <Hero />

      {/* Main Content with Side-by-Side Layout */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Features */}
            <section id="features" className="order-2 lg:order-1">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-3 text-synthwave-neonPurple">
                  Gamify Your Habits
                </h2>
                <p className="text-gray-600 mb-6">
                  Turn your daily routines into exciting challenges with our
                  gamified habit tracking system.
                </p>
                <FeatureTabs />
              </div>

              {/* Stats Section Integrated */}
              <div className="bg-gradient-to-r from-synthwave-neonPurple to-synthwave-highlight text-white p-6 rounded-xl my-8">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold mb-1">10M+</div>
                    <div className="text-white text-sm">Habits Tracked</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-1">87%</div>
                    <div className="text-white text-sm">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-1">500K+</div>
                    <div className="text-white text-sm">Happy Users</div>
                  </div>
                </div>
              </div>

              {/* Testimonials Section */}
              <div className="my-8">
                <h2 className="text-2xl font-bold mb-3 text-synthwave-neonPurple">
                  Success Stories
                </h2>
                <p className="text-gray-600 mb-6">
                  See how our app has helped people transform their habits and
                  lives.
                </p>
                <TestimonialCarousel />
              </div>
            </section>

            {/* Right Column - Demo and Pricing */}
            <section className="order-1 lg:order-2">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-3 text-synthwave-neonPurple">
                  Try It Yourself
                </h2>
                <p className="text-gray-600 mb-6">
                  Experience how our habit tracker works with this interactive
                  demo.
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl">
                  <HabitDemo />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="my-8" id="pricing">
                <h2 className="text-2xl font-bold mb-3 text-synthwave-neonPurple">
                  Simple, Transparent Pricing
                </h2>
                <p className="text-gray-600 mb-6">
                  Choose the perfect plan for your habit-building journey.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {plans?.map((item: any) => (
                    <PricingCard key={item.id} item={item} user={user} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <CtaSection />

      <Footer />
    </div>
  );
}
