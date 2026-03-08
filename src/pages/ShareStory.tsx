import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, PenLine, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AudioRecorder from "@/components/AudioRecorder";

const abuseTypes = ["Physical", "Sexual", "Emotional", "Economic", "Other"];
const languages = ["English", "Kiswahili", "Sheng"];

type InputMode = "text" | "audio";

const ShareStory = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [abuseType, setAbuseType] = useState("");
  const [language, setLanguage] = useState("English");
  const [mode, setMode] = useState<InputMode>("text");
  const [submitting, setSubmitting] = useState(false);

  const submitStory = async (storyText: string) => {
    if (!storyText.trim()) {
      toast.error("Please share your story before submitting.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("stories")
      .insert({
        text: storyText,
        abuse_type: abuseType || null,
        language,
        status: "pending",
        source: mode === "audio" ? "voice" : "app",
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    // Trigger moderation in background
    if (data?.id) {
      supabase.functions.invoke("moderate-story", {
        body: { story_id: data.id, text: storyText },
      });
    }
    toast.success("Your story has been received. You are brave. 💚");
    setText("");
    setAbuseType("");
    setMode("text");
    setSubmitting(false);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitStory(text);
  };

  const handleAudioTranscript = async (transcript: string) => {
    await submitStory(transcript);
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">
          Share Your Story
        </h1>
      </header>

      <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          This is a safe space. You can share anonymously. Choose a language you're
          most comfortable with.
        </p>

        {/* Input mode toggle */}
        <div
          className="flex gap-2 rounded-lg border border-border bg-muted/30 p-1"
          role="radiogroup"
          aria-label="Choose how to share your story"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "text"}
            onClick={() => setMode("text")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              mode === "text"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Type your story
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "audio"}
            onClick={() => setMode("audio")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              mode === "audio"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            Speak your story
          </button>
        </div>

        {/* Language */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Language
          </label>
          <div className="flex gap-2" role="radiogroup" aria-label="Select language">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={language === l}
                onClick={() => setLanguage(l)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  language === l
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Abuse type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Type of abuse (optional)
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select abuse type">
            {abuseTypes.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={abuseType === t}
                onClick={() => setAbuseType(abuseType === t ? "" : t)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  abuseType === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content area — text or audio */}
        {mode === "text" ? (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="story-text"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Your story
              </label>
              <textarea
                id="story-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Tell us what happened... We're listening."
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-describedby="story-hint"
              />
              <p id="story-hint" className="sr-only">
                Share your experience anonymously. Only text you submit will be stored.
              </p>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitting ? "Submitting…" : "Submit Anonymously"}
            </Button>
          </form>
        ) : (
          <AudioRecorder onTranscript={handleAudioTranscript} />
        )}
      </div>
    </div>
  );
};

export default ShareStory;
