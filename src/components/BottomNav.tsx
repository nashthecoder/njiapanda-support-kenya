import { Home, BookOpen, Shield, Phone, MapPin, Handshake, Heart, Mic } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BookOpen, label: "Stories", path: "/stories" },
  { icon: Shield, label: "Safety", path: "/safety" },
  { icon: MapPin, label: "Resources", path: "/resources" },
  { icon: Phone, label: "Helpline", path: "/helpline" },
  { icon: Heart, label: "Why", path: "/why" },
  { icon: Handshake, label: "Join Us", path: "/join" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-2 py-1 text-xs transition-colors",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} aria-hidden="true" />
              <span className="text-[10px]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
