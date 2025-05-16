import DashboardNavbar from "@/components/dashboard-navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackForm } from "@/components/feedback-form";
import { FeedbackLeaderboard } from "@/components/feedback-leaderboard";

export default async function FeedbackPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return redirect("/sign-in?error=Failed+to+initialize+database+client");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch initial feedback data for server-side rendering
  const { data: feedbackDataRaw } = await supabase
    .from("feedback")
    .select(
      `
      id,
      title,
      feedback_type,
      content,
      upvotes,
      created_at,
      user_id,
      users:user_id (name, display_name, avatar_url)
    `,
    )
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false });

  // Transform the data to match the expected Feedback type
  const feedbackData = feedbackDataRaw?.map((item) => {
    // Handle users data safely
    let userData = {
      name: null,
      display_name: null,
      avatar_url: null,
    };

    if (item.users) {
      if (Array.isArray(item.users) && item.users.length > 0) {
        userData = {
          name: item.users[0].name || null,
          display_name: item.users[0].display_name || null,
          avatar_url: item.users[0].avatar_url || null,
        };
      } else if (typeof item.users === "object") {
        const usersObj = item.users as Record<string, any>;
        userData = {
          name: usersObj.name || null,
          display_name: usersObj.display_name || null,
          avatar_url: usersObj.avatar_url || null,
        };
      }
    }

    return {
      id: item.id,
      title: item.title,
      feedback_type: item.feedback_type,
      content: item.content,
      upvotes: item.upvotes,
      created_at: item.created_at,
      user_id: item.user_id,
      users: userData,
    };
  });

  // Fetch user's upvotes
  const { data: userUpvotesData } = await supabase
    .from("feedback_upvotes")
    .select("feedback_id")
    .eq("user_id", user.id);

  const userUpvotes =
    userUpvotesData?.map((upvote) => upvote.feedback_id) || [];

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Feedback</h1>
            <p className="text-gray-600">
              We value your input! Share your thoughts and help us improve
              HabitHero.
            </p>
          </header>

          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="leaderboard">
                Feedback Leaderboard
              </TabsTrigger>
              <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle>Community Feedback</CardTitle>
                  <CardDescription>
                    Browse and upvote feedback from the community. The most
                    popular ideas rise to the top!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FeedbackLeaderboard
                    initialFeedback={feedbackData || []}
                    initialUserUpvotes={userUpvotes}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Feedback</CardTitle>
                  <CardDescription>
                    Let us know what you think about HabitHero or report any
                    issues you've encountered.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FeedbackForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium">How do streaks work?</h3>
                  <p className="text-gray-600 mt-1">
                    Streaks increase by 1 each day you complete a habit. If you
                    miss a day, your streak resets to 0.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium">
                    Can I change the frequency of my habits?
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Yes, you can edit any habit to change its frequency between
                    daily, weekly, or monthly tracking.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium">How do I earn badges?</h3>
                  <p className="text-gray-600 mt-1">
                    Badges are awarded automatically when you reach certain
                    milestones, like maintaining a streak or completing specific
                    challenges.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
