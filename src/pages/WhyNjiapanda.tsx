import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const beliefs = [
  "Survivors should never have to create an account to ask for help",
  "Recognition comes before action — awareness is the first intervention",
  "The emergency exit button is not a feature. It is the foundation.",
  "AI assists. Humans decide. Always.",
  "Anonymity is not a limitation. It is the design.",
  "A coordination layer that connects is more resilient than a platform that replaces",
  "Open source because every country that needs this should be able to build it",
];

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5 },
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-xs uppercase tracking-[0.15em] text-ochre mb-3">
    {children}
  </p>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-2xl sm:text-3xl font-bold text-forest-dk leading-snug mb-6">
    {children}
  </h2>
);

const Body = ({ children }: { children: React.ReactNode }) => (
  <div className="font-body text-charcoal leading-[1.85] text-base sm:text-lg space-y-4">
    {children}
  </div>
);

const WhyNjiapanda = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      {/* SECTION 1 — Opening */}
      <section className="px-4 pt-16 sm:pt-24 pb-12">
        <motion.div {...fadeIn} className="mx-auto max-w-[680px]">
          <p
            className="font-display text-xl sm:text-2xl font-light italic text-forest-dk leading-[1.85] whitespace-pre-line"
          >
{`Most of the services that GBV survivors need already exist in Kenya.
Shelters. Legal aid. Crisis hotlines. Counselling.
The gap was never the absence of help.
It was the distance between a person and the moment they could reach it.
And before that distance — there is another one.
The moment before you can reach for help is the moment you have to be honest with yourself about what is happening.
That is the hardest moment of all.
Because abuse does not announce itself.
It settles in slowly, quietly, until it starts to feel like your normal.
It is that gut feeling you keep pushing down.
The nervousness you cannot explain.
The discomfort you have learned to move around.
It is hiding a physical mark from your friends.
It is carrying an emotional hurt so deep you have stopped knowing how to name it — even to yourself.
You do not see it until you look into a mirror and decide to be honest about what is looking back.
That moment of recognition — that is where Njiapanda begins.`}
          </p>
        </motion.div>
      </section>

      {/* SECTION 2 — The problem */}
      <section className="px-4 py-12">
        <motion.div {...fadeIn} className="mx-auto max-w-[680px]">
          <Eyebrow>The Gap</Eyebrow>
          <SectionHeading>Named, it becomes real. Unnamed, it stays.</SectionHeading>
          <Body>
            <p>
              Financial control. Emotional degradation. Isolation from friends and family. Phone monitoring. Millions of people in Kenya experience these as normal relationship problems — because no one has ever named them as anything else.
            </p>
            <p>
              No hotline reaches a person at that moment. No shelter. No form.
            </p>
            <p>
              They are not yet looking for help. They are still asking themselves whether what is happening to them is real.
            </p>
            <p>
              Njiapanda starts with stories — real, relatable scenarios that help people name what they are experiencing. Because naming it is the first step. Everything else follows from that.
            </p>
          </Body>
        </motion.div>
      </section>

      {/* SECTION 3 — Why it is personal */}
      <section className="px-4 py-12">
        <motion.div {...fadeIn} className="mx-auto max-w-[680px]">
          <Eyebrow>Why We Built This</Eyebrow>
          <SectionHeading>This started closer to home than a hackathon</SectionHeading>
          <Body>
            <p>
              Njiapanda was built in 24 hours on International Women's Day.
            </p>
            <p>
              But it did not start there.
            </p>
            <p>
              It started with people I love — watching financial abuse play out quietly over years. Watching emotional abuse be explained away as personality. Watching physical abuse be survived in silence because there was nowhere obvious to go and no clear first step.
            </p>
            <p>
              At one point, the first step was my home. Someone close to me needed a few weeks of space — somewhere safe to think, to plan, to breathe — before they could find their way out. I gave them that.
            </p>
            <p>
              That is not a system. That is one person helping one person.
            </p>
            <p>
              But it taught me something: the most important thing in that moment was not a hotline number or a legal resource. It was a quiet, trusted path to safety — and someone who knew how to walk it with them.
            </p>
            <p>
              Njiapanda is an attempt to make that path findable. For everyone. Not just the people who happen to know someone who happens to have a spare room.
            </p>
          </Body>
        </motion.div>
      </section>

      {/* SECTION 4 — The approach */}
      <section className="px-4 py-12">
        <motion.div {...fadeIn} className="mx-auto max-w-[680px]">
          <Eyebrow>The Approach</Eyebrow>
          <SectionHeading>A layer, not a replacement</SectionHeading>
          <Body>
            <p>
              We did not build another hotline. We did not build a shelter or a legal service.
            </p>
            <p>
              We built the layer that sits before all of those things — the awareness, the recognition, the quiet first signal — and connects it to what already exists.
            </p>
            <p>
              Njiapanda works because FIDA Kenya exists. Because COVAW exists. Because the Gender Violence Recovery Centre exists. Because community health workers and social workers and religious leaders and neighbours already show up for people in crisis — they just need a way to be found and coordinated.
            </p>
            <p>
              Our job is to make the network visible and navigable. Not to replace it.
            </p>
          </Body>
        </motion.div>
      </section>

      {/* Thin ochre rule before beliefs */}
      <div className="mx-auto max-w-[680px] px-4">
        <hr className="border-t border-ochre/30" />
      </div>

      {/* SECTION 5 — The design beliefs */}
      <section className="px-4 py-12">
        <motion.div {...fadeIn} className="mx-auto max-w-[680px]">
          <Eyebrow>What We Believe</Eyebrow>
          <SectionHeading>Every decision on this platform is a safety decision</SectionHeading>
          <ul className="space-y-4 mt-8">
            {beliefs.map((belief, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-start gap-3 font-body text-charcoal text-base sm:text-lg leading-[1.85]"
              >
                <span className="text-ochre font-semibold mt-0.5 shrink-0">→</span>
                <span>{belief}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* Thin ochre rule before open source */}
      <div className="mx-auto max-w-[680px] px-4">
        <hr className="border-t border-ochre/30" />
      </div>

      {/* SECTION 6 — Open source */}
      <section className="px-4 py-12">
        <motion.div {...fadeIn} className="mx-auto max-w-[680px]">
          <Eyebrow>Open Source</Eyebrow>
          <SectionHeading>Built for Kenya. Forkable for everywhere.</SectionHeading>
          <Body>
            <p>
              Njiapanda is MIT licensed. Every line of code is public.
            </p>
            <p>
              The model that works in Nairobi and Limuru should be deployable in Kampala, Dar es Salaam, Kigali, and Johannesburg — without starting from scratch.
            </p>
            <p>
              If you are building something similar, or want to adapt this for your context, the repository is open. Fork it. Localise it. Make it yours.
            </p>
            <a
              href="https://github.com/nashthecoder/njiapanda-support-kenya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ochre font-semibold hover:underline"
            >
              → github.com/nashthecoder/njiapanda-support-kenya
            </a>
          </Body>
        </motion.div>
      </section>

      {/* CLOSING SECTION */}
      <section className="bg-forest-dk px-4 py-16 sm:py-20 text-center">
        <div className="mx-auto max-w-[680px]">
          <h2 className="font-display text-2xl sm:text-3xl font-light text-cream leading-snug mb-4">
            If you understand why this needed to exist, you already know how to help.
          </h2>
          <p className="font-body text-cream/70 mb-8">
            The network grows one conductor, one organisation, one connection at a time.
          </p>
          <Button
            variant="hero"
            size="xl"
            className="bg-ochre text-white hover:bg-ochre/90"
            onClick={() => navigate("/join")}
          >
            Join the Network
          </Button>
          <p className="font-mono text-xs text-cream/40 mt-6">
            Pilot: Nairobi &amp; Limuru, Kenya · Open Source MIT · Built on International Women's Day 2026
          </p>
        </div>
      </section>
    </div>
  );
};

export default WhyNjiapanda;
