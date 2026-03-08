import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { priceId, mode, email } = await req.json();

    if (!priceId || !mode) {
      throw new Error("priceId and mode are required");
    }

    const origin = req.headers.get("origin") || "https://njiapanda-support-kenya.lovable.app";

    const sessionParams: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${origin}/contribute?success=true`,
      cancel_url: `${origin}/contribute?canceled=true`,
    };
    };

    // If email provided, pre-fill
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        sessionParams.customer = customers.data[0].id;
      } else {
        sessionParams.customer_email = email;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
