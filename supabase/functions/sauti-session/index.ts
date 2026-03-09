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

    // Get and decode Vertex AI service account key
    const serviceAccountKeyB64 = Deno.env.get("VERTEX_AI_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKeyB64) {
      throw new Error("VERTEX_AI_SERVICE_ACCOUNT_KEY not configured");
    }

    // Decode base64 to get JSON string, then parse
    const serviceAccountKeyJson = new TextDecoder().decode(
      Uint8Array.from(atob(serviceAccountKeyB64), c => c.charCodeAt(0))
    );
    const serviceAccount = JSON.parse(serviceAccountKeyJson);

    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || serviceAccount.project_id;
    const location = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "us-central1";
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-live";

    // Create JWT for Google Cloud OAuth
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    // Create JWT header and payload
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify(jwtPayload));
    
    // Import private key for signing
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      Uint8Array.from(atob(serviceAccount.private_key.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, "")), c => c.charCodeAt(0)),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(`${header}.${payload}`)
    );
    const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const { access_token } = await tokenResponse.json();

    // Create Vertex AI WebSocket URL
    const wsUrl = `wss://${location}-aiplatform.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    return new Response(
      JSON.stringify({
        wsUrl,
        accessToken: access_token,
        expiresAt,
        sessionId,
        model: `projects/${projectId}/locations/${location}/models/${model}`,
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
