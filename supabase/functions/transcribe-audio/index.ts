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
    const { audio, duration } = await req.json();

    if (!audio) {
      return new Response(
        JSON.stringify({ error: "No audio data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Gemini via Lovable AI gateway — it supports audio input natively
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a transcription assistant. Your ONLY job is to transcribe the audio into text. " +
              "Output ONLY the transcribed words. Do not add commentary, punctuation corrections beyond what was spoken, " +
              "summaries, or any other text. If the audio is in Swahili or Sheng, transcribe it in that language. " +
              "If the audio is unclear or silent, respond with: [No speech detected]",
          },
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: {
                  data: audio,
                  format: "webm",
                },
              },
              {
                type: "text",
                text: "Transcribe this audio recording exactly as spoken.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Transcription service error");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Log only anonymised metadata
    console.log(
      JSON.stringify({
        event: "transcription_complete",
        duration_seconds: duration ?? null,
        transcript_length: text.length,
        timestamp: new Date().toISOString(),
      })
    );

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("transcribe-audio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Transcription failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
