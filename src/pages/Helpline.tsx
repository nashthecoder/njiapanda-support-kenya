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
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Emergency Helplines</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 rounded-lg bg-emergency/10 p-4 text-center">
          <Phone className="mx-auto mb-2 h-8 w-8 text-emergency" />
          <p className="text-sm font-medium text-foreground">
            If you are in immediate danger, call <strong>999</strong> or <strong>1195</strong>.
          </p>
        </div>

        <div className="space-y-3">
          {helplines.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <h3 className="font-semibold text-card-foreground">{h.name}</h3>
                <p className="text-xs text-muted-foreground">{h.available}</p>
              </div>
              <a href={`tel:${h.number}`}>
                <Button size="sm" variant="default" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {h.number}
                </Button>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-4 text-center">
          <MessageCircle className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">
            Prefer texting? SMS <strong>"HELP"</strong> to <strong>1195</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Helpline;
