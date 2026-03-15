import { useEffect, useState } from "react";
import { useGameStore } from "./store";

export default function MatchEnd() {
  const setPhase = useGameStore((s) => s.setPhase);
  const kills = useGameStore((s) => s.kills);
  const deaths = useGameStore((s) => s.deaths);
  const totalShots = useGameStore((s) => s.totalShots);
  const hitShots = useGameStore((s) => s.hitShots);
  const addXp = useGameStore((s) => s.addXp);
  const myName = useGameStore((s) => s.myName);
  const remotePlayers = useGameStore((s) => s.remotePlayers);

  const accuracy = totalShots > 0 ? Math.round((hitShots / totalShots) * 100) : 0;
  const xpGained = kills * 100 + (deaths === 0 ? 200 : 0) + Math.floor(accuracy / 10) * 20;

  const [animating, setAnimating] = useState(true);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    addXp(xpGained);
    const t1 = setTimeout(() => setAnimating(false), 800);
    const t2 = setTimeout(() => setShowReward(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const allPlayers = [
    { name: myName, kills, deaths },
    ...Object.values(remotePlayers).map((p) => ({ name: p.name, kills: p.kills, deaths: p.deaths })),
  ].sort((a, b) => b.kills - a.kills);

  const myRank = allPlayers.findIndex((p) => p.name === myName) + 1;

  const playAgain = () => {
    setPhase("lobby");
  };

  const returnLobby = () => {
    setPhase("lobby");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, #0d1b3e 0%, #050510 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        color: "#fff",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(30px)" : "translateY(0)",
          transition: "all 0.6s ease",
          width: "90%",
          maxWidth: 520,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 4,
            color: "#666",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Match Complete
        </div>

        <div
          style={{
            fontSize: myRank === 1 ? 64 : 48,
            marginBottom: 4,
          }}
        >
          {myRank === 1 ? "🏆" : myRank <= 3 ? "🥈" : "💀"}
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: 4,
            background:
              myRank === 1
                ? "linear-gradient(135deg, #ffd93d, #ff6b6b)"
                : myRank <= 3
                ? "linear-gradient(135deg, #aaa, #fff)"
                : "linear-gradient(135deg, #666, #aaa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          {myRank === 1 ? "VICTORY!" : myRank <= 3 ? "WELL PLAYED" : "BETTER LUCK NEXT TIME"}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#666",
            marginBottom: 30,
          }}
        >
          #{myRank} Rank • {myName}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "KILLS", value: kills, color: "#6bcb77" },
            { label: "DEATHS", value: deaths, color: "#ff6b6b" },
            { label: "ACCURACY", value: `${accuracy}%`, color: "#4a9eff" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: "16px 8px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 4, letterSpacing: 1 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {showReward && (
          <div
            style={{
              background: "rgba(255,217,61,0.08)",
              border: "1px solid rgba(255,217,61,0.25)",
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              animation: "pulse 1s ease-in-out",
            }}
          >
            <span style={{ fontSize: 20 }}>⭐</span>
            <div>
              <div style={{ color: "#ffd93d", fontWeight: "bold", fontSize: 16 }}>
                +{xpGained} XP Earned!
              </div>
              <div style={{ color: "#888", fontSize: 12 }}>
                {kills > 0 && `${kills} kills × 100  `}
                {accuracy > 0 && `Accuracy bonus: ${Math.floor(accuracy / 10) * 20}`}
              </div>
            </div>
          </div>
        )}

        {allPlayers.length > 1 && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 24,
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 11, color: "#555", marginBottom: 10, letterSpacing: 1 }}>
              FINAL SCOREBOARD
            </div>
            {allPlayers.map((p, i) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: i < allPlayers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: i === 0 ? "#ffd93d" : "#555", fontSize: 12, width: 16 }}>
                    #{i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: p.name === myName ? "#88ccff" : "#aaa",
                      fontWeight: p.name === myName ? "bold" : "normal",
                    }}
                  >
                    {p.name}
                  </span>
                </div>
                <span style={{ color: "#888", fontSize: 12 }}>
                  <span style={{ color: "#6bcb77" }}>{p.kills}</span>
                  {" / "}
                  <span style={{ color: "#ff6b6b" }}>{p.deaths}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={playAgain}
            style={{
              flex: 2,
              padding: "16px",
              background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 2,
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(255,107,107,0.35)",
            }}
          >
            ⚡ PLAY AGAIN
          </button>
          <button
            onClick={returnLobby}
            style={{
              flex: 1,
              padding: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#888",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
