"use client";

import { TempoInit } from "./tempo-init";
import { GameNotificationContainer } from "./game-notification";

export function ClientTempoInit() {
  // Add console log to verify this component is being mounted
  console.log(
    "ClientTempoInit mounted - GameNotificationContainer should be active",
  );

  return (
    <>
      <TempoInit />
      <GameNotificationContainer />
    </>
  );
}
