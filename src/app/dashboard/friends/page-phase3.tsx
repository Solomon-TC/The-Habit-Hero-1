import { Metadata } from "next";
import { Suspense } from "react";
import FriendSystemWrapper from "@/components/friends/friend-system-wrapper";

export const metadata: Metadata = {
  title: "Friends",
  description: "Connect with friends and see their progress",
};

export default function FriendsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground">
          Connect with friends and track their progress together.
        </p>
      </div>

      <Suspense fallback={<div>Loading friend system...</div>}>
        <FriendSystemWrapper />
      </Suspense>
    </div>
  );
}
