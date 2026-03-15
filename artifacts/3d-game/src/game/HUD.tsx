import { useGameStore } from "./store";

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
  const selectedGun = useGameStore((s) => s.selectedGun);
  const setPhase = useGameStore((s) => s.setPhase);

  const scoreboard = Object.values(remotePlayers).sort((a, b) => b.kills - a.kills);
  const kd = deaths > 0 ? (kills / deaths).toFixed(1) : kills.toString();

  const healthColor = health > 60 ? "#00e676" : health > 30 ? "#ffb300" : "#f44336";

  return (
    <>
      {hitIndicator && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            border: "6px solid rgba(255,0,0,0.6)",
            pointerEvents: "none",
            zIndex: 50,
            animation: "fadeOut 0.4s ease-out forwards",
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 40,
          pointerEvents: "none",
          width: 24,
          height: 24,
        }}
      >
        <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.85)", left: "50%", top: 0, transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.85)", left: "50%", bottom: 0, transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.85)", top: "50%", left: 0, transform: "translateY(-50%)" }} />
        <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.85)", top: "50%", right: 0, transform: "translateY(-50%)" }} />
        <div
          style={{
            position: "absolute",
            width: 3,
            height: 3,
            background: "rgba(255,255,255,0.6)",
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

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
            background: "rgba(0,0,0,0.55)",
            borderRadius: 12,
            padding: "12px 16px",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.08)",
            minWidth: 180,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 10, color: "#888", letterSpacing: 1 }}>HEALTH</span>
            <span
              style={{ fontSize: 18, fontWeight: 900, color: healthColor, fontFamily: "monospace" }}
            >
              {Math.max(0, health)}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: `${Math.max(0, health)}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${healthColor}, ${healthColor}88)`,
                borderRadius: 3,
                transition: "width 0.2s, background 0.3s",
                boxShadow: `0 0 8px ${healthColor}66`,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 10, color: "#888", letterSpacing: 1 }}>AMMO</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: ammo <= 5 ? "#f44336" : "#fff",
                  fontFamily: "monospace",
                }}
              >
                {ammo}
              </span>
              <span style={{ fontSize: 11, color: "#555" }}>/{maxAmmo}</span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>
            {selectedGun} • Press R to reload
          </div>
        </div>
      </div>

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
            background: "rgba(0,0,0,0.55)",
            borderRadius: 12,
            padding: "12px 16px",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{ fontSize: 26, fontWeight: 900, fontFamily: "monospace", lineHeight: 1 }}
          >
            <span style={{ color: "#6bcb77" }}>{kills}</span>
            <span style={{ color: "#444", fontSize: 18 }}> / </span>
            <span style={{ color: "#ff6b6b" }}>{deaths}</span>
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 3, letterSpacing: 1 }}>
            KILLS / DEATHS
          </div>
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#aaa", fontWeight: "bold" }}>{kd}</div>
              <div style={{ fontSize: 9, color: "#555" }}>K/D</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: latency < 80 ? "#6bcb77" : latency < 150 ? "#ffd93d" : "#ff6b6b",
                  fontWeight: "bold",
                }}
              >
                {latency}ms
              </div>
              <div style={{ fontSize: 9, color: "#555" }}>PING</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          maxWidth: 220,
        }}
      >
        {killFeed.slice(0, 5).map((k) => (
          <div
            key={k.id}
            style={{
              background: "rgba(0,0,0,0.7)",
              padding: "5px 10px",
              borderRadius: 6,
              fontSize: 12,
              color: "#fff",
              display: "flex",
              gap: 6,
              alignItems: "center",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderLeft: k.headshot ? "3px solid #ffd93d" : "3px solid #ff6b6b",
            }}
          >
            <span style={{ color: "#88ccff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {k.killerName}
            </span>
            {k.headshot && <span style={{ color: "#ffd93d", fontSize: 11 }}>🎯</span>}
            <span style={{ color: "#ff6b6b" }}>→</span>
            <span
              style={{
                color: "#ff9999",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {k.victimName}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            borderRadius: 10,
            padding: "10px 14px",
            minWidth: 170,
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              color: "#ffd93d",
              fontSize: 10,
              fontWeight: "bold",
              marginBottom: 6,
              letterSpacing: 1,
            }}
          >
            SCOREBOARD
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#444",
              fontSize: 9,
              marginBottom: 4,
              letterSpacing: 0.5,
            }}
          >
            <span>NAME</span>
            <span>K / D</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              marginBottom: 2,
              padding: "2px 0",
            }}
          >
            <span style={{ color: "#4a9eff" }}>★ {myName.slice(0, 12)}</span>
            <span style={{ color: "#aaa" }}>
              <span style={{ color: "#6bcb77" }}>{kills}</span>
              {" / "}
              <span style={{ color: "#ff6b6b" }}>{deaths}</span>
            </span>
          </div>
          {scoreboard.slice(0, 6).map((p) => (
            <div
              key={p.id}
              style={{
                fontSize: 11,
                display: "flex",
                justifyContent: "space-between",
                color: "#777",
                marginBottom: 2,
                padding: "2px 0",
              }}
            >
              <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name.slice(0, 12)}
              </span>
              <span>
                <span style={{ color: "#6bcb77" }}>{p.kills}</span>
                {" / "}
                <span style={{ color: "#ff6b6b" }}>{p.deaths}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setPhase("results")}
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "6px 18px",
          color: "#888",
          fontSize: 11,
          cursor: "pointer",
          letterSpacing: 1,
          backdropFilter: "blur(4px)",
        }}
      >
        END MATCH
      </button>

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
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#f44336",
              letterSpacing: 4,
              textShadow: "0 0 40px rgba(244,67,54,0.6)",
            }}
          >
            YOU DIED
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#fff",
              marginTop: 10,
              background: "rgba(0,0,0,0.6)",
              padding: "8px 24px",
              borderRadius: 30,
            }}
          >
            Respawning in{" "}
            <span style={{ color: "#ffd93d", fontWeight: "bold" }}>{respawnCountdown}s</span>
          </div>
        </div>
      )}
    </>
  );
}
