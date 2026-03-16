import { useState, useEffect } from "react";
import { useGameStore } from "./store";
import ShopModal from "./ShopModal";

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SniperScope() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Dark vignette corners — circular hole in center */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <mask id="scopeMask">
            <rect width="100" height="100" fill="white" />
            <circle cx="50" cy="50" r="34" fill="black" />
          </mask>
          <radialGradient id="glassGrad" cx="45%" cy="38%">
            <stop offset="0%" stopColor="rgba(180,220,255,0.07)" />
            <stop offset="60%" stopColor="rgba(120,180,255,0.02)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        {/* Black surround */}
        <rect width="100" height="100" fill="rgba(0,0,0,0.97)" mask="url(#scopeMask)" />
        {/* Glass glare inside circle */}
        <circle cx="50" cy="50" r="34" fill="url(#glassGrad)" />
        {/* Outer ring */}
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(80,80,80,0.9)" strokeWidth="0.6" />
        {/* Inner thin ring */}
        <circle cx="50" cy="50" r="32.5" fill="none" stroke="rgba(60,60,60,0.5)" strokeWidth="0.25" />
        {/* Crosshair — full lines */}
        <line x1="16" y1="50" x2="84" y2="50" stroke="rgba(0,0,0,0.85)" strokeWidth="0.18" />
        <line x1="50" y1="16" x2="50" y2="84" stroke="rgba(0,0,0,0.85)" strokeWidth="0.18" />
        {/* Center gap — invisible center dot zone */}
        <line x1="16" y1="50" x2="46.5" y2="50" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        <line x1="53.5" y1="50" x2="84" y2="50" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        <line x1="50" y1="16" x2="50" y2="46.5" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        <line x1="50" y1="53.5" x2="50" y2="84" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        {/* Center red dot */}
        <circle cx="50" cy="50" r="0.4" fill="rgba(220,30,30,0.9)" />
        {/* Mil-dots on horizontal */}
        {[-12, -8, -4, 4, 8, 12].map((d) => (
          <circle key={d} cx={50 + d} cy="50" r="0.35" fill="rgba(20,20,20,0.88)" />
        ))}
        {/* Mil-dots on vertical */}
        {[-12, -8, -4, 4, 8, 12].map((d) => (
          <circle key={d} cx="50" cy={50 + d} r="0.35" fill="rgba(20,20,20,0.88)" />
        ))}
        {/* Rangefinder ticks on horizontal */}
        {[-16, -12, -8, -4, 4, 8, 12, 16].map((d) => (
          <line key={d} x1={50 + d} y1="48.5" x2={50 + d} y2="51.5" stroke="rgba(20,20,20,0.6)" strokeWidth="0.15" />
        ))}
      </svg>
    </div>
  );
}

function ADSCrosshair() {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 45,
        pointerEvents: "none",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
        <line x1="12" y1="0" x2="12" y2="6.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
        <line x1="12" y1="17.5" x2="12" y2="24" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
        <line x1="0" y1="12" x2="6.5" y2="12" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
        <line x1="17.5" y1="12" x2="24" y2="12" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="1.2" fill="rgba(255,80,80,0.9)" />
      </svg>
    </div>
  );
}

