import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AccessibilityState {
  highContrast: boolean;
  lowBandwidth: boolean;
  simpleLanguage: boolean;
  toggleHighContrast: () => void;
  toggleLowBandwidth: () => void;
  toggleSimpleLanguage: () => void;
}

const AccessibilityContext = createContext<AccessibilityState | null>(null);

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(() =>
    localStorage.getItem("njiapanda-high-contrast") === "true"
  );
  const [lowBandwidth, setLowBandwidth] = useState(() => {
    const stored = localStorage.getItem("njiapanda-low-bandwidth");
    if (stored !== null) return stored === "true";
    // Auto-detect
    const conn = (navigator as any).connection;
    if (conn?.effectiveType) {
      return ["slow-2g", "2g"].includes(conn.effectiveType);
    }
    return false;
  });
  const [simpleLanguage, setSimpleLanguage] = useState(() =>
    localStorage.getItem("njiapanda-simple-language") === "true"
  );

  useEffect(() => {
    document.body.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("njiapanda-high-contrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem("njiapanda-low-bandwidth", String(lowBandwidth));
  }, [lowBandwidth]);

  useEffect(() => {
    localStorage.setItem("njiapanda-simple-language", String(simpleLanguage));
  }, [simpleLanguage]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        lowBandwidth,
        simpleLanguage,
        toggleHighContrast: () => setHighContrast((p) => !p),
        toggleLowBandwidth: () => setLowBandwidth((p) => !p),
        toggleSimpleLanguage: () => setSimpleLanguage((p) => !p),
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
