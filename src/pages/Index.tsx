import { Button } from "@/components/ui/button";
import { Shield, Heart, MessageCircle, Phone, MapPin } from "lucide-react";
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
      <section className="relative overflow-hidden bg-primary px-4 pb-10 pt-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-primary-foreground" />
        </div>
        <div className="relative mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-8 w-8 text-primary-foreground" />
              <h1 className="font-display text-3xl font-bold text-primary-foreground">
                Njiapanda
              </h1>
            </div>
            <p className="mb-6 text-lg text-primary-foreground/90">
              You are not alone. We are here to listen, protect, and connect you with help — safely and confidentially.
            </p>
            <Button
              variant="hero"
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => navigate("/share")}
            >
              Get Support Now
            </Button>
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
