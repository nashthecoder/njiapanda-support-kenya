import { ArrowLeft, MapPin, Phone, Clock, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccessibility } from "@/hooks/useAccessibility";
import type { Tables } from "@/integrations/supabase/types";

import L from "leaflet";

const typeColors: Record<string, string> = {
  "Legal Aid": "bg-primary/10 text-primary",
  Medical: "bg-emergency/10 text-emergency",
  Counselling: "bg-safe/10 text-safe",
  "Safe House": "bg-warning/10 text-warning",
  Helpline: "bg-info/10 text-info",
  Shelter: "bg-warning/10 text-warning",
  "Psychosocial Support": "bg-safe/10 text-safe",
};

const zoneCenters: Record<string, [number, number]> = {
  Nairobi: [-1.2921, 36.8219],
  Mombasa: [-4.0435, 39.6682],
  Kisumu: [-0.1022, 34.7617],
  Nakuru: [-0.3031, 36.08],
  Eldoret: [0.5143, 35.2698],
  National: [-1.2921, 36.8219],
};

const Resources = () => {
  const navigate = useNavigate();
  const { lowBandwidth } = useAccessibility();
  const [resources, setResources] = useState<Tables<"resources">[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase.from("resources").select("*").order("name");
      if (data) setResources(data);
      setLoading(false);
    };
    fetchResources();
  }, []);

  const filtered = resources.filter((r) => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.type || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesZone = !filterZone || r.zone === filterZone;
    return matchesSearch && matchesType && matchesZone;
  });

  const uniqueTypes = [...new Set(resources.map((r) => r.type).filter(Boolean))];
  const uniqueZones = [...new Set(resources.map((r) => r.zone).filter(Boolean))];

  // Group by zone for low bandwidth list view
  const groupedByZone = filtered.reduce<Record<string, Tables<"resources">[]>>((acc, r) => {
    const zone = r.zone || "Other";
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(r);
    return acc;
  }, {});

  // Leaflet map — only when not in low bandwidth mode
  useEffect(() => {
    if (lowBandwidth || !mapRef.current || filtered.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView([-1.2921, 36.8219], 6);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    filtered.forEach((r) => {
      const center = zoneCenters[r.zone || ""] || zoneCenters.Nairobi;
      const offset = [
        center[0] + (Math.random() - 0.5) * 0.02,
        center[1] + (Math.random() - 0.5) * 0.02,
      ] as [number, number];

      L.marker(offset)
        .addTo(map)
        .bindPopup(`<strong>${r.name}</strong><br/>${r.type || ""}<br/>${r.zone || ""}`);
    });

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(
        filtered.map((r) => {
          const c = zoneCenters[r.zone || ""] || zoneCenters.Nairobi;
          return [c[0], c[1]] as [number, number];
        })
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [filtered, lowBandwidth]);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-muted-foreground" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Resource Directory</h1>
      </header>

      <main id="main-content" role="main" className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {lowBandwidth && (
          <div className="low-bandwidth-banner" role="status">
            Low data mode — map replaced with list view
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisations…"
            aria-label="Search resources"
            className="w-full min-h-[48px] rounded-lg border border-input bg-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by type"
            className="min-h-[44px] rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground"
          >
            <option value="">All types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t!}>{t}</option>
            ))}
          </select>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            aria-label="Filter by zone"
            className="min-h-[44px] rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground"
          >
            <option value="">All zones</option>
            {uniqueZones.map((z) => (
              <option key={z} value={z!}>{z}</option>
            ))}
          </select>
        </div>

        {/* Map or list */}
        {!lowBandwidth && (
          <div
            ref={mapRef}
            className="h-52 w-full rounded-lg border border-border overflow-hidden"
            style={{ zIndex: 0 }}
            role="img"
            aria-label="Map showing resource locations across Kenya"
          />
        )}

        {/* Cards */}
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8" role="status">Loading resources…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No resources found.</p>
        ) : lowBandwidth ? (
          /* Grouped list view for low bandwidth */
          <div className="space-y-6">
            {Object.entries(groupedByZone).sort(([a], [b]) => a.localeCompare(b)).map(([zone, items]) => (
              <div key={zone}>
                <h2 className="mb-2 font-display text-sm font-semibold text-foreground">{zone}</h2>
                <div className="space-y-2">
                  {items.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-card-foreground text-sm">{r.name}</h3>
                        {r.verified && (
                          <span className="rounded-full bg-safe/10 px-2 py-0.5 text-[10px] font-medium text-safe">Verified</span>
                        )}
                      </div>
                      {r.type && <p className="text-xs text-muted-foreground">{r.type}</p>}
                      {r.contact && (
                        <a href={`tel:${r.contact}`} className="mt-1 block text-sm font-medium text-primary underline">{r.contact}</a>
                      )}
                      {r.hours && <p className="text-xs text-muted-foreground">{r.hours}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Resources">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 shadow-sm" role="listitem">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">{r.name}</h3>
                  {r.verified && (
                    <span className="rounded-full bg-safe/10 px-2 py-0.5 text-xs font-medium text-safe">
                      Verified
                    </span>
                  )}
                </div>
                {r.type && (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mb-2 ${typeColors[r.type] || "bg-muted text-muted-foreground"}`}>
                    {r.type}
                  </span>
                )}
                <div className="space-y-1 text-sm text-muted-foreground">
                  {r.zone && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{r.zone}</span>
                    </div>
                  )}
                  {r.contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      <a href={`tel:${r.contact}`} className="text-primary underline" aria-label={`Call ${r.name}`}>{r.contact}</a>
                    </div>
                  )}
                  {r.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{r.hours}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Resources;
