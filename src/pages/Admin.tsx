import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, Users, BookOpen, Shield, MapPin, Home, Bell, ClipboardList,
  LogOut, Radio, MessageSquarePlus, Handshake, UserCog, PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminConductors from "@/components/admin/AdminConductors";
import AdminStories from "@/components/admin/AdminStories";
import AdminAlerts from "@/components/admin/AdminAlerts";
import AdminFeedback from "@/components/admin/AdminFeedback";
import AdminPartners from "@/components/admin/AdminPartners";
import AdminUserRoles from "@/components/admin/AdminUserRoles";
import AdminStoryCMS from "@/components/admin/AdminStoryCMS";
import AdminResources from "@/components/admin/AdminResources";
import AdminSafeHouses from "@/components/admin/AdminSafeHouses";
import AdminSignals from "@/components/admin/AdminSignals";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: BarChart3, ready: true },
  { id: "signals", label: "Signals", icon: Radio, ready: true },
  { id: "conductors", label: "Conductors", icon: Users, ready: true },
  { id: "roles", label: "User Roles", icon: UserCog, ready: true },
  { id: "stories", label: "Stories", icon: BookOpen, ready: true },
  { id: "cms", label: "Create Story", icon: PenLine, ready: true },
  { id: "feedback", label: "Feedback", icon: MessageSquarePlus, ready: true },
  { id: "partners", label: "Partners", icon: Handshake, ready: true },
  { id: "resources", label: "Resources", icon: MapPin, ready: true },
  { id: "safehouses", label: "Safe Houses", icon: Home, ready: true },
  { id: "alerts", label: "Alerts", icon: Bell, ready: true },
  { id: "audit", label: "Audit Log", icon: ClipboardList, ready: false },
] as const;

type TabId = (typeof NAV_ITEMS)[number]["id"];

export default function Admin() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-[hsl(30,15%,7%)] text-[hsl(36,20%,90%)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-display text-base font-semibold">Njiapanda</span>
          <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-primary">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => item.ready && setTab(item.id)}
              disabled={!item.ready}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === item.id
                  ? "bg-primary/20 text-primary"
                  : item.ready
                  ? "text-[hsl(36,20%,70%)] hover:bg-white/5 hover:text-[hsl(36,20%,90%)]"
                  : "cursor-not-allowed text-[hsl(36,20%,35%)]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {!item.ready && (
                <span className="ml-auto font-mono text-[9px] uppercase tracking-wider opacity-50">
                  Soon
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2 text-[hsl(36,20%,60%)] hover:text-[hsl(36,20%,90%)]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {tab === "overview" && <AdminOverview onNavigate={(t) => setTab(t as TabId)} />}
        {tab === "signals" && <AdminSignals />}
        {tab === "conductors" && <AdminConductors />}
        {tab === "roles" && <AdminUserRoles />}
        {tab === "stories" && <AdminStories />}
        {tab === "cms" && <AdminStoryCMS />}
        {tab === "feedback" && <AdminFeedback />}
        {tab === "partners" && <AdminPartners />}
        {tab === "resources" && <AdminResources />}
        {tab === "safehouses" && <AdminSafeHouses />}
        {tab === "alerts" && <AdminAlerts />}
        {tab === "audit" && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Audit Log — coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
