import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { story_id, text } = await req.json();
    if (!story_id || !text) {
      return new Response(JSON.stringify({ error: "Missing story_id or text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a content safety moderator for a GBV survivor support platform. Analyse the following story submission and determine if it should be flagged. Flag if ANY of these are present:
1. Personal identifiers (full names, phone numbers, addresses, ID numbers, email addresses)
2. Extremely graphic or gratuitous descriptions of violence or sexual assault that go beyond what is needed to share the experience
3. Unsafe advice (telling others to confront abusers, sharing dangerous remedies, promoting self-harm)

Respond ONLY with a JSON object: {"flagged": true/false, "reason": "brief explanation or empty string"}`,
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      // Don't block submission on moderation failure
      return new Response(JSON.stringify({ moderated: false, error: "AI unavailable" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let flagged = false;
    let reason = "";
    try {
      const cleaned = content.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      flagged = parsed.flagged === true;
      reason = parsed.reason || "";
    } catch {
      console.error("Failed to parse AI response:", content);
    }

    if (flagged) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      await sb
        .from("stories")
        .update({ status: "flagged" })
        .eq("id", story_id);

      console.log(`Story ${story_id} flagged: ${reason}`);
    }

    return new Response(JSON.stringify({ moderated: true, flagged, reason }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
