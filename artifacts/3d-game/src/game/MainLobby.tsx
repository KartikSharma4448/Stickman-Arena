import { useState, useEffect } from "react";
import { useGameStore } from "./store";
import { getSocket } from "./socket";
import LobbyScene from "./LobbyScene";
import ShopModal from "./ShopModal";

const GUNS = [
  { id: "AK-47",   icon: "\u{1F52B}", dmg: 35,  rate: "Med",  range: "Long"  },
  { id: "SMG",     icon: "\u{1F4A5}", dmg: 20,  rate: "Fast", range: "Short" },
  { id: "Sniper",  icon: "\u{1F3AF}", dmg: 100, rate: "Slow", range: "Max"   },
  { id: "Shotgun", icon: "\u{1F527}", dmg: 60,  rate: "Slow", range: "Short" },
  { id: "Pistol",  icon: "\u{1F529}", dmg: 28,  rate: "Med",  range: "Med"   },
];

const MAPS = [
  { id: "highlands", name: "Highlands",     icon: "\u{1F3D4}\uFE0F", desc: "Sniper towers & bunkers",  color: "#4a9eff", maxPlayers: 8  },
  { id: "desert",    name: "Desert Storm",  icon: "\u{1F3DC}\uFE0F", desc: "Open dunes, long range",   color: "#e8a040", maxPlayers: 8  },
  { id: "ruins",     name: "Urban Ruins",   icon: "\u{1F3DA}\uFE0F", desc: "Close-quarters combat",    color: "#8a8aaa", maxPlayers: 8  },
  { id: "bgmk",      name: "BGMK",         icon: "\u{1F3ED}",       desc: "Military warehouse CQC",   color: "#6bcb77", maxPlayers: 8  },
  { id: "barmuda",   name: "Barmuda",       icon: "\u{1F3DD}\uFE0F", desc: "Battle Royale 150x150",    color: "#ff6b6b", maxPlayers: 30 },
];

const DAILY_MISSIONS = [
  { id: 1, text: "Get 5 kills",    reward: 50, progress: 2, total: 5 },
  { id: 2, text: "Play 3 matches", reward: 30, progress: 1, total: 3 },
  { id: 3, text: "Get a headshot", reward: 75, progress: 0, total: 1 },
];

type LobbyTab = "play" | "loadout" | "missions" | "settings";
type PlayTab  = "solo" | "squad" | "private";

