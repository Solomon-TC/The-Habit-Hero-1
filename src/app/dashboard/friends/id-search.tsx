"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { searchUsersAction } from "@/app/actions/friends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Bug } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function IdSearch() {
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setError(null);
    setUser(null);
    setRequestStatus(null);

    try {
      console.log("Searching for user ID:", userId.trim());
      const searchId = userId.trim();

      // Try direct API call first
      const formData = new FormData();
      formData.append("userId", searchId);

      const response = await fetch("/api/friends/search-by-id", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      if (response.users && response.users.length > 0) {
        setUser(response.users[0]);
        return;
      }

      // If API call fails, try the debug endpoint
      const debugResponse = await fetch("/api/friends/debug-id-search", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      console.log("Debug search response:", debugResponse);

      if (debugResponse.firstSuccess) {
        setUser(debugResponse.firstSuccess);
      } else if (
        debugResponse.results &&
        Object.values(debugResponse.results).some(
          (result: any) => result.success,
        )
      ) {
        // Find the first successful result and use that user
        for (const method in debugResponse.results) {
          if (
            debugResponse.results[method].success &&
            debugResponse.results[method].data
          ) {
            setUser(debugResponse.results[method].data);
            break;
          }
        }
      } else {
        // If debug search fails, try the server action as a last resort
        const actionFormData = new FormData();
        actionFormData.append("query", searchId);
        actionFormData.append("searchType", "id");

        const actionResult = await searchUsersAction(actionFormData);
        console.log("Server action results:", actionResult.users);

        if (actionResult.users && actionResult.users.length > 0) {
          setUser(actionResult.users[0]);
        } else {
          setError("No user found with this ID");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("ID search error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setRequestStatus("pending");

    try {
      const formData = new FormData();
      formData.append("receiverId", user.id);

      // Try server action first
      try {
        const actionResult = await searchUsersAction(formData);
        if (actionResult.success) {
          setRequestStatus("success");
          return;
        }
      } catch (actionErr) {
        console.error("Server action error:", actionErr);
        // Fall back to API call if server action fails
      }

      // Fallback to API call
      const result = await fetch("/api/friends/request", {
        method: "POST",
        body: formData,
      });

      if (result.ok) {
        setRequestStatus("success");
      } else {
        const data = await result.json();
        setRequestStatus(data.error || "error");
      }
    } catch (err) {
      setRequestStatus("error");
      console.error("Send request error:", err);
    }
  }

  const [debugMode, setDebugMode] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

  async function handleDebugSearch() {
    if (!userId.trim()) return;

    setLoading(true);
    setError(null);
    setDebugResults(null);

    try {
      const formData = new FormData();
      formData.append("userId", userId.trim());

      const response = await fetch("/api/friends/debug-id-search", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      console.log("Debug search response:", response);
      setDebugResults(response);

      // If any method succeeded, set the user
      if (response.firstSuccess) {
        setUser(response.firstSuccess);
      } else if (
        response.results &&
        Object.values(response.results).some((result: any) => result.success)
      ) {
        // Find the first successful result and use that user
        for (const method in response.results) {
          if (
            response.results[method].success &&
            response.results[method].data
          ) {
            setUser(response.results[method].data);
            break;
          }
        }
      } else {
        setError("No user found with this ID using any method");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Debug search error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Search by User ID</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
            className="h-8 w-8 p-0"
          >
            <Bug
              className={`h-4 w-4 ${debugMode ? "text-purple-600" : "text-gray-400"}`}
            />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="standard">
          <TabsList className="mb-4">
            <TabsTrigger value="standard">Standard Search</TabsTrigger>
            {debugMode && <TabsTrigger value="debug">Debug Search</TabsTrigger>}
          </TabsList>

          <TabsContent value="standard">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter exact user ID"
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Find User"}
              </Button>
            </form>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {user && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border mt-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={
                        user.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                      }
                      alt={user.name || "User"}
                    />
                    <AvatarFallback>
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                  </div>
                </div>

                {requestStatus === "success" ? (
                  <span className="text-green-600 text-sm font-medium">
                    Request sent
                  </span>
                ) : requestStatus === "pending" ? (
                  <span className="text-gray-500 text-sm">Sending...</span>
                ) : requestStatus && requestStatus !== "error" ? (
                  <span className="text-red-500 text-sm">{requestStatus}</span>
                ) : (
                  <form onSubmit={handleSendRequest}>
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
            )}
          </TabsContent>

          {debugMode && (
            <TabsContent value="debug">
              <div className="flex gap-2 mb-4">
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter exact user ID for debugging"
                  className="flex-1"
                />
                <Button onClick={handleDebugSearch} disabled={loading}>
                  {loading ? "Debugging..." : "Debug Search"}
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md mb-4">
                  {error}
                </div>
              )}

              {debugResults && (
                <div className="mt-4 space-y-4">
                  <h3 className="font-medium">
                    Debug Results for ID: {debugResults.userId}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(debugResults.results).map(
                      ([method, result]: [string, any]) => (
                        <div
                          key={method}
                          className={`p-3 rounded-lg border ${result.success ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                        >
                          <h4 className="font-medium flex items-center">
                            <span
                              className={`w-3 h-3 rounded-full mr-2 ${result.success ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            {method} {result.success ? "✓" : "✗"}
                          </h4>
                          {result.error && (
                            <p className="text-sm text-red-500 mt-1">
                              Error: {result.error}
                            </p>
                          )}
                          {result.data && (
                            <div className="mt-2 text-sm">
                              <p>
                                <span className="font-medium">ID:</span>{" "}
                                {result.data.id}
                              </p>
                              <p>
                                <span className="font-medium">Name:</span>{" "}
                                {result.data.name}
                              </p>
                              <p>
                                <span className="font-medium">Email:</span>{" "}
                                {result.data.email}
                              </p>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>

                  {user && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">User Found:</h3>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                user.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                              }
                              alt={user.name || "User"}
                            />
                            <AvatarFallback>
                              {user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-400">
                              ID: {user.id}
                            </p>
                          </div>
                        </div>

                        <form onSubmit={handleSendRequest}>
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Friend
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
