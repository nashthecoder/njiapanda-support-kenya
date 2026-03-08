import { ArrowLeft, MapPin, Phone, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const resourcesList = [
  { name: "FIDA Kenya", type: "Legal Aid", zone: "Nairobi", contact: "+254 20 2719913", hours: "Mon–Fri 8am–5pm", verified: true },
  { name: "Gender Violence Recovery Centre", type: "Medical", zone: "Nairobi", contact: "+254 20 2726300", hours: "24/7", verified: true },
  { name: "COVAW", type: "Counselling", zone: "Nairobi", contact: "+254 20 2604831", hours: "Mon–Fri 8am–5pm", verified: true },
  { name: "Childline Kenya", type: "Helpline", zone: "National", contact: "116", hours: "24/7", verified: true },
  { name: "Healthcare Assistance Kenya", type: "Safe House", zone: "Mombasa", contact: "+254 41 2315836", hours: "24/7", verified: true },
];

const Resources = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Resources</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-3 px-4 py-6">
        {resourcesList.map((r, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">{r.name}</h3>
              {r.verified && (
                <span className="rounded-full bg-safe/10 px-2 py-0.5 text-xs font-medium text-safe">
                  Verified
                </span>
              )}
            </div>
            <p className="mb-2 text-xs font-medium text-primary">{r.type}</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>{r.zone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${r.contact}`} className="text-primary underline">{r.contact}</a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>{r.hours}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;
