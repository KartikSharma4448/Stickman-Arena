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

  const scoreboard = Object.values(remotePlayers).sort(
    (a, b) => b.kills - a.kills,
  );

  return (
    <>
      {hitIndicator && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            border: "6px solid rgba(255,0,0,0.5)",
            pointerEvents: "none",
            zIndex: 50,
            animation: "fadeOut 0.3s ease-out",
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 20,
          height: 20,
          zIndex: 40,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 2,
            height: 20,
            background: "rgba(255,255,255,0.9)",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            height: 2,
            width: 20,
            background: "rgba(255,255,255,0.9)",
            top: "50%",
            left: 0,
            transform: "translateY(-50%)",
          }}
        />
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ color: "#aaa", fontSize: 12 }}>HEALTH</div>
        <div
          style={{
            width: 180,
            height: 12,
            background: "rgba(0,0,0,0.5)",
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              width: `${Math.max(0, health)}%`,
              height: "100%",
              background:
                health > 60 ? "#00ff44" : health > 30 ? "#ffaa00" : "#ff2200",
              borderRadius: 6,
              transition: "width 0.2s",
            }}
          />
        </div>
        <div style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
          {Math.max(0, health)} HP
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 40,
          textAlign: "right",
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: "bold" }}>
          <span style={{ color: "#ffcc00" }}>{kills}</span>
          <span style={{ color: "#888" }}> / </span>
          <span style={{ color: "#ff6666" }}>{deaths}</span>
        </div>
        <div style={{ fontSize: 11, color: "#aaa" }}>KILLS / DEATHS</div>
        <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
          {latency}ms
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
          maxWidth: 200,
        }}
      >
        {killFeed.slice(0, 5).map((k) => (
          <div
            key={k.id}
            style={{
              background: "rgba(0,0,0,0.6)",
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 12,
              color: "#fff",
              display: "flex",
              gap: 4,
              alignItems: "center",
            }}
          >
            <span style={{ color: "#88ccff" }}>{k.killerName}</span>
            {k.headshot && (
              <span style={{ color: "#ffcc00", fontSize: 10 }}>🎯</span>
            )}
            <span style={{ color: "#ff6666" }}>→</span>
            <span style={{ color: "#ff9999" }}>{k.victimName}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 40,
          background: "rgba(0,0,0,0.6)",
          borderRadius: 6,
          padding: "8px 12px",
          minWidth: 160,
        }}
      >
        <div
          style={{
            color: "#ffcc00",
            fontSize: 11,
            fontWeight: "bold",
            marginBottom: 4,
          }}
        >
          SCOREBOARD
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: 10, marginBottom: 2 }}>
          <span>NAME</span>
          <span>K / D</span>
        </div>
        <div
          style={{
            color: "#88ff88",
            fontSize: 11,
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 1,
          }}
        >
          <span style={{ color: "#88ccff" }}>★ {myName.slice(0, 10)}</span>
          <span>
            {kills} / {deaths}
          </span>
        </div>
        {scoreboard.map((p) => (
          <div
            key={p.id}
            style={{
              fontSize: 11,
              display: "flex",
              justifyContent: "space-between",
              color: "#ccc",
              marginBottom: 1,
            }}
          >
            <span style={{ maxWidth: 90, overflow: "hidden" }}>
              {p.name.slice(0, 10)}
            </span>
            <span>
              {p.kills} / {p.deaths}
            </span>
          </div>
        ))}
      </div>

      {isDead && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 60,
            textAlign: "center",
            color: "#ff4444",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: "bold" }}>YOU DIED</div>
          <div style={{ fontSize: 20, color: "#fff", marginTop: 8 }}>
            Respawning in {respawnCountdown}s...
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        Click to aim • WASD move • LMB shoot
      </div>
    </>
  );
}
