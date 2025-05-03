"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X, UserCircle, Sword } from "lucide-react";
import UserProfile from "./user-profile";

interface NavbarProps {
  user: any | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center">
          <Sword className="h-6 w-6 text-synthwave-neonPurple mr-2" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-synthwave-neonPurple to-synthwave-neonBlue">
            The Habit Hero
          </span>
        </Link>

        <div className="hidden md:flex space-x-6">
          <Link
            href="#demo"
            className="text-gray-600 hover:text-synthwave-neonPurple font-medium"
          >
            Demo
          </Link>
          <Link
            href="#"
            className="text-gray-600 hover:text-synthwave-neonPurple font-medium"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-gray-600 hover:text-synthwave-neonPurple font-medium"
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="text-gray-600 hover:text-synthwave-neonPurple font-medium"
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
                <Button className="bg-synthwave-neonPurple hover:bg-synthwave-neonPurple/90">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-synthwave-neonPurple"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-synthwave-neonPurple rounded-md hover:bg-synthwave-neonPurple/90"
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
