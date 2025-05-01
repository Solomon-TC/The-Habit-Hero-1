"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { debugSearchById } from "@/lib/debug-search";
import { Search } from "lucide-react";

export default function DebugSearchForm() {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    setError("");
    setResults(null);

    try {
      console.log("Starting debug search for ID:", searchInput);
      const result = await debugSearchById(searchInput.trim());
      setResults(result);
      console.log("Debug search complete:", result);
    } catch (err: any) {
      console.error("Debug search error:", err);
      setError(err.message || "An error occurred during search");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="w-full bg-white shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardTitle>Debug User ID Search</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter user ID to debug search"
            className="flex-1"
            required
          />
          <Button
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? "Searching..." : "Debug Search"}
          </Button>
        </form>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {results && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">RPC Function Results:</h3>
              <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                {JSON.stringify(results.rpcData, null, 2) || "No results"}
              </pre>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Direct Query Results:</h3>
              <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                {JSON.stringify(results.directData, null, 2) || "No results"}
              </pre>
            </div>

            {results.error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-red-700">Errors:</h3>
                <pre className="text-xs overflow-auto p-2 bg-red-100 rounded text-red-800">
                  {JSON.stringify(results.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
