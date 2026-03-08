import { ArrowLeft, ShieldCheck, X } from "lucide-react";
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

const handleSafeClose = () => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.replace("https://weather.com");
};

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
      toast.error("Please select how urgent your situation is.");
      return;
    }
    setSubmitting(true);

    try {
      const { error } = await supabase.from("signals").insert({
        urgency,
        resource_needed: resources.join(", "),
        zone: zone || null,
        consent,
      });

      if (error) throw error;

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
      toast.error("Something went wrong — please try again, or call a helpline directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-background px-6" role="alert" aria-live="assertive">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <ShieldCheck className="mx-auto mb-6 h-20 w-20 text-safe" aria-hidden="true" />
        </motion.div>
        <h2 className="mb-3 text-center font-display text-2xl font-semibold text-foreground">
          Your signal has been received
        </h2>
        <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          Someone will reach out safely. No personal data was stored. You can close this page whenever you're ready.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate("/helpline")}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            View Emergency Helplines
          </button>
          <button
            onClick={handleSafeClose}
            className="w-full rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Close this page safely
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-muted-foreground" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Quiet Help Signal</h1>
      </header>

      <main id="main-content" role="main" className="mx-auto max-w-lg px-4 py-6 space-y-6">
        <div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
          <strong>Anonymous & safe.</strong> No login required. Your identity is never recorded.
        </div>

        {/* Urgency */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">
            How urgent is your situation?
          </legend>
          <div className="space-y-2" role="radiogroup">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={urgency === opt.value}
                onClick={() => setUrgency(opt.value)}
                className={`w-full min-h-[48px] rounded-lg border p-3 text-left text-sm transition-colors ${
                  urgency === opt.value ? opt.color + " ring-2 ring-ring" : "border-border bg-card"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Resources needed */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">
            What do you need? <span className="font-normal text-muted-foreground">(select all that apply)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {resourceOptions.map((opt) => (
              <button
                key={opt.value}
                aria-pressed={resources.includes(opt.value)}
                onClick={() => toggleResource(opt.value)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors ${
                  resources.includes(opt.value)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Zone */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">
            Your area <span className="font-normal text-muted-foreground">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {zoneOptions.map((z) => (
              <button
                key={z}
                aria-pressed={zone === z}
                onClick={() => setZone(zone === z ? "" : z)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors ${
                  zone === z
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Safe contact */}
        <div>
          <label htmlFor="contact-method" className="mb-2 block text-sm font-semibold text-foreground">
            Safe contact method <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="contact-method"
            type="text"
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value)}
            placeholder="e.g. WhatsApp, SMS, call — include a safe time"
            className="w-full min-h-[48px] rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Consent */}
        <label className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-border accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            I consent to this de-identified information being shared with trained responders to coordinate help.
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={submitting || !urgency}
          className="w-full min-h-[48px] rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send Signal"}
        </button>
      </main>
    </div>
  );
};

export default QuietSignal;
