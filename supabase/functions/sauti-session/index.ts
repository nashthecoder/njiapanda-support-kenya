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

    // Use Gemini API key directly (works with browser WebSocket)
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-live";

    // Google AI Studio WebSocket URL (supports ?key= param)
    const wsUrl =
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    return new Response(
      JSON.stringify({
        wsUrl,
        expiresAt,
        sessionId,
        model: `models/${model}`,
        language,
        zone: zone || "unspecified",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sauti-session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
