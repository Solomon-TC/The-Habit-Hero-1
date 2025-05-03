"use client";

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import FriendSearch from "@/components/friends/friend-search";
import FriendRequests from "@/components/friends/friend-requests";

export default function FriendActions() {
  const [activeTab, setActiveTab] = useState<"search" | "requests">("search");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogTitle className="sr-only">Add Friends</DialogTitle>
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3 font-medium text-center ${activeTab === "search" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"}`}
          >
            Find Friends
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-3 font-medium text-center ${activeTab === "requests" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"}`}
          >
            Friend Requests
          </button>
        </div>
        <div className="p-4">
          {activeTab === "search" ? <FriendSearch /> : <FriendRequests />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
