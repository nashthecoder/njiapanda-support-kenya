import { useState } from "react";
import { UrgencyBadge, timeAgo } from "@/pages/Dashboard";
import { Sparkles, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Signal = Tables<"signals">;
type Case = Tables<"cases">;

interface CaseWithSignal extends Case {
  signal?: Signal | null;
}

interface AIBrief {
  risk_level: string;
  detected_abuse_types: string[];
  suggested_resources: string[];
  immediate_safety_concern: boolean;
}

interface CaseCardProps {
  caseData: CaseWithSignal;
  onUpdate: (caseId: string, updates: Partial<Case>) => Promise<void>;
}

const statusOptions = ["open", "in_progress", "referred", "resolved"];

const CaseCard = ({ caseData, onUpdate }: CaseCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [aiBrief, setAiBrief] = useState<AIBrief | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAIBrief = async () => {
    if (aiBrief) {
      setAiBrief(null);
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-brief", {
        body: {
          signal: caseData.signal,
          case_notes: caseData.notes,
        },
      });
      if (error) throw error;
      setAiBrief(data as AIBrief);
    } catch (err) {
      console.error("AI Brief error:", err);
      toast.error("AI Brief unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const existing = caseData.notes || "";
    const timestamp = new Date().toLocaleString();
    const updated = `${existing}\n[${timestamp}] ${noteText}`.trim();
    await onUpdate(caseData.id, { notes: updated });
    setNoteText("");
  };

  const statusColor: Record<string, string> = {
    open: "bg-emergency/10 text-emergency",
    in_progress: "bg-warning/10 text-warning",
    referred: "bg-info/10 text-info",
    resolved: "bg-safe/10 text-safe",
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {caseData.signal && <UrgencyBadge urgency={caseData.signal.urgency} />}
            <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${statusColor[caseData.status ?? "open"]}`}>
              {caseData.status?.replace("_", " ") ?? "open"}
            </span>
            {caseData.risk_level && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                Risk: {caseData.risk_level}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Updated {timeAgo(caseData.updated_at)}
            </span>
          </div>

          {/* Resource tags from signal */}
          {caseData.signal?.resource_needed && (
            <div className="mb-2 flex flex-wrap gap-1">
              {caseData.signal.resource_needed.split(", ").map((r) => (
                <span key={r} className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {r}
                </span>
              ))}
            </div>
          )}

          {caseData.signal?.zone && (
            <span className="text-xs text-muted-foreground">Zone: {caseData.signal.zone}</span>
          )}
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
        <select
          value={caseData.status ?? "open"}
          onChange={(e) => onUpdate(caseData.id, { status: e.target.value })}
          className="rounded-lg border border-input bg-card px-2 py-1.5 text-xs text-foreground"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>

        <select
          value={caseData.risk_level ?? "medium"}
          onChange={(e) => onUpdate(caseData.id, { risk_level: e.target.value })}
          className="rounded-lg border border-input bg-card px-2 py-1.5 text-xs text-foreground"
        >
          {["low", "medium", "high", "critical"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <button
          onClick={fetchAIBrief}
          disabled={aiLoading}
          className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {aiLoading ? "Analysing…" : aiBrief ? "Hide AI Brief" : "AI Brief"}
        </button>
      </div>

      {/* AI Brief Panel */}
      {aiBrief && (
        <div className="border-t border-border bg-secondary/30 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Risk Assessment
            <span className="ml-auto text-[10px] font-normal text-muted-foreground">Session only — not stored</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Risk Level</span>
              <p className="font-semibold text-foreground">{aiBrief.risk_level}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Safety Concern</span>
              <p className={`font-semibold ${aiBrief.immediate_safety_concern ? "text-emergency" : "text-safe"}`}>
                {aiBrief.immediate_safety_concern ? "⚠ Immediate" : "✓ No immediate danger"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Detected Types</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {aiBrief.detected_abuse_types.map((t) => (
                  <span key={t} className="rounded bg-emergency/10 px-1.5 py-0.5 text-[11px] text-emergency">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Suggested Resources</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {aiBrief.suggested_resources.map((r) => (
                  <span key={r} className="rounded bg-safe/10 px-1.5 py-0.5 text-[11px] text-safe">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded: Notes */}
      {expanded && (
        <div className="border-t border-border p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Case Notes
          </h4>
          {caseData.notes && (
            <pre className="mb-3 whitespace-pre-wrap rounded bg-muted p-3 text-xs text-foreground">
              {caseData.notes}
            </pre>
          )}
          <div className="flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note…"
              className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => e.key === "Enter" && addNote()}
            />
            <button
              onClick={addNote}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseCard;
