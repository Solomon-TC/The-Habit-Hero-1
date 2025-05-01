"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FriendsPageClient() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Friends System</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">The friends system is currently being updated.</p>
          <Button
            onClick={() => setLoading(!loading)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
