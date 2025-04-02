"use client";

import { TempoInit } from "./tempo-init";
import { GameNotificationContainer } from "./game-notification";

export function ClientTempoInit() {
  return (
    <>
      <TempoInit />
      <GameNotificationContainer />
    </>
  );
}
