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

  async function handleDirectSearch() {
    setLoading(true);
    setError(null);
    try {
      // Direct database query using fetch to a server action
      const response = await fetch("/api/debug-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Debug search error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Debug Email Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter exact email to search"
              className="flex-1"
            />
            <Button onClick={handleDirectSearch} disabled={loading}>
              {loading ? "Searching..." : "Direct Search"}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
          )}

          {results && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Results:</h3>
              <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-60">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
