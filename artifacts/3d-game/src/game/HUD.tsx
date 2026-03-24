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
    <div style={{ position: "fixed", inset: 0, zIndex: 45, pointerEvents: "none", overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}>
        <defs>
          <mask id="scopeMask">
            <rect width="100" height="100" fill="white" />
            <circle cx="50" cy="50" r="34" fill="black" />
          </mask>
          <radialGradient id="glassGrad" cx="45%" cy="38%">
            <stop offset="0%" stopColor="rgba(180,220,255,0.07)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="rgba(0,0,0,0.97)" mask="url(#scopeMask)" />
        <circle cx="50" cy="50" r="34" fill="url(#glassGrad)" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(80,80,80,0.9)" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="32.5" fill="none" stroke="rgba(60,60,60,0.5)" strokeWidth="0.25" />
        <line x1="16" y1="50" x2="84" y2="50" stroke="rgba(0,0,0,0.85)" strokeWidth="0.18" />
        <line x1="50" y1="16" x2="50" y2="84" stroke="rgba(0,0,0,0.85)" strokeWidth="0.18" />
        <line x1="16" y1="50" x2="46.5" y2="50" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        <line x1="53.5" y1="50" x2="84" y2="50" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        <line x1="50" y1="16" x2="50" y2="46.5" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        <line x1="50" y1="53.5" x2="50" y2="84" stroke="rgba(20,20,20,0.95)" strokeWidth="0.22" />
        <circle cx="50" cy="50" r="0.4" fill="rgba(220,30,30,0.9)" />
        {[-12,-8,-4,4,8,12].map((d) => (
          <circle key={d} cx={50 + d} cy="50" r="0.35" fill="rgba(20,20,20,0.88)" />
        ))}
        {[-12,-8,-4,4,8,12].map((d) => (
          <circle key={d} cx="50" cy={50 + d} r="0.35" fill="rgba(20,20,20,0.88)" />
        ))}
      </svg>
    </div>
  );
}

function ADSCrosshair() {
  return (
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 45, pointerEvents: "none" }}>
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

// ── Barmuda-specific HUD overlays ──────────────────────────────────────────

function BarmudaDropOverlay({ altitude }: { altitude: number }) {
  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 55,
      textAlign: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.5)",
        borderRadius: 16,
        padding: "18px 32px",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#87ceeb", letterSpacing: 3, marginBottom: 6 }}>PARACHUTING</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontFamily: "monospace", lineHeight: 1 }}>
          {Math.round(altitude)}<span style={{ fontSize: 16, color: "#aaa", marginLeft: 4 }}>m</span>
        </div>
        <div style={{ fontSize: 11, color: "#ffcc44", marginTop: 8, letterSpacing: 1 }}>
          WASD — Steer  •  Land to play
        </div>
      </div>
    </div>
  );
}

function LivesDisplay({ lives, map }: { lives: number; map: string }) {
  if (map !== "barmuda") return null;
  return (
    <div style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 40,
      display: "flex",
      gap: 6,
      alignItems: "center",
      background: "rgba(0,0,0,0.55)",
      borderRadius: 20,
      padding: "6px 16px",
      backdropFilter: "blur(6px)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <span style={{ fontSize: 10, color: "#888", letterSpacing: 2, marginRight: 4 }}>BARMUDA</span>
      {[0, 1].map((i) => (
        <span key={i} style={{ fontSize: 20, filter: i < lives ? "none" : "grayscale(1) opacity(0.3)" }}>
          ❤️
        </span>
      ))}
      <span style={{ fontSize: 10, color: lives > 0 ? "#6bcb77" : "#ff6b6b", letterSpacing: 1, marginLeft: 4 }}>
        {lives > 0 ? `${lives} LIVES` : "LAST LIFE"}
      </span>
    </div>
  );
}

function PickupPrompt({ gun }: { gun: string | null }) {
  if (!gun) return null;
  const gunColors: Record<string, string> = {
    "AK-47": "#ff6b35", "SMG": "#4ecdc4", "Sniper": "#9b59b6",
    "Shotgun": "#ffd93d", "Pistol": "#c8d6e5",
  };
  const color = gunColors[gun] || "#fff";
  return (
    <div style={{
      position: "fixed",
      bottom: 140,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.75)",
        borderRadius: 12,
        padding: "10px 22px",
        backdropFilter: "blur(8px)",
        border: `1px solid ${color}55`,
        textAlign: "center",
        boxShadow: `0 0 20px ${color}33`,
      }}>
        <div style={{ fontSize: 11, color, letterSpacing: 2, marginBottom: 2 }}>PRESS E TO PICK UP</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{gun}</div>
      </div>
    </div>
  );
}

function EliminatedScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 70,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(6px)",
    }}>
      <div style={{ fontSize: 64, fontWeight: 900, color: "#f44336", letterSpacing: 6, textShadow: "0 0 60px rgba(244,67,54,0.7)" }}>
        ELIMINATED
      </div>
      <div style={{ fontSize: 18, color: "#aaa", marginTop: 12, letterSpacing: 2 }}>
        Both lives used — better luck next time!
      </div>
      <button
        onClick={() => setPhase("results")}
        style={{
          marginTop: 32,
          background: "rgba(244,67,54,0.2)",
          border: "2px solid rgba(244,67,54,0.5)",
          borderRadius: 12,
          padding: "12px 36px",
          color: "#f44336",
          fontSize: 16,
          fontWeight: "bold",
          cursor: "pointer",
          letterSpacing: 2,
        }}
      >
        VIEW RESULTS
      </button>
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
  const isTpp = useGameStore((s) => s.isTpp);
  const setIsTpp = useGameStore((s) => s.setIsTpp);
  const matchTimeLeft = useGameStore((s) => s.matchTimeLeft);
  const currentMap = useGameStore((s) => s.currentMap);
  const myId = useGameStore((s) => s.myId);

  // Barmuda-specific
  const hasGun = useGameStore((s) => s.hasGun);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const barmudaDropping = useGameStore((s) => s.barmudaDropping);
  const barmudaDropAlt = useGameStore((s) => s.barmudaDropAlt);
  const nearbyLootGun = useGameStore((s) => s.nearbyLootGun);
  const eliminated = useGameStore((s) => s.eliminated);
  const pickupLoot = useGameStore((s) => s.pickupLoot);
  const nearbyLootIndex = useGameStore((s) => s.nearbyLootIndex);

  const [showShop, setShowShop] = useState(false);

  const scoreboard = Object.values(remotePlayers).sort((a, b) => b.kills - a.kills);
  const kd = deaths > 0 ? (kills / deaths).toFixed(1) : kills.toString();
  const healthColor = health > 60 ? "#00e676" : health > 30 ? "#ffb300" : "#f44336";

  const gunIcon: Record<string, string> = { "AK-47": "🔫", "SMG": "💥", "Sniper": "🎯", "Shotgun": "🔧", "Pistol": "🔫" };

  const isBarmuda = currentMap === "barmuda";

  return (
    <>
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {/* Eliminated overlay */}
      {eliminated && <EliminatedScreen />}

      {/* Hit flash */}
      {hitIndicator && (
        <div style={{ position: "fixed", inset: 0, border: "6px solid rgba(255,0,0,0.6)", pointerEvents: "none", zIndex: 50 }} />
      )}

      {/* SCOPE OVERLAYS */}
      {isScoped && selectedGun === "Sniper" && <SniperScope />}
      {isScoped && selectedGun !== "Sniper" && <ADSCrosshair />}

      {/* CROSSHAIR */}
      {!isScoped && hasGun && !barmudaDropping && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 40, pointerEvents: "none", width: 28, height: 28 }}>
          <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.9)", left: "50%", top: 0, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.9)", left: "50%", bottom: 0, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.9)", top: "50%", left: 0, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.9)", top: "50%", right: 0, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", width: 3, height: 3, background: "rgba(255,107,107,0.8)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        </div>
      )}

      {/* ADS hint for Sniper */}
      {!isScoped && hasGun && selectedGun === "Sniper" && !barmudaDropping && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 40, pointerEvents: "none", background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "4px 12px", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
          RIGHT CLICK — SCOPE
        </div>
      )}

      {/* BARMUDA: Drop overlay */}
      {isBarmuda && barmudaDropping && <BarmudaDropOverlay altitude={barmudaDropAlt} />}

      {/* BARMUDA: Lives display (top center) */}
      {isBarmuda && !barmudaDropping && <LivesDisplay lives={livesLeft} map={currentMap} />}

      {/* BARMUDA: Loot pickup prompt */}
      {isBarmuda && !barmudaDropping && <PickupPrompt gun={nearbyLootGun} />}

      {/* BARMUDA: No gun indicator */}
      {isBarmuda && !hasGun && !barmudaDropping && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 40, pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: 10, padding: "8px 20px", border: "1px solid rgba(255,107,107,0.4)", fontSize: 13, color: "#ff6b6b", letterSpacing: 2 }}>
            ⚠ FIND A GUN!
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: Health + Ammo */}
      <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 40 }}>
        <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: 14, padding: "14px 18px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 190 }}>
          {/* Health */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>♥ HEALTH</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: healthColor, fontFamily: "monospace" }}>{Math.max(0, health)}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ width: `${Math.max(0, health)}%`, height: "100%", background: `linear-gradient(90deg, ${healthColor}88, ${healthColor})`, borderRadius: 3, transition: "width 0.2s, background 0.3s", boxShadow: `0 0 8px ${healthColor}55` }} />
          </div>

          {/* Ammo / Gun */}
          {!isBarmuda || hasGun ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
                  {gunIcon[selectedGun] || "🔫"} {selectedGun}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: ammo <= 5 ? "#f44336" : "#fff", fontFamily: "monospace" }}>{ammo}</span>
                  <span style={{ fontSize: 11, color: "#444" }}>/{maxAmmo}</span>
                </div>
              </div>
              {isReloading ? (
                <div style={{ fontSize: 10, color: "#ffd93d", fontWeight: "bold", letterSpacing: 2 }}>↺ RELOADING...</div>
              ) : (
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {Array.from({ length: Math.min(maxAmmo, 45) }).map((_, i) => (
                    <div key={i} style={{ width: 4, height: 10, borderRadius: 1, background: i < ammo ? "#ffcc44" : "rgba(255,255,255,0.1)", transition: "background 0.15s" }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 11, color: "#ff6b6b", letterSpacing: 1 }}>🔍 Search for weapons</div>
          )}
        </div>
      </div>

      {/* BOTTOM-RIGHT: Stats */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 40, textAlign: "right" }}>
        <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: 14, padding: "14px 18px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)" }}>
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
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 40, display: "flex", flexDirection: "column", gap: 4, maxWidth: 240 }}>
        {killFeed.slice(0, 5).map((k) => (
          <div key={k.id} style={{ background: "rgba(0,0,0,0.72)", padding: "5px 10px", borderRadius: 6, fontSize: 12, color: "#fff", display: "flex", gap: 6, alignItems: "center", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: k.headshot ? "3px solid #ffd93d" : "3px solid #ff6b6b" }}>
            <span style={{ color: "#88ccff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.killerName}</span>
            {k.headshot && <span style={{ color: "#ffd93d", fontSize: 10 }}>🎯</span>}
            <span style={{ color: "#ff6b6b" }}>→</span>
            <span style={{ color: "#ff9999", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.victimName}</span>
          </div>
        ))}
      </div>

      {/* TOP-LEFT: Scoreboard */}
      <div style={{ position: "fixed", top: 20, left: 20, zIndex: 40 }}>
        <div style={{ background: "rgba(0,0,0,0.62)", borderRadius: 10, padding: "10px 14px", minWidth: 175, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
      <div style={{ position: "fixed", top: isBarmuda ? 58 : 20, left: "50%", transform: "translateX(-50%)", zIndex: 40, display: "flex", gap: 8 }}>
        {!isBarmuda && (
          <button onClick={() => setShowShop(true)} style={{ background: "rgba(255,217,61,0.12)", border: "1px solid rgba(255,217,61,0.25)", borderRadius: 8, padding: "6px 14px", color: "#ffd93d", fontSize: 11, cursor: "pointer", backdropFilter: "blur(4px)", fontWeight: "bold" }}>
            🛒 SHOP
          </button>
        )}
        <button onClick={() => setIsTpp(!isTpp)} style={{ background: isTpp ? "rgba(74,158,255,0.18)" : "rgba(0,0,0,0.4)", border: isTpp ? "1px solid rgba(74,158,255,0.5)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", color: isTpp ? "#4a9eff" : "#aaa", fontSize: 11, cursor: "pointer", backdropFilter: "blur(4px)", fontWeight: "bold", letterSpacing: 0.5 }}>
          {isTpp ? "👁 TPP" : "👁 FPP"}
        </button>
        <button onClick={() => setPhase("results")} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", color: "#555", fontSize: 11, cursor: "pointer", backdropFilter: "blur(4px)" }}>
          END MATCH
        </button>
      </div>

      {/* MOBILE: Pickup button */}
      {isBarmuda && nearbyLootGun && nearbyLootIndex !== null && (
        <button
          onClick={() => pickupLoot(nearbyLootIndex!, nearbyLootGun!)}
          style={{
            position: "fixed",
            bottom: 160,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 55,
            background: "rgba(255,204,68,0.9)",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            color: "#000",
            fontSize: 15,
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          PICK UP {nearbyLootGun}
        </button>
      )}

      {/* DEAD screen — Barmuda shows lives remaining */}
      {isDead && !eliminated && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 60, textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: "#f44336", letterSpacing: 4, textShadow: "0 0 40px rgba(244,67,54,0.5)" }}>
            YOU DIED
          </div>
          {isBarmuda && (
            <div style={{ fontSize: 18, color: "#ffd93d", marginTop: 8, fontWeight: "bold" }}>
              {livesLeft} {livesLeft === 1 ? "life" : "lives"} remaining
            </div>
          )}
          <div style={{ fontSize: 22, color: "#fff", marginTop: 10, background: "rgba(0,0,0,0.6)", padding: "8px 24px", borderRadius: 30 }}>
            Respawning in{" "}
            <span style={{ color: "#ffd93d", fontWeight: "bold" }}>{respawnCountdown}s</span>
          </div>
        </div>
      )}
    </>
  );
}
