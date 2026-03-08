import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const urgencyOptions = [
  { value: "emergency", label: "🔴 Emergency — I'm in danger now", color: "border-emergency/60 bg-emergency/5" },
  { value: "urgent", label: "🟠 Urgent — I need help soon", color: "border-warning/60 bg-warning/5" },
  { value: "information", label: "🟢 Need information", color: "border-safe/60 bg-safe/5" },
];

const resourceOptions = [
  { value: "safe_place", label: "Safe place" },
  { value: "legal_help", label: "Legal help" },
  { value: "counseling", label: "Counselling" },
  { value: "transport", label: "Transport" },
  { value: "medical", label: "Medical" },
];

const zoneOptions = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Other"];

const QuietSignal = () => {
  const navigate = useNavigate();
  const [urgency, setUrgency] = useState("");
  const [resources, setResources] = useState<string[]>([]);
  const [zone, setZone] = useState("");
  const [consent, setConsent] = useState(false);
  const [contactMethod, setContactMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleResource = (val: string) => {
    setResources((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  };

  const handleSubmit = async () => {
    if (!urgency) {
      toast.error("Please select an urgency level");
      return;
    }
    setSubmitting(true);

    try {
      // Insert to signals table
      const { error } = await supabase.from("signals").insert({
        urgency,
        resource_needed: resources.join(", "),
        zone: zone || null,
        consent,
      });

      if (error) throw error;

      // Forward de-identified payload to OpenFN via edge function
      await supabase.functions.invoke("forward-signal", {
        body: {
          event_type: "quiet_help_signal",
          timestamp: new Date().toISOString(),
          zone: zone || "unknown",
          urgency_level: urgency,
          consent,
          resource_needed: resources.join(", "),
        },
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Signal submission error:", err);
      toast.error("Something went wrong. Please try the helpline if you need immediate help.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pb-24">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
          <button onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground">Signal Sent</h1>
        </header>
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-safe" />
          </motion.div>
          <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
            Your signal has been received
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            A trained responder will be coordinated to help. No personal data was stored.
          </p>
          <button
            onClick={() => navigate("/helpline")}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            View Emergency Helplines
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Quiet Help Signal</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        <div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
          <strong>Anonymous & safe.</strong> No login required. Your identity is never recorded.
        </div>

        {/* Urgency */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            How urgent is your situation?
          </label>
          <div className="space-y-2">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setUrgency(opt.value)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                  urgency === opt.value ? opt.color + " ring-2 ring-ring" : "border-border bg-card"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resources needed */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            What do you need? <span className="font-normal text-muted-foreground">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {resourceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleResource(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  resources.includes(opt.value)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Your area <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {zoneOptions.map((z) => (
              <button
                key={z}
                onClick={() => setZone(zone === z ? "" : z)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  zone === z
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Safe contact */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Safe contact method <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            type="text"
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value)}
            placeholder="e.g. WhatsApp, SMS, call — include a safe time"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            I consent to this de-identified information being shared with trained responders to coordinate help.
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={submitting || !urgency}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send Signal"}
        </button>
      </div>
    </div>
  );
};

export default QuietSignal;
