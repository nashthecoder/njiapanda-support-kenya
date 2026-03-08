import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const handleIdleExit = () => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.replace("https://weather.com");
};

/**
 * Auto-clears session after 5 minutes of inactivity for authenticated users.
 * Resets on mouse, keyboard, touch, and scroll events.
 */
export function useIdleTimeout(isAuthenticated: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        handleIdleExit();
      }, IDLE_TIMEOUT_MS);
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start on mount

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated]);
}
