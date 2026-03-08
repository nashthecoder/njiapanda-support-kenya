import { Button } from "@/components/ui/button";
import { Shield, MessageCircle, Phone, MapPin } from "lucide-react";
import logoMark from "@/assets/njiapanda_logo_mark.png";
import heroImage from "@/assets/njiapanda_hero.png";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const quickActions = [
  {
    icon: MessageCircle,
    title: "Share Your Story",
    description: "Speak anonymously in your language",
    path: "/share",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Safety Planning",
    description: "Create a personal safety plan",
    path: "/safety",
    color: "bg-safe/10 text-safe",
  },
  {
    icon: MapPin,
    title: "Find Resources",
    description: "Safe houses, counselling & legal aid",
    path: "/resources",
    color: "bg-accent-foreground/10 text-accent-foreground",
  },
  {
    icon: Phone,
    title: "Emergency Helpline",
    description: "Call 1195 or reach GBV hotlines",
    path: "/helpline",
    color: "bg-emergency/10 text-emergency",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-dk min-h-[70vh] flex flex-col justify-between">
        {/* Hero background image */}
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
        />
        <div className="relative z-10 flex flex-1 flex-col justify-between px-4 pb-6 pt-8">
          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground/60"
          >
            <span>Paths to Safety</span>
            <span className="text-ochre">·</span>
            <span className="text-ochre">#SheBuilds</span>
            <span className="text-primary-foreground/40">·</span>
            <span>8 March 2026</span>
          </motion.div>

          {/* Wordmark + tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-auto"
          >
            <h1 className="font-display text-5xl font-bold leading-[1.1] sm:text-7xl">
              <span className="text-cream">Njia</span>
              <span className="italic text-ochre">panda</span>
            </h1>
            <p className="mt-3 max-w-md font-display text-lg italic text-cream/80 sm:text-xl">
              Quietly guiding survivors to help,
              <br />
              without alerting abusers.
            </p>
          </motion.div>

          {/* Bottom metadata */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 space-y-1 font-mono text-[10px] uppercase tracking-[0.15em] text-cream/50 sm:text-xs"
          >
            <div className="flex items-center gap-3">
              <span className="text-ochre-lt">Nairobi</span>
              <span>·</span>
              <span className="text-ochre-lt">Limuru</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Open Source</span>
              <span>·</span>
              <span>MIT License</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Lovable</span>
              <span>·</span>
              <span>Anthropic</span>
              <span>·</span>
              <span>OpenFn</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
            How can we help?
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust banner */}
      <section className="px-4 pb-8">
        <div className="mx-auto max-w-lg rounded-lg bg-secondary p-4 text-center">
          <Shield className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-secondary-foreground">
            Your privacy is protected. No personal data is stored without your consent.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
