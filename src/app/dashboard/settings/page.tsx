import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { UserSettingsForm } from "@/components/user-settings-form";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user profile data with cache busting to ensure fresh data
  const timestamp = Date.now();
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()
    .abortSignal(new AbortController().signal); // Force fresh data

  console.log(
    `User settings data fetched at ${new Date().toISOString()}:`,
    userData,
  );

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600">
              Manage your account settings and preferences
            </p>
          </header>

          <UserSettingsForm initialData={userData} userId={user.id} />
        </div>
      </main>
    </SubscriptionCheck>
  );
}
