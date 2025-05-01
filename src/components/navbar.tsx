"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Trophy, Menu, X, UserCircle } from "lucide-react";
import UserProfile from "./user-profile";

interface NavbarProps {
  user: any | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center">
          <Trophy className="h-6 w-6 text-purple-600 mr-2" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            HabitQuest
          </span>
        </Link>

        <div className="hidden md:flex space-x-6">
          <Link
            href="#demo"
            className="text-gray-600 hover:text-purple-600 font-medium"
          >
            Demo
          </Link>
          <Link
            href="#"
            className="text-gray-600 hover:text-purple-600 font-medium"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-gray-600 hover:text-purple-600 font-medium"
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="text-gray-600 hover:text-purple-600 font-medium"
          >
            Testimonials
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
