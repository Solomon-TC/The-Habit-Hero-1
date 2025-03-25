"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFriends } from "@/lib/friends";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function DebugFriends() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleDebug() {
    setLoading(true);
    try {
      // Direct call to getFriends
      const friendsResult = await getFriends();

      // Get raw data from Supabase for debugging
      let rawData: any = { error: "No data available" };
      try {
        const supabase = createBrowserSupabaseClient();
        if (!supabase) {
          rawData = { error: "Failed to create Supabase client" };
        } else {
          try {
            const { data: currentUser } = await supabase.auth.getUser();
            const userId = currentUser?.user?.id;

            if (userId) {
              const { data: friendsRaw, error: friendsError } = await supabase
                .from("friends")
                .select("*")
                .eq("user_id", userId);

              const { data: usersRaw, error: usersError } = await supabase
                .from("users")
                .select("id, name, email")
                .limit(5);

              rawData = {
                userId,
                friendsTable: friendsRaw || [],
                friendsError: friendsError?.message,
                usersTable: usersRaw || [],
                usersError: usersError?.message,
              };
            } else {
              rawData = { error: "No authenticated user found" };
            }
          } catch (authError) {
            console.error("Auth error:", authError);
            rawData = { error: `Auth error: ${String(authError)}` };
          }
        }
      } catch (error) {
        console.error("Error getting raw data:", error);
        rawData = { error: String(error) };
      }

      setResults({
        friendsResult,
        rawData,
      });
    } catch (error) {
      console.error("Debug error:", error);
      setResults({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug Friends Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleDebug} disabled={loading} className="mb-4">
          {loading ? "Loading..." : "Debug Friends Data"}
        </Button>

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
