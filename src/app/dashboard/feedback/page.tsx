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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default async function FeedbackPage() {
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
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Feedback</h1>
            <p className="text-gray-600">
              We value your input! Share your thoughts and help us improve
              HabitHero.
            </p>
          </header>

          {/* Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>
                Let us know what you think about HabitHero or report any issues
                you've encountered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="feedback-type">Feedback Type</Label>
                  <Select defaultValue="feature">
                    <SelectTrigger id="feedback-type">
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="improvement">
                        Improvement Suggestion
                      </SelectItem>
                      <SelectItem value="general">General Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-title">Title</Label>
                  <input
                    id="feedback-title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief summary of your feedback"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-details">Details</Label>
                  <Textarea
                    id="feedback-details"
                    placeholder="Please provide as much detail as possible"
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>I'm willing to be contacted about this feedback</span>
                  </Label>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
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
                  className="mr-2 h-4 w-4"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                Submit Feedback
              </Button>
            </CardFooter>
          </Card>

          {/* Previous Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Your Previous Feedback</CardTitle>
              <CardDescription>
                Track the status of feedback you've submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-4 text-center text-gray-500">
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
                    You haven't submitted any feedback yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
