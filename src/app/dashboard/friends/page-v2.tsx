import DashboardNavbar from "@/components/dashboard-navbar";
import { Suspense } from "react";
import { ClientFriendsSectionV2 } from "./client-section-v2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FriendsPageV2() {
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Friends</h1>
            </div>
            <p className="text-gray-600">
              Connect with friends and motivate each other on your habit
              journeys.
            </p>
          </header>

          <Suspense fallback={<div>Loading friend system...</div>}>
            <ClientFriendsSectionV2 />
          </Suspense>
        </div>
      </main>
    </>
  );
}
