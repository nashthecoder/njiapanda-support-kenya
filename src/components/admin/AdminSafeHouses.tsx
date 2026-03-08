import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type SafeHouse = {
  id: string;
  zone: string | null;
  type: string | null;
  capacity_status: string | null;
  updated_at: string;
};

const ZONES = [
  "Nairobi East", "Nairobi West", "Mombasa", "Kisumu",
  "Nakuru", "Eldoret", "Nyeri", "Garissa", "Limuru",
];
const TYPES = ["Women", "Children", "Mixed", "Emergency"];
const STATUSES = ["available", "limited", "full"];

const EMPTY = { zone: "", type: "", capacity_status: "available" };

export default function AdminSafeHouses() {
  const [houses, setHouses] = useState<SafeHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SafeHouse | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("safe_houses").select("*").order("zone");
    setHouses(data ?? []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (h: SafeHouse) => {
    setEditing(h);
    setForm({ zone: h.zone ?? "", type: h.type ?? "", capacity_status: h.capacity_status ?? "available" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.zone) { toast.error("Zone is required"); return; }
    setSaving(true);
    const payload = {
      zone: form.zone || null,
      type: form.type || null,
      capacity_status: form.capacity_status || "available",
    };

    if (editing) {
      const { error } = await supabase.from("safe_houses").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message); else { toast.success("Updated"); fetchData(); }
    } else {
      const { error } = await supabase.from("safe_houses").insert(payload);
      if (error) toast.error(error.message); else { toast.success("Safe house added"); fetchData(); }
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (h: SafeHouse) => {
    if (!confirm("Delete this safe house?")) return;
    const { error } = await supabase.from("safe_houses").delete().eq("id", h.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setHouses((p) => p.filter((x) => x.id !== h.id)); }
  };

  const statusColor = (s: string | null) => {
    if (s === "available") return "border-safe/30 bg-safe/10 text-safe";
    if (s === "limited") return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    return "border-destructive/30 bg-destructive/10 text-destructive";
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">Safe Houses</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Add Safe House</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : houses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No safe houses yet.</CardContent></Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Zone</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Capacity</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Updated</th>
                <th className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{h.zone ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-xs">{h.type ?? "—"}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge className={`font-mono text-[10px] uppercase ${statusColor(h.capacity_status)}`}>
                      {h.capacity_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(h.updated_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(h)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(h)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Safe House" : "Add Safe House"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Zone *</Label>
              <Select value={form.zone} onValueChange={(v) => setForm((p) => ({ ...p, zone: v }))}>
                <SelectTrigger><SelectValue placeholder="Select zone…" /></SelectTrigger>
                <SelectContent>{ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacity Status</Label>
              <Select value={form.capacity_status} onValueChange={(v) => setForm((p) => ({ ...p, capacity_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