export default function MainLobby() {
  const rooms         = useGameStore((s) => s.rooms);
  const setRooms      = useGameStore((s) => s.setRooms);
  const myName        = useGameStore((s) => s.myName);
  const myLevel       = useGameStore((s) => s.myLevel);
  const myXp          = useGameStore((s) => s.myXp);
  const kills         = useGameStore((s) => s.kills);
  const deaths        = useGameStore((s) => s.deaths);
  const latency       = useGameStore((s) => s.latency);
  const coins         = useGameStore((s) => s.coins);
  const selectedGun   = useGameStore((s) => s.selectedGun);
  const setSelectedGun = useGameStore((s) => s.setSelectedGun);
  const resetMatchStats = useGameStore((s) => s.resetMatchStats);
  const myRegion      = useGameStore((s) => s.myRegion);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);

  const [tab, setTab]           = useState<LobbyTab>("play");
  const [playTab, setPlayTab]   = useState<PlayTab>("solo");
  const [selectedMap, setSelectedMap] = useState<string | undefined>(undefined);
  const [privateCode, setPrivateCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [showShop, setShowShop] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const xpForNextLevel = 500;
  const xpProgress = ((myXp % xpForNextLevel) / xpForNextLevel) * 100;
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("get_rooms");
    const interval = setInterval(() => socket.emit("get_rooms"), 4000);
    const onRooms = (data: typeof rooms) => setRooms(data);
    socket.on("rooms_list", onRooms);
    const onError = (e: { message: string }) => {
      setErrorMsg(e.message);
      setSearching(false);
      setTimeout(() => setErrorMsg(""), 3000);
    };
    socket.on("error", onError);
    return () => {
      clearInterval(interval);
      socket.off("rooms_list", onRooms);
      socket.off("error", onError);
    };
  }, []);

  const quickSolo = () => {
    resetMatchStats();
    setSearching(true);
    getSocket().emit("quick_join", { mode: "solo" });
  };

  const quickSquad = () => {
    resetMatchStats();
    setSearching(true);
    getSocket().emit("quick_join", { mode: "squad" });
  };

  const createPrivate = () => {
    resetMatchStats();
    getSocket().emit("create_private", { name: roomName || "Private Room", mode: playTab === "squad" ? "squad" : "solo" });
  };

  const joinByCode = () => {
    if (!privateCode.trim()) return;
    resetMatchStats();
    getSocket().emit("join_by_code", { code: privateCode.trim().toUpperCase() });
  };

  const joinRoom = (roomId: string) => {
    resetMatchStats();
    getSocket().emit("join_room", { roomId });
  };

  const createPublicRoom = () => {
    resetMatchStats();
    getSocket().emit("create_room", {
      name: roomName || (playTab === "squad" ? "Squad Battle" : "Solo Arena"),
      mode: playTab as "solo" | "squad",
      map: selectedMap as any,
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(135deg, #0a0e1a 0%, #0d1530 40%, #0a0e1a 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Segoe UI', sans-serif", color: "#fff", overflow: "hidden",
    }}>
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {/* TOP NAVBAR */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", background: "rgba(0,0,0,0.5)",
        borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            fontSize: 20, fontWeight: 900, letterSpacing: 2,
            background: "linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            STICKMAN FPS
          </div>
          <div style={{ height: 20, width: 1, background: "rgba(255,255,255,0.1)" }} />
          {(["play","loadout","missions","settings"] as LobbyTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? "rgba(255,107,107,0.15)" : "transparent",
              border: "none", borderRadius: 8, padding: "6px 14px",
              color: tab === t ? "#ff6b6b" : "#556", cursor: "pointer",
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              transition: "all 0.15s",
            }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,217,61,0.08)", borderRadius: 20, padding: "5px 12px",
            border: "1px solid rgba(255,217,61,0.15)", cursor: "pointer",
          }} onClick={() => setShowShop(true)}>
            <span style={{ fontSize: 14 }}>{"\u{1FA99}"}</span>
            <span style={{ color: "#ffd93d", fontWeight: 700, fontSize: 13 }}>{coins}</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "4px 12px 4px 4px",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg,#ff6b6b,#ee5a24)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900,
            }}>
              {myName[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1 }}>{myName}</div>
              <div style={{ fontSize: 9, color: "#ffd93d" }}>LV {myLevel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT PANEL — Character + Stats */}
        <div style={{
          width: 220, flexShrink: 0, display: "flex", flexDirection: "column",
          background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.04)",
          padding: 14, gap: 10, overflowY: "auto",
        }}>
          <LobbyScene />

          <div style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10,
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#445", marginBottom: 3 }}>
              <span>XP</span><span>{myXp % xpForNextLevel}/{xpForNextLevel}</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${xpProgress}%`, background: "linear-gradient(90deg,#ffd93d,#ff6b6b)", borderRadius: 2 }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            {[{ label: "K/D", value: kd }, { label: "Kills", value: kills }, { label: "Ping", value: `${latency}ms` }].map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 4px",
                textAlign: "center", border: "1px solid rgba(255,255,255,0.03)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#ddd" }}>{s.value}</div>
                <div style={{ fontSize: 8, color: "#445", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: "#334", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
              <span>{"\u{1F310}"} Region</span><span style={{ color: "#ffd93d" }}>{myRegion}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
              <span>{"\u{1F52B}"} Weapon</span><span style={{ color: "#88ccff" }}>{selectedGun}</span>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* PLAY TAB */}
          {tab === "play" && (
            <div style={{ maxWidth: 700 }}>
              {errorMsg && (
                <div style={{
                  background: "rgba(244,67,54,0.12)", border: "1px solid rgba(244,67,54,0.3)",
                  borderRadius: 10, padding: "10px 16px", marginBottom: 14,
                  color: "#ff6b6b", fontSize: 13, fontWeight: 600,
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Mode Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {(["solo","squad","private"] as PlayTab[]).map((pt) => (
                  <button key={pt} onClick={() => setPlayTab(pt)} style={{
                    padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                    background: playTab === pt
                      ? "linear-gradient(135deg, rgba(255,107,107,0.18), rgba(255,107,107,0.08))"
                      : "rgba(255,255,255,0.03)",
                    border: playTab === pt
                      ? "1px solid rgba(255,107,107,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color: playTab === pt ? "#ff6b6b" : "#445",
                    fontSize: 13, fontWeight: 700, letterSpacing: 1, transition: "all 0.15s",
                  }}>
                    {pt === "solo" ? "\u{1F464} SOLO" : pt === "squad" ? "\u{1F465} SQUAD" : "\u{1F512} PRIVATE"}
                  </button>
                ))}
              </div>

              {(playTab === "solo" || playTab === "squad") && (
                <>
                  {/* BIG PLAY BUTTON */}
                  <button
                    onClick={playTab === "solo" ? quickSolo : quickSquad}
                    disabled={searching}
                    style={{
                      width: "100%", padding: "18px 32px", border: "none",
                      borderRadius: 14, cursor: searching ? "default" : "pointer",
                      background: searching
                        ? "rgba(255,107,107,0.2)"
                        : "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                      fontSize: 22, fontWeight: 900, letterSpacing: 4, color: "#fff",
                      marginBottom: 20,
                      boxShadow: searching ? "none" : "0 6px 30px rgba(255,107,107,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    {searching
                      ? "\u23F3 SEARCHING..."
                      : playTab === "solo" ? "\u26A1 QUICK PLAY" : "\u26A1 QUICK SQUAD"}
                  </button>

                  {/* MAP SELECTION */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
                      SELECT MAP
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                      {MAPS.map((m) => {
                        const sel = selectedMap === m.id;
                        return (
                          <button key={m.id}
                            onClick={() => setSelectedMap(sel ? undefined : m.id)}
                            style={{
                              padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                              background: sel
                                ? `linear-gradient(180deg, ${m.color}18, ${m.color}08)`
                                : "rgba(255,255,255,0.025)",
                              border: sel
                                ? `2px solid ${m.color}80`
                                : "2px solid rgba(255,255,255,0.04)",
                              textAlign: "center", transition: "all 0.15s",
                              position: "relative", overflow: "hidden",
                            }}
                          >
                            <div style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</div>
                            <div style={{
                              fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                              color: sel ? m.color : "#777",
                            }}>{m.name}</div>
                            <div style={{ fontSize: 9, color: "#445", marginTop: 3, lineHeight: 1.3 }}>{m.desc}</div>
                            <div style={{
                              fontSize: 9, marginTop: 5, fontWeight: 700,
                              color: m.id === "barmuda" ? "#ff6b6b" : "#445",
                            }}>
                              {m.maxPlayers}P
                            </div>
                            {sel && <div style={{
                              position: "absolute", top: 6, right: 6,
                              width: 8, height: 8, borderRadius: "50%",
                              background: m.color, boxShadow: `0 0 8px ${m.color}`,
                            }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CREATE ROOM */}
                  <div style={{
                    background: "rgba(255,255,255,0.025)", borderRadius: 12, padding: 16,
                    marginBottom: 14, border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
                      CREATE ROOM
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Room name..."
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                          padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none",
                        }}
                      />
                      <button onClick={createPublicRoom} style={{
                        border: "none", borderRadius: 10, padding: "10px 18px",
                        background: "rgba(255,107,107,0.12)", cursor: "pointer",
                        color: "#ff6b6b", fontWeight: 700, fontSize: 12, letterSpacing: 1,
                        whiteSpace: "nowrap",
                      }}>
                        + CREATE
                      </button>
                    </div>
                  </div>

                  {/* LIVE ROOMS */}
                  <div style={{
                    background: "rgba(255,255,255,0.025)", borderRadius: 12, padding: 16,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
                      LIVE ROOMS ({rooms.filter((r) => r.type !== "private" && r.mode === playTab).length})
                    </div>
                    {rooms.filter((r) => r.type !== "private" && (r.mode === playTab || !r.mode)).length === 0 ? (
                      <div style={{ color: "#334", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
                        No active rooms — create one!
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                        {rooms
                          .filter((r) => r.type !== "private" && (r.mode === playTab || !r.mode))
                          .map((room) => {
                            const mapInfo = MAPS.find((m) => m.id === room.map) ?? MAPS[0];
                            const full = (room.playerCount ?? 0) >= (room.maxPlayers ?? 8);
                            return (
                              <div key={room.id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.03)",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ fontSize: 22 }}>{mapInfo.icon}</span>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{room.name}</div>
                                    <div style={{ fontSize: 10, color: "#556" }}>
                                      {mapInfo.name} {"\u00B7"} {room.playerCount}/{room.maxPlayers}
                                      {room.matchActive && <span style={{ color: "#ff6b6b", marginLeft: 6 }}>{"\u25CF"} LIVE</span>}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => joinRoom(room.id)}
                                  disabled={full}
                                  style={{
                                    border: "none", borderRadius: 8, padding: "6px 16px",
                                    fontSize: 11, fontWeight: 700, cursor: full ? "not-allowed" : "pointer",
                                    background: full ? "#1a1a2a" : "rgba(107,203,119,0.12)",
                                    color: full ? "#334" : "#6bcb77",
                                  }}>
                                  {full ? "FULL" : "JOIN"}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* PRIVATE */}
              {playTab === "private" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    background: "rgba(255,255,255,0.025)", borderRadius: 12, padding: 18,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>
                      JOIN BY CODE
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        value={privateCode}
                        onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        maxLength={6}
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                          padding: "12px 16px", color: "#fff", fontSize: 18,
                          outline: "none", letterSpacing: 6, fontWeight: 900,
                          fontFamily: "monospace", textTransform: "uppercase", textAlign: "center",
                        }}
                      />
                      <button onClick={joinByCode} style={{
                        border: "none", borderRadius: 10, padding: "12px 24px",
                        background: "rgba(74,158,255,0.12)", cursor: "pointer",
                        color: "#4a9eff", fontWeight: 700, fontSize: 14,
                      }}>
                        JOIN
                      </button>
                    </div>
                  </div>

                  <div style={{
                    background: "rgba(255,255,255,0.025)", borderRadius: 12, padding: 18,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>
                      CREATE PRIVATE ROOM
                    </div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Room name..."
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                          padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none",
                        }}
                      />
                    </div>
                    <button onClick={createPrivate} style={{
                      width: "100%", border: "none", borderRadius: 10, padding: "12px 20px",
                      background: "rgba(107,203,119,0.1)", cursor: "pointer",
                      color: "#6bcb77", fontWeight: 700, fontSize: 13, letterSpacing: 1,
                    }}>
                      {"\u{1F512}"} CREATE PRIVATE
                    </button>
                    <div style={{ marginTop: 10, fontSize: 10, color: "#334", textAlign: "center" }}>
                      Share the room code with friends to join!
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: "#445", letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
                      SELECT MAP
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                      {MAPS.map((m) => {
                        const sel = selectedMap === m.id;
                        return (
                          <button key={m.id}
                            onClick={() => setSelectedMap(sel ? undefined : m.id)}
                            style={{
                              padding: "12px 6px", borderRadius: 10, cursor: "pointer",
                              background: sel ? `${m.color}15` : "rgba(255,255,255,0.025)",
                              border: sel ? `2px solid ${m.color}60` : "2px solid rgba(255,255,255,0.04)",
                              textAlign: "center",
                            }}
                          >
                            <div style={{ fontSize: 24 }}>{m.icon}</div>
                            <div style={{ fontSize: 10, color: sel ? m.color : "#556", fontWeight: 700, marginTop: 4 }}>{m.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                marginTop: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10,
                padding: "10px 16px", fontSize: 11, color: "#334", textAlign: "center",
              }}>
                {"\u{1F3AF}"} 40 Kills or 5 Min Timer {"\u00B7"} Solo & Squad {"\u00B7"} 5 Maps (up to 30P)
              </div>
            </div>
          )}

          {/* LOADOUT TAB */}
          {tab === "loadout" && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ fontSize: 13, color: "#556", marginBottom: 16, letterSpacing: 2, fontWeight: 700 }}>
                SELECT WEAPON
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {GUNS.map((gun) => {
                  const sel = selectedGun === gun.id;
                  return (
                    <button key={gun.id} onClick={() => setSelectedGun(gun.id)}
                      style={{
                        background: sel ? "rgba(255,107,107,0.08)" : "rgba(255,255,255,0.025)",
                        border: sel ? "2px solid rgba(255,107,107,0.4)" : "2px solid rgba(255,255,255,0.04)",
                        borderRadius: 14, padding: 16, cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s", position: "relative",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{gun.icon}</div>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{gun.id}</div>
                      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                        {[{ label: "DMG", value: gun.dmg }, { label: "RATE", value: gun.rate }, { label: "RANGE", value: gun.range }].map((s) => (
                          <div key={s.label}>
                            <div style={{ fontSize: 9, color: "#445", fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: sel ? "#ff6b6b" : "#888", fontWeight: 700 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      {sel && <div style={{
                        position: "absolute", top: 10, right: 12,
                        fontSize: 10, color: "#ff6b6b", fontWeight: 800,
                        background: "rgba(255,107,107,0.1)", padding: "3px 8px", borderRadius: 6,
                      }}>EQUIPPED</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MISSIONS TAB */}
          {tab === "missions" && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ fontSize: 13, color: "#556", marginBottom: 16, letterSpacing: 2, fontWeight: 700 }}>
                DAILY MISSIONS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {DAILY_MISSIONS.map((mission) => (
                  <div key={mission.id} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{mission.text}</span>
                      <span style={{
                        fontSize: 11, color: "#ffd93d", fontWeight: 700,
                        background: "rgba(255,217,61,0.1)", padding: "4px 10px", borderRadius: 20,
                      }}>+{mission.reward} XP</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${(mission.progress / mission.total) * 100}%`,
                        background: "linear-gradient(90deg,#6bcb77,#4caf50)", borderRadius: 3,
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#445", marginTop: 5, fontWeight: 600 }}>
                      {mission.progress}/{mission.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === "settings" && (
            <div style={{ maxWidth: 500 }}>
              <div style={{ fontSize: 13, color: "#556", marginBottom: 14, letterSpacing: 2, fontWeight: 700 }}>
                GRAPHICS
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {(["low","medium","high"] as const).map((q) => (
                  <button key={q} onClick={() => setGraphicsQuality(q)}
                    style={{
                      flex: 1, padding: 14,
                      background: graphicsQuality === q ? "rgba(74,158,255,0.1)" : "rgba(255,255,255,0.025)",
                      border: graphicsQuality === q ? "2px solid rgba(74,158,255,0.4)" : "2px solid rgba(255,255,255,0.04)",
                      borderRadius: 12, color: graphicsQuality === q ? "#4a9eff" : "#556",
                      cursor: "pointer", fontWeight: 800, fontSize: 13, letterSpacing: 1,
                    }}>
                    {q.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 13, color: "#556", marginBottom: 12, letterSpacing: 2, fontWeight: 700 }}>
                CONTROLS
              </div>
              <div style={{
                background: "rgba(255,255,255,0.025)", borderRadius: 12, padding: 16,
                border: "1px solid rgba(255,255,255,0.04)",
              }}>
                {[
                  ["WASD","Move"],["Space","Jump"],["Shift","Sprint"],["C","Crouch"],
                  ["Mouse","Aim"],["LMB","Shoot"],["RMB","Scope"],["R","Reload"],
                  ["1/2","Switch Gun"],["E","Pickup"],["F","Heal"],["ESC","Menu"],
                ].map(([key,action]) => (
                  <div key={key} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}>
                    <span style={{
                      background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 6,
                      fontFamily: "monospace", color: "#88ccff", fontSize: 11, fontWeight: 700,
                    }}>{key}</span>
                    <span style={{ color: "#556", fontSize: 12 }}>{action}</span>
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
