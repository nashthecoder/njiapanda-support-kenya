import { useState, useRef } from "react";
import { Users, MapPin, Plug, DollarSign, CheckCircle2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const ZONES = [
  "Nairobi Central",
  "Nairobi East",
  "Nairobi West",
  "Nairobi North",
  "Limuru",
  "Other — I will specify",
];

const CONDUCTOR_ROLES = [
  "Social Worker",
  "Community Health Worker",
  "NGO Staff",
  "Religious Leader",
  "Trained Volunteer",
  "Other",
];

const ORG_SERVICE_TYPES = [
  "Shelter",
  "Legal Aid",
  "Counselling",
  "Crisis Hotline",
  "Medical",
  "Economic Support",
  "Other",
];

const SYSTEMS = [
  "DHIS2",
  "Kobo Toolbox",
  "CommCare",
  "Salesforce NPSP",
  "Custom system",
  "Not sure yet",
];

const lanes = [
  {
    icon: Users,
    heading: "Become a Conductor",
    text: "Conductors are the heart of Njiapanda — trusted community members trained to receive signals, assess risk, and connect survivors to safety. If you are a social worker, community health worker, NGO staff member, religious leader, or trained volunteer in Nairobi or Limuru, we want to hear from you.",
    button: "Express Interest",
    target: "conductor" as const,
    eyebrow: "01 — Conductors",
    formHeading: "I want to become a conductor",
  },
  {
    icon: MapPin,
    heading: "Add Your Organisation",
    text: "If you run a shelter, legal aid service, counselling centre, crisis hotline, or any GBV support service in Nairobi or Limuru, add your organisation to the verified resource directory. We review every listing before it goes live.",
    button: "Submit Your Organisation",
    target: "organisation" as const,
    eyebrow: "02 — Organisations",
    formHeading: "Add your organisation to the directory",
  },
  {
    icon: Plug,
    heading: "Connect Your System",
    text: "Njiapanda connects to existing NGO systems — DHIS2, Kobo, CommCare, Salesforce NPSP, and custom case management tools — via OpenFN. No rebuild needed on your side. If your organisation already manages GBV cases digitally, we can plug in.",
    button: "Book a Call",
    target: "connect" as const,
    eyebrow: "03 — System Integration",
    formHeading: "Let's connect your system",
  },
  {
    icon: DollarSign,
    heading: "Fund the Network",
    text: "Every contribution funds something specific — conductor training, safe house capacity, or platform sustainability. Njiapanda is open source and community-funded. If your organisation has a CSR programme, grant budget, or wants to sponsor a pilot zone, get in touch.",
    button: "Support the Network",
    target: "contribute" as const,
    eyebrow: "",
    formHeading: "",
  },
];

type LaneTarget = "conductor" | "organisation" | "connect" | "contribute";

function SuccessMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-md bg-secondary px-4 py-3 text-secondary-foreground"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">Received — we will be in touch.</span>
    </motion.div>
  );
}

