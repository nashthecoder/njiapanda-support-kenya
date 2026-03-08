import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type SafeHouse = Tables<"safe_houses">;

const capacityColors: Record<string, string> = {
  available: "bg-safe/10 text-safe border-safe/30",
  limited: "bg-warning/10 text-warning border-warning/30",
  full: "bg-emergency/10 text-emergency border-emergency/30",
};

const capacityLabels: Record<string, string> = {
  available: "Safe house capacity: available",
  limited: "Safe house capacity: limited",
  full: "Safe house capacity: full",
};

const SafeHousePanel = () => {
  const [houses, setHouses] = useState<SafeHouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHouses = async () => {
      const { data } = await supabase.from("safe_houses").select("*").order("zone");
      if (data) setHouses(data);
      setLoading(false);
    };
    fetchHouses();

    const channel = supabase
      .channel("safe-houses-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "safe_houses" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setHouses((prev) =>
              prev.map((h) => (h.id === (payload.new as SafeHouse).id ? (payload.new as SafeHouse) : h))
            );
          } else if (payload.eventType === "INSERT") {
            setHouses((prev) => [...prev, payload.new as SafeHouse]);
          } else if (payload.eventType === "DELETE") {
            setHouses((prev) => prev.filter((h) => h.id !== (payload.old as SafeHouse).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground" role="status">Loading safe houses…</div>;
  }

  if (houses.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Home className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">No safe houses registered</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Safe houses">
      {houses.map((h) => {
        const status = h.capacity_status ?? "available";
        const capClass = capacityColors[status] ?? capacityColors.available;
        return (
          <div
            key={h.id}
            role="listitem"
            className={`rounded-lg border p-4 shadow-sm ${capClass}`}
            aria-label={`${h.type || "Shelter"} in ${h.zone || "unknown zone"} — ${capacityLabels[status] || status}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-foreground">{h.type || "Shelter"}</span>
              <span
                className="rounded-full bg-card px-2 py-0.5 font-mono text-xs font-medium"
                aria-label={capacityLabels[status]}
              >
                {status}
              </span>
            </div>
            {h.zone && <p className="font-mono text-xs">Zone: {h.zone}</p>}
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              Updated {new Date(h.updated_at).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default SafeHousePanel;
