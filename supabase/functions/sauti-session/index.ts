import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

const bytesToBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));

const base64UrlFromBytes = (bytes: Uint8Array) =>
  bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const base64UrlFromString = (s: string) =>
  base64UrlFromBytes(new TextEncoder().encode(s));

const base64ToBytes = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const decodePossiblyBase64Json = <T,>(value: string): T => {
  // 1) raw JSON
  const trimmed = value.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as T;
  }

  // 2) base64-encoded JSON
  const decoded = new TextDecoder().decode(base64ToBytes(trimmed));
  return JSON.parse(decoded) as T;
};

const pemPkcs8ToBytes = (pem: string) => {
  // Convert PEM to raw PKCS8 bytes
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "")
    .trim();
  return base64ToBytes(b64);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language = "sw", zone } = await req.json().catch(() => ({ language: "sw" }));

    const serviceAccountKey = Deno.env.get("VERTEX_AI_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) throw new Error("VERTEX_AI_SERVICE_ACCOUNT_KEY not configured");

    const serviceAccount = decodePossiblyBase64Json<ServiceAccount>(serviceAccountKey);
    if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
      throw new Error("VERTEX_AI_SERVICE_ACCOUNT_KEY is missing client_email/private_key");
    }

    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || serviceAccount.project_id;
    if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured");

    const location = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "us-central1";
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-live";

    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: "RS256", typ: "JWT" };
    const jwtPayload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const header = base64UrlFromString(JSON.stringify(jwtHeader));
    const payload = base64UrlFromString(JSON.stringify(jwtPayload));
    const signingInput = `${header}.${payload}`;

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemPkcs8ToBytes(serviceAccount.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(signingInput),
    );

    const jwt = `${signingInput}.${base64UrlFromBytes(new Uint8Array(signature))}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });

    const tokenBodyText = await tokenResponse.text();
    if (!tokenResponse.ok) {
      throw new Error(
        `Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText} — ${tokenBodyText}`,
      );
    }

    const tokenJson = JSON.parse(tokenBodyText);
    const accessToken = tokenJson?.access_token as string | undefined;
    if (!accessToken) throw new Error("Token exchange succeeded but access_token missing");

    const wsUrl = `wss://${location}-aiplatform.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    return new Response(
      JSON.stringify({
        wsUrl,
        accessToken,
        expiresAt,
        sessionId,
        model: `projects/${projectId}/locations/${location}/models/${model}`,
        language,
        zone: zone || "unspecified",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("sauti-session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