export default function JoinNetwork() {
  const navigate = useNavigate();
  const [openLane, setOpenLane] = useState<LaneTarget | null>(null);
  const formRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleLaneClick = (target: LaneTarget) => {
    if (target === "contribute") {
      window.open("/contribute", "_blank", "noopener");
      return;
    }
    const next = openLane === target ? null : target;
    setOpenLane(next);
    if (next) {
      setTimeout(() => {
        formRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <section className="px-4 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl md:text-4xl font-bold text-foreground"
        >
          Join the Network
        </motion.h1>
        <p className="mt-3 font-display italic text-lg text-accent-foreground">
          Njiapanda works because people show up.
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          We are building a quiet, resilient safety network for GBV survivors in Kenya. It runs on
          community — conductors, safe houses, legal aid organisations, health workers, and
          developers who believe the infrastructure for safety should be open, connected, and local.
          If that is you, there is a place here.
        </p>
      </section>

      {/* Lane Cards with inline forms */}
      <section className="px-4 max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lanes.map((lane, i) => {
            const isOpen = openLane === lane.target;
            const hasForm = lane.target !== "contribute";

            return (
              <motion.div
                key={lane.target}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "rounded-lg border-l-4 border-l-primary bg-card shadow-sm transition-shadow",
                  isOpen && "shadow-md ring-1 ring-primary/20",
                  hasForm && isOpen && "md:col-span-2"
                )}
              >
                <div className="p-5">
                  <lane.icon className="h-6 w-6 text-accent-foreground mb-3" />
                  <h3 className="font-display text-lg font-bold text-foreground">{lane.heading}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lane.text}</p>
                  <Button
                    variant={isOpen ? "default" : "outline"}
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => handleLaneClick(lane.target)}
                  >
                    {lane.button}
                    {hasForm && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    )}
                  </Button>
                </div>

                {/* Inline form */}
                <AnimatePresence>
                  {hasForm && isOpen && (
                    <motion.div
                      ref={(el) => { formRefs.current[lane.target] = el; }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border bg-muted/30 p-5">
                        <span className="font-mono text-xs tracking-wider text-accent-foreground uppercase">
                          {lane.eyebrow}
                        </span>
                        <h4 className="mt-1 font-display text-base font-bold text-foreground">
                          {lane.formHeading}
                        </h4>
                        <div className="mt-4">
                          {lane.target === "conductor" && <ConductorFormFields />}
                          {lane.target === "organisation" && <OrganisationFormFields />}
                          {lane.target === "connect" && <ConnectFormFields />}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Closing */}
      <section className="mt-16 bg-secondary-foreground text-primary-foreground py-12 px-4 text-center">
        <h2 className="font-display text-xl font-semibold">Not sure where you fit?</h2>
        <p className="mt-2 text-sm opacity-80">
          Send a message via the feedback button on any page — or DM us directly on LinkedIn.
        </p>
        <p className="mt-4 font-mono text-xs opacity-60">
          Njiapanda is open source. MIT License.
        </p>
      </section>
    </div>
  );
}

/* ─── Conductor Form ─── */
function ConductorFormFields() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [role, setRole] = useState("");
  const [zone, setZone] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    setLoading(true);
    await supabase.from("partner_expressions" as any).insert({
      type: "conductor",
      name: name.trim(),
      organisation: organisation.trim() || null,
      role: role || null,
      zone: zone || null,
      contact_email: contact.trim(),
      message: message.trim() || null,
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return <SuccessMessage />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Your name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Organisation or community group">
        <Input value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your role">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {CONDUCTOR_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Zone">
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
            <SelectContent>
              {ZONES.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Best way to reach you *">
        <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone number" required />
      </Field>
      <Field label="Anything else you want us to know">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 300))} maxLength={300} rows={3} />
        <span className="text-xs text-muted-foreground">{message.length}/300</span>
      </Field>
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Sending…" : "Send Expression of Interest"}
      </Button>
    </form>
  );
}

/* ─── Organisation Form ─── */
function OrganisationFormFields() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [publicContact, setPublicContact] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [personName, setPersonName] = useState("");
  const [email, setEmail] = useState("");

  const toggleService = (s: string) =>
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleZone = (z: string) =>
    setZones((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !publicContact.trim() || !personName.trim() || !email.trim()) return;
    setLoading(true);
    await supabase.from("partner_expressions" as any).insert({
      type: "organisation",
      name: personName.trim(),
      organisation: orgName.trim(),
      contact_email: email.trim(),
      contact_phone: publicContact.trim(),
      zone: zones.join(", ") || null,
      extra: { services, website: website.trim() || null, hours: hours.trim() || null },
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return <SuccessMessage />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Organisation name *">
        <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
      </Field>
      <Field label="Type of service">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ORG_SERVICE_TYPES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={services.includes(s)} onCheckedChange={() => toggleService(s)} />
              {s}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Zone(s) you serve">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ZONES.map((z) => (
            <label key={z} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={zones.includes(z)} onCheckedChange={() => toggleZone(z)} />
              {z}
            </label>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Public contact — phone or email *">
          <Input value={publicContact} onChange={(e) => setPublicContact(e.target.value)} required />
        </Field>
        <Field label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </Field>
      </div>
      <Field label="Operating hours">
        <Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. Mon–Fri 8am–5pm" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name and role *">
          <Input value={personName} onChange={(e) => setPersonName(e.target.value)} required />
        </Field>
        <Field label="Your contact email for verification *">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
      </div>
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Sending…" : "Submit for Review"}
      </Button>
    </form>
  );
}

/* ─── Connect Form ─── */
function ConnectFormFields() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [system, setSystem] = useState("");
  const [personName, setPersonName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !personName.trim() || !email.trim()) return;
    setLoading(true);
    await supabase.from("partner_expressions" as any).insert({
      type: "connect",
      name: personName.trim(),
      organisation: orgName.trim(),
      contact_email: email.trim(),
      message: message.trim() || null,
      extra: { system: system || null },
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return <SuccessMessage />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Organisation name *">
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
        </Field>
        <Field label="System you use">
          <Select value={system} onValueChange={setSystem}>
            <SelectTrigger><SelectValue placeholder="Select system" /></SelectTrigger>
            <SelectContent>
              {SYSTEMS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name and role *">
          <Input value={personName} onChange={(e) => setPersonName(e.target.value)} required />
        </Field>
        <Field label="Contact email *">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
      </div>
      <Field label="Brief description of what you want to connect">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 400))}
          maxLength={400}
          rows={3}
          placeholder="e.g. We manage case referrals in Kobo and want signals from Njiapanda to appear automatically"
        />
        <span className="text-xs text-muted-foreground">{message.length}/400</span>
      </Field>
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Sending…" : "Get in Touch"}
      </Button>
    </form>
  );
}

/* ─── Shared layout helpers ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
