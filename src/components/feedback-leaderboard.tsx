"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";

type FeedbackUser = {
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export interface Feedback {
  id: string;
  title: string;
  feedback_type: string;
  content: string;
  upvotes: number;
  created_at: string;
  user_id: string;
  users: FeedbackUser;
}

interface FeedbackLeaderboardProps {
  initialFeedback?: Feedback[];
  initialUserUpvotes?: string[];
}

export function FeedbackLeaderboard({
  initialFeedback = [],
  initialUserUpvotes = [],
}: FeedbackLeaderboardProps) {
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const [userUpvotes, setUserUpvotes] = useState<string[]>(initialUserUpvotes);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        get(name) {
          if (typeof window === "undefined") return undefined;
          const cookies = document.cookie.split("; ");
          const cookie = cookies.find((c) => c.startsWith(`${name}=`));
          return cookie ? cookie.split("=")[1] : undefined;
        },
        set(name, value, options) {
          if (typeof window === "undefined") return;
          let cookie = `${name}=${value}`;
          if (options?.expires)
            cookie += `; expires=${options.expires.toUTCString()}`;
          if (options?.path) cookie += `; path=${options.path}`;
          if (options?.domain) cookie += `; domain=${options.domain}`;
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options?.secure) cookie += `; secure`;
          document.cookie = cookie;
        },
        remove(name, options) {
          if (typeof window === "undefined") return;
          const newOptions = { ...options, expires: new Date(0) };
          this.set(name, "", newOptions);
        },
      },
    },
  );

  // Fetch feedback data
  const fetchFeedback = async () => {
    try {
      const response = await fetch("/api/feedback");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch feedback");
      }

      setFeedback(data.feedback || []);
      setUserUpvotes(data.userUpvotes || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle upvote
  const handleUpvote = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/upvote`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upvote");
      }

      // Optimistically update the UI
      if (data.action === "added") {
        // Add to user upvotes
        setUserUpvotes((prev) => [...prev, feedbackId]);

        // Increment the upvote count
        setFeedback((prev) =>
          prev.map((item) =>
            item.id === feedbackId
              ? { ...item, upvotes: item.upvotes + 1 }
              : item,
          ),
        );
      } else {
        // Remove from user upvotes
        setUserUpvotes((prev) => prev.filter((id) => id !== feedbackId));

        // Decrement the upvote count
        setFeedback((prev) =>
          prev.map((item) =>
            item.id === feedbackId
              ? { ...item, upvotes: Math.max(0, item.upvotes - 1) }
              : item,
          ),
        );
      }

      // Re-sort the feedback based on upvotes
      setFeedback((prev) =>
        [...prev].sort((a, b) => {
          // First sort by upvotes (descending)
          if (b.upvotes !== a.upvotes) {
            return b.upvotes - a.upvotes;
          }
          // Then by creation date (newest first)
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }),
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upvote feedback",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchFeedback();

    // Subscribe to changes in the feedback table
    const feedbackSubscription = supabase
      .channel("public:feedback")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feedback",
        },
        () => {
          fetchFeedback();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedbackSubscription);
    };
  }, []);

  // Helper function to get display name
  const getDisplayName = (feedback: Feedback) => {
    return (
      feedback.users?.display_name || feedback.users?.name || "Anonymous User"
    );
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get feedback type badge color
  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return "bg-blue-100 text-blue-800";
      case "bug":
        return "bg-red-100 text-red-800";
      case "improvement":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto h-12 w-12 text-gray-400"
          >
            <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z" />
            <path d="M12 13v8" />
            <path d="M5 13v6a2 2 0 0 0 2 2h8" />
          </svg>
          <h3 className="mt-2 text-sm font-medium">No feedback yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to submit feedback!
          </p>
        </div>
      ) : (
        feedback.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getFeedbackTypeColor(
                          item.feedback_type,
                        )}`}
                      >
                        {item.feedback_type.charAt(0).toUpperCase() +
                          item.feedback_type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        by {getDisplayName(item)} •{" "}
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={
                      userUpvotes.includes(item.id) ? "default" : "outline"
                    }
                    size="sm"
                    className={`flex items-center gap-1 ${userUpvotes.includes(item.id) ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                    onClick={() => handleUpvote(item.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m12 19V5" />
                      <path d="m5 12 7-7 7 7" />
                    </svg>
                    <span className="transform rotate-90">{item.upvotes}</span>
                  </Button>
                </div>
                <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
