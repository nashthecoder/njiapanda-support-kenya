import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_type, timestamp, zone, urgency_level, consent, resource_needed } = await req.json();

    const OPENFN_WEBHOOK_URL = Deno.env.get("OPENFN_WEBHOOK_URL");
    if (!OPENFN_WEBHOOK_URL) {
      throw new Error("OPENFN_WEBHOOK_URL is not configured");
    }

    const payload = {
      event_type: event_type || "quiet_help_signal",
      timestamp: timestamp || new Date().toISOString(),
      zone: zone || "unknown",
      urgency_level,
      consent: consent ?? false,
      resource_needed: resource_needed || "",
    };

    console.log("Forwarding signal to OpenFN:", JSON.stringify(payload));

    const response = await fetch(OPENFN_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`OpenFN webhook failed [${response.status}]: ${responseText}`);
      return new Response(
        JSON.stringify({ forwarded: false, error: `Webhook returned ${response.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Signal forwarded successfully");
    return new Response(
      JSON.stringify({ forwarded: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Forward signal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