export default function HUD() {
  const health = useGameStore((s) => s.health);
  const kills = useGameStore((s) => s.kills);
  const deaths = useGameStore((s) => s.deaths);
  const isDead = useGameStore((s) => s.isDead);
  const respawnCountdown = useGameStore((s) => s.respawnCountdown);
  const killFeed = useGameStore((s) => s.killFeed);
  const hitIndicator = useGameStore((s) => s.hitIndicator);
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const myName = useGameStore((s) => s.myName);
  const latency = useGameStore((s) => s.latency);
  const ammo = useGameStore((s) => s.ammo);
  const maxAmmo = useGameStore((s) => s.maxAmmo);
  const isReloading = useGameStore((s) => s.isReloading);
  const selectedGun = useGameStore((s) => s.selectedGun);
  const setPhase = useGameStore((s) => s.setPhase);
  const coins = useGameStore((s) => s.coins);
  const isScoped = useGameStore((s) => s.isScoped);
  const matchTimeLeft = useGameStore((s) => s.matchTimeLeft);
  const killTarget = useGameStore((s) => s.killTarget);
  const matchLeaderboard = useGameStore((s) => s.matchLeaderboard);
  const matchMode = useGameStore((s) => s.matchMode);
  const myTeamId = useGameStore((s) => s.myTeamId);
  const currentMap = useGameStore((s) => s.currentMap);
  const roomCode = useGameStore((s) => s.roomCode);
  const myId = useGameStore((s) => s.myId);

  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const scoreboard = Object.values(remotePlayers).sort((a, b) => b.kills - a.kills);
  const kd = deaths > 0 ? (kills / deaths).toFixed(1) : kills.toString();
  const healthColor = health > 60 ? "#00e676" : health > 30 ? "#ffb300" : "#f44336";

  const gunIcon: Record<string, string> = { "AK-47": "🔫", "SMG": "💥", "Sniper": "🎯", "Shotgun": "🔧" };

  return (
    <>
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {hitIndicator && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            border: "6px solid rgba(255,0,0,0.6)",
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}

      {/* SCOPE OVERLAYS */}
      {isScoped && selectedGun === "Sniper" && <SniperScope />}
      {isScoped && selectedGun !== "Sniper" && <ADSCrosshair />}

      {/* CROSSHAIR — hide when scoped */}
      {!isScoped && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 40,
            pointerEvents: "none",
            width: 28,
            height: 28,
          }}
        >
          <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.9)", left: "50%", top: 0, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.9)", left: "50%", bottom: 0, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.9)", top: "50%", left: 0, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.9)", top: "50%", right: 0, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", width: 3, height: 3, background: "rgba(255,107,107,0.8)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        </div>
      )}

      {/* ADS hint for Sniper when not scoped */}
      {!isScoped && selectedGun === "Sniper" && (
        <div style={{
          position: "fixed",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          pointerEvents: "none",
          background: "rgba(0,0,0,0.5)",
          borderRadius: 6,
          padding: "4px 12px",
          fontSize: 10,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 1,
        }}>
          RIGHT CLICK — SCOPE
        </div>
      )}

      {/* BOTTOM-LEFT: Health + Ammo */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            borderRadius: 14,
            padding: "14px 18px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.07)",
            minWidth: 190,
          }}
        >
          {/* Health */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>♥ HEALTH</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: healthColor, fontFamily: "monospace" }}>
              {Math.max(0, health)}
            </span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
            <div
              style={{
                width: `${Math.max(0, health)}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${healthColor}88, ${healthColor})`,
                borderRadius: 3,
                transition: "width 0.2s, background 0.3s",
                boxShadow: `0 0 8px ${healthColor}55`,
              }}
            />
          </div>

          {/* Ammo */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
              {gunIcon[selectedGun] || "🔫"} {selectedGun}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: ammo <= 5 ? "#f44336" : "#fff", fontFamily: "monospace" }}>
                {ammo}
              </span>
              <span style={{ fontSize: 11, color: "#444" }}>/{maxAmmo}</span>
            </div>
          </div>
          {isReloading ? (
            <div
              style={{
                fontSize: 10,
                color: "#ffd93d",
                fontWeight: "bold",
                letterSpacing: 2,
                animation: "pulse 0.5s ease-in-out infinite alternate",
              }}
            >
              ↺ RELOADING...
            </div>
          ) : (
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {Array.from({ length: maxAmmo }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: 10,
                    borderRadius: 1,
                    background: i < ammo ? "#ffcc44" : "rgba(255,255,255,0.1)",
                    transition: "background 0.15s",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM-RIGHT: Stats */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 40,
          textAlign: "right",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            borderRadius: 14,
            padding: "14px 18px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", lineHeight: 1 }}>
            <span style={{ color: "#6bcb77" }}>{kills}</span>
            <span style={{ color: "#333", fontSize: 18 }}> / </span>
            <span style={{ color: "#ff6b6b" }}>{deaths}</span>
          </div>
          <div style={{ fontSize: 9, color: "#444", marginTop: 2, letterSpacing: 1 }}>KILLS / DEATHS</div>
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#aaa", fontWeight: "bold" }}>{kd}</div>
              <div style={{ fontSize: 9, color: "#444" }}>K/D</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: latency < 80 ? "#6bcb77" : latency < 150 ? "#ffd93d" : "#ff6b6b", fontWeight: "bold" }}>{latency}ms</div>
              <div style={{ fontSize: 9, color: "#444" }}>PING</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#ffd93d", fontWeight: "bold" }}>🪙 {coins}</div>
              <div style={{ fontSize: 9, color: "#444" }}>COINS</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT: Kill feed */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          maxWidth: 240,
        }}
      >
        {killFeed.slice(0, 5).map((k) => (
          <div
            key={k.id}
            style={{
              background: "rgba(0,0,0,0.72)",
              padding: "5px 10px",
              borderRadius: 6,
              fontSize: 12,
              color: "#fff",
              display: "flex",
              gap: 6,
              alignItems: "center",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderLeft: k.headshot ? "3px solid #ffd93d" : "3px solid #ff6b6b",
            }}
          >
            <span style={{ color: "#88ccff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.killerName}</span>
            {k.headshot && <span style={{ color: "#ffd93d", fontSize: 10 }}>🎯</span>}
            <span style={{ color: "#ff6b6b" }}>→</span>
            <span style={{ color: "#ff9999", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.victimName}</span>
          </div>
        ))}
      </div>

      {/* TOP-LEFT: Scoreboard */}
      <div style={{ position: "fixed", top: 20, left: 20, zIndex: 40 }}>
        <div
          style={{
            background: "rgba(0,0,0,0.62)",
            borderRadius: 10,
            padding: "10px 14px",
            minWidth: 175,
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ color: "#ffd93d", fontSize: 9, fontWeight: "bold", marginBottom: 6, letterSpacing: 1 }}>SCOREBOARD</div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#333", fontSize: 8, marginBottom: 4 }}>
            <span>NAME</span><span>K / D</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2, padding: "2px 0" }}>
            <span style={{ color: "#4a9eff" }}>★ {myName.slice(0, 12)}</span>
            <span><span style={{ color: "#6bcb77" }}>{kills}</span>{" / "}<span style={{ color: "#ff6b6b" }}>{deaths}</span></span>
          </div>
          {scoreboard.slice(0, 6).map((p) => (
            <div key={p.id} style={{ fontSize: 11, display: "flex", justifyContent: "space-between", color: "#666", marginBottom: 2, padding: "2px 0" }}>
              <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.name || "Player").slice(0, 12)}</span>
              <span><span style={{ color: "#6bcb77" }}>{p.kills}</span>{" / "}<span style={{ color: "#ff6b6b" }}>{p.deaths}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* TOP-CENTER buttons */}
      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => setShowShop(true)}
          style={{
            background: "rgba(255,217,61,0.12)",
            border: "1px solid rgba(255,217,61,0.25)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#ffd93d",
            fontSize: 11,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            fontWeight: "bold",
          }}
        >
          🛒 SHOP
        </button>
        <button
          onClick={() => setPhase("results")}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#555",
            fontSize: 11,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          END MATCH
        </button>
      </div>

      {/* DEAD screen */}
      {isDead && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 60,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 900, color: "#f44336", letterSpacing: 4, textShadow: "0 0 40px rgba(244,67,54,0.5)" }}>
            YOU DIED
          </div>
          <div style={{ fontSize: 22, color: "#fff", marginTop: 10, background: "rgba(0,0,0,0.6)", padding: "8px 24px", borderRadius: 30 }}>
            Respawning in{" "}
            <span style={{ color: "#ffd93d", fontWeight: "bold" }}>{respawnCountdown}s</span>
          </div>
        </div>
      )}
    </>
  );
}
