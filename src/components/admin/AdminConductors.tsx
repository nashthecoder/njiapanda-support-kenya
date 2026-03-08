import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

type Conductor = {
  id: string;
  name: string;
  zone: string | null;
  active: boolean | null;
  role: string | null;
};

const ZONES = [
  "Nairobi East",
  "Nairobi West",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Nyeri",
  "Garissa",
];

export default function AdminConductors() {
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [editZone, setEditZone] = useState<{ id: string; zone: string } | null>(null);

  useEffect(() => {
    fetchConductors();
  }, []);

  const fetchConductors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("conductors")
      .select("*")
      .order("name");
    setConductors(data ?? []);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim(), {
        data: { role: "conductor" },
      });
      if (error) throw error;
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteOpen(false);
    } catch (err: any) {
      // Fallback: use edge function if admin API not available client-side
      toast.error("Could not send invite", { description: err.message });
    } finally {
      setInviting(false);
    }
  };

  const toggleActive = async (conductor: Conductor) => {
    const newActive = !conductor.active;
    await supabase.from("conductors").update({ active: newActive }).eq("id", conductor.id);
    setConductors((prev) =>
      prev.map((c) => (c.id === conductor.id ? { ...c, active: newActive } : c))
    );
    toast.success(`${conductor.name} ${newActive ? "activated" : "deactivated"}`);
  };

  const saveZone = async () => {
    if (!editZone) return;
    await supabase.from("conductors").update({ zone: editZone.zone }).eq("id", editZone.id);
    setConductors((prev) =>
      prev.map((c) => (c.id === editZone.id ? { ...c, zone: editZone.zone } : c))
    );
    toast.success("Zone updated");
    setEditZone(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">Conductors</h2>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Conductor
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : conductors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No conductors yet. Invite your first conductor above.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Zone
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {conductors.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {c.zone ?? "Unassigned"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`font-mono text-[10px] uppercase ${
                        c.active
                          ? "border-safe/30 bg-safe/10 text-safe"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {c.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {c.role ?? "conductor"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditZone({ id: c.id, zone: c.zone ?? "" })}
                      >
                        Edit Zone
                      </Button>
                      <Button
                        variant={c.active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleActive(c)}
                      >
                        {c.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Invite Conductor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="conductor@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Sending…" : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Modal */}
      <Dialog open={!!editZone} onOpenChange={(open) => !open && setEditZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Zone</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Zone</Label>
            <Select
              value={editZone?.zone ?? ""}
              onValueChange={(val) => editZone && setEditZone({ ...editZone, zone: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditZone(null)}>
              Cancel
            </Button>
            <Button onClick={saveZone}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
