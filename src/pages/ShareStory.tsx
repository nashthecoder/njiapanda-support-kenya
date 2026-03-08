import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const abuseTypes = ["Physical", "Sexual", "Emotional", "Economic", "Other"];
const languages = ["English", "Kiswahili", "Sheng"];

const ShareStory = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [abuseType, setAbuseType] = useState("");
  const [language, setLanguage] = useState("English");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Please share your story before submitting.");
      return;
    }
    const { error } = await supabase.from("stories").insert({
      text,
      abuse_type: abuseType || null,
      language,
      status: "pending",
      source: "app",
    });
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("Your story has been received. You are brave. 💚");
    setText("");
    setAbuseType("");
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Share Your Story</h1>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          This is a safe space. You can share anonymously. Choose a language you're most comfortable with.
        </p>

        {/* Language */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Language</label>
          <div className="flex gap-2">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
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
          <label className="mb-1.5 block text-sm font-medium text-foreground">Type of abuse (optional)</label>
          <div className="flex flex-wrap gap-2">
            {abuseTypes.map((t) => (
              <button
                key={t}
                type="button"
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

        {/* Story text */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Your story</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Tell us what happened... We're listening."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button type="submit" size="lg" className="w-full">
          <Send className="h-4 w-4" />
          Submit Anonymously
        </Button>
      </form>
    </div>
  );
};

export default ShareStory;
