"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DebugFriends() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // This component is now a placeholder for the new friend system
  // The old debug friends functionality has been removed

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug Friends Data (Deprecated)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-gray-100 rounded-md text-center">
          <p>
            This debug functionality has been replaced by the new friend system.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
