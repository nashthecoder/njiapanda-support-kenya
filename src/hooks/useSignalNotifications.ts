import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Signal = Tables<"signals">;

/** Request browser notification permission */
function requestPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(signal: Signal) {
  if ("Notification" in window && Notification.permission === "granted") {
    const urgencyLabel =
      signal.urgency === "emergency"
        ? "🔴 Emergency"
        : signal.urgency === "urgent"
        ? "🟠 Urgent"
        : "🟢 Info";

    new Notification("New Signal — Njiapanda", {
      body: `${urgencyLabel} in ${signal.zone ?? "Unknown zone"}${
        signal.resource_needed ? ` • Needs: ${signal.resource_needed}` : ""
      }`,
      icon: "/favicon.ico",
      tag: signal.id, // dedup
    });
  }
}

/**
 * Subscribe to new signals via Supabase Realtime.
 * Shows in-app toast + browser push notification.
 * Only active when `enabled` is true (conductor/admin logged in).
 */
export function useSignalNotifications(enabled: boolean) {
  const ready = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    requestPermission();

    const channel = supabase
      .channel("signal-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        (payload) => {
          // Skip the first batch that fires on subscribe
          if (!ready.current) return;

          const signal = payload.new as Signal;
          const urgencyLabel =
            signal.urgency === "emergency"
              ? "🔴 Emergency"
              : signal.urgency === "urgent"
              ? "🟠 Urgent"
              : "🟢 Info";

          toast.warning(`${urgencyLabel} New signal in ${signal.zone ?? "Unknown zone"}`, {
            description: signal.resource_needed
              ? `Resources needed: ${signal.resource_needed}`
              : undefined,
            duration: 8000,
          });

          sendBrowserNotification(signal);
        }
      )
      .subscribe(() => {
        // Mark ready after initial subscription so we don't toast existing rows
        setTimeout(() => {
          ready.current = true;
        }, 2000);
      });

    return () => {
      ready.current = false;
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
