import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Create a signed JWT for Google service account OAuth2 */
async function getAccessToken(keyJson: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: keyJson.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const b64url = (data: Uint8Array) =>
    base64Encode(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the RSA private key
  const pemContents = keyJson.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    enc.encode(signingInput)
  );

  const signatureB64 = b64url(new Uint8Array(signature));
  const jwt = `${signingInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("Token exchange failed:", errText);
    throw new Error("Failed to get access token");
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language = "sw", zone } = await req.json();

    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
    const location = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "us-central1";
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-live";
    const saKeyB64 = Deno.env.get("VERTEX_AI_SERVICE_ACCOUNT_KEY");

    if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured");
    if (!saKeyB64) throw new Error("VERTEX_AI_SERVICE_ACCOUNT_KEY not configured");

    // Decode service account key
    const keyJson = JSON.parse(atob(saKeyB64));

    // Get access token via service account JWT
    const accessToken = await getAccessToken(keyJson);

    // Construct Vertex AI Gemini Live WebSocket URL
    const wsUrl =
      `wss://${location}-aiplatform.googleapis.com/ws/` +
      `google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent` +
      `?key=${accessToken}`;

    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    return new Response(
      JSON.stringify({
        wsUrl,
        accessToken,
        expiresAt,
        sessionId,
        model: `publishers/google/models/${model}`,
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
