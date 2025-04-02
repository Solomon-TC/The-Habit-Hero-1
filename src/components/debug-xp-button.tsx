"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DebugXPButton() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleDebugXP() {
    setLoading(true);
    try {
      const response = await fetch("/api/debug-xp");
      const data = await response.json();
      console.log("Debug XP response:", data);
      setResults(data);
    } catch (error) {
      console.error("Error debugging XP:", error);
      setResults({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug XP System</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={handleDebugXP} disabled={loading}>
            {loading ? "Testing..." : "Test XP System"}
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch("/api/debug-xp-direct");
                const data = await response.json();
                console.log("Direct debug XP response:", data);
                setResults(data);
              } catch (error) {
                console.error("Error with direct XP debug:", error);
                setResults({ error: String(error) });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Testing..." : "Direct XP Test"}
          </Button>
        </div>

        {results && (
          <div className="p-4 bg-gray-50 rounded-md overflow-auto">
            <h3 className="font-medium mb-2">Results:</h3>
            <pre className="whitespace-pre-wrap text-xs max-h-96 overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
