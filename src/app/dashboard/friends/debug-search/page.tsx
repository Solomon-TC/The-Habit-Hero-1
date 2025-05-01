import DashboardNavbar from "@/components/dashboard-navbar";
import DebugSearchForm from "@/components/debug-search-form";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DebugSearchPage() {
  // Check authentication
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Debug User Search</h1>
            </div>
            <p className="text-gray-600">
              Use this tool to debug user ID search functionality.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6">
            <DebugSearchForm />

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                Debugging Instructions
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Enter a user ID in the search box above</li>
                <li>
                  The system will attempt to find the user using multiple
                  methods
                </li>
                <li>
                  Results from each method will be displayed below the search
                  box
                </li>
                <li>Check the browser console for detailed logs</li>
                <li>
                  Compare the results to identify where the search is failing
                </li>
              </ol>
              <p className="mt-4 text-sm text-gray-500">
                This tool helps identify issues with the user search
                functionality by showing results from different search methods
                side by side.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
