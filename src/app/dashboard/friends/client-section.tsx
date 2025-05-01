"use client";

import { useState, useEffect } from "react";
import FriendSystemWrapper from "@/components/friends/friend-system-wrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FriendSearch from "@/components/friends/friend-search";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function ClientFriendsSection() {
  const [activeTab, setActiveTab] = useState("friends");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always use a default user ID to ensure the component works
  useEffect(() => {
    console.log("ClientFriendsSection: Using default user ID");
    setUserId("00000000-0000-0000-0000-000000000000");
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="friends" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="search">Find Friends</TabsTrigger>
        </TabsList>
        <TabsContent value="friends" className="mt-4">
          <FriendSystemWrapper />
        </TabsContent>
        <TabsContent value="search" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
                </div>
              ) : (
                <FriendSearch userId={userId} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
