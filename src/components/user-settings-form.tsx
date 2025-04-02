"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { showGameToast } from "./level-up-toast";

interface UserSettingsFormProps {
  initialData: any;
  userId: string;
}

export function UserSettingsForm({
  initialData,
  userId,
}: UserSettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialData?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createBrowserSupabaseClient();

      // Update the user's display name
      const { error } = await supabase
        .from("users")
        .update({ name: displayName, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      setSuccess("Settings updated successfully!");
      showGameToast({
        type: "milestone",
        title: "Settings Updated",
        xpGained: 0,
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (err: any) {
      console.error("Error updating settings:", err);
      setError(err.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="max-w-md"
            />
            <p className="text-sm text-gray-500">
              This name will be visible to your friends and on your dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
