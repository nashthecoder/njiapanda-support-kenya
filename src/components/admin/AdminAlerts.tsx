import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type EscalationRules = {
  urgent_minutes: number;
  emergency_minutes: number;
  admin_email: string;
};

export default function AdminAlerts() {
  const [rules, setRules] = useState<EscalationRules>({
    urgent_minutes: 30,
    emergency_minutes: 60,
    admin_email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("platform_config" as any)
      .select("value")
      .eq("key", "escalation_rules")
      .single();
    if (data) {
      const val = (data as any).value as EscalationRules;
      setRules({
        urgent_minutes: val.urgent_minutes ?? 30,
        emergency_minutes: val.emergency_minutes ?? 60,
        admin_email: val.admin_email ?? "",
      });
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_config" as any)
      .update({ value: rules as any, updated_at: new Date().toISOString() } as any)
      .eq("key", "escalation_rules");
    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      toast.success("Escalation rules saved");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <h2 className="mb-6 font-display text-2xl font-semibold">Alert Configuration</h2>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">
        Alert Configuration
      </h2>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="font-display text-lg">Escalation Rules</CardTitle>
          <CardDescription>
            Configure how quickly unactioned signals escalate to admin alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="urgent-min" className="font-mono text-xs uppercase tracking-wider">
              Urgent signal escalation (minutes)
            </Label>
            <Input
              id="urgent-min"
              type="number"
              min={1}
              value={rules.urgent_minutes}
              onChange={(e) =>
                setRules((r) => ({ ...r, urgent_minutes: parseInt(e.target.value) || 0 }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Time before an unactioned <strong>urgent</strong> signal triggers an admin alert.
            </p>
          </div>

          <div>
            <Label htmlFor="emergency-min" className="font-mono text-xs uppercase tracking-wider">
              Emergency signal escalation (minutes)
            </Label>
            <Input
              id="emergency-min"
              type="number"
              min={1}
              value={rules.emergency_minutes}
              onChange={(e) =>
                setRules((r) => ({ ...r, emergency_minutes: parseInt(e.target.value) || 0 }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Time before an unactioned <strong>emergency</strong> signal triggers an admin alert.
            </p>
          </div>

          <div>
            <Label htmlFor="admin-email" className="font-mono text-xs uppercase tracking-wider">
              Admin escalation email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@njiapanda.org"
              value={rules.admin_email}
              onChange={(e) => setRules((r) => ({ ...r, admin_email: e.target.value }))}
            />
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save Escalation Rules"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
