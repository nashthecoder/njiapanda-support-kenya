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
    const { signal, case_notes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const context = [
      signal?.urgency ? `Urgency: ${signal.urgency}` : "",
      signal?.zone ? `Zone: ${signal.zone}` : "",
      signal?.resource_needed ? `Resources needed: ${signal.resource_needed}` : "",
      signal?.consent !== undefined ? `Consent given: ${signal.consent}` : "",
      case_notes ? `Case notes: ${case_notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a GBV case assessment assistant for Njiapanda, a Kenyan survivor support platform. Given signal data, provide a structured risk assessment. You MUST respond using the provided tool.`,
          },
          {
            role: "user",
            content: `Assess this signal:\n${context}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "risk_assessment",
              description: "Return a structured risk assessment for a GBV help signal.",
              parameters: {
                type: "object",
                properties: {
                  risk_level: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                    description: "Overall risk level",
                  },
                  detected_abuse_types: {
                    type: "array",
                    items: { type: "string" },
                    description: "Types of abuse detected or suspected, e.g. physical, sexual, emotional, economic, digital",
                  },
                  suggested_resources: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recommended resources: safe_place, legal_help, counseling, medical, transport, police",
                  },
                  immediate_safety_concern: {
                    type: "boolean",
                    description: "Whether the person appears to be in immediate danger",
                  },
                },
                required: ["risk_level", "detected_abuse_types", "suggested_resources", "immediate_safety_concern"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "risk_assessment" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const assessment = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(assessment), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI Brief error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
