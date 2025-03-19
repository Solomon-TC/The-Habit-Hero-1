"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {
  searchUsersAction,
  sendFriendRequestAction,
} from "@/app/actions/friends";
import { useFormStatus } from "react-dom";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

function SendRequestButton({ userId }: { userId: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      className="bg-purple-600 hover:bg-purple-700"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      {pending ? "Sending..." : "Add Friend"}
    </Button>
  );
}

export default function FriendSearchResults() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>(
    {},
  );

  // Load all users on component mount
  useEffect(() => {
    const loadInitialUsers = async () => {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    loadInitialUsers();
  }, []);

  async function handleSearch(formData: FormData) {
    const query = formData.get("query") as string;
    setSearchQuery(query);
    setIsLoading(true);

    try {
      console.log("Searching for:", query);
      // Create a new FormData object to ensure it's properly sent
      const newFormData = new FormData();
      newFormData.append("query", query ? query.trim() : "");

      const result = await searchUsersAction(newFormData);
      console.log("Search results client-side:", result.users);

      if (result.users && result.users.length > 0) {
        setSearchResults(result.users);
      } else {
        // If no results, try with empty query to get all users
        const emptyFormData = new FormData();
        emptyFormData.append("query", "");

        const allUsersResult = await searchUsersAction(emptyFormData);
        console.log("All users fallback:", allUsersResult.users);

        if (allUsersResult.users && allUsersResult.users.length > 0) {
          setSearchResults(allUsersResult.users);
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
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
    <div>
      <form action={handleSearch} className="flex gap-2 mb-4">
        <input
          name="query"
          type="text"
          placeholder="Search by name or email"
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      {isLoading ? (
        <p className="text-center py-4">Loading users...</p>
      ) : searchResults.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-medium">
            {searchQuery ? `Results for "${searchQuery}"` : "All Users"}
          </h3>
          {searchResults.map((user) => (
            <div
              key={user.id}
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
                  <SendRequestButton userId={user.id} />
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
