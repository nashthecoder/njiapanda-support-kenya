import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogOut, Shield, AlertTriangle, Clock, Sparkles } from "lucide-react";
import CaseCard from "@/components/dashboard/CaseCard";
import SafeHousePanel from "@/components/dashboard/SafeHousePanel";
import { useSignalNotifications } from "@/hooks/useSignalNotifications";
import type { Tables } from "@/integrations/supabase/types";

type Signal = Tables<"signals">;
type Case = Tables<"cases">;

interface CaseWithSignal extends Case {
  signal?: Signal | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isConductor, signOut } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [cases, setCases] = useState<CaseWithSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [conductorZone, setConductorZone] = useState<string | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"signals" | "cases" | "safehouses">("signals");

  // Real-time notifications for new signals
  useSignalNotifications(isConductor);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && user && !isConductor) {
      toast.error("Access denied: Conductor role required");
      navigate("/");
    }
  }, [authLoading, user, isConductor, navigate]);

  useEffect(() => {
    if (!user || !isConductor) return;
    fetchData();
  }, [user, isConductor]);

  const fetchData = async () => {
    setLoading(true);

    // Resolve conductor's zone first
    const { data: zoneData } = await supabase.rpc("get_conductor_zone", {
      _user_id: user!.id,
    });
    const zone = zoneData as string | null;
    setConductorZone(zone);

    if (!zone) {
      setLoading(false);
      return;
    }

    const [signalsRes, casesRes] = await Promise.all([
      supabase.from("signals").select("*").eq("zone", zone).order("created_at", { ascending: false }),
      supabase.from("cases").select("*").order("updated_at", { ascending: false }),
    ]);

    if (signalsRes.data) setSignals(signalsRes.data);
    if (casesRes.data) {
      // Enrich cases with their signal data, then filter to zone
      const enriched: CaseWithSignal[] = (
        await Promise.all(
          casesRes.data.map(async (c) => {
            if (c.signal_id) {
              const { data: sig } = await supabase
                .from("signals")
                .select("*")
                .eq("id", c.signal_id)
                .single();
              return { ...c, signal: sig };
            }
            return { ...c, signal: null };
          })
        )
      ).filter((c) => c.signal?.zone === zone);
      setCases(enriched);
    }
    setLoading(false);
  };

  const createCaseFromSignal = async (signal: Signal) => {
    const { error } = await supabase.from("cases").insert({
      signal_id: signal.id,
      conductor_id: user?.id,
      status: "open",
      risk_level: signal.urgency === "emergency" ? "high" : signal.urgency === "urgent" ? "medium" : "low",
    });
    if (error) {
      toast.error("Failed to create case");
    } else {
      toast.success("Case created");
      fetchData();
    }
  };

  const updateCase = async (caseId: string, updates: Partial<Case>) => {
    const { error } = await supabase.from("cases").update(updates).eq("id", caseId);
    if (error) toast.error("Update failed");
    else {
      toast.success("Case updated");
      fetchData();
    }
  };

  // Signals not yet linked to a case
  const unresolvedSignals = signals.filter(
    (s) => !cases.some((c) => c.signal_id === s.id)
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (conductorZone === null) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-semibold text-foreground">Conductor Dashboard</h1>
            </div>
            <button
              onClick={async () => { await signOut(); navigate("/"); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-display text-xl font-semibold text-foreground">Zone not configured</h2>
          <p className="text-sm text-muted-foreground">
            Your zone has not been configured yet. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-display text-lg font-semibold text-foreground">Conductor Dashboard</h1>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs font-medium text-secondary-foreground">
              {conductorZone} · Conductor View
            </span>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl">
          {([
            { key: "signals" as const, label: "Incoming Signals", icon: AlertTriangle, count: unresolvedSignals.length },
            { key: "cases" as const, label: "Active Cases", icon: Clock, count: cases.filter(c => c.status !== "resolved").length },
            { key: "safehouses" as const, label: "Safe Houses", icon: Shield, count: null },
          ]).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== null && count > 0 && (
                <span className="rounded-full bg-emergency/10 px-2 py-0.5 font-mono text-xs font-semibold text-emergency">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {activeTab === "signals" && (
          <div className="space-y-3">
            {unresolvedSignals.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-safe" />
                <p className="text-muted-foreground">No unassigned signals</p>
              </div>
            ) : (
              unresolvedSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <UrgencyBadge urgency={signal.urgency} />
                        {signal.zone && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
                            {signal.zone}
                          </span>
                        )}
                        <span className="font-mono text-xs text-muted-foreground">
                          {timeAgo(signal.created_at)}
                        </span>
                      </div>
                      {signal.resource_needed && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {signal.resource_needed.split(", ").map((r) => (
                            <span key={r} className="rounded bg-accent px-2 py-0.5 font-mono text-xs text-accent-foreground">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Consent: {signal.consent ? "Yes" : "No"}
                      </p>
                    </div>
                    <button
                      onClick={() => createCaseFromSignal(signal)}
                      className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      Create Case
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "cases" && (
          <div className="space-y-3">
            {cases.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No cases yet</p>
              </div>
            ) : (
              cases.map((c) => (
                <CaseCard key={c.id} caseData={c} onUpdate={updateCase} />
              ))
            )}
          </div>
        )}

        {activeTab === "safehouses" && <SafeHousePanel />}
      </main>
    </div>
  );
};

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    emergency: { bg: "bg-emergency/10", text: "text-emergency", label: "🔴 Emergency" },
    urgent: { bg: "bg-warning/10", text: "text-warning", label: "🟠 Urgent" },
    information: { bg: "bg-safe/10", text: "text-safe", label: "🟢 Info" },
    medium: { bg: "bg-warning/10", text: "text-warning", label: "🟠 Medium" },
  };
  const c = config[urgency] ?? config.medium;
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default Dashboard;
