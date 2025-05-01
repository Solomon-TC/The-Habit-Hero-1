"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Check, X } from "lucide-react";
import { respondToFriendRequestAction } from "@/app/actions/friends";
import { createClient } from "../../../supabase/client";

type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: {
    id: string;
    name?: string | null;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
};

export default function FriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});
  const supabase = createClient();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("friend_requests")
          .select(
            `
            *,
            sender:sender_id(*)
          `,
          )
          .eq("receiver_id", user.id)
          .eq("status", "pending");

        if (error) throw error;
        setRequests(data || []);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel("friend-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
        },
        () => {
          fetchRequests();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleResponse = async (requestId: string, accept: boolean) => {
    setActionStatus((prev) => ({ ...prev, [requestId]: "processing" }));
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("accept", accept.toString());

      const result = await respondToFriendRequestAction(formData);

      if (result.success) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        setActionStatus((prev) => ({ ...prev, [requestId]: "completed" }));
      } else {
        setActionStatus((prev) => ({
          ...prev,
          [requestId]: `error: ${result.error}`,
        }));
      }
    } catch (error) {
      console.error("Response error:", error);
      setActionStatus((prev) => ({ ...prev, [requestId]: "error" }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friend Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center py-4 text-gray-500">
            No pending friend requests
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const sender = request.sender;
              if (!sender) return null;

              const displayName =
                sender.full_name ||
                sender.name ||
                sender.email?.split("@")[0] ||
                "User";
              const isProcessing = actionStatus[request.id] === "processing";

              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-purple-200">
                      {sender.avatar_url ? (
                        <AvatarImage
                          src={sender.avatar_url}
                          alt={displayName}
                        />
                      ) : (
                        <AvatarFallback className="bg-purple-100">
                          <UserCircle className="h-5 w-5 text-purple-600" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{displayName}</p>
                      <p className="text-sm text-gray-500">{sender.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleResponse(request.id, true)}
                      disabled={isProcessing}
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleResponse(request.id, false)}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
