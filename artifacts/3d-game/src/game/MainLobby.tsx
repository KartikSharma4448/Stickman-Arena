import { useState, useEffect } from "react";
import { useGameStore } from "./store";
import { getSocket } from "./socket";
import LobbyScene from "./LobbyScene";
import ShopModal from "./ShopModal";

const GUNS = [
  { id: "AK-47", icon: "🔫", dmg: 35, rate: "Med", range: "Long" },
  { id: "SMG", icon: "💥", dmg: 20, rate: "Fast", range: "Short" },
  { id: "Sniper", icon: "🎯", dmg: 100, rate: "Slow", range: "Max" },
  { id: "Shotgun", icon: "🔧", dmg: 60, rate: "Slow", range: "Short" },
];

const DAILY_MISSIONS = [
  { id: 1, text: "Get 5 kills", reward: 50, progress: 2, total: 5 },
  { id: 2, text: "Play 3 matches", reward: 30, progress: 1, total: 3 },
  { id: 3, text: "Get a headshot", reward: 75, progress: 0, total: 1 },
];

type LobbyTab = "play" | "loadout" | "missions" | "settings";

export default function MainLobby() {
  const rooms = useGameStore((s) => s.rooms);
  const setRooms = useGameStore((s) => s.setRooms);
  const myName = useGameStore((s) => s.myName);
  const myLevel = useGameStore((s) => s.myLevel);
  const myXp = useGameStore((s) => s.myXp);
  const kills = useGameStore((s) => s.kills);
  const deaths = useGameStore((s) => s.deaths);
  const latency = useGameStore((s) => s.latency);
  const coins = useGameStore((s) => s.coins);
  const setPhase = useGameStore((s) => s.setPhase);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);
  const selectedGun = useGameStore((s) => s.selectedGun);
  const setSelectedGun = useGameStore((s) => s.setSelectedGun);
  const resetMatchStats = useGameStore((s) => s.resetMatchStats);
  const myRegion = useGameStore((s) => s.myRegion);

  const [tab, setTab] = useState<LobbyTab>("play");
  const [newRoomName, setNewRoomName] = useState("");
  const [showShop, setShowShop] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("get_rooms");
    const interval = setInterval(() => socket.emit("get_rooms"), 3000);
    const onRooms = (data: typeof rooms) => setRooms(data);
    socket.on("rooms_list", onRooms);
    return () => {
      clearInterval(interval);
      socket.off("rooms_list", onRooms);
    };
  }, []);

  const createRoom = () => {
    resetMatchStats();
    getSocket().emit("create_room", { name: newRoomName || "Arena" });
  };

  const joinRoom = (roomId: string) => {
    resetMatchStats();
    getSocket().emit("join_room", { roomId });
  };

  const quickMatch = () => {
    const available = rooms.filter((r) => r.playerCount < r.maxPlayers);
    resetMatchStats();
    if (available.length > 0) {
      getSocket().emit("join_room", { roomId: available[0].id });
    } else {
      getSocket().emit("create_room", { name: "Quick Match" });
    }
  };

  const xpForNextLevel = 500;
  const xpProgress = ((myXp % xpForNextLevel) / xpForNextLevel) * 100;
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 0",
    background: active ? "rgba(255,107,107,0.12)" : "transparent",
    border: "none",
    borderBottom: `2px solid ${active ? "#ff6b6b" : "transparent"}`,
    color: active ? "#ff6b6b" : "#555",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    transition: "all 0.15s",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at 20% 80%, #0d1b3e 0%, #050510 100%)",
        display: "flex",
        fontFamily: "'Segoe UI', sans-serif",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: 250,
          background: "rgba(0,0,0,0.45)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          padding: 18,
          gap: 0,
          flexShrink: 0,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 3,
            background: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 18,
            filter: "drop-shadow(0 0 10px rgba(255,107,107,0.25))",
          }}
        >
          STICKMAN FPS
        </div>

        {/* 3D Character Preview */}
        <LobbyScene />

        {/* Player Stats */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: 14,
            marginTop: 14,
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              {myName[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: 14 }}>{myName}</div>
              <div style={{ color: "#ffd93d", fontSize: 11, fontWeight: "bold" }}>
                Level {myLevel}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#555", marginBottom: 3 }}>
              <span>XP PROGRESS</span>
              <span>{myXp % xpForNextLevel} / {xpForNextLevel}</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${xpProgress}%`,
                  background: "linear-gradient(90deg, #ffd93d, #ff6b6b)",
                  borderRadius: 2,
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { label: "K/D", value: kd },
              { label: "Kills", value: kills },
              { label: "Ping", value: `${latency}ms` },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "5px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: "#555", marginTop: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coins + Shop */}
        <button
          onClick={() => setShowShop(true)}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "11px 14px",
            background: "rgba(255,217,61,0.08)",
            border: "1px solid rgba(255,217,61,0.22)",
            borderRadius: 10,
            color: "#ffd93d",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            fontWeight: "bold",
          }}
        >
          <span>🛒 SHOP</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 15 }}>🪙</span>
            {coins}
          </span>
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 7, background: "rgba(255,255,255,0.03)", fontSize: 11 }}>
            <span style={{ color: "#666" }}>🌐 Region</span>
            <span style={{ color: "#ffd93d", fontSize: 10 }}>{myRegion}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 7, background: "rgba(255,255,255,0.03)", fontSize: 11 }}>
            <span style={{ color: "#666" }}>🔫 Gun</span>
            <span style={{ color: "#88ccff", fontSize: 10 }}>{selectedGun}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
          {(["play", "loadout", "missions", "settings"] as LobbyTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={TAB_STYLE(tab === t)}>
              {t === "play" && "🎮 PLAY"}
              {t === "loadout" && "🔫 LOADOUT"}
              {t === "missions" && "📋 MISSIONS"}
              {t === "settings" && "⚙️ SETTINGS"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {tab === "play" && (
            <div style={{ maxWidth: 580 }}>
              <button
                onClick={quickMatch}
                style={{
                  width: "100%",
                  padding: "22px 32px",
                  background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                  border: "none",
                  borderRadius: 16,
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: 3,
                  cursor: "pointer",
                  marginBottom: 18,
                  boxShadow: "0 8px 40px rgba(255,107,107,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              >
                ⚡ QUICK MATCH
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 10, letterSpacing: 1 }}>CREATE ROOM</div>
                  <input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createRoom()}
                    placeholder="Room name..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: 13,
                      outline: "none",
                      marginBottom: 8,
                    }}
                  />
                  <button
                    onClick={createRoom}
                    style={{
                      width: "100%",
                      padding: "9px",
                      background: "rgba(255,107,107,0.15)",
                      border: "1px solid rgba(255,107,107,0.3)",
                      borderRadius: 8,
                      color: "#ff6b6b",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    + CREATE
                  </button>
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 10, letterSpacing: 1 }}>
                    LIVE ROOMS ({rooms.length})
                  </div>
                  {rooms.length === 0 ? (
                    <div style={{ color: "#333", fontSize: 12, textAlign: "center", marginTop: 16 }}>
                      No rooms. Create one!
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto" }}>
                      {rooms.map((room) => (
                        <div key={room.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "7px 10px", borderRadius: 8 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: "bold" }}>{room.name}</div>
                            <div style={{ fontSize: 10, color: "#555" }}>{room.playerCount}/{room.maxPlayers}</div>
                          </div>
                          <button
                            onClick={() => joinRoom(room.id)}
                            disabled={room.playerCount >= room.maxPlayers}
                            style={{
                              padding: "5px 10px",
                              background: room.playerCount >= room.maxPlayers ? "#1a1a1a" : "rgba(107,203,119,0.15)",
                              border: "1px solid",
                              borderColor: room.playerCount >= room.maxPlayers ? "#2a2a2a" : "rgba(107,203,119,0.35)",
                              borderRadius: 6,
                              color: room.playerCount >= room.maxPlayers ? "#333" : "#6bcb77",
                              cursor: room.playerCount >= room.maxPlayers ? "not-allowed" : "pointer",
                              fontSize: 11,
                              fontWeight: "bold",
                            }}
                          >
                            {room.playerCount >= room.maxPlayers ? "FULL" : "JOIN"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 16px", fontSize: 11, color: "#333", textAlign: "center" }}>
                WASD move • Space jump • Mouse aim • LMB shoot • R reload • ESC cursor
              </div>
            </div>
          )}

          {tab === "loadout" && (
            <div style={{ maxWidth: 540 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 14, letterSpacing: 1 }}>SELECT WEAPON</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {GUNS.map((gun) => (
                  <button
                    key={gun.id}
                    onClick={() => setSelectedGun(gun.id)}
                    style={{
                      background: selectedGun === gun.id ? "rgba(255,107,107,0.1)" : "rgba(255,255,255,0.03)",
                      border: "1px solid",
                      borderColor: selectedGun === gun.id ? "rgba(255,107,107,0.45)" : "rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: 16,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{gun.icon}</div>
                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>{gun.id}</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      {[{ label: "DMG", value: gun.dmg }, { label: "RATE", value: gun.rate }, { label: "RANGE", value: gun.range }].map((s) => (
                        <div key={s.label}>
                          <div style={{ fontSize: 9, color: "#555" }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: selectedGun === gun.id ? "#ff6b6b" : "#888", fontWeight: "bold" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {selectedGun === gun.id && (
                      <div style={{ marginTop: 8, fontSize: 10, color: "#ff6b6b", fontWeight: "bold" }}>✓ EQUIPPED</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "missions" && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 14, letterSpacing: 1 }}>DAILY MISSIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {DAILY_MISSIONS.map((mission) => (
                  <div key={mission.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: "bold" }}>{mission.text}</span>
                      <span style={{ fontSize: 11, color: "#ffd93d", background: "rgba(255,217,61,0.1)", padding: "3px 10px", borderRadius: 20 }}>
                        +{mission.reward} XP
                      </span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(mission.progress / mission.total) * 100}%`, background: "linear-gradient(90deg, #6bcb77, #4caf50)", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 5 }}>{mission.progress} / {mission.total}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 12, letterSpacing: 1 }}>GRAPHICS QUALITY</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {(["low", "medium", "high"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setGraphicsQuality(q)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: graphicsQuality === q ? "rgba(74,158,255,0.12)" : "rgba(255,255,255,0.03)",
                      border: "1px solid",
                      borderColor: graphicsQuality === q ? "rgba(74,158,255,0.45)" : "rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      color: graphicsQuality === q ? "#4a9eff" : "#555",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 12,
                      letterSpacing: 1,
                    }}
                  >
                    {q.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 13, color: "#666", marginBottom: 12, letterSpacing: 1 }}>CONTROLS</div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                {[["WASD", "Move"], ["Space", "Jump"], ["Mouse", "Aim"], ["LMB", "Shoot"], ["R", "Reload"], ["ESC", "Unlock Cursor"]].map(([key, action]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                    <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 10px", borderRadius: 5, fontFamily: "monospace", fontSize: 11, color: "#88ccff" }}>{key}</span>
                    <span style={{ color: "#666" }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
