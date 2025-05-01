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

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define default plans since the 'plans' table doesn't exist yet
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

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Gamify Your Habits</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Turn your daily routines into exciting challenges with our
              gamified habit tracking system.
            </p>
          </div>

          <FeatureTabs />
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Try It Yourself</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience how our habit tracker works with this interactive demo.
            </p>
          </div>

          <HabitDemo />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-purple-100">Habits Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">87%</div>
              <div className="text-purple-100">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500K+</div>
              <div className="text-synthwave-neonPurple/80">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See how our app has helped people transform their habits and
              lives.
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your habit-building journey.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CtaSection />

      <Footer />
    </div>
  );
}
