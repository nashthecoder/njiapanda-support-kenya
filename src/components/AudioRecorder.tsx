import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_DURATION = 90; // seconds

type RecorderState = "consent" | "ready" | "recording" | "processing" | "review";

interface AudioRecorderProps {
  onTranscript: (text: string) => void;
}

export default function AudioRecorder({ onTranscript }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>("consent");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopEverything = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 40;
      const barWidth = canvas.width / barCount - 2;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step];
        const barHeight = (value / 255) * canvas.height * 0.85;
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Use CSS custom property for primary color
        ctx.fillStyle = "hsl(152, 55%, 33%)";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };
    draw();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stopEverything();
        setState("processing");

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];

          try {
            const { data, error } = await supabase.functions.invoke("transcribe-audio", {
              body: { audio: base64, duration: elapsed },
            });

            if (error || !data?.text) {
              toast.error("Transcription failed. Please try again or type your story.");
              setState("ready");
              return;
            }

            setTranscript(data.text);
            setState("review");
          } catch {
            toast.error("Transcription failed. Please try again or type your story.");
            setState("ready");
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(1000); // collect chunks every second
      setState("recording");
      setElapsed(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION) {
            mediaRecorderRef.current?.stop();
            toast.info("Maximum recording time reached (90 seconds).");
          }
          return next;
        });
      }, 1000);

      drawWaveform();
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error(
          "Microphone access was denied. Please enable it in your browser settings and try again.",
          { duration: 6000 }
        );
      } else {
        toast.error("Could not access your microphone. Please check your device settings.");
      }
      setState("ready");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const handleReRecord = () => {
    setTranscript("");
    setElapsed(0);
    setState("ready");
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // --- CONSENT ---
  if (state === "consent") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center" role="region" aria-label="Audio recording consent">
        <Mic className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
        <p className="mb-4 text-sm leading-relaxed text-foreground">
          Your voice will be transcribed to text.{" "}
          <strong>No audio recording is stored</strong> — only the text you approve.
        </p>
        <Button onClick={() => setState("ready")} className="w-full">
          I understand — start recording
        </Button>
      </div>
    );
  }

  // --- READY ---
  if (state === "ready") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6" role="region" aria-label="Audio recorder ready">
        <button
          onClick={startRecording}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ring"
          aria-label="Tap to start recording"
        >
          <Mic className="h-7 w-7" />
        </button>
        <p className="text-sm font-medium text-muted-foreground">Tap to record</p>
      </div>
    );
  }

  // --- RECORDING ---
  if (state === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-card p-6" role="region" aria-label="Recording in progress" aria-live="polite">
        {/* Pulsing stop button */}
        <button
          onClick={stopRecording}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ring"
          aria-label="Tap to stop recording"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />
          <Square className="relative h-6 w-6" />
        </button>
        <p className="text-sm font-medium text-destructive">
          Recording… tap to stop
        </p>
        <p className="font-mono text-lg tabular-nums text-foreground" aria-live="off">
          {formatTime(elapsed)}
        </p>

        {/* Waveform */}
        <canvas
          ref={canvasRef}
          width={280}
          height={48}
          className="w-full max-w-[280px] rounded"
          aria-hidden="true"
        />

        {/* Progress bar */}
        <div className="w-full max-w-[280px]">
          <Progress value={(elapsed / MAX_DURATION) * 100} className="h-1.5" />
          <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
            {formatTime(MAX_DURATION - elapsed)} remaining
          </p>
        </div>
      </div>
    );
  }

  // --- PROCESSING ---
  if (state === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6" role="region" aria-label="Transcribing your recording" aria-live="polite">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Transcribing…</p>
      </div>
    );
  }

  // --- REVIEW ---
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5" role="region" aria-label="Review your transcription">
      <label className="block text-sm font-medium text-foreground">
        We heard this — edit anything before submitting
      </label>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={6}
        className="w-full rounded-lg border border-input bg-background px-4 py-3 font-serif text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Transcribed story text, editable"
      />
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleReRecord} className="flex-1 gap-2">
          <RotateCcw className="h-4 w-4" />
          Re-record
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Submit Story
        </Button>
      </div>
    </div>
  );
}
