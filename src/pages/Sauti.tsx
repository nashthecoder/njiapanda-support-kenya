import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import SautiWaveform from "@/components/sauti/SautiWaveform";
import SautiTimer from "@/components/sauti/SautiTimer";
import {
  SAUTI_SYSTEM_PROMPT_EN,
  SAUTI_SYSTEM_PROMPT_SW,
  EMERGENCY_MSG,
} from "@/components/sauti/sautiPrompts";

type SautiState = "idle" | "consent" | "connecting" | "listening" | "processing" | "ended" | "mic-error";
type Lang = "sw" | "en";

const labels: Record<string, Record<Lang, string>> = {
  tapToSpeak: { en: "Tap to speak", sw: "Gusa kuongea" },
  listening: { en: "Listening...", sw: "Ninakusikiliza..." },
  tapToEnd: { en: "Tap to end", sw: "Gusa kumaliza" },
  connecting: { en: "Connecting you safely...", sw: "Inakuunganisha salama..." },
  received: { en: "Your message has been received.", sw: "Ujumbe wako umepokewa." },
  helperReach: {
    en: "A trained helper will reach out to you safely.",
    sw: "Msaidizi aliyefunzwa atawasiliana nawe salama.",
  },
  leaveSafely: { en: "Leave this page safely", sw: "Ondoka ukurasa huu kwa usalama" },
  consentTitle: { en: "Before we begin", sw: "Kabla hatujaanza" },
  consentBody: {
    en: "Sauti listens to you in real time.\nNo recording is saved.\nYour conversation helps connect you to support.\nYou can stop at any time.",
    sw: "Sauti inakusikiliza wakati halisi.\nHakuna rekodi inayohifadhiwa.\nMazungumzo yako yanakusaidia kupata msaada.\nUnaweza kusimama wakati wowote.",
  },
  consentBtn: { en: "I understand — start", sw: "Naelewa — anza" },
  micError: { 
    en: "Microphone access is needed to use Sauti", 
    sw: "Unahitaji ufikiaji wa kipaza sauti kutumia Sauti" 
  },
  micErrorBody: {
    en: "Please allow microphone access in your browser to continue.\nYou may need to click the microphone icon in your address bar.",
    sw: "Tafadhali ruhusu ufikiaji wa kipaza sauti kwenye kivinjari chako kuendelea.\nHuenda ukahitaji kubonyeza ikoni ya kipaza sauti kwenye upau wa anwani."
  },
  tryAgain: { en: "Try again", sw: "Jaribu tena" },
};

const handleExit = () => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.replace("https://weather.com");
};

