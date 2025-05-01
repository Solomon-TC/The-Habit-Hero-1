import QueryProvider from "@/components/providers/query-provider";
import FriendsPageClient from "./new-client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";

export default async function FriendsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <QueryProvider>
        <FriendsPageClient />
      </QueryProvider>
    </SubscriptionCheck>
  );
}
