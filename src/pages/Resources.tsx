import { ArrowLeft, MapPin, Phone, Clock, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Leaflet CSS loaded via link tag in index.html
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

// Approximate zone centres for the map
const zoneCenters: Record<string, [number, number]> = {
  Nairobi: [-1.2921, 36.8219],
  Mombasa: [-4.0435, 39.6682],
  Kisumu: [-0.1022, 34.7617],
  Nakuru: [-0.3031, 36.0800],
  Eldoret: [0.5143, 35.2698],
  National: [-1.2921, 36.8219],
};

const Resources = () => {
  const navigate = useNavigate();
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

  // Leaflet map
  useEffect(() => {
    if (!mapRef.current || filtered.length === 0) return;

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
      // Add slight random offset so markers don't stack
      const offset = [
        center[0] + (Math.random() - 0.5) * 0.02,
        center[1] + (Math.random() - 0.5) * 0.02,
      ] as [number, number];

      L.marker(offset)
        .addTo(map)
        .bindPopup(`<strong>${r.name}</strong><br/>${r.type || ""}<br/>${r.zone || ""}`);
    });

    // Fit bounds
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
  }, [filtered]);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Resource Directory</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisations…"
            className="w-full rounded-lg border border-input bg-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground"
          >
            <option value="">All types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t!}>{t}</option>
            ))}
          </select>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground"
          >
            <option value="">All zones</option>
            {uniqueZones.map((z) => (
              <option key={z} value={z!}>{z}</option>
            ))}
          </select>
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          className="h-52 w-full rounded-lg border border-border overflow-hidden"
          style={{ zIndex: 0 }}
        />

        {/* Cards */}
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Loading resources…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No resources found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{r.zone}</span>
                    </div>
                  )}
                  {r.contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${r.contact}`} className="text-primary underline">{r.contact}</a>
                    </div>
                  )}
                  {r.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{r.hours}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
