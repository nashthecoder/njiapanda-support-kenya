import { useState } from "react";
import { MessageSquarePlus, Bug, Mail, Lightbulb, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const feedbackTypes = [
  { id: "bug", label: "Report Bug", icon: Bug, color: "text-destructive" },
  { id: "contact", label: "Contact Us", icon: Mail, color: "text-primary" },
  { id: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-warning" },
] as const;

type FeedbackType = (typeof feedbackTypes)[number]["id"];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setType(null);
    setEmail("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !message.trim()) return;

    setSubmitting(true);
    try {
      // Insert feedback into database
      const { error: dbError } = await supabase.from("feedback").insert({
        type,
        message: message.trim(),
        email: email.trim() || null,
        page_url: window.location.pathname,
      });

      if (dbError) throw dbError;

      // Trigger email notification
      await supabase.functions.invoke("notify-feedback", {
        body: { type, message: message.trim(), email: email.trim() || null },
      });

      toast({
        title: "Thank you for your feedback!",
        description: "We'll review it and get back to you if needed.",
      });
      reset();
      setOpen(false);
    } catch (err) {
      console.error("Feedback submission error:", err);
      toast({
        title: "Couldn't submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg md:bottom-6"
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Send Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve Njiapanda. Your input matters.
          </DialogDescription>
        </DialogHeader>

        {!type ? (
          <div className="grid gap-2 py-2">
            {feedbackTypes.map((ft) => (
              <button
                key={ft.id}
                onClick={() => setType(ft.id)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
              >
                <ft.icon className={cn("h-5 w-5", ft.color)} />
                <span className="font-medium">{ft.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => setType(null)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <X className="h-3 w-3" /> Change
              </button>
              <span>•</span>
              <span className="capitalize">{type.replace("_", " ")}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email (optional)</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only if you'd like a response
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message *</Label>
              <Textarea
                id="feedback-message"
                placeholder={
                  type === "bug"
                    ? "Describe what happened and what you expected..."
                    : type === "contact"
                    ? "How can we help you?"
                    : "Share your idea or suggestion..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={submitting || !message.trim()}
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Feedback
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
