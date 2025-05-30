import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { subscription_id } = await req.json();

    if (!subscription_id) {
      throw new Error("Missing subscription ID");
    }

    // Cancel the subscription at period end (doesn't end immediately)
    const canceledSubscription = await stripe.subscriptions.update(
      subscription_id,
      { cancel_at_period_end: true },
    );

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Subscription will be canceled at the end of the billing period",
        subscription: {
          id: canceledSubscription.id,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          current_period_end: canceledSubscription.current_period_end,
          status: canceledSubscription.status,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
