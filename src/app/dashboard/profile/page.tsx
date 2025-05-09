import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";
import DashboardNavbar from "@/components/dashboard-navbar";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              You need to be logged in to view your profile
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get user profile data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get subscription data
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {userData?.avatar_url ? (
                    <Avatar className="h-20 w-20 border-2 border-purple-200">
                      <AvatarImage src={userData.avatar_url} alt="Profile" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserCircle className="h-12 w-12 text-purple-600" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full px-2 py-0.5 border border-yellow-300">
                    Lv{userData?.level || 1}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">
                    {userData?.full_name || userData?.name || "User"}
                  </h3>
                  <p className="text-gray-500">{userData?.email}</p>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {userData?.xp || 0} XP
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">User ID:</span>
                  <span className="font-mono text-sm">{userData?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Created:</span>
                  <span>
                    {new Date(userData?.created_at || "").toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan details</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Plan:</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {subscriptionData.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>

                  {subscriptionData.status === "active" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plan Type:</span>
                        <span>{subscriptionData.interval || "Monthly"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span>
                          {subscriptionData.currency && subscriptionData.amount
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: subscriptionData.currency,
                              }).format(subscriptionData.amount / 100)
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Current Period Ends:
                        </span>
                        <span>
                          {subscriptionData.current_period_end
                            ? new Date(
                                subscriptionData.current_period_end * 1000,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Auto-renew:</span>
                        <span>
                          {subscriptionData.cancel_at_period_end ? "Off" : "On"}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {subscriptionData.cancel_at_period_end ? (
                      <div className="text-center text-amber-600">
                        <p>
                          Your subscription will end on{" "}
                          {new Date(
                            subscriptionData.current_period_end * 1000,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-500">
                          Contact support to manage your subscription
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500 mb-4">
                    You don't have an active subscription
                  </p>
                  <a
                    href="/pricing"
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    View available plans
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
