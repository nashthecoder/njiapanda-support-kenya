import { useState, useRef } from "react";
import { Users, MapPin, Plug, Heart, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
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
    target: "conductor",
  },
  {
    icon: MapPin,
    heading: "Add Your Organisation",
    text: "If you run a shelter, legal aid service, counselling centre, crisis hotline, or any GBV support service in Nairobi or Limuru, add your organisation to the verified resource directory. We review every listing before it goes live.",
    button: "Submit Your Organisation",
    target: "organisation",
  },
  {
    icon: Plug,
    heading: "Connect Your System",
    text: "Njiapanda connects to existing NGO systems — DHIS2, Kobo, CommCare, Salesforce NPSP, and custom case management tools — via OpenFN. No rebuild needed on your side. If your organisation already manages GBV cases digitally, we can plug in.",
    button: "Book a Call",
    target: "connect",
  },
  {
    icon: Heart,
    heading: "Fund the Network",
    text: "Every contribution funds something specific — conductor training, safe house capacity, or platform sustainability. Njiapanda is open source and community-funded. If your organisation has a CSR programme, grant budget, or wants to sponsor a pilot zone, get in touch.",
    button: "Support the Network",
    target: "contribute",
  },
];

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
  const conductorRef = useRef<HTMLDivElement>(null);
  const organisationRef = useRef<HTMLDivElement>(null);
  const connectRef = useRef<HTMLDivElement>(null);

  const scrollTo = (target: string) => {
    if (target === "contribute") {
      navigate("/contribute");
      return;
    }
    const ref =
      target === "conductor"
        ? conductorRef
        : target === "organisation"
        ? organisationRef
        : connectRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

      {/* Lane Cards */}
      <section className="px-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {lanes.map((lane, i) => (
          <motion.div
            key={lane.target}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border-l-4 border-l-primary bg-card p-5 shadow-sm"
          >
            <lane.icon className="h-6 w-6 text-accent-foreground mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground">{lane.heading}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lane.text}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => scrollTo(lane.target)}
            >
              {lane.button}
            </Button>
          </motion.div>
        ))}
      </section>

      {/* Forms */}
      <div className="mt-16 space-y-16 max-w-2xl mx-auto px-4">
        <div ref={conductorRef}>
          <ConductorForm />
        </div>
        <div ref={organisationRef}>
          <OrganisationForm />
        </div>
        <div ref={connectRef}>
          <ConnectForm />
        </div>
      </div>

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
function ConductorForm() {
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

  if (submitted) return <FormSection eyebrow="01 — Conductors" heading="I want to become a conductor"><SuccessMessage /></FormSection>;

  return (
    <FormSection eyebrow="01 — Conductors" heading="I want to become a conductor">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Organisation or community group">
          <Input value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
        </Field>
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
        <Field label="Best way to reach you *">
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone number" required />
        </Field>
        <Field label="Anything else you want us to know">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 300))} maxLength={300} rows={3} />
          <span className="text-xs text-muted-foreground">{message.length}/300</span>
        </Field>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send Expression of Interest"}
        </Button>
      </form>
    </FormSection>
  );
}

/* ─── Organisation Form ─── */
function OrganisationForm() {
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

  if (submitted) return <FormSection eyebrow="02 — Organisations" heading="Add your organisation to the directory"><SuccessMessage /></FormSection>;

  return (
    <FormSection eyebrow="02 — Organisations" heading="Add your organisation to the directory">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Organisation name *">
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
        </Field>
        <Field label="Type of service">
          <div className="grid grid-cols-2 gap-2">
            {ORG_SERVICE_TYPES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={services.includes(s)} onCheckedChange={() => toggleService(s)} />
                {s}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Zone(s) you serve">
          <div className="grid grid-cols-2 gap-2">
            {ZONES.map((z) => (
              <label key={z} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={zones.includes(z)} onCheckedChange={() => toggleZone(z)} />
                {z}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Public contact — phone or email *">
          <Input value={publicContact} onChange={(e) => setPublicContact(e.target.value)} required />
        </Field>
        <Field label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Operating hours">
          <Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. Mon–Fri 8am–5pm" />
        </Field>
        <Field label="Your name and role *">
          <Input value={personName} onChange={(e) => setPersonName(e.target.value)} required />
        </Field>
        <Field label="Your contact email for verification *">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Submit for Review"}
        </Button>
      </form>
    </FormSection>
  );
}

/* ─── Connect Form ─── */
function ConnectForm() {
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

  if (submitted) return <FormSection eyebrow="03 — System Integration" heading="Let's connect your system"><SuccessMessage /></FormSection>;

  return (
    <FormSection eyebrow="03 — System Integration" heading="Let's connect your system">
      <form onSubmit={submit} className="space-y-4">
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
        <Field label="Your name and role *">
          <Input value={personName} onChange={(e) => setPersonName(e.target.value)} required />
        </Field>
        <Field label="Contact email *">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Get in Touch"}
        </Button>
      </form>
    </FormSection>
  );
}

/* ─── Shared layout helpers ─── */
function FormSection({ eyebrow, heading, children }: { eyebrow: string; heading: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-card p-6 shadow-sm scroll-mt-20">
      <span className="font-mono text-xs tracking-wider text-accent-foreground uppercase">{eyebrow}</span>
      <h2 className="mt-1 font-display text-xl font-bold text-foreground">{heading}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
