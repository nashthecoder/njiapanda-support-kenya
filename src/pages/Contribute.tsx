import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Heart, Shield, GraduationCap, Home, CreditCard, Smartphone, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";

const TIERS = [
  {
    id: "sustain",
    title: "Sustain the Platform",
    amount: "KES 500/month",
    amountNum: 500,
    description: "Your monthly contribution keeps Njiapanda running — paying for servers, SMS alerts, and 24/7 helpline access for survivors across Kenya.",
    impact: "1 month of uninterrupted service for 200+ users",
    icon: Heart,
    priceId: "price_1T8dvPGyJw3jx1ssdZp6qjnl",
    mode: "subscription" as const,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  {
    id: "training",
    title: "Fund a Conductor Training",
    amount: "KES 2,000",
    amountNum: 2000,
    description: "Train one community responder in trauma-informed care, safety planning, and digital case management. They become a lifeline in their zone.",
    impact: "1 trained conductor serving an entire community",
    icon: GraduationCap,
    priceId: "price_1T8dvqGyJw3jx1ssO9qF54cj",
    mode: "payment" as const,
    color: "bg-accent text-accent-foreground border-accent-foreground/20",
    iconColor: "text-accent-foreground",
  },
  {
    id: "safehouse",
    title: "Fund a Safe House Night",
    amount: "KES 5,000",
    amountNum: 5000,
    description: "Cover one night of safe shelter for a survivor — including meals, basic supplies, and access to a trained house mother.",
    impact: "1 night of safety for a survivor and their children",
    icon: Home,
    priceId: "price_1T8dwzGyJw3jx1ssxuQU3XtL",
    mode: "payment" as const,
    color: "bg-safe/10 text-safe border-safe/20",
    iconColor: "text-safe",
  },
];

type PaymentMethod = "stripe" | "mpesa" | "paypal";

export default function Contribute() {
  const [searchParams] = useSearchParams();
  const [totalRaised, setTotalRaised] = useState(0);
  const [contributionCount, setContributionCount] = useState(0);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");

  // Show success/cancel toast
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Thank you for your contribution! 🙏", {
        description: "Your support makes a real difference.",
      });
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Payment was canceled. No charges were made.");
    }
  }, [searchParams]);

  // Fetch initial total & subscribe to realtime updates
  useEffect(() => {
    const fetchTotal = async () => {
      const { data } = await supabase
        .from("contributions")
        .select("total_amount, contribution_count")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();
      if (data) {
        setTotalRaised(data.total_amount);
        setContributionCount(data.contribution_count);
      }
    };
    fetchTotal();

    const channel = supabase
      .channel("contributions-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contributions" },
        (payload) => {
          const newData = payload.new as any;
          setTotalRaised(newData.total_amount);
          setContributionCount(newData.contribution_count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStripeCheckout = async (tier: typeof TIERS[0]) => {
    setLoadingTier(tier.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.priceId, mode: tier.mode },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Could not start checkout", { description: err.message });
    } finally {
      setLoadingTier(null);
    }
  };

  const handleMpesa = (tier: typeof TIERS[0]) => {
    toast.info("M-Pesa Coming Soon", {
      description: `To contribute KES ${tier.amountNum.toLocaleString()} via M-Pesa, send to Paybill 123456, Account: NJIAPANDA. We're working on automatic M-Pesa integration.`,
      duration: 10000,
    });
  };

  const handlePaypal = (tier: typeof TIERS[0]) => {
    toast.info("PayPal Coming Soon", {
      description: "PayPal integration is under development. Please use Stripe card payment for now.",
      duration: 6000,
    });
  };

  const handleContribute = (tier: typeof TIERS[0]) => {
    if (selectedMethod === "stripe") handleStripeCheckout(tier);
    else if (selectedMethod === "mpesa") handleMpesa(tier);
    else handlePaypal(tier);
  };

  const formatAmount = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary px-4 py-16 text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="mx-auto mb-4 h-12 w-12 opacity-80" />
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Stand With Survivors
            </h1>
            <p className="mt-4 text-lg leading-relaxed opacity-90">
              Every contribution directly funds safety, healing, and justice for GBV survivors across Kenya. Your support keeps Njiapanda's network alive.
            </p>
          </motion.div>

          {/* Live Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-6 backdrop-blur-sm"
          >
            <p className="text-sm font-medium uppercase tracking-wider opacity-70">Total Raised</p>
            <p className="mt-1 font-mono text-4xl font-bold tabular-nums sm:text-5xl">
              {formatAmount(totalRaised)}
            </p>
            <p className="mt-2 text-sm opacity-70">
              from {contributionCount.toLocaleString()} contribution{contributionCount !== 1 ? "s" : ""}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Payment Method Selector */}
      <section className="mx-auto max-w-2xl px-4 pt-8">
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
          Choose payment method
        </p>
        <div className="flex justify-center gap-2">
          {[
            { id: "stripe" as const, label: "Card", icon: CreditCard },
            { id: "mpesa" as const, label: "M-Pesa", icon: Smartphone },
            { id: "paypal" as const, label: "PayPal", icon: DollarSign },
          ].map((method) => (
            <Button
              key={method.id}
              variant={selectedMethod === method.id ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setSelectedMethod(method.id)}
            >
              <method.icon className="h-4 w-4" />
              {method.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Tier Cards */}
      <section className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        {TIERS.map((tier, idx) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * idx }}
          >
            <Card className="overflow-hidden border-2 transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${tier.color}`}>
                      <tier.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-serif">{tier.title}</CardTitle>
                      <p className="mt-0.5 font-mono text-xl font-bold text-foreground">
                        {tier.amount}
                      </p>
                    </div>
                  </div>
                  {tier.mode === "subscription" && (
                    <Badge variant="secondary" className="text-xs">
                      Monthly
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm leading-relaxed">
                  {tier.description}
                </CardDescription>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your Impact
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {tier.impact}
                  </p>
                </div>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => handleContribute(tier)}
                  disabled={loadingTier === tier.id}
                >
                  {loadingTier === tier.id ? (
                    "Opening checkout…"
                  ) : (
                    <>
                      {selectedMethod === "stripe" && <CreditCard className="h-4 w-4" />}
                      {selectedMethod === "mpesa" && <Smartphone className="h-4 w-4" />}
                      {selectedMethod === "paypal" && <DollarSign className="h-4 w-4" />}
                      Contribute {tier.amount}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Trust footer */}
      <section className="mx-auto max-w-2xl px-4 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          Payments are processed securely via Stripe. Njiapanda is a registered initiative
          supporting GBV survivors in Kenya. All contributions go directly to platform operations,
          conductor training, and safe house funding.
        </p>
      </section>
    </div>
  );
}
