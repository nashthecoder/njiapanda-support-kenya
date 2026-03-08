import { X } from "lucide-react";

const EmergencyExitButton = () => {
  const handleExit = () => {
    // Clear all client-side storage
    sessionStorage.clear();
    localStorage.clear();
    // Replace history entry so back button won't return here
    window.location.replace("https://weather.com");
  };

  return (
    <button
      onClick={handleExit}
      className="fixed top-3 right-3 z-[9999] flex items-center gap-1.5 rounded-full bg-emergency px-3 py-2 text-xs font-semibold text-emergency-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 animate-pulse-soft"
      aria-label="Emergency exit — leave this site immediately"
    >
      <X className="h-4 w-4" />
      <span className="hidden sm:inline">Exit</span>
    </button>
  );
};

export default EmergencyExitButton;
