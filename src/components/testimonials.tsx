"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  achievement: string;
  stars: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Fitness Enthusiast",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    quote:
      "This app completely transformed my workout routine. The gamification elements keep me motivated, and I've maintained a 60-day streak so far!",
    achievement: "Lost 15 pounds in 3 months",
    stars: 5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Software Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
    quote:
      "As someone who struggles with consistency, the rewards system has been a game-changer. I've finally established a solid reading habit.",
    achievement: "Read 12 books in 6 months",
    stars: 5,
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    quote:
      "The badges and achievements make building habits feel like a fun game instead of a chore. I'm much more productive with my study schedule now.",
    achievement: "Improved GPA from 3.2 to 3.8",
    stars: 4,
  },
  {
    id: 4,
    name: "David Wilson",
    role: "Marketing Manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    quote:
      "Competing with friends on the leaderboard adds an extra layer of motivation. We push each other to stay consistent with our habits.",
    achievement: "Maintained meditation streak for 90 days",
    stars: 5,
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-8">
        <div className="absolute top-4 left-4 text-purple-300">
          <Quote className="w-12 h-12 opacity-30" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 relative rounded-full overflow-hidden border-4 border-purple-100 flex-shrink-0">
              <Image
                src={testimonials[activeIndex].avatar}
                alt={testimonials[activeIndex].name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex mb-2">
                {[...Array(testimonials[activeIndex].stars)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
                {[...Array(5 - testimonials[activeIndex].stars)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-200" />
                ))}
              </div>

              <blockquote className="text-lg text-gray-700 italic mb-4">
                "{testimonials[activeIndex].quote}"
              </blockquote>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonials[activeIndex].name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonials[activeIndex].role}
                  </div>
                </div>

                <div className="mt-2 sm:mt-0 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {testimonials[activeIndex].achievement}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex space-x-2">
          <button
            onClick={prevTestimonial}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={nextTestimonial}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${index === activeIndex ? "bg-synthwave-neonPink" : "bg-gray-300"}`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
