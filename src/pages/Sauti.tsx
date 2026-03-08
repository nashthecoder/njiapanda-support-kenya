import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type SautiState = "idle" | "consent" | "connecting" | "listening" | "processing" | "ended";
type Lang = "sw" | "en";

const labels: Record<string, Record<Lang, string>> = {
  tapToSpeak: { en: "Tap to speak", sw: "Gusa kuongea" },
  listening: { en: "Listening...", sw: "Ninakusikiliza..." },
  tapToEnd: { en: "Tap to end", sw: "Gusa kumaliza" },
  connecting: { en: "Connecting you safely...", sw: "Inakuunganisha salama..." },
  received: { en: "Your message has been received.", sw: "Ujumbe wako umepokewa." },
  helperReach: {
    en: "A trained helper will reach out to you safely.",
    sw: "Msaidizi aliyefunzwa atakufikia kwa usalama.",
  },
  leaveSafely: { en: "Leave this page safely", sw: "Ondoka ukurasa huu kwa usalama" },
  consentTitle: { en: "Before we begin", sw: "Kabla hatujaanza" },
  consentBody: {
    en: "Sauti listens to you in real time.\nNo recording is saved.\nYour conversation helps connect you to support.\nYou can stop at any time.",
    sw: "Sauti inakusikiliza wakati halisi.\nHakuna rekodi inayohifadhiwa.\nMazungumzo yako yanakusaidia kupata msaada.\nUnaweza kusimama wakati wowote.",
  },
  consentBtn: { en: "I understand — start", sw: "Naelewa — anza" },
};

const handleExit = () => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.replace("https://weather.com");
};

const Sauti = () => {
  const [state, setState] = useState<SautiState>("idle");
  const [lang, setLang] = useState<Lang>(
    () => (sessionStorage.getItem("sauti_lang") as Lang) || "sw"
  );
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem("sauti_lang", lang);
  }, [lang]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const t = useCallback((key: string) => labels[key]?.[lang] ?? key, [lang]);

  const startSession = async () => {
    setState("connecting");
    try {
      const { data, error } = await supabase.functions.invoke("sauti-session", {
        body: { language: lang },
      });
      if (error || !data?.session_url) throw new Error(error?.message || "No session URL");

      const ws = new WebSocket(data.session_url);
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          streamAudioToAgent(stream, ws);
          setState("listening");
        } catch {
          setState("idle");
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "audio") playAudioChunk(msg.audio);
        if (msg.type === "transcript") {
          setTranscript((prev) => [...prev, { speaker: msg.speaker, text: msg.text }]);
        }
        if (msg.type === "signal_ready") completeSession(msg.signal_payload);
        if (msg.type === "emergency") speakEmergencyNumber(lang);
      };

      ws.onerror = () => setState("idle");
      ws.onclose = () => {
        if (state === "listening") setState("processing");
      };
    } catch {
      setState("idle");
    }
  };

  const stopSession = () => {
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setState("processing");
  };

  const completeSession = async (payload: any) => {
    setState("processing");
    try {
      await supabase.functions.invoke("sauti-complete", {
        body: { ...payload, language: lang },
      });
    } catch {
      // Signal still shown as received for user safety
    }
    setState("ended");
  };

  const streamAudioToAgent = (stream: MediaStream, ws: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN) {
        const pcm = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, pcm[i] * 32768));
        }
        ws.send(int16.buffer);
      }
    };
  };

  const playAudioChunk = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);
  };

  const speakEmergencyNumber = (language: Lang) => {
    const msg = new SpeechSynthesisUtterance(
      language === "sw" ? "Piga simu 1195 sasa hivi" : "Call 1195 now"
    );
    speechSynthesis.speak(msg);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: "#091F1A" }}>
      {/* Language toggle */}
      <div className="fixed top-3 left-3 z-50 flex gap-1">
        {(["en", "sw"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase transition-colors ${
              lang === l
                ? "bg-primary text-primary-foreground"
                : "bg-white/10 text-white/50 hover:text-white/80"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Consent overlay */}
      <AnimatePresence>
        {state === "consent" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-sm rounded-2xl p-6 text-center"
              style={{ backgroundColor: "#0D2B23" }}
            >
              <h2 className="mb-4 font-display text-lg font-semibold text-white">
                {t("consentTitle")}
              </h2>
              <p className="mb-6 whitespace-pre-line font-sans text-sm leading-relaxed text-white/70">
                {t("consentBody")}
              </p>
              <button
                onClick={startSession}
                className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform active:scale-95"
              >
                {t("consentBtn")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main interaction area */}
      <div className="flex flex-col items-center gap-6">
        {/* Mic button */}
        {(state === "idle" || state === "listening") && (
          <motion.button
            onClick={() => {
              if (state === "idle") setState("consent");
              else if (state === "listening") stopSession();
            }}
            className="relative flex h-32 w-32 items-center justify-center rounded-full transition-transform active:scale-95"
            whileTap={{ scale: 0.92 }}
          >
            {/* Rings */}
            {state === "idle" && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-safe/20" />
                <span className="absolute inset-0 rounded-full border-2 border-safe/40" />
              </>
            )}
            {state === "listening" && (
              <>
                <motion.span
                  className="absolute inset-[-8px] rounded-full border-2 border-emergency/60"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
                <motion.span
                  className="absolute inset-[-16px] rounded-full border border-emergency/30"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                />
              </>
            )}
            <span
              className={`relative flex h-24 w-24 items-center justify-center rounded-full ${
                state === "listening" ? "bg-emergency/20" : "bg-safe/10"
              }`}
            >
              {state === "listening" ? (
                <MicOff className="h-10 w-10 text-emergency" />
              ) : (
                <Mic className="h-10 w-10 text-safe" />
              )}
            </span>
          </motion.button>
        )}

        {/* Connecting state */}
        {state === "connecting" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-sans text-sm text-white/70">{t("connecting")}</p>
          </div>
        )}

        {/* Processing state */}
        {state === "processing" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-sans text-sm text-white/70">{t("connecting")}</p>
          </div>
        )}

        {/* Ended state */}
        {state === "ended" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <CheckCircle2 className="h-16 w-16 text-safe" />
            <p className="font-display text-lg font-semibold text-white">{t("received")}</p>
            <p className="text-sm text-white/60">{t("helperReach")}</p>
            <button
              onClick={handleExit}
              className="mt-4 rounded-xl bg-safe px-6 py-3 font-semibold text-white transition-transform active:scale-95"
            >
              {t("leaveSafely")}
            </button>
          </motion.div>
        )}

        {/* Labels below mic button */}
        {state === "idle" && (
          <div className="text-center">
            <p className="font-sans text-sm text-white/60">{t("tapToSpeak")}</p>
            <p className="mt-1 font-sans text-xs" style={{ color: "#C4871A" }}>
              {lang === "en" ? "Gusa kuongea" : "Tap to speak"}
            </p>
          </div>
        )}
        {state === "listening" && (
          <div className="text-center">
            <p className="font-sans text-sm text-white/70">{t("listening")}</p>
            <p className="mt-1 font-sans text-xs text-white/40">{t("tapToEnd")}</p>
          </div>
        )}
      </div>

      {/* Transcript area */}
      {(state === "listening" || state === "processing") && transcript.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[30vh] overflow-y-auto px-4 pb-6 pt-2">
          <div className="mx-auto max-w-md space-y-1">
            {transcript.map((line, i) => (
              <p
                key={i}
                className="text-xs text-white/40"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                <span className="font-semibold text-white/50">
                  {line.speaker === "agent" ? "Sauti" : "You"}:
                </span>{" "}
                {line.text}
              </p>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sauti;
