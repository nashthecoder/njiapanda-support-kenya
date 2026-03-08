import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Resource = {
  id: string;
  name: string;
  type: string | null;
  zone: string | null;
  contact: string | null;
  hours: string | null;
  verified: boolean | null;
};

const ZONES = [
  "Nairobi East", "Nairobi West", "Mombasa", "Kisumu",
  "Nakuru", "Eldoret", "Nyeri", "Garissa", "Limuru",
];

const TYPES = ["Shelter", "Legal Aid", "Counselling", "Medical", "Hotline", "NGO", "Other"];

const EMPTY: Omit<Resource, "id"> = {
  name: "", type: "", zone: "", contact: "", hours: "", verified: false,
};

export default function AdminResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("resources").select("*").order("name");
    setResources(data ?? []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({ name: r.name, type: r.type, zone: r.zone, contact: r.contact, hours: r.hours, verified: r.verified });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type || null,
      zone: form.zone || null,
      contact: form.contact?.trim() || null,
      hours: form.hours?.trim() || null,
      verified: form.verified ?? false,
    };

    if (editing) {
      const { error } = await supabase.from("resources").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else { toast.success("Resource updated"); fetch(); }
    } else {
      const { error } = await supabase.from("resources").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Resource added"); fetch(); }
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (r: Resource) => {
    if (!confirm(`Delete "${r.name}"?`)) return;
    const { error } = await supabase.from("resources").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setResources((prev) => prev.filter((x) => x.id !== r.id)); }
  };

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">Resources</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Add Resource</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : resources.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No resources yet.</CardContent></Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Zone</th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Verified</th>
                <th className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-xs">{r.type ?? "—"}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.zone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`font-mono text-[10px] uppercase ${r.verified ? "border-safe/30 bg-safe/10 text-safe" : "border-muted bg-muted/30 text-muted-foreground"}`}>
                      {r.verified ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. FIDA Kenya" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select value={form.type ?? ""} onValueChange={(v) => update("type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zone</Label>
                <Select value={form.zone ?? ""} onValueChange={(v) => update("zone", v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Contact</Label><Input value={form.contact ?? ""} onChange={(e) => update("contact", e.target.value)} placeholder="Phone or email" /></div>
            <div><Label>Hours</Label><Input value={form.hours ?? ""} onChange={(e) => update("hours", e.target.value)} placeholder="e.g. Mon–Fri 8am–5pm" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={!!form.verified} onCheckedChange={(v) => update("verified", v)} />
              <Label>Verified organisation</Label>
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
