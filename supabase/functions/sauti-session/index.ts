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
    const { language = "sw", zone } = await req.json();

    const cloudRunUrl = Deno.env.get("SAUTI_CLOUD_RUN_URL");
    if (!cloudRunUrl) {
      throw new Error("SAUTI_CLOUD_RUN_URL is not configured");
    }

    const apiKey = Deno.env.get("SAUTI_API_KEY");
    if (!apiKey) {
      throw new Error("SAUTI_API_KEY is not configured");
    }

    const response = await fetch(`${cloudRunUrl}/create-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        zone: zone || "unspecified",
        model: "gemini-2.0-flash-live",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Cloud Run error:", response.status, text);
      throw new Error(`Cloud Run returned ${response.status}`);
    }

    const data = await response.json();

    // Set 5-minute expiry
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        session_url: data.session_url || data.websocket_url,
        session_token: data.session_token || data.token,
        expires_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("sauti-session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
