"use client";

import FriendSystemV2 from "@/components/friends/friend-system-v2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function ClientFriendsSectionV2() {
  return (
    <QueryClientProvider client={queryClient}>
      <FriendSystemV2 />
    </QueryClientProvider>
  );
}
