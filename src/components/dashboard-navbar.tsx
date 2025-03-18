"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Activity,
  Target,
  Users,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Habits",
      href: "/dashboard/habits",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      name: "Goals",
      href: "/dashboard/goals",
      icon: <Target className="h-5 w-5" />,
    },
    {
      name: "Friends",
      href: "/dashboard/friends",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Feedback",
      href: "/dashboard/feedback",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-3 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="text-xl font-bold text-purple-600">
            HabitQuest
          </Link>
          <div className="hidden md:flex gap-6 ml-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 text-gray-700 hover:text-purple-600 font-medium ${isActive ? "text-purple-600" : ""}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full"></span>
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5 text-gray-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 bg-purple-100"
              >
                <UserCircle className="h-5 w-5 text-purple-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md text-xs font-medium transition-colors ${isActive ? "text-purple-700" : "text-gray-700"}`}
              >
                {React.cloneElement(item.icon, {
                  className: `h-5 w-5 ${isActive ? "text-purple-600" : "text-gray-500"}`,
                })}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
