import { useState, useEffect } from "react";
import { useGameStore } from "./store";
import { getSocket } from "./socket";
import LobbyScene from "./LobbyScene";
import ShopModal from "./ShopModal";

const GUNS = [
  { id: "AK-47",   icon: "🔫", dmg: 35,  rate: "Med",  range: "Long"  },
  { id: "SMG",     icon: "💥", dmg: 20,  rate: "Fast", range: "Short" },
  { id: "Sniper",  icon: "🎯", dmg: 100, rate: "Slow", range: "Max"   },
  { id: "Shotgun", icon: "🔧", dmg: 60,  rate: "Slow", range: "Short" },
  { id: "Pistol",  icon: "🔩", dmg: 28,  rate: "Med",  range: "Med"   },
];

const MAPS = [
  { id: "highlands", name: "Operation Highlands", icon: "🏔️", desc: "Sniper towers, bunkers, high ground",      maxPlayers: 8  },
  { id: "desert",    name: "Desert Storm",        icon: "🏜️", desc: "Open dunes, long-range duels",             maxPlayers: 8  },
  { id: "ruins",     name: "Urban Ruins",          icon: "🏚️", desc: "Close-quarters building combat",           maxPlayers: 8  },
  { id: "bgmk",      name: "BGMK Compound",        icon: "🏭", desc: "Military compound, warehouse CQC",         maxPlayers: 8  },
  { id: "barmuda",   name: "Barmuda Island",       icon: "🏝️", desc: "Massive 150×150 island — 30 players, 9 zones, Free Fire style", maxPlayers: 30 },
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

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 0",
    background: active ? "rgba(255,107,107,0.12)" : "transparent",
    border: "none",
    borderBottom: `2px solid ${active ? "#ff6b6b" : "transparent"}`,
    color: active ? "#ff6b6b" : "#555",
    cursor: "pointer", fontSize: 11, fontWeight: "bold", letterSpacing: 1, transition: "all 0.15s",
  });

  const PTAB_STYLE = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "9px 0",
    background: active ? "rgba(74,158,255,0.15)" : "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderColor: active ? "rgba(74,158,255,0.5)" : "rgba(255,255,255,0.07)",
    borderRadius: 10, color: active ? "#4a9eff" : "#444",
    cursor: "pointer", fontSize: 11, fontWeight: "bold", letterSpacing: 1, transition: "all 0.15s",
  });

  const BTN: React.CSSProperties = {
    border: "none", borderRadius: 10, padding: "10px 14px",
    cursor: "pointer", fontWeight: "bold", fontSize: 12, letterSpacing: 1, transition: "all 0.12s",
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 20% 80%, #0d1b3e 0%, #050510 100%)",
      display: "flex", fontFamily: "'Segoe UI', sans-serif", color: "#fff", overflow: "hidden",
    }}>
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <div style={{
        width: 240, background: "rgba(0,0,0,0.45)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", padding: 16, gap: 0,
        flexShrink: 0, overflowY: "auto",
      }}>
        <div style={{
          fontSize: 24, fontWeight: 900, letterSpacing: 3, marginBottom: 14,
          background: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 10px rgba(255,107,107,0.25))",
        }}>
          STICKMAN FPS
        </div>

        <LobbyScene />

        {/* Player Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, marginTop: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#ff6b6b,#ee5a24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "bold" }}>
              {myName[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: 13 }}>{myName}</div>
              <div style={{ color: "#ffd93d", fontSize: 10 }}>Level {myLevel}</div>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#555", marginBottom: 2 }}>
              <span>XP</span><span>{myXp % xpForNextLevel}/{xpForNextLevel}</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${xpProgress}%`, background: "linear-gradient(90deg,#ffd93d,#ff6b6b)", borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            {[{ label: "K/D", value: kd }, { label: "Kills", value: kills }, { label: "Ping", value: `${latency}ms` }].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 3px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: "bold" }}>{s.value}</div>
                <div style={{ fontSize: 8, color: "#555" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setShowShop(true)} style={{ ...BTN, marginTop: 10, background: "rgba(255,217,61,0.08)", border: "1px solid rgba(255,217,61,0.22)", color: "#ffd93d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>🛒 SHOP</span>
          <span>🪙 {coins}</span>
        </button>

        <div style={{ marginTop: 8, fontSize: 10, color: "#444", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
            <span>🌐 Region</span><span style={{ color: "#ffd93d" }}>{myRegion}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
            <span>🔫 Gun</span><span style={{ color: "#88ccff" }}>{selectedGun}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Tab Bar */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
          {(["play","loadout","missions","settings"] as LobbyTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={TAB_STYLE(tab === t)}>
              {t === "play" && "🎮 PLAY"}{t === "loadout" && "🔫 LOADOUT"}
              {t === "missions" && "📋 MISSIONS"}{t === "settings" && "⚙️ SETTINGS"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>

          {/* ── PLAY TAB ──────────────────────────────────────────────── */}
          {tab === "play" && (
            <div style={{ maxWidth: 620 }}>
              {/* Error */}
              {errorMsg && (
                <div style={{ background: "rgba(244,67,54,0.18)", border: "1px solid rgba(244,67,54,0.4)", borderRadius: 8, padding: "8px 14px", marginBottom: 12, color: "#ff6b6b", fontSize: 12 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Mode selector */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(["solo","squad","private"] as PlayTab[]).map((pt) => (
                  <button key={pt} onClick={() => setPlayTab(pt)} style={PTAB_STYLE(playTab === pt)}>
                    {pt === "solo" && "👤 SOLO"}
                    {pt === "squad" && "👥 SQUAD"}
                    {pt === "private" && "🔒 PRIVATE"}
                  </button>
                ))}
              </div>

              {/* ─ SOLO / SQUAD panels ───────────────────────────────── */}
              {(playTab === "solo" || playTab === "squad") && (
                <>
                  {/* Quick join */}
                  <button
                    onClick={playTab === "solo" ? quickSolo : quickSquad}
                    disabled={searching}
                    style={{
                      ...BTN, width: "100%", padding: "20px 32px",
                      background: searching
                        ? "rgba(255,107,107,0.3)"
                        : "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                      fontSize: 20, letterSpacing: 3, marginBottom: 14,
                      boxShadow: "0 8px 40px rgba(255,107,107,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    }}
                  >
                    {searching
                      ? "⏳ SEARCHING..."
                      : playTab === "solo" ? "⚡ QUICK SOLO" : "⚡ QUICK SQUAD"}
                  </button>

                  {/* Map picker */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 8 }}>SELECT MAP (optional)</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {MAPS.map((m) => (
                        <button key={m.id}
                          onClick={() => setSelectedMap(selectedMap === m.id ? undefined : m.id)}
                          style={{
                            flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                            background: selectedMap === m.id ? "rgba(74,158,255,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${selectedMap === m.id ? "rgba(74,158,255,0.5)" : "rgba(255,255,255,0.07)"}`,
                            textAlign: "center", transition: "all 0.15s",
                          }}
                        >
                          <div style={{ fontSize: 22 }}>{m.icon}</div>
                          <div style={{ fontSize: 9, fontWeight: "bold", color: selectedMap === m.id ? "#4a9eff" : "#666", marginTop: 4 }}>{m.name}</div>
                          <div style={{ fontSize: 8, color: "#444", marginTop: 2 }}>{m.desc}</div>
                          <div style={{ fontSize: 8, color: m.id === "barmuda" ? "#f0c060" : "#555", marginTop: 3 }}>👥 {m.maxPlayers}P max</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Create custom room */}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, marginBottom: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 8 }}>CREATE CUSTOM ROOM</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Room name..."
                        style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none" }}
                      />
                      <button onClick={createPublicRoom} style={{ ...BTN, background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff6b6b", whiteSpace: "nowrap" }}>
                        + CREATE
                      </button>
                    </div>
                  </div>

                  {/* Live room list */}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 8 }}>
                      LIVE ROOMS ({rooms.filter((r) => r.type !== "private" && r.mode === playTab).length})
                    </div>
                    {rooms.filter((r) => r.type !== "private" && (r.mode === playTab || !r.mode)).length === 0 ? (
                      <div style={{ color: "#333", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No active rooms — be the first!</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                        {rooms
                          .filter((r) => r.type !== "private" && (r.mode === playTab || !r.mode))
                          .map((room) => {
                            const mapInfo = MAPS.find((m) => m.id === room.map) ?? MAPS[0];
                            const full = (room.playerCount ?? 0) >= (room.maxPlayers ?? 8);
                            return (
                              <div key={room.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 18 }}>{mapInfo.icon}</span>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: "bold" }}>{room.name}</div>
                                    <div style={{ fontSize: 9, color: "#555" }}>
                                      {mapInfo.name} · {room.playerCount}/{room.maxPlayers}
                                      {room.matchActive && <span style={{ color: "#ff6b6b", marginLeft: 4 }}>● LIVE</span>}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => joinRoom(room.id)}
                                  disabled={full}
                                  style={{ ...BTN, padding: "5px 10px", fontSize: 10, background: full ? "#1a1a1a" : "rgba(107,203,119,0.15)", border: `1px solid ${full ? "#2a2a2a" : "rgba(107,203,119,0.35)"}`, color: full ? "#333" : "#6bcb77", cursor: full ? "not-allowed" : "pointer" }}>
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

              {/* ─ PRIVATE panel ─────────────────────────────────────── */}
              {playTab === "private" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Join by code */}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 10 }}>JOIN FRIEND'S ROOM</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={privateCode}
                        onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-digit code..."
                        maxLength={6}
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 16,
                          outline: "none", letterSpacing: 4, fontWeight: "bold", fontFamily: "monospace", textTransform: "uppercase",
                        }}
                      />
                      <button onClick={joinByCode} style={{ ...BTN, background: "rgba(74,158,255,0.15)", border: "1px solid rgba(74,158,255,0.35)", color: "#4a9eff" }}>
                        JOIN
                      </button>
                    </div>
                  </div>

                  {/* Create private room */}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 10 }}>CREATE PRIVATE ROOM</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Room name..."
                        style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={createPrivate} style={{ ...BTN, flex: 1, background: "rgba(107,203,119,0.12)", border: "1px solid rgba(107,203,119,0.3)", color: "#6bcb77" }}>
                        🔒 CREATE PRIVATE ROOM
                      </button>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 10, color: "#444", textAlign: "center" }}>
                      A unique room code will be shown in-game. Share it with friends!
                    </div>
                  </div>

                  {/* Map picker */}
                  <div>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 8 }}>SELECT MAP</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {MAPS.map((m) => (
                        <button key={m.id}
                          onClick={() => setSelectedMap(selectedMap === m.id ? undefined : m.id)}
                          style={{
                            flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                            background: selectedMap === m.id ? "rgba(74,158,255,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${selectedMap === m.id ? "rgba(74,158,255,0.5)" : "rgba(255,255,255,0.07)"}`,
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: 22 }}>{m.icon}</div>
                          <div style={{ fontSize: 9, color: selectedMap === m.id ? "#4a9eff" : "#666" }}>{m.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Match info footer */}
              <div style={{ marginTop: 14, background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 14px", fontSize: 10, color: "#333", textAlign: "center" }}>
                🎯 40 Kills or 5 Min Timer · Solo & Squad · 5 Maps (up to 30 Players)
              </div>
            </div>
          )}

          {/* ── LOADOUT TAB ──────────────────────────────────────────── */}
          {tab === "loadout" && (
            <div style={{ maxWidth: 540 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 14, letterSpacing: 1 }}>SELECT WEAPON</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {GUNS.map((gun) => (
                  <button key={gun.id} onClick={() => setSelectedGun(gun.id)}
                    style={{
                      background: selectedGun === gun.id ? "rgba(255,107,107,0.1)" : "rgba(255,255,255,0.03)",
                      border: "1px solid",
                      borderColor: selectedGun === gun.id ? "rgba(255,107,107,0.45)" : "rgba(255,255,255,0.07)",
                      borderRadius: 12, padding: 14, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{gun.icon}</div>
                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>{gun.id}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                      {[{ label: "DMG", value: gun.dmg }, { label: "RATE", value: gun.rate }, { label: "RANGE", value: gun.range }].map((s) => (
                        <div key={s.label}>
                          <div style={{ fontSize: 8, color: "#555" }}>{s.label}</div>
                          <div style={{ fontSize: 10, color: selectedGun === gun.id ? "#ff6b6b" : "#777", fontWeight: "bold" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {selectedGun === gun.id && <div style={{ marginTop: 6, fontSize: 9, color: "#ff6b6b", fontWeight: "bold" }}>✓ EQUIPPED</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── MISSIONS TAB ─────────────────────────────────────────── */}
          {tab === "missions" && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 14, letterSpacing: 1 }}>DAILY MISSIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {DAILY_MISSIONS.map((mission) => (
                  <div key={mission.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: "bold" }}>{mission.text}</span>
                      <span style={{ fontSize: 10, color: "#ffd93d", background: "rgba(255,217,61,0.1)", padding: "2px 8px", borderRadius: 20 }}>+{mission.reward} XP</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(mission.progress / mission.total) * 100}%`, background: "linear-gradient(90deg,#6bcb77,#4caf50)", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#555", marginTop: 4 }}>{mission.progress}/{mission.total}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ─────────────────────────────────────────── */}
          {tab === "settings" && (
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 12, letterSpacing: 1 }}>GRAPHICS QUALITY</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
                {(["low","medium","high"] as const).map((q) => (
                  <button key={q} onClick={() => setGraphicsQuality(q)}
                    style={{ flex: 1, padding: "11px", background: graphicsQuality === q ? "rgba(74,158,255,0.12)" : "rgba(255,255,255,0.03)", border: "1px solid", borderColor: graphicsQuality === q ? "rgba(74,158,255,0.45)" : "rgba(255,255,255,0.06)", borderRadius: 10, color: graphicsQuality === q ? "#4a9eff" : "#555", cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
                    {q.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10, letterSpacing: 1 }}>CONTROLS</div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
                {[["WASD","Move"],["Space","Jump"],["Mouse","Aim"],["LMB","Shoot"],["R","Reload"],["ESC","Unlock Cursor"]].map(([key,action]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
                    <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace", color: "#88ccff" }}>{key}</span>
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
