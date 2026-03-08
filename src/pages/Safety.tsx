import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const safetySteps = [
  "Identify a safe person you can call in an emergency.",
  "Pack an emergency bag with essentials (ID, money, phone charger).",
  "Save important numbers in a disguised contact name.",
  "Know the nearest safe house or police station (Gender Desk).",
  "Have a code word with someone you trust.",
  "If online, clear your browser history regularly.",
];

const Safety = () => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<boolean[]>(new Array(safetySteps.length).fill(false));
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggle = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-muted-foreground" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Safety Plan</h1>
      </header>

      <main id="main-content" role="main" className="mx-auto max-w-lg px-4 py-6">
        {isOffline && (
          <div className="mb-4 rounded-md bg-accent px-3 py-2 text-center text-xs font-medium text-accent-foreground" role="status">
            You are offline — this page is available from saved data
          </div>
        )}

        <div className="mb-6 flex items-center gap-3 rounded-lg bg-secondary p-4">
          <Shield className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-secondary-foreground">
            A safety plan helps you prepare for dangerous situations. Check off each step as you complete it.
          </p>
        </div>

        <div className="space-y-3" role="list" aria-label="Safety plan steps">
          {safetySteps.map((step, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => toggle(i)}
              role="listitem"
              aria-pressed={checked[i]}
              aria-label={`Step ${i + 1}: ${step} — ${checked[i] ? "completed" : "not completed"}`}
              className={`flex w-full min-h-[56px] items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                checked[i]
                  ? "border-safe/40 bg-safe/5"
                  : "border-border bg-card"
              }`}
            >
              <CheckCircle2
                className={`mt-0.5 h-5 w-5 shrink-0 transition-colors ${
                  checked[i] ? "text-safe" : "text-muted-foreground/40"
                }`}
                aria-hidden="true"
              />
              <span className={`text-sm ${checked[i] ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
            </motion.button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This checklist is stored only on your device and can be cleared with the exit button.
        </p>
      </main>
    </div>
  );
};

export default Safety;
