import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Send, Phone, Filter, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

type Lang = "en" | "sw";

const t: Record<string, Record<Lang, string>> = {
  title: { en: "Story Library", sw: "Maktaba ya Hadithi" },
  subtitle: {
    en: "Real stories from survivors. You are not alone.",
    sw: "Hadithi halisi kutoka kwa walionusurika. Huko si peke yako.",
  },
  familiar: { en: "This sounds familiar", sw: "Hii inanisikika" },
  needHelp: { en: "I need help", sw: "Nahitaji msaada" },
  filterAll: { en: "All", sw: "Zote" },
  noStories: {
    en: "No stories yet. Be the first to share.",
    sw: "Hakuna hadithi bado. Kuwa wa kwanza kushiriki.",
  },
  shareTitle: { en: "Share Your Story", sw: "Shiriki Hadithi Yako" },
  shareDesc: {
    en: "This is a safe space. You can share anonymously.",
    sw: "Hapa ni sehemu salama. Unaweza kushiriki bila kutambulishwa.",
  },
  storyPlaceholder: {
    en: "Tell us what happened... We're listening.",
    sw: "Tuambie kilichotokea... Tunakusikiliza.",
  },
  typeLabel: { en: "Type of abuse (optional)", sw: "Aina ya unyanyasaji (hiari)" },
  submit: { en: "Submit Anonymously", sw: "Wasilisha Bila Jina" },
  submitted: {
    en: "Your story has been received. You are brave. 💚",
    sw: "Hadithi yako imepokelewa. Wewe ni jasiri. 💚",
  },
  emptyText: {
    en: "Please share your story before submitting.",
    sw: "Tafadhali shiriki hadithi yako kabla ya kuwasilisha.",
  },
};

const abuseTypes = [
  "Physical", "Sexual", "Emotional", "Economic",
  "financial_abuse", "digital_surveillance", "isolation",
  "coercive_control", "physical_abuse", "reproductive_coercion",
  "psychological_abuse", "public_humiliation", "stalking",
  "sexual_coercion", "spiritual_abuse", "elder_abuse",
  "workplace_abuse", "child_marriage", "Other",
];

const abuseTypeLabels: Record<string, Record<string, string>> = {
  Physical: { en: "Physical", sw: "Kimwili" },
  Sexual: { en: "Sexual", sw: "Kingono" },
  Emotional: { en: "Emotional", sw: "Kihisia" },
  Economic: { en: "Economic", sw: "Kiuchumi" },
  financial_abuse: { en: "Financial Abuse", sw: "Unyanyasaji wa Kifedha" },
  digital_surveillance: { en: "Digital Surveillance", sw: "Ufuatiliaji wa Kidijitali" },
  isolation: { en: "Isolation", sw: "Kutengwa" },
  coercive_control: { en: "Coercive Control", sw: "Udhibiti wa Kulazimisha" },
  physical_abuse: { en: "Physical Abuse", sw: "Unyanyasaji wa Kimwili" },
  reproductive_coercion: { en: "Reproductive Coercion", sw: "Kulazimishwa Uzazi" },
  psychological_abuse: { en: "Psychological Abuse", sw: "Unyanyasaji wa Kisaikolojia" },
  public_humiliation: { en: "Public Humiliation", sw: "Kudhalilishwa Hadharani" },
  stalking: { en: "Stalking", sw: "Kufuatiliwa" },
  sexual_coercion: { en: "Sexual Coercion", sw: "Kulazimishwa Kingono" },
  spiritual_abuse: { en: "Spiritual Abuse", sw: "Unyanyasaji wa Kiroho" },
  elder_abuse: { en: "Elder Abuse", sw: "Unyanyasaji wa Wazee" },
  workplace_abuse: { en: "Workplace Abuse", sw: "Unyanyasaji Kazini" },
  child_marriage: { en: "Child Marriage", sw: "Ndoa ya Watoto" },
  Other: { en: "Other", sw: "Nyingine" },
};

type Story = {
  id: string;
  text: string;
  title: string | null;
  swahili_text: string | null;
  message: string | null;
  abuse_type: string | null;
  resonance_count: number;
  created_at: string;
};

