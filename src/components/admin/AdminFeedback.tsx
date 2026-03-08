import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bug, Mail, Lightbulb, MessageSquare, Check, Clock, Archive } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type FeedbackType = "bug" | "contact" | "suggestion" | "other";
type FeedbackStatus = "new" | "in_progress" | "resolved";

interface Feedback {
  id: string;
  type: FeedbackType;
  message: string;
  email: string | null;
  page_url: string | null;
  status: string;
  created_at: string;
}

const typeConfig: Record<FeedbackType, { icon: typeof Bug; label: string; color: string }> = {
  bug: { icon: Bug, label: "Bug", color: "bg-destructive/10 text-destructive" },
  contact: { icon: Mail, label: "Contact", color: "bg-primary/10 text-primary" },
  suggestion: { icon: Lightbulb, label: "Suggestion", color: "bg-warning/10 text-warning" },
  other: { icon: MessageSquare, label: "Other", color: "bg-muted text-muted-foreground" },
};

const statusConfig: Record<FeedbackStatus, { icon: typeof Clock; label: string; color: string }> = {
  new: { icon: Clock, label: "New", color: "bg-primary text-primary-foreground" },
  in_progress: { icon: Archive, label: "In Progress", color: "bg-warning text-warning-foreground" },
  resolved: { icon: Check, label: "Resolved", color: "bg-safe text-safe-foreground" },
};

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchFeedback = async () => {
    setLoading(true);
    let query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter as FeedbackType);
    }
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching feedback:", error);
    } else {
      setFeedback(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, [typeFilter, statusFilter]);

  const updateStatus = async (id: string, newStatus: FeedbackStatus) => {
    const { error } = await supabase
      .from("feedback")
      .update({
        status: newStatus,
        resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      fetchFeedback();
    }
  };

  const counts = {
    total: feedback.length,
    new: feedback.filter((f) => f.status === "new").length,
    bugs: feedback.filter((f) => f.type === "bug").length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Feedback Inbox
        </h1>
        <p className="text-muted-foreground">
          Review and respond to user feedback
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{counts.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-primary">{counts.new}</p>
          <p className="text-sm text-muted-foreground">New</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-destructive">{counts.bugs}</p>
          <p className="text-sm text-muted-foreground">Bug Reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="bug">Bug Reports</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="suggestion">Suggestions</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : feedback.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => {
            const typeInfo = typeConfig[item.type as FeedbackType] || typeConfig.other;
            const statusInfo = statusConfig[item.status as FeedbackStatus] || statusConfig.new;
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className={typeInfo.color} variant="outline">
                      <TypeIcon className="mr-1 h-3 w-3" />
                      {typeInfo.label}
                    </Badge>
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>

                <p className="mb-2 text-sm text-foreground whitespace-pre-wrap">
                  {item.message}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {item.email && (
                      <a
                        href={`mailto:${item.email}`}
                        className="text-primary hover:underline"
                      >
                        {item.email}
                      </a>
                    )}
                    {item.page_url && <span>Page: {item.page_url}</span>}
                  </div>

                  {item.status !== "resolved" && (
                    <div className="flex gap-2">
                      {item.status === "new" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(item.id, "in_progress")}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateStatus(item.id, "resolved")}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
