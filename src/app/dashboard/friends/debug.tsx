"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DebugSearch() {
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This component is now a placeholder for the new friend system
  // The old debug search functionality has been removed

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Debug Email Search (Deprecated)</CardTitle>
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
