import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CONTACT_EMAIL = "info@mamatech.co.ke";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, message, email } = await req.json();

    // Build email content
    const typeLabel =
      type === "bug"
        ? "🐛 Bug Report"
        : type === "contact"
        ? "📧 Contact Request"
        : type === "suggestion"
        ? "💡 Suggestion"
        : "📝 Feedback";

    const subject = `[Njiapanda] ${typeLabel}`;
    const body = `
New feedback submitted on Njiapanda:

Type: ${typeLabel}
From: ${email || "Anonymous"}

Message:
${message}

---
Sent automatically by Njiapanda Platform
    `.trim();

    // Use Lovable AI gateway for email via Resend (if configured)
    // For now, log the notification - actual email sending can be configured
    console.log("=== FEEDBACK NOTIFICATION ===");
    console.log("To:", CONTACT_EMAIL);
    console.log("Subject:", subject);
    console.log("Body:", body);
    console.log("=============================");

    // Try sending via Resend if API key exists
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Njiapanda <noreply@njiapanda.com>",
          to: [CONTACT_EMAIL],
          subject,
          text: body,
        }),
      });

      if (!resendRes.ok) {
        console.error("Resend error:", await resendRes.text());
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notify feedback error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