const StoryLibrary = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>("en");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [resonated, setResonated] = useState<Set<string>>(new Set());

  // Submission form state
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [abuseType, setAbuseType] = useState("");

  // Dev-only font debug
  const [showFontDebug, setShowFontDebug] = useState(false);
  const isDev = import.meta.env.DEV;

  const fetchStories = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("stories")
      .select("id, text, title, swahili_text, message, abuse_type, resonance_count, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (filter !== "All") {
      query = query.eq("abuse_type", filter);
    }

    if (searchQuery.trim()) {
      query = query.ilike("text", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (!error && data) setStories(data);
    setLoading(false);
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleResonate = async (storyId: string) => {
    if (resonated.has(storyId)) return;
    setResonated((prev) => new Set(prev).add(storyId));
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId ? { ...s, resonance_count: s.resonance_count + 1 } : s
      )
    );
    await supabase.rpc("increment_resonance" as any, { story_id: storyId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error(t.emptyText[lang]);
      return;
    }
    const { data, error } = await supabase
      .from("stories")
      .insert({
        text,
        abuse_type: abuseType || null,
        language: lang === "en" ? "English" : "Kiswahili",
        status: "pending",
        source: "app",
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    // Trigger moderation in background
    if (data?.id) {
      supabase.functions.invoke("moderate-story", {
        body: { story_id: data.id, text },
      });
    }

    toast.success(t.submitted[lang]);
    setText("");
    setAbuseType("");
    setShowForm(false);
  };

  const label = (key: string) => t[key]?.[lang] ?? key;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground">
            {label("title")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isDev && (
            <button
              onClick={() => setShowFontDebug(!showFontDebug)}
              className="rounded border border-dashed border-muted-foreground/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted"
              title="Toggle font debug"
            >
              🔤
            </button>
          )}
          <button
            onClick={() => setLang(lang === "en" ? "sw" : "en")}
            className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-colors"
          >
            {lang === "en" ? "SW" : "EN"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5">
        <p className="mb-4 text-sm text-muted-foreground">{label("subtitle")}</p>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "en" ? "Search stories…" : "Tafuta hadithi…"}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {["All", ...abuseTypes].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                filter === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {lang === "sw" && type !== "All"
                ? abuseTypeLabels[type]?.sw || type
                : type === "All"
                ? label("filterAll")
                : abuseTypeLabels[type]?.en || type}
            </button>
          ))}
        </div>

        {/* Story Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {label("noStories")}
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {stories.map((story, i) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  {story.abuse_type && (
                    <Badge variant="secondary" className="mb-2 font-mono text-xs">
                      {lang === "sw"
                        ? abuseTypeLabels[story.abuse_type]?.sw || story.abuse_type
                        : abuseTypeLabels[story.abuse_type]?.en || story.abuse_type}
                    </Badge>
                  )}
                  {story.title && (
                    <h3 className="mb-2 font-display text-base font-semibold text-foreground">
                      {story.title}
                    </h3>
                  )}
                  <p
                    data-font-debug
                    className="story-body mb-3 text-sm leading-relaxed text-card-foreground [font-family:var(--font-serif)]"
                  >
                    {lang === "sw" && story.swahili_text ? story.swahili_text : story.text}
                  </p>
                  {showFontDebug && (
                    <div className="mb-2 rounded bg-muted/60 px-2 py-1 font-mono text-[9px] text-muted-foreground">
                      font-family:{" "}
                      <span className="text-foreground">
                        {typeof window !== "undefined" &&
                          (() => {
                            const el = document.querySelector(`[data-font-debug]`);
                            return el ? getComputedStyle(el).fontFamily : "N/A";
                          })()}
                      </span>
                    </div>
                  )}
                  {story.message && (
                    <p className="mb-3 rounded-md bg-primary/5 px-3 py-2 text-xs italic leading-relaxed text-primary [font-family:var(--font-serif)]">
                      💚 {story.message}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResonate(story.id)}
                      disabled={resonated.has(story.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        resonated.has(story.id)
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          resonated.has(story.id) ? "fill-primary" : ""
                        }`}
                      />
                      {label("familiar")}{" "}
                      {story.resonance_count > 0 && (
                        <span className="text-muted-foreground">
                          · {story.resonance_count}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => navigate("/helpline")}
                      className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {label("needHelp")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Share Story Toggle */}
        <div className="mt-8">
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4" />
              {label("shareTitle")}
            </Button>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleSubmit}
              className="space-y-4 rounded-lg border border-border bg-card p-4"
            >
              <p className="text-sm text-muted-foreground">{label("shareDesc")}</p>

              {/* Abuse type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  {label("typeLabel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {abuseTypes.map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setAbuseType(abuseType === tp ? "" : tp)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        abuseType === tp
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {lang === "sw" ? abuseTypeLabels[tp]?.sw || tp : abuseTypeLabels[tp]?.en || tp}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder={label("storyPlaceholder")}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="flex gap-2">
                <Button type="submit" size="lg" className="flex-1">
                  <Send className="h-4 w-4" />
                  {label("submit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowForm(false)}
                >
                  ✕
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryLibrary;
