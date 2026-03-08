import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If webhook secret is set, verify signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log(`[STRIPE-WEBHOOK] Event type: ${event.type}`);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "invoice.paid"
    ) {
      const session = event.data.object as any;
      const amountTotal = session.amount_total || session.amount_paid || 0;
      // amount is in minor units (cents for KES = KES itself since KES has no subunits... 
      // but Stripe treats KES as having 2 decimal places)
      const amountKES = Math.round(amountTotal / 100);

      if (amountKES > 0) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        const { error } = await supabase.rpc("increment_contribution", {
          amount: amountKES,
        });

        if (error) {
          console.error("[STRIPE-WEBHOOK] Error incrementing contribution:", error);
          throw error;
        }

        console.log(`[STRIPE-WEBHOOK] Incremented by KES ${amountKES}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-WEBHOOK] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
