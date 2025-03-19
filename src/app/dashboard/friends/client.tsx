"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search } from "lucide-react";
import {
  searchUsersAction,
  sendFriendRequestAction,
} from "@/app/actions/friends";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export function FriendSearch() {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>(
    {},
  );

  // Load all users on component mount
  useEffect(() => {
    const loadInitialUsers = async () => {
      try {
        const emptyFormData = new FormData();
        emptyFormData.append("query", "");
        const result = await searchUsersAction(emptyFormData);
        if (result.users && result.users.length > 0) {
          setSearchResults(result.users);
        }
      } catch (error) {
        console.error("Error loading initial users:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialUsers();
  }, []);

  async function handleSearch(formData: FormData) {
    const query = formData.get("query") as string;
    setSearchQuery(query);
    setIsSearching(true);
    setSearchResults([]); // Clear previous results

    try {
      console.log("Searching for:", query);
      // Create a new FormData object to ensure it's properly sent
      const newFormData = new FormData();
      newFormData.append("query", query.trim());

      // Check if the query looks like a UUID (user ID)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          query.trim(),
        );
      if (isUUID) {
        newFormData.append("searchType", "id");
      }

      // Search for users with the query
      const result = await searchUsersAction(newFormData);
      console.log("Search results client-side:", result.users);

      if (result.users && result.users.length > 0) {
        // Ensure we have unique users by ID
        const uniqueUsers = Array.from(
          new Map(result.users.map((user) => [user.id, user])).values(),
        );
        setSearchResults(uniqueUsers);
      } else {
        // If no results, try with empty query to get all users
        const emptyFormData = new FormData();
        emptyFormData.append("query", "");

        const allUsersResult = await searchUsersAction(emptyFormData);
        console.log("All users fallback:", allUsersResult.users);

        if (allUsersResult.users && allUsersResult.users.length > 0) {
          const uniqueUsers = Array.from(
            new Map(
              allUsersResult.users.map((user) => [user.id, user]),
            ).values(),
          );
          setSearchResults(uniqueUsers);
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSendRequest(formData: FormData, userId: string) {
    setRequestStatus((prev) => ({ ...prev, [userId]: "pending" }));

    try {
      const result = await sendFriendRequestAction(formData);
      if (result.success) {
        setRequestStatus((prev) => ({ ...prev, [userId]: "success" }));
      } else {
        setRequestStatus((prev) => ({
          ...prev,
          [userId]: result.error || "error",
        }));
      }
    } catch (error) {
      setRequestStatus((prev) => ({ ...prev, [userId]: "error" }));
    }
  }

  return (
    <div className="space-y-4">
      <form action={handleSearch} className="flex gap-2">
        <Input
          name="query"
          placeholder="Search by email or username"
          className="flex-1"
        />
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isSearching}
        >
          <Search className="mr-2 h-4 w-4" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {isInitialLoading ? (
        <p className="text-center py-4">Loading users...</p>
      ) : isSearching ? (
        <p className="text-center py-4">Searching...</p>
      ) : searchResults.length > 0 ? (
        <div className="space-y-3 mt-4">
          <h3 className="font-medium">
            {searchQuery ? `Results for "${searchQuery}"` : "All Users"}
          </h3>
          {searchResults.map((user, index) => (
            <div
              key={`${user.id}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={
                      user.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                    }
                    alt={user.name || "User"}
                  />
                  <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              {requestStatus[user.id] === "success" ? (
                <span className="text-green-600 text-sm font-medium">
                  Request sent
                </span>
              ) : requestStatus[user.id] === "pending" ? (
                <span className="text-gray-500 text-sm">Sending...</span>
              ) : requestStatus[user.id] &&
                requestStatus[user.id] !== "error" ? (
                <span className="text-red-500 text-sm">
                  {requestStatus[user.id]}
                </span>
              ) : (
                <form
                  action={(formData) => handleSendRequest(formData, user.id)}
                >
                  <input type="hidden" name="receiverId" value={user.id} />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : searchQuery ? (
        <p className="text-gray-500 text-center py-4">
          No users found matching "{searchQuery}"
        </p>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No users available. Try searching for someone.
        </p>
      )}
    </div>
  );
}
