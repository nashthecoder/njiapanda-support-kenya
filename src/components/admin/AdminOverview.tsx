import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, AlertTriangle, Clock, BookOpen, Users, Home } from "lucide-react";

type Props = { onNavigate: (tab: string) => void };

export default function AdminOverview({ onNavigate }: Props) {
  const [metrics, setMetrics] = useState({
    signalsThisWeek: 0,
    urgencyCounts: { emergency: 0, urgent: 0, "non-urgent": 0 } as Record<string, number>,
    avgResponseMin: 0,
    pendingStories: 0,
    activeConductors: 0,
    fullSafeHouses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString();

    // Parallel queries
    const [signalsRes, storiesRes, conductorsRes, safeHousesRes, casesRes] =
      await Promise.all([
        supabase.from("signals").select("id, urgency, created_at").gte("created_at", weekStr),
        supabase.from("stories").select("id").eq("status", "pending"),
        supabase.from("conductors").select("id").eq("active", true),
        supabase.from("safe_houses").select("id").eq("capacity_status", "full"),
        supabase
          .from("cases")
          .select("updated_at, signal_id, status")
          .not("status", "eq", "open"),
      ]);

    const signals = signalsRes.data ?? [];
    const urgencyCounts: Record<string, number> = { emergency: 0, urgent: 0, "non-urgent": 0 };
    signals.forEach((s) => {
      const key = s.urgency === "medium" ? "non-urgent" : s.urgency === "high" ? "urgent" : s.urgency === "emergency" ? "emergency" : "non-urgent";
      urgencyCounts[key] = (urgencyCounts[key] || 0) + 1;
    });

    // Average response time: diff between signal created_at and case first update
    let avgMin = 0;
    const cases = casesRes.data ?? [];
    if (cases.length > 0 && signals.length > 0) {
      // Build signal created_at lookup
      const signalMap = new Map(signals.map((s) => [s.id, new Date(s.created_at).getTime()]));
      let totalMs = 0;
      let count = 0;
      cases.forEach((c) => {
        if (c.signal_id && signalMap.has(c.signal_id)) {
          const diff = new Date(c.updated_at).getTime() - signalMap.get(c.signal_id)!;
          if (diff > 0) {
            totalMs += diff;
            count++;
          }
        }
      });
      if (count > 0) avgMin = Math.round(totalMs / count / 60000);
    }

    setMetrics({
      signalsThisWeek: signals.length,
      urgencyCounts,
      avgResponseMin: avgMin,
      pendingStories: storiesRes.data?.length ?? 0,
      activeConductors: conductorsRes.data?.length ?? 0,
      fullSafeHouses: safeHousesRes.data?.length ?? 0,
    });
    setLoading(false);
  };

  const maxUrgency = Math.max(...Object.values(metrics.urgencyCounts), 1);

  const cards = [
    {
      title: "Signals This Week",
      value: metrics.signalsThisWeek,
      icon: Radio,
      color: "text-primary",
    },
    {
      title: "Avg Response Time",
      value: `${metrics.avgResponseMin}m`,
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Pending Moderation",
      value: metrics.pendingStories,
      icon: BookOpen,
      color: "text-accent-foreground",
      onClick: () => onNavigate("stories"),
    },
    {
      title: "Active Conductors",
      value: metrics.activeConductors,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Safe Houses Full",
      value: metrics.fullSafeHouses,
      icon: Home,
      color: metrics.fullSafeHouses > 0 ? "text-destructive" : "text-safe",
      alert: metrics.fullSafeHouses > 0,
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <h2 className="mb-6 font-display text-2xl font-semibold">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">Overview</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric cards */}
        {cards.map((c) => (
          <Card
            key={c.title}
            className={`transition-shadow hover:shadow-md ${c.onClick ? "cursor-pointer" : ""} ${
              c.alert ? "border-destructive/40" : ""
            }`}
            onClick={c.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-3xl font-bold text-foreground">{c.value}</p>
              {c.onClick && (
                <p className="mt-1 text-xs text-muted-foreground underline">Go to Stories →</p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Urgency breakdown card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Signals by Urgency
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(["emergency", "urgent", "non-urgent"] as const).map((level) => (
              <div key={level} className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`w-24 justify-center font-mono text-[10px] uppercase ${
                    level === "emergency"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : level === "urgent"
                      ? "border-warning/30 bg-warning/10 text-warning"
                      : "border-border"
                  }`}
                >
                  {level}
                </Badge>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        level === "emergency"
                          ? "bg-destructive"
                          : level === "urgent"
                          ? "bg-warning"
                          : "bg-primary"
                      }`}
                      style={{
                        width: `${(metrics.urgencyCounts[level] / maxUrgency) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right font-mono text-sm font-bold text-foreground">
                  {metrics.urgencyCounts[level]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
