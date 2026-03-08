import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";

type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  approve: "bg-green-500/10 text-green-700 border-green-500/20",
  reject: "bg-red-500/10 text-red-700 border-red-500/20",
  create: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  update: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  delete: "bg-red-500/10 text-red-700 border-red-500/20",
  assign_role: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  remove_role: "bg-orange-500/10 text-orange-700 border-orange-500/20",
};

function getActionColor(action: string) {
  for (const [key, val] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return val;
  }
  return "bg-muted text-muted-foreground border-border";
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>("all");

  useEffect(() => {
    fetchEntries();
  }, [entityFilter]);

  const fetchEntries = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (entityFilter !== "all") {
      query = query.eq("entity_type", entityFilter);
    }

    const { data } = await query;
    setEntries((data as any as AuditEntry[]) ?? []);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-semibold text-foreground">Audit Log</h2>
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="story">Stories</SelectItem>
            <SelectItem value="role">Roles</SelectItem>
            <SelectItem value="conductor">Conductors</SelectItem>
            <SelectItem value="resource">Resources</SelectItem>
            <SelectItem value="safe_house">Safe Houses</SelectItem>
            <SelectItem value="signal">Signals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No audit entries yet. Actions will be logged here automatically.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 px-4 py-3">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] uppercase ${getActionColor(entry.action)}`}>
                  {entry.action}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{entry.entity_type}</span>
                    {entry.entity_id && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        {entry.entity_id.slice(0, 8)}…
                      </span>
                    )}
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {Object.entries(entry.details)
                          .slice(0, 3)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
