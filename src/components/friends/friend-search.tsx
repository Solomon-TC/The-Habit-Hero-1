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

export default function FriendSearch() {
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Find Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSearch} className="flex gap-2 mb-4">
          <Input
            name="query"
            placeholder="Enter user ID"
            className="flex-1"
            required
          />
          <input type="hidden" name="searchType" value="id" />
          <Button type="submit" disabled={isSearching}>
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
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-purple-200">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={displayName} />
                    ) : (
                      <AvatarFallback className="bg-purple-100">
                        <UserCircle className="h-5 w-5 text-purple-600" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={
                    requestState === "sending" || requestState === "sent"
                  }
                  variant={requestState === "sent" ? "outline" : "default"}
                  size="sm"
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
