"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  searchUsersAction,
  sendFriendRequestAction,
} from "@/app/actions/friends";
import { Search, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";

type User = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  level?: number | null;
};

export default function IdSearchForm() {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>(
    {},
  );

  const handleSearch = async (formData: FormData) => {
    setIsSearching(true);
    setSearchError("");
    try {
      const { users } = await searchUsersAction(formData);
      setSearchResults(users);
      if (users.length === 0) {
        setSearchError("No users found with that ID");
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("An error occurred while searching");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setRequestStatus((prev) => ({ ...prev, [userId]: "sending" }));
    try {
      const formData = new FormData();
      formData.append("receiverId", userId);
      const result = await sendFriendRequestAction(formData);

      if (result.success) {
        setRequestStatus((prev) => ({ ...prev, [userId]: "sent" }));
      } else {
        setRequestStatus((prev) => ({
          ...prev,
          [userId]: `error: ${result.error}`,
        }));
      }
    } catch (error) {
      console.error("Send request error:", error);
      setRequestStatus((prev) => ({ ...prev, [userId]: "error" }));
    }
  };

  return (
    <Card className="w-full bg-white shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardTitle>Find Users by ID</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form action={handleSearch} className="flex gap-2 mb-4">
          <Input
            name="query"
            placeholder="Enter exact user ID (UUID format)"
            className="flex-1"
            required
            title="Please enter a valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)"
          />
          <input type="hidden" name="searchType" value="id" />
          <Button
            type="submit"
            disabled={isSearching}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>

        {searchError && (
          <p className="text-red-500 text-sm mb-4">{searchError}</p>
        )}

        <div className="space-y-4">
          {searchResults.map((user) => {
            const displayName =
              user.full_name ||
              user.name ||
              user.email?.split("@")[0] ||
              "User";
            const requestState = requestStatus[user.id];

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-purple-200">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={displayName} />
                    ) : (
                      <AvatarFallback className="bg-purple-100">
                        <UserCircle className="h-6 w-6 text-purple-600" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-800">{displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-purple-600">
                      {user.level ? `Level ${user.level}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={
                    requestState === "sending" || requestState === "sent"
                  }
                  variant={requestState === "sent" ? "outline" : "default"}
                  size="sm"
                  className={
                    requestState === "sent"
                      ? "border-green-500 text-green-600"
                      : "bg-purple-600 hover:bg-purple-700"
                  }
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {requestState === "sending"
                    ? "Sending..."
                    : requestState === "sent"
                      ? "Request Sent"
                      : requestState?.startsWith("error")
                        ? "Failed"
                        : "Add Friend"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
