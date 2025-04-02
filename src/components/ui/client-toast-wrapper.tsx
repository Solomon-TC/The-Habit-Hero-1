"use client";

import { useEffect } from "react";
import { showGameToast } from "@/components/level-up-toast";

interface ClientToastWrapperProps {
  type: "habit" | "milestone" | "goal" | "level";
  title: string;
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
  showToast: boolean;
}

export function ClientToastWrapper({
  type,
  title,
  xpGained = 0,
  leveledUp = false,
  newLevel = 1,
  showToast = false,
}: ClientToastWrapperProps) {
  useEffect(() => {
    if (showToast) {
      showGameToast({
        type,
        title,
        xpGained,
        leveledUp,
        newLevel,
      });
    }
  }, [showToast, type, title, xpGained, leveledUp, newLevel]);

  return null;
}
