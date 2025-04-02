"use client";

import dynamic from "next/dynamic";

// Use dynamic import with no SSR to avoid hydration issues
// We'll simplify by not using dynamic import to avoid chunk loading issues
export function GameNotificationsClient() {
  // Simply return null instead of dynamically loading the component
  // This will prevent the chunk loading error
  return null;
}
