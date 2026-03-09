import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit3 } from "lucide-react";
import { toast } from "sonner";

type Story = {
  id: string;
  text: string;
  title: string | null;
  abuse_type: string | null;
  language: string | null;
  created_at: string;
  status: string | null;
  tags: string[] | null;
};

export default function AdminStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stories")
      .select("id, text, title, abuse_type, language, created_at, status, tags")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setStories(data ?? []);
    setLoading(false);
  };

  const approve = async (id: string, text?: string) => {
    const update: any = { status: "approved" };
    if (text) update.text = text;
    await supabase.from("stories").update(update).eq("id", id);
    await supabase.from("audit_log" as any).insert({
      action: "approve",
      entity_type: "story",
      entity_id: id,
      details: text ? { edited: true } : {},
    });
    setStories((prev) => prev.filter((s) => s.id !== id));
    setEditingId(null);
    toast.success("Story approved");
  };

  const reject = async (id: string) => {
    await supabase.from("stories").update({ status: "rejected" }).eq("id", id);
    await supabase.from("audit_log" as any).insert({
      action: "reject",
      entity_type: "story",
      entity_id: id,
      details: rejectReason ? { reason: rejectReason } : {},
    });
    setStories((prev) => prev.filter((s) => s.id !== id));
    setRejectId(null);
    setRejectReason("");
    toast.success("Story rejected");
  };

  const startEdit = (story: Story) => {
    setEditingId(story.id);
    setEditText(story.text);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">Story Moderation</h2>
        <Badge variant="secondary" className="font-mono text-xs">
          {stories.length} pending
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PartyPopper className="mx-auto mb-2 h-8 w-8 text-primary" />
            No stories pending moderation.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden">
              <CardContent className="p-5">
                {/* Meta row */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {story.abuse_type && (
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {story.abuse_type}
                    </Badge>
                  )}
                  {story.language && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {story.language}
                    </Badge>
                  )}
                  {story.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-mono text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {new Date(story.created_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Story text or editor */}
                {editingId === story.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={6}
                      className="font-serif text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(story.id, editText)} className="gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Save & Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : rejectId === story.id ? (
                  <div className="space-y-3">
                    <p className="font-serif text-sm leading-relaxed text-foreground">{story.text}</p>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (internal only)…"
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reject(story.id)}
                        className="gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Confirm Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectId(null);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mb-4 font-serif text-sm leading-relaxed text-foreground">
                      {story.text}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approve(story.id)}
                        className="gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectId(story.id)}
                        className="gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(story)}
                        className="gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit & Approve
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
