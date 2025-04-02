"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export function DebugFriendsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleDebugFriends = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/debug-friends");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to debug friends");
      }

      setResult(data);
      setShowResult(true);
    } catch (err: any) {
      console.error("Error debugging friends:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleDebugFriends}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? "Checking..." : "Debug Friends Data"}
      </Button>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {showResult && result && (
        <div className="bg-gray-50 p-4 rounded-lg border text-sm font-mono overflow-auto max-h-96">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">Debug Results</h3>
            <button
              onClick={() => setShowResult(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
