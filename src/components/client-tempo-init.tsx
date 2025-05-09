"use client";

import { TempoInit } from "./tempo-init";

export function ClientTempoInit() {
  // Add console log to verify this component is being mounted
  console.log("ClientTempoInit mounted");

  return (
    <>
      <TempoInit />
    </>
  );
}
