import { Home, Shield, Phone, MapPin, Mic, MoreHorizontal, BookOpen, Heart, Handshake } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const primaryItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Shield, label: "Safety", path: "/safety" },
  { icon: Mic, label: "Speak", path: "/sauti" },
  { icon: Phone, label: "Helpline", path: "/helpline" },
];

const moreItems = [
  { icon: BookOpen, label: "Stories", path: "/stories" },
  { icon: MapPin, label: "Resources", path: "/resources" },
  { icon: Heart, label: "Why", path: "/why" },
  { icon: Handshake, label: "Join Us", path: "/join" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some((item) => item.path === location.pathname);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setShowMore(false)}
        />
      )}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-2 safe-area-bottom">
          <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-2 shadow-lg">
            {moreItems.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setShowMore(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-md items-center justify-around py-1">
          {primaryItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            const isSauti = path === "/sauti";
            return (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setShowMore(false);
                }}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground",
                  isSauti && !isActive && "text-[#C4871A]"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} aria-hidden="true" />
                <span className="text-[10px]">{label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            aria-label="More options"
            className={cn(
              "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors",
              isMoreActive || showMore ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", (isMoreActive || showMore) && "stroke-[2.5]")} aria-hidden="true" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
