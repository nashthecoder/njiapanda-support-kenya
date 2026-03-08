import { Eye, Wifi, BookOpen } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";

export default function AccessibilityToolbar() {
  const { highContrast, lowBandwidth, simpleLanguage, toggleHighContrast, toggleLowBandwidth, toggleSimpleLanguage } =
    useAccessibility();

  return (
    <div className="flex items-center gap-1" role="toolbar" aria-label="Accessibility options">
      <button
        onClick={toggleHighContrast}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors ${
          highContrast
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card text-muted-foreground hover:text-foreground"
        }`}
        aria-label={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
        aria-pressed={highContrast}
        title="High contrast"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={toggleLowBandwidth}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors ${
          lowBandwidth
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card text-muted-foreground hover:text-foreground"
        }`}
        aria-label={lowBandwidth ? "Disable low data mode" : "Enable low data mode"}
        aria-pressed={lowBandwidth}
        title="Low data mode"
      >
        <Wifi className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={toggleSimpleLanguage}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors ${
          simpleLanguage
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card text-muted-foreground hover:text-foreground"
        }`}
        aria-label={simpleLanguage ? "Switch to standard language" : "Switch to simple language"}
        aria-pressed={simpleLanguage}
        title="Simple language"
      >
        <BookOpen className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
