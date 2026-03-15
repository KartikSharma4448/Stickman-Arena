import { useState } from "react";
import { useGameStore } from "./store";
import { getSocket } from "./socket";

const REGIONS = ["Asia", "Europe", "North America", "South America", "Middle East"];

export default function LoginScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  const setMyName = useGameStore((s) => s.setMyName);
  const setMyRegion = useGameStore((s) => s.setMyRegion);
  const myRegion = useGameStore((s) => s.myRegion);

  const [nameInput, setNameInput] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(myRegion);
  const [mode, setMode] = useState<"main" | "username">("main");
  const [error, setError] = useState("");

  const guestLogin = () => {
    const guestName = nameInput.trim() || `Guest${Math.floor(Math.random() * 9999)}`;
    setMyName(guestName);
    setMyRegion(selectedRegion);
    getSocket().emit("set_name", { name: guestName });
    setPhase("lobby");
  };

  const handleUsernameLogin = () => {
    if (nameInput.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    setMyName(nameInput.trim());
    setMyRegion(selectedRegion);
    getSocket().emit("set_name", { name: nameInput.trim() });
    setPhase("lobby");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at 30% 50%, #0d1b3e 0%, #050510 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        zIndex: 9998,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.02%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: "relative",
          width: 420,
          maxWidth: "92vw",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: 4,
              background: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 20px rgba(255,107,107,0.3))",
            }}
          >
            STICKMAN FPS
          </div>
          <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
            Enter the battlefield
          </div>
        </div>

        <button
          onClick={guestLogin}
          style={{
            width: "100%",
            padding: "18px 24px",
            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
            border: "none",
            borderRadius: 14,
            color: "#fff",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 2,
            cursor: "pointer",
            marginBottom: 16,
            boxShadow: "0 8px 32px rgba(255,107,107,0.35)",
            transition: "transform 0.1s, box-shadow 0.1s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          <span style={{ fontSize: 22 }}>⚡</span>
          GUEST LOGIN (FAST)
        </button>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "#888", marginBottom: 10, letterSpacing: 1 }}>
            USERNAME (OPTIONAL)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleUsernameLogin()}
              placeholder="Your battle name..."
              maxLength={20}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 15,
                outline: "none",
              }}
            />
            <button
              onClick={handleUsernameLogin}
              style={{
                background: "rgba(74,158,255,0.2)",
                border: "1px solid rgba(74,158,255,0.4)",
                borderRadius: 10,
                padding: "10px 18px",
                color: "#4a9eff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              JOIN
            </button>
          </div>
          {error && (
            <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 6 }}>{error}</div>
          )}
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 20,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 12, color: "#888", marginBottom: 10, letterSpacing: 1 }}>
            🌐 SELECT REGION (PING OPTIMIZATION)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: selectedRegion === r ? "#ffd93d" : "rgba(255,255,255,0.12)",
                  background: selectedRegion === r ? "rgba(255,217,61,0.15)" : "transparent",
                  color: selectedRegion === r ? "#ffd93d" : "#888",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: selectedRegion === r ? "bold" : "normal",
                  transition: "all 0.15s",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            color: "#333",
            fontSize: 11,
            marginTop: 24,
            letterSpacing: 1,
          }}
        >
          No account needed • Start playing instantly
        </div>
      </div>
    </div>
  );
}
