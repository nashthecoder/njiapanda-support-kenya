import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const helplines = [
  { name: "GBV Hotline (National)", number: "1195", available: "24/7" },
  { name: "Childline Kenya", number: "116", available: "24/7" },
  { name: "Kenya Red Cross", number: "1199", available: "24/7" },
  { name: "Police Emergency", number: "999", available: "24/7" },
  { name: "FIDA Kenya", number: "+254 20 2719913", available: "Mon–Fri" },
];

const Helpline = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-muted-foreground" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Emergency Helplines</h1>
      </header>

      <main id="main-content" role="main" className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 rounded-lg bg-emergency/10 p-4 text-center" role="alert">
          <Phone className="mx-auto mb-2 h-8 w-8 text-emergency" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">
            If you are in immediate danger, call <strong>999</strong> or <strong>1195</strong>.
          </p>
        </div>

        <div className="space-y-3" role="list" aria-label="Emergency helplines">
          {helplines.map((h, i) => (
            <div
              key={i}
              role="listitem"
              className="flex min-h-[64px] items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <h3 className="font-semibold text-card-foreground">{h.name}</h3>
                <p className="text-xs text-muted-foreground">{h.available}</p>
              </div>
              <a href={`tel:${h.number}`} aria-label={`Call ${h.name} at ${h.number}`}>
                <Button size="sm" variant="default" className="min-h-[44px] gap-1.5">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {h.number}
                </Button>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-4 text-center">
          <MessageCircle className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Prefer texting? SMS <strong>"HELP"</strong> to <strong>1195</strong>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Helpline;
