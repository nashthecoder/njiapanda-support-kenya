import { useEffect, useRef } from "react";

interface SautiWaveformProps {
  stream: MediaStream | null;
  barCount?: number;
}

const SautiWaveform = ({ stream, barCount = 7 }: SautiWaveformProps) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const val = dataArray[i % dataArray.length] / 255;
        const height = Math.max(8, val * 48);
        bar.style.height = `${height}px`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      audioCtx.close();
    };
  }, [stream]);

  return (
    <div className="flex items-center justify-center gap-1" aria-hidden="true">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className="w-1 rounded-full bg-safe/60 transition-[height] duration-75"
          style={{ height: "8px" }}
        />
      ))}
    </div>
  );
};

export default SautiWaveform;
