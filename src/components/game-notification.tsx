"use client";

import { useEffect, useState } from "react";
import { Star, Check, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "habit" | "milestone" | "goal" | "level";

export interface GameNotificationProps {
  type: NotificationType;
  title: string;
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
  onClose?: () => void;
}

interface NotificationState extends GameNotificationProps {
  id: string;
  visible: boolean;
}

// Global notification queue
let notifications: NotificationState[] = [];
let listeners: (() => void)[] = [];

// Function to add a notification
export function showGameNotification(props: GameNotificationProps) {
  const id = Math.random().toString(36).substring(2, 9);
  const notification = {
    ...props,
    id,
    visible: true,
  };

  notifications = [...notifications, notification];
  notifyListeners();

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeNotification(id);
  }, 5000);

  return id;
}

// Function to remove a notification
export function removeNotification(id: string) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, visible: false } : n,
  );
  notifyListeners();

  // Remove from array after animation completes
  setTimeout(() => {
    notifications = notifications.filter((n) => n.id !== id);
    notifyListeners();
  }, 300);
}

// Function to notify all listeners
function notifyListeners() {
  listeners.forEach((listener) => listener());
}

// Individual notification item
function GameNotificationItem({
  id,
  type,
  title,
  xpGained = 0,
  leveledUp = false,
  newLevel = 1,
  visible,
}: NotificationState) {
  // Define icon and colors based on type
  let icon;
  let bgColor = "bg-green-100 border-green-300";
  let textColor = "text-green-800";

  switch (type) {
    case "habit":
      icon = <Check className="h-5 w-5 text-green-500" />;
      bgColor = "bg-green-100 border-green-300";
      textColor = "text-green-800";
      break;
    case "milestone":
      icon = <Star className="h-5 w-5 text-blue-500" />;
      bgColor = "bg-blue-100 border-blue-300";
      textColor = "text-blue-800";
      break;
    case "goal":
      icon = <Trophy className="h-5 w-5 text-purple-500" />;
      bgColor = "bg-purple-100 border-purple-300";
      textColor = "text-purple-800";
      break;
    case "level":
      icon = <TrendingUp className="h-5 w-5 text-amber-500" />;
      bgColor = "bg-amber-100 border-amber-300";
      textColor = "text-amber-800";
      break;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 shadow-lg p-4 mb-2 w-72 transform transition-all duration-300",
        bgColor,
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      {/* Close button */}
      <button
        onClick={() => removeNotification(id)}
        className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-white/50">{icon}</div>
        <h3 className={`font-bold ${textColor}`}>{title}</h3>
      </div>

      {/* Content */}
      <div className="pl-9">
        {xpGained > 0 && (
          <div className="flex items-center gap-1">
            <div className="text-amber-500 font-bold">+{xpGained} XP</div>
            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
        )}

        {leveledUp && (
          <div className="mt-1 font-bold text-amber-600 animate-pulse">
            Level Up! You reached level {newLevel}!
          </div>
        )}
      </div>

      {/* Progress bar animation */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
        <div
          className="h-full bg-white/60 animate-shrink"
          style={{
            animation: "shrink 5s linear forwards",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// Container component that renders all notifications
export function GameNotificationContainer() {
  const [, setForceUpdate] = useState({});

  useEffect(() => {
    // Subscribe to notification changes
    const listener = () => setForceUpdate({});
    listeners.push(listener);

    return () => {
      // Unsubscribe on unmount
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {notifications.map((notification) => (
          <GameNotificationItem key={notification.id} {...notification} />
        ))}
      </div>
    </div>
  );
}