const Sauti = () => {
  const [state, setState] = useState<SautiState>("idle");
  const [lang, setLang] = useState<Lang>(
    () => (sessionStorage.getItem("sauti-lang") as Lang) || "sw"
  );
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string>("");
  const audioOutCtxRef = useRef<AudioContext | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const isCompletingRef = useRef(false);
  const hasMicStartedRef = useRef(false);

  useEffect(() => {
    sessionStorage.setItem("sauti-lang", lang);
  }, [lang]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current);
      }
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioOutCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const t = useCallback((key: string) => labels[key]?.[lang] ?? key, [lang]);

  /** Convert Float32 PCM to base64 Int16 PCM */
  const pcmToBase64 = (float32: Float32Array): string => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const bytesFromBase64 = (base64: string) =>
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const getOutCtx = (sampleRate: number) => {
    const ctx = audioOutCtxRef.current;
    if (!ctx || ctx.sampleRate !== sampleRate) {
      ctx?.close().catch(() => {});
      audioOutCtxRef.current = new AudioContext({ sampleRate });
    }
    return audioOutCtxRef.current!;
  };

  /** Play base64-encoded audio chunk from Vertex */
  const playAudioChunk = (base64: string, mimeType?: string) => {
    const type = mimeType ?? "audio/wav";

    // Vertex often returns raw PCM: "audio/pcm;rate=24000".
    if (type.includes("audio/pcm")) {
      const rate = Number(type.match(/rate=(\d+)/)?.[1] ?? 24000);
      const ctx = getOutCtx(rate);
      ctx.resume().catch(() => {});

      const bytes = bytesFromBase64(base64);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const frameCount = Math.floor(bytes.byteLength / 2);
      const float32 = new Float32Array(frameCount);
      for (let i = 0; i < frameCount; i++) {
        const s = view.getInt16(i * 2, true);
        float32[i] = s / 32768;
      }

      const buffer = ctx.createBuffer(1, float32.length, rate);
      buffer.copyToChannel(float32, 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start();
      return;
    }

    // Fallback (e.g. audio/wav)
    const bytes = bytesFromBase64(base64);
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);
  };

  /** Try to parse JSON signal payload from agent text */
  const tryParseSignal = (text: string) => {
    try {
      const match = text.match(/\{[^}]+\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.urgency) return parsed;
      }
    } catch {
      /* not json yet */
    }
    return null;
  };

  const completeSession = async (payload: any) => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    setState("processing");

    const normalizedPayload = {
      urgency: payload?.urgency ?? "medium",
      zone: payload?.zone ?? "unspecified",
      resource_needed: payload?.resource_needed ?? "general_support",
    };

    // Emergency: speak hotline number immediately
    if (normalizedPayload.urgency === "emergency") {
      const msg = new SpeechSynthesisUtterance(EMERGENCY_MSG[lang]);
      speechSynthesis.speak(msg);
    }

    try {
      await supabase.functions.invoke("sauti-complete", {
        body: {
          urgency: normalizedPayload.urgency,
          zone: normalizedPayload.zone,
          resource_needed: normalizedPayload.resource_needed,
          language: lang,
          sessionId: sessionIdRef.current,
        },
      });
    } catch {
      // Signal still shown as received for user safety
    }

    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    hasMicStartedRef.current = false;
    setState("ended");
  };

  const startSession = async () => {
    setState("connecting");
    isCompletingRef.current = false;
    hasMicStartedRef.current = false;

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("sauti-session", {
        body: { language: lang },
      });
      if (error || !data?.wsUrl) throw new Error(error?.message || "No session URL");

      sessionIdRef.current = data.sessionId;

      // Pass bearer token as query parameter for Vertex AI WebSocket auth
      const wsUrlWithAuth = `${data.wsUrl}?access_token=${encodeURIComponent(data.accessToken)}`;
      const ws = new WebSocket(wsUrlWithAuth);
      wsRef.current = ws;

      // Timeout: if WebSocket doesn't open within 10s, reset
      const connectTimeout = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setState("idle");
        }
      }, 10000);

      let setupTimeout: number | null = null;
      const clearSetupTimeout = () => {
        if (setupTimeout) {
          window.clearTimeout(setupTimeout);
          setupTimeout = null;
        }
      };

      const beginMicCapture = () => {
        if (hasMicStartedRef.current) return;
        hasMicStartedRef.current = true;
        clearSetupTimeout();

        navigator.mediaDevices
          .getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })
          .then((stream) => {
            streamRef.current = stream;
            setState("listening");
            streamAudioToWs(stream, ws);
          })
          .catch(() => {
            setState("mic-error");
            ws.close();
          });
      };

      ws.onopen = () => {
        clearTimeout(connectTimeout);

        // Send Vertex AI setup message
        ws.send(
          JSON.stringify({
            setup: {
              model: data.model,
              generation_config: {
                response_modalities: ["AUDIO", "TEXT"],
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: { voice_name: "Aoede" },
                  },
                },
              },
              system_instruction: {
                parts: [
                  {
                    text:
                      lang === "sw"
                        ? SAUTI_SYSTEM_PROMPT_SW
                        : SAUTI_SYSTEM_PROMPT_EN,
                  },
                ],
              },
            },
          })
        );

        // Wait for setup acknowledgement before starting microphone stream
        setupTimeout = window.setTimeout(() => {
          if (!hasMicStartedRef.current) {
            beginMicCapture();
          }
        }, 1500);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if ((msg.setupComplete || msg.setup_complete) && !hasMicStartedRef.current) {
            beginMicCapture();
            return;
          }

          const serverContent = msg.serverContent ?? msg.server_content;
          const modelTurn = serverContent?.modelTurn ?? serverContent?.model_turn;
          const parts = modelTurn?.parts ?? [];

          // Handle audio and text from model
          if (parts.length > 0) {
            parts.forEach((part: any) => {
              const inlineData = part.inlineData ?? part.inline_data;
              const mimeType = inlineData?.mimeType ?? inlineData?.mime_type;

              if (mimeType?.includes("audio")) {
                playAudioChunk(inlineData.data, mimeType);
              }

              if (part.text) {
                setTranscript((prev) => [...prev, { speaker: "Sauti", text: part.text }]);
                // Check if agent returned signal JSON
                const signal = tryParseSignal(part.text);
                if (signal) completeSession(signal);
              }
            });
          }
        } catch {
          // Non-JSON message, ignore
        }
      };

      ws.onerror = () => {
        clearSetupTimeout();
        setState("idle");
      };

      ws.onclose = () => {
        clearSetupTimeout();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        hasMicStartedRef.current = false;
        setState((current) => {
          if (current === "processing" && !isCompletingRef.current) return "ended";
          if (current === "connecting") return "idle";
          return current;
        });
      };
    } catch {
      setState("idle");
    }
  };

  const streamAudioToWs = (stream: MediaStream, ws: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContext.resume().catch(() => {});

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    // Keep processor alive without echo/feedback
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const pcm = e.inputBuffer.getChannelData(0);
      const b64 = pcmToBase64(pcm);
      ws.send(
        JSON.stringify({
          realtime_input: {
            media_chunks: [{ mime_type: "audio/pcm;rate=16000", data: b64 }],
          },
        })
      );
    };
  };

  const stopSession = () => {
    setState("processing");
    streamRef.current?.getTracks().forEach((t) => t.stop());

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            realtime_input: {
              audio_stream_end: true,
            },
          })
        );
      }
    } catch {
      // If signaling stop fails, fallback completion timeout below still protects user flow
    }

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
    }

    processingTimeoutRef.current = window.setTimeout(() => {
      completeSession({
        urgency: "medium",
        zone: "unspecified",
        resource_needed: "general_support",
      });
    }, 8000);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: "#091F1A" }}
    >
      {/* Language toggle */}
      <div className="fixed top-3 left-3 z-50 flex gap-1">
        {(["en", "sw"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase transition-colors ${
              lang === l
                ? "bg-[#C4871A] text-[#091F1A]"
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
            className="fixed inset-0 z-40 flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-[400px] rounded-2xl p-8 text-center"
              style={{ backgroundColor: "#0F3D34" }}
            >
              <h2 className="mb-4 font-display text-lg font-semibold text-white">
                {t("consentTitle")}
              </h2>
              <p className="mb-6 whitespace-pre-line font-sans text-sm leading-relaxed text-white/70">
                {t("consentBody")}
              </p>
              <button
                onClick={startSession}
                className="w-full rounded-xl px-6 py-3 font-semibold transition-transform active:scale-95"
                style={{ backgroundColor: "#C4871A", color: "#091F1A" }}
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
        {(state === "idle" || state === "listening" || state === "mic-error") && (
          <motion.button
            onClick={() => {
              if (state === "idle") setState("consent");
              else if (state === "listening") stopSession();
              else if (state === "mic-error") setState("consent");
            }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95"
            style={{ minWidth: 80, minHeight: 80 }}
            whileTap={{ scale: 0.92 }}
            aria-label={
              state === "mic-error" ? t("tryAgain") : 
              state === "idle" ? t("tapToSpeak") : t("tapToEnd")
            }
          >
            {/* Rings */}
            {state === "idle" && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-safe/20" />
                <span className="absolute inset-0 rounded-full border-2 border-safe/40" />
              </>
            )}
            {state === "listening" && (
              <motion.span
                className="absolute inset-[-8px] rounded-full border-2 border-emergency/60"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
            <span
              className={`relative flex h-16 w-16 items-center justify-center rounded-full ${
                state === "listening" ? "bg-emergency/20" : 
                state === "mic-error" ? "bg-emergency/10" :
                "bg-[#C4871A]/15"
              }`}
            >
              {state === "listening" ? (
                <MicOff className="h-8 w-8 text-emergency" />
              ) : state === "mic-error" ? (
                <MicOff className="h-8 w-8 text-emergency/60" />
              ) : (
                <Mic className="h-8 w-8" style={{ color: "#C4871A" }} />
              )}
            </span>
          </motion.button>
        )}

        {/* Waveform (listening) */}
        {state === "listening" && (
          <SautiWaveform stream={streamRef.current} barCount={7} />
        )}

        {/* Timer (listening) */}
        {state === "listening" && <SautiTimer running={true} />}

        {/* Connecting / Processing state */}
        {(state === "connecting" || state === "processing") && (
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
            <p className="font-display text-lg font-semibold italic text-white">
              {t("received")}
            </p>
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
            <p className="mt-1 font-mono text-xs" style={{ color: "#C4871A" }}>
              {lang === "en" ? "Gusa kuongea" : "Tap to speak"}
            </p>
          </div>
        )}
        {state === "listening" && (
          <div className="text-center">
            <p className="font-sans text-sm text-white/70">{t("listening")}</p>
            <p className="mt-1 font-sans text-xs text-white/30">{t("tapToEnd")}</p>
          </div>
        )}
        {state === "mic-error" && (
          <div className="text-center max-w-xs">
            <p className="font-display text-sm font-semibold text-emergency mb-2">{t("micError")}</p>
            <p className="font-sans text-xs text-white/60 whitespace-pre-line leading-relaxed mb-3">
              {t("micErrorBody")}
            </p>
            <p className="font-sans text-xs" style={{ color: "#C4871A" }}>
              {t("tryAgain")}
            </p>
          </div>
        )}
      </div>

      {/* Transcript area */}
      {(state === "listening" || state === "processing") && transcript.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[25vh] overflow-y-auto px-4 pb-6 pt-2">
          <div className="mx-auto max-w-md space-y-1">
            {transcript.slice(-6).map((line, i) => (
              <p
                key={i}
                className="font-serif text-xs italic text-white/35"
              >
                <span className="font-semibold text-white/45">{line.speaker}:</span>{" "}
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
