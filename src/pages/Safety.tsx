import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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

  const toggle = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Safety Plan</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-secondary p-4">
          <Shield className="h-8 w-8 shrink-0 text-primary" />
          <p className="text-sm text-secondary-foreground">
            A safety plan helps you prepare for dangerous situations. Check off each step as you complete it.
          </p>
        </div>

        <div className="space-y-3">
          {safetySteps.map((step, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => toggle(i)}
              className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                checked[i]
                  ? "border-safe/40 bg-safe/5"
                  : "border-border bg-card"
              }`}
            >
              <CheckCircle2
                className={`mt-0.5 h-5 w-5 shrink-0 transition-colors ${
                  checked[i] ? "text-safe" : "text-muted-foreground/40"
                }`}
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
      </div>
    </div>
  );
};

export default Safety;
