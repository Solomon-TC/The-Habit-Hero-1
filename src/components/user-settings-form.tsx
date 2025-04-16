"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { showGameToast } from "./level-up-toast";
import Image from "next/image";
import { UserCircle } from "lucide-react";

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
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Set initial avatar URL from database
    if (initialData?.avatar_url) {
      setPreviewUrl(initialData.avatar_url);
      setAvatarUrl(initialData.avatar_url);
    }
    // Always set display name from initialData
    if (initialData?.name) {
      setDisplayName(initialData.name);
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB");
      return;
    }

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();

      // Check if supabase client was created successfully
      if (!supabase) {
        throw new Error("Supabase client initialization failed");
      }

      // Upload the file to Supabase Storage
      const fileName = `${userId}-${Date.now()}`;
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.log("Upload error details:", JSON.stringify(uploadError));
        throw new Error(
          `Upload failed: ${uploadError.message || "Unknown error"}`,
        );
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get public URL for uploaded image");
      }

      setAvatarUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Error uploading image:", err);
      // Log more detailed error information
      console.log("Error type:", typeof err);
      console.log("Error stringified:", JSON.stringify(err, null, 2));
      console.log("Error properties:", Object.keys(err));

      // Provide a more descriptive error message
      let errorMessage = "Failed to upload image";
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(`${errorMessage}. Please try again or use a different image.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createBrowserSupabaseClient();

      // Update the user's profile data
      const { error } = await supabase
        .from("users")
        .update({
          name: displayName,
          full_name: displayName, // Ensure both fields are updated for consistency
          avatar_url: avatarUrl, // Add the avatar URL to the update
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // Also update the user metadata in auth
      await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
          full_name: displayName,
          name: displayName,
        },
      });

      // Force refresh of user data in real-time
      await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      // Show success message
      setSuccess(
        "Settings updated successfully! Your profile has been updated.",
      );

      // Show game toast notification
      showGameToast({
        type: "milestone",
        title: "Settings Updated",
        xpGained: 0,
      });

      // Force refresh to show updated profile immediately across all components
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
          {/* Profile Picture Upload */}
          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile picture"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserCircle className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="max-w-xs"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500">
                  Upload a profile picture (max 2MB).
                </p>
                {isUploading && (
                  <p className="text-xs text-amber-600">Uploading image...</p>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
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
            disabled={isLoading || isUploading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
