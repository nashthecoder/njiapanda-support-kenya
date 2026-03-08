import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Users, MapPin, Plug } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Expression = {
  id: string;
  type: string;
  name: string;
  organisation: string | null;
  role: string | null;
  zone: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  message: string | null;
  extra: any;
  status: string;
  created_at: string;
};

const TYPE_ICONS: Record<string, typeof Users> = {
  conductor: Users,
  organisation: MapPin,
  connect: Plug,
};

const TYPE_COLORS: Record<string, string> = {
  conductor: "bg-primary/10 text-primary",
  organisation: "bg-accent text-accent-foreground",
  connect: "bg-info/10 text-info",
};

export default function AdminPartners() {
  const [rows, setRows] = useState<Expression[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partner_expressions" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as any as Expression[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const markContacted = async (id: string) => {
    await supabase
      .from("partner_expressions" as any)
      .update({ status: "contacted" } as any)
      .eq("id", id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "contacted" } : r)));
    toast({ title: "Marked as contacted" });
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.type === filter);

  const counts = {
    all: rows.length,
    conductor: rows.filter((r) => r.type === "conductor").length,
    organisation: rows.filter((r) => r.type === "organisation").length,
    connect: rows.filter((r) => r.type === "connect").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Partner Expressions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submissions from the Join the Network page
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["all", "conductor", "organisation", "connect"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              filter === t ? "border-primary bg-secondary" : "border-border bg-card"
            }`}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t === "all" ? "Total" : t}
            </span>
            <p className="text-2xl font-bold text-foreground mt-1">{counts[t]}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const Icon = TYPE_ICONS[row.type] ?? Users;
            return (
              <div key={row.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 ${TYPE_COLORS[row.type] ?? ""}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{row.name}</p>
                      {row.organisation && (
                        <p className="text-xs text-muted-foreground">{row.organisation}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={row.status === "contacted" ? "secondary" : "default"} className="text-xs">
                      {row.status}
                    </Badge>
                    {row.status === "new" && (
                      <Button size="sm" variant="outline" onClick={() => markContacted(row.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Contacted
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  {row.zone && <span>📍 {row.zone}</span>}
                  {row.role && <span>👤 {row.role}</span>}
                  {row.contact_email && <span>✉ {row.contact_email}</span>}
                  {row.contact_phone && <span>📞 {row.contact_phone}</span>}
                </div>
                {row.message && (
                  <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded p-2">
                    {row.message}
                  </p>
                )}
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
