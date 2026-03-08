import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Signal = {
  id: string;
  urgency: string;
  zone: string | null;
  resource_needed: string | null;
  consent: boolean | null;
  created_at: string;
};

export default function AdminSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setSignals(data ?? []);
      setLoading(false);
    })();
  }, []);

  const urgencyColor = (u: string) => {
    if (u === "high") return "border-destructive/30 bg-destructive/10 text-destructive";
    if (u === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    return "border-safe/30 bg-safe/10 text-safe";
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">Signals</h2>
        <Badge variant="secondary" className="font-mono text-xs">{signals.length} total</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : signals.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No signals yet.</CardContent></Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Urgency</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Zone</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Need</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Consent</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`font-mono text-[10px] uppercase ${urgencyColor(s.urgency)}`}>{s.urgency}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.zone ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{s.resource_needed ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-mono text-[10px]">{s.consent ? "Yes" : "No"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
