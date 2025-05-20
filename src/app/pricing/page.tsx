import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import { createClient } from "@/utils/supabase-server";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = "force-dynamic";

export default async function Pricing() {
  const supabase = await createClient();

  // Handle case when supabase client is null (during build)
  let user = null;
  try {
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  } catch (error) {
    console.error("Error fetching user in pricing page:", error);
    // Continue with null user
  }

  // Fetch plans from edge function
  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
    {
      method: "GET",
    },
  );
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans?.map((item: any) => (
            <PricingCard key={item.id} item={item} user={user} />
          ))}
        </div>
      </div>
    </>
  );
}
