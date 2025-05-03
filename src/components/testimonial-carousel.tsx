"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

export default function TestimonialCarousel() {
  return (
    <Carousel className="w-full max-w-4xl mx-auto">
      <CarouselContent>
        {testimonials.map((testimonial) => (
          <CarouselItem key={testimonial.id}>
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-synthwave-neonPurple/10 p-8 relative">
              <div className="absolute top-4 left-4 text-purple-300">
                <Quote className="w-12 h-12 opacity-30" />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 relative rounded-full overflow-hidden border-4 border-synthwave-neonPurple/20 flex-shrink-0">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex mb-2">
                      {[...Array(testimonial.stars)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                      {[...Array(5 - testimonial.stars)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gray-200" />
                      ))}
                    </div>

                    <blockquote className="text-lg text-gray-700 italic mb-4">
                      "{testimonial.quote}"
                    </blockquote>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {testimonial.role}
                        </div>
                      </div>

                      <Badge variant="purple" className="mt-2 sm:mt-0">
                        {testimonial.achievement}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex justify-center mt-4 gap-2">
        <CarouselPrevious className="static translate-y-0 translate-x-0" />
        <CarouselNext className="static translate-y-0 translate-x-0" />
      </div>
    </Carousel>
  );
}
