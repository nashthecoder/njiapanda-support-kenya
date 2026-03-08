# Njiapanda — Paths to Safety

**A community-led GBV survivor support platform for Kenya**

*Njiapanda* is Swahili for **crossroads** — the moment a person stops and asks:
*is this normal? Is this love? Or is this something I need to name?*

[![License: MIT](https://img.shields.io/badge/License-MIT-2D8A77.svg)](LICENSE)
[![Live Platform](https://img.shields.io/badge/Platform-Live-C4871A.svg)](https://njiapanda-support-kenya.lovable.app)
[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-E9A83A.svg)](https://lovable.dev)
[![Powered by Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E.svg)](https://supabase.com)
[![DPG Aligned](https://img.shields.io/badge/DPG-Aligned-0F3D34.svg)](https://digitalpublicgoods.net)

[🌍 Live Platform](https://njiapanda-support-kenya.lovable.app) · [📖 Why Njiapanda](https://njiapanda-support-kenya.lovable.app/why) · [🤝 Join the Network](https://njiapanda-support-kenya.lovable.app/join) · [💬 LinkedIn](https://www.linkedin.com/in/naijeriatoweett/)

---

## The Problem

Most of the services GBV survivors need already exist in Kenya.
Shelters. Legal aid. Crisis hotlines. Counselling.

**The gap was never the absence of help. It was the distance between a person and the moment they could reach it.**

And before that distance — there is another one. Abuse does not announce itself. It settles in slowly, quietly, until it starts to feel like normal. No hotline reaches a person at that moment.

Njiapanda does.

---

## What Njiapanda Is

> **Not another app. A layer on top of what already exists.**

Njiapanda is a coordination layer — connecting survivors to trained community responders, verified organisations, and safe houses through three interlocking journeys:

| Journey | Who | What they do |
|---|---|---|
| 🟢 **Survivor** | Anonymous visitor | Reads a story, recognises abuse, submits a quiet signal, finds real organisations nearby, taps to call. No account. No trace. |
| 🟡 **Conductor** | Trained community responder | Receives signals, assesses risk with AI support, coordinates safe house placement and referrals. |
| 🔵 **Admin** | Platform manager | Manages conductors, moderates stories, monitors escalation alerts, reviews metrics. |

---

## Three Pillars

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWARENESS     │    │     ACCESS      │    │     SAFETY      │
│                 │    │                 │    │                 │
│  Story library  │───▶│  Help signal    │───▶│  Conductor      │
│  15 scenarios   │    │  Resource map   │    │  network        │
│  EN + Swahili   │    │  Verified orgs  │    │  Safe houses    │
│  Recognition    │    │  Tap-to-call    │    │  Safe passage   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     Entry point            Navigation              Response
```

---

## Live Routes

| Route | Description | Access |
|---|---|---|
| `/` | Home — hero, 5 quick actions, trust banner | 🌍 Public |
| `/stories` | Story library — 15 bilingual stories, search + filter | 🌍 Public |
| `/signal` | Quiet help request — anonymous, 3 fields only | 🌍 Anonymous |
| `/share` | Share a story — anonymous submission | 🌍 Anonymous |
| `/safety` | Interactive 6-step safety plan checklist | 🌍 Public |
| `/resources` | Verified resource directory — Leaflet map | 🌍 Public |
| `/helpline` | Emergency helplines — tap-to-call | 🌍 Public |
| `/contribute` | Contributions — Stripe / M-Pesa / PayPal | 🌍 Public |
| `/why` | Why Njiapanda — the personal narrative | 🌍 Public |
| `/join` | Join the network — conductors, orgs, integrations | 🌍 Public |
| `/dashboard` | Conductor dashboard — zone-filtered cases, AI briefs | 🔒 Conductor |
| `/admin` | Admin portal — metrics, moderation, management | 🔒 Admin |

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend + Build | [Lovable.ai](https://lovable.dev) | Rapid React + Supabase generation |
| Database + Auth | [Supabase](https://supabase.com) | Postgres, RLS by role and zone, Realtime |
| AI Triage | [Anthropic Claude API](https://anthropic.com) | Risk briefs — session only, never stored |
| Interoperability | [OpenFN](https://openfn.org) | Bridge to DHIS2, Kobo, CommCare, Salesforce NPSP |
| Maps | [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://openstreetmap.org) | 100% open source, zone-level only |
| Payments | Stripe + M-Pesa + PayPal | M-Pesa from day one — built for Kenya |
| SMS (planned) | [Africa's Talking](https://africastalking.com) | Low-data and feature phone access |

---

## Data Model

```
stories          signals          cases
────────         ────────         ────────
id               id               id
title            urgency          signal_id
story_text       zone             conductor_id
swahili_text     resource_needed  status
abuse_type       consent          risk_level
message          created_at       notes
tags                              updated_at
status
resonance_count

conductors       resources        safe_houses
────────         ────────         ────────
id               id               id
name             name             zone
zone             type             capacity_status
role             zone             type
active           contact          updated_at
                 hours
                 verified
```

---

## Security & Safety Design

Every decision on this platform is a safety decision.

- 🚪 **Emergency exit button** on every page — clears session, replaces browser history, redirects instantly
- 👤 **Survivors never create accounts** — all public routes work without login
- 🔐 **Row Level Security** enforced at the database level, not just the UI — conductors see only their zone's cases
- 🤖 **AI output is session-only** — risk briefs are never stored in the database
- 📍 **Zone-level display only** — exact safe house addresses never surface in the UI
- 🗑️ **Minimal data collection** — only what is necessary for the referral

---

## Why OpenFN & Interoperability

> *"A coordination layer that cannot talk to existing systems is just another silo."*

Kenya has shelters, legal aid organisations, and crisis hotlines. The problem is fragmentation — none of them connected, all of them working harder than they should have to.

OpenFN connects Njiapanda to the systems NGOs already use:

```
Njiapanda Case Update
        │
        ├──▶ DHIS2 (health reporting)
        ├──▶ Kobo Toolbox (NGO case management)
        ├──▶ CommCare (community health workflows)
        └──▶ Salesforce NPSP (fundraising + CRM)

De-identified · Event-driven · Open standard · No lock-in
```

If Njiapanda ends tomorrow, every organisation keeps their data, their tools, their workflows.

---

## Digital Public Goods Alignment

Njiapanda is designed to meet the [DPG Standard](https://digitalpublicgoods.net/standard/):

| Criterion | Status |
|---|---|
| ✅ Open source licence | MIT — see [LICENSE](LICENSE) |
| ✅ Clear ownership | Maintained by [@nashthecoder](https://github.com/nashthecoder) |
| ✅ Platform independence | Deployable on any Supabase + Vercel/Netlify stack |
| ✅ Privacy & data protection | Minimal collection, RLS, no PII in AI layer |
| ✅ Do no harm | Trauma-informed design, survivor consent throughout |
| ✅ Adherence to standards | OpenFN open standard, OpenStreetMap, open APIs |
| 🔄 DPG Nomination | Planned after pilot evaluation |

---

## Pilot

**Locations:** Nairobi & Limuru, Kenya
**Status:** Live — seeking conductor partners and NGO integrations

The pilot tests whether a hybrid community + digital support system can:
- Help survivors recognise abuse earlier
- Provide clear pathways to support
- Enable fast, discreet connection to help
- Coordinate existing resources effectively

---

## Fork This for Your Country

This model should work in Kampala, Dar es Salaam, Kigali, and Johannesburg — without starting from scratch.

```bash
# Clone the repo
git clone https://github.com/nashthecoder/njiapanda-support-kenya.git

# Install dependencies
cd njiapanda-support-kenya
npm install

# Set up environment variables
cp .env.example .env

# Run locally
npm run dev
```

**Environment variables needed:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
```

**To localise for your country:**
- Replace seed stories with local scenarios in your language
- Update resource directory with local verified organisations
- Update zone names to match your geography
- Adjust mobile money integration for your local provider

---

## Contributing

Contributions welcome — especially from people with lived experience, GBV practitioners, and developers in East Africa.

| Type | How |
|---|---|
| 🐛 Bug report | Open an issue with label `bug` |
| 💡 Feature idea | Open an issue with label `enhancement` |
| 🌍 Localisation | Open a PR with translated story content |
| 🏥 Add an organisation | Submit via [/join](https://njiapanda-support-kenya.lovable.app/join) |
| 🤝 Become a conductor | Apply via [/join](https://njiapanda-support-kenya.lovable.app/join) |
| 🔌 System integration | Book a call via [/join](https://njiapanda-support-kenya.lovable.app/join) |

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.
All contributors must agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Roadmap

- [x] Story library — 15 trauma-informed scenarios, EN + Swahili
- [x] Anonymous signal form
- [x] Verified resource directory with Leaflet map
- [x] Conductor dashboard with zone-based RLS
- [x] AI risk triage — session-only, never stored
- [x] Safe house panel with Supabase Realtime
- [x] Admin portal — moderation, conductor management, alerts
- [x] Contribution system — Stripe + M-Pesa + PayPal
- [x] /join page — conductor, org, and integration onboarding
- [ ] Africa's Talking SMS integration
- [ ] OpenFN live integration testing with Kobo + DHIS2
- [ ] Survivor Advisory Board
- [ ] Offline-capable PWA for low-connectivity areas
- [ ] Multilingual expansion — Kikuyu, Luo, Luhya
- [ ] DPG nomination
- [ ] Regional expansion — Uganda, Tanzania, Rwanda

---

## Acknowledgements

Built on International Women's Day, 8 March 2026, during the Lovable [#SheBuilds](https://lovable.dev) hackathon.

Thanks to the organisations already doing this work in Kenya every day — FIDA Kenya, COVAW, Gender Violence Recovery Centre, and every community health worker, social worker, and trusted neighbour who has ever opened their door.

---

## Licence

MIT — fork it, localise it, deploy it.
See [LICENSE](LICENSE) for details.

---

**Njiapanda is a pilot. The network grows one conductor, one organisation, one conversation at a time.**

[🌍 njiapanda-support-kenya.lovable.app](https://njiapanda-support-kenya.lovable.app)

*Built with purpose · Open source · Made in Kenya*
