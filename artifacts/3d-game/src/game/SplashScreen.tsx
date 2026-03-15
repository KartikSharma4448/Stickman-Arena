import { useEffect, useState } from "react";
import { useGameStore } from "./store";

export default function SplashScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");

  useEffect(() => {
    const steps = [
      { pct: 20, text: "Loading assets...", delay: 400 },
      { pct: 45, text: "Connecting to server...", delay: 800 },
      { pct: 70, text: "Preloading maps...", delay: 600 },
      { pct: 90, text: "Almost ready...", delay: 500 },
      { pct: 100, text: "Ready!", delay: 400 },
    ];

    let total = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const step of steps) {
      total += step.delay;
      const t = setTimeout(() => {
        setProgress(step.pct);
        setStatusText(step.text);
      }, total);
      timers.push(t);
    }

    const done = setTimeout(() => {
      setPhase("login");
    }, total + 600);
    timers.push(done);

    return () => timers.forEach(clearTimeout);
  }, [setPhase]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, #0d0d2b 0%, #050510 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 100%)," +
            "radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.1) 0%, transparent 100%)," +
            "radial-gradient(1px 1px at 50% 60%, rgba(255,255,255,0.12) 0%, transparent 100%)," +
            "radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.08) 0%, transparent 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          textAlign: "center",
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: 6,
            background: "linear-gradient(135deg, #ff6b6b 0%, #ffd93d 40%, #6bcb77 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0 0 30px rgba(255,107,107,0.4))",
            lineHeight: 1,
          }}
        >
          STICKMAN
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: 12,
            color: "#ff6b6b",
            filter: "drop-shadow(0 0 20px rgba(255,107,107,0.6))",
            marginTop: 4,
          }}
        >
          FPS
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#555",
            letterSpacing: 4,
            marginTop: 8,
            textTransform: "uppercase",
          }}
        >
          Online Multiplayer Shooter
        </div>
      </div>

      <div style={{ width: 320, position: "relative" }}>
        <div
          style={{
            height: 4,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 2,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #ff6b6b, #ffd93d)",
              borderRadius: 2,
              transition: "width 0.4s ease",
              boxShadow: "0 0 12px rgba(255,107,107,0.6)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#555",
            fontSize: 12,
          }}
        >
          <span>{statusText}</span>
          <span>{progress}%</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 30,
          color: "#333",
          fontSize: 11,
          letterSpacing: 2,
        }}
      >
        v1.0.0 • Powered by WebGL
      </div>
    </div>
  );
}
