import { useState, useEffect } from "react";
import { useGameStore } from "./store";
import ShopModal from "./ShopModal";
import Minimap from "./Minimap";
import { playerPosX, playerPosZ, playerYaw, isAimbotActive } from "./PlayerController";

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

function BarmudaDropOverlay({ altitude }: { altitude: number }) {
  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      zIndex: 55, textAlign: "center", pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.5)", borderRadius: 16, padding: "18px 32px",
        backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#87ceeb", letterSpacing: 3, marginBottom: 6 }}>PARACHUTING</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontFamily: "monospace", lineHeight: 1 }}>
          {Math.round(altitude)}<span style={{ fontSize: 16, color: "#aaa", marginLeft: 4 }}>m</span>
        </div>
        <div style={{ fontSize: 11, color: "#ffcc44", marginTop: 8, letterSpacing: 1 }}>
          WASD — Steer  |  Land to play
        </div>
      </div>
    </div>
  );
}

function LivesDisplay({ lives }: { lives: number }) {
  return (
    <div style={{
      display: "flex", gap: 6, alignItems: "center",
    }}>
      {[0, 1].map((i) => (
        <span key={i} style={{ fontSize: 18, filter: i < lives ? "none" : "grayscale(1) opacity(0.3)" }}>
          &#10084;&#65039;
        </span>
      ))}
      <span style={{ fontSize: 9, color: lives > 0 ? "#6bcb77" : "#ff6b6b", letterSpacing: 1 }}>
        {lives > 0 ? `${lives}` : "0"}
      </span>
    </div>
  );
}

function PickupPrompt({ gun, itemType }: { gun: string | null; itemType: string | null }) {
  const label = gun || (itemType === "medkit" ? "Medkit" : itemType === "bandage" ? "Bandage" : itemType === "armor" ? "Armor" : itemType === "ammo" ? "Ammo" : null);
  if (!label) return null;
  const gunColors: Record<string, string> = {
    "AK-47": "#ff6b35", "SMG": "#4ecdc4", "Sniper": "#9b59b6",
    "Shotgun": "#ffd93d", "Pistol": "#c8d6e5",
    "Medkit": "#ff4444", "Bandage": "#ff8888", "Armor": "#4488ff", "Ammo": "#ffaa00",
  };
  const color = gunColors[label] || "#fff";
  return (
    <div style={{
      position: "fixed", bottom: 140, left: "50%", transform: "translateX(-50%)",
      zIndex: 50, pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.75)", borderRadius: 12, padding: "10px 22px",
        backdropFilter: "blur(8px)", border: `1px solid ${color}55`,
        textAlign: "center", boxShadow: `0 0 20px ${color}33`,
      }}>
        <div style={{ fontSize: 11, color, letterSpacing: 2, marginBottom: 2 }}>PRESS E TO PICK UP</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{label}</div>
      </div>
    </div>
  );
}

function EliminatedScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  const kills = useGameStore((s) => s.kills);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
    }}>
      <div style={{ fontSize: 64, fontWeight: 900, color: "#f44336", letterSpacing: 6, textShadow: "0 0 60px rgba(244,67,54,0.7)" }}>
        ELIMINATED
      </div>
      <div style={{ fontSize: 18, color: "#aaa", marginTop: 12, letterSpacing: 2 }}>
        Both lives used — better luck next time!
      </div>
      <div style={{ fontSize: 24, color: "#ffd93d", marginTop: 8, fontWeight: "bold" }}>
        {kills} KILLS
      </div>
      <button onClick={() => setPhase("results")} style={{
        marginTop: 32, background: "rgba(244,67,54,0.2)", border: "2px solid rgba(244,67,54,0.5)",
        borderRadius: 12, padding: "12px 36px", color: "#f44336", fontSize: 16, fontWeight: "bold",
        cursor: "pointer", letterSpacing: 2,
      }}>
        VIEW RESULTS
      </button>
    </div>
  );
}

function DamageDirection({ angle }: { angle: number }) {
  const relAngle = angle - playerYaw;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 48, pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) rotate(${-relAngle}rad)`,
        width: 200, height: 200,
      }}>
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderBottom: "24px solid rgba(255,50,50,0.7)",
        }} />
      </div>
    </div>
  );
}

function KillStreakBanner({ msg }: { msg: string }) {
  return (
    <div style={{
      position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
      zIndex: 52, pointerEvents: "none",
      animation: "fadeInUp 0.3s ease-out",
    }}>
      <div style={{
        fontSize: 36, fontWeight: 900, letterSpacing: 4,
        color: msg === "FIRST BLOOD" ? "#ff4444" : "#ffd93d",
        textShadow: `0 0 40px ${msg === "FIRST BLOOD" ? "rgba(255,68,68,0.6)" : "rgba(255,217,61,0.6)"}`,
        textAlign: "center",
      }}>
        {msg}
      </div>
    </div>
  );
}

function ZoneInfo({ timer, phase, shrinking, inZone }: {
  timer: number; phase: number; shrinking: boolean; inZone: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: !inZone ? "#ff4444" : shrinking ? "#ffd93d" : "#00aaff",
        boxShadow: !inZone ? "0 0 8px rgba(255,68,68,0.6)" : "none",
        animation: !inZone ? "pulse 1s infinite" : "none",
      }} />
      <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 1 }}>
        {shrinking ? "SHRINKING" : `ZONE ${phase + 1}`}
      </div>
      {!shrinking && (
        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>
          {Math.ceil(timer)}s
        </div>
      )}
      {!inZone && (
        <div style={{ fontSize: 10, color: "#ff4444", fontWeight: "bold" }}>OUTSIDE!</div>
      )}
    </div>
  );
}

function WeaponSlots({ slots, activeSlot }: { slots: [string | null, string | null]; activeSlot: number }) {
  const switchWeapon = useGameStore((s) => s.switchWeapon);
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
      {slots.map((gun, i) => (
        <div
          key={i}
          onClick={() => gun && switchWeapon(i)}
          style={{
            width: 85, padding: "5px 8px",
            background: i === activeSlot ? "rgba(255,204,68,0.15)" : "rgba(255,255,255,0.04)",
            border: i === activeSlot ? "1px solid rgba(255,204,68,0.5)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6, cursor: gun ? "pointer" : "default",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>{i + 1}</div>
          <div style={{ fontSize: 11, color: gun ? (i === activeSlot ? "#ffd93d" : "#aaa") : "#333", fontWeight: "bold" }}>
            {gun || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

function StaminaBar({ stamina }: { stamina: number }) {
  if (stamina >= 99.5) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 8, color: "#666", letterSpacing: 1, marginBottom: 2 }}>STAMINA</div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${stamina}%`, height: "100%",
          background: stamina > 30 ? "linear-gradient(90deg, #ff88ff88, #ff88ff)" : "linear-gradient(90deg, #ff444488, #ff4444)",
          borderRadius: 2, transition: "width 0.15s",
        }} />
      </div>
    </div>
  );
}

function InventoryBar({ inventory }: { inventory: { medkits: number; bandages: number; ammoBoxes: number } }) {
  if (inventory.medkits === 0 && inventory.bandages === 0 && inventory.ammoBoxes === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {inventory.medkits > 0 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14 }}>&#10133;</div>
          <div style={{ fontSize: 9, color: "#ff4444", fontWeight: "bold" }}>{inventory.medkits}</div>
        </div>
      )}
      {inventory.bandages > 0 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14 }}>&#129657;</div>
          <div style={{ fontSize: 9, color: "#ff8888", fontWeight: "bold" }}>{inventory.bandages}</div>
        </div>
      )}
      {inventory.ammoBoxes > 0 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12 }}>&#128299;</div>
          <div style={{ fontSize: 9, color: "#ffaa00", fontWeight: "bold" }}>{inventory.ammoBoxes}</div>
        </div>
      )}
      <div style={{ fontSize: 8, color: "#555", alignSelf: "center", letterSpacing: 1 }}>F HEAL</div>
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

  const hasGun = useGameStore((s) => s.hasGun);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const barmudaDropping = useGameStore((s) => s.barmudaDropping);
  const barmudaDropAlt = useGameStore((s) => s.barmudaDropAlt);
  const nearbyLootGun = useGameStore((s) => s.nearbyLootGun);
  const eliminated = useGameStore((s) => s.eliminated);
  const pickupLoot = useGameStore((s) => s.pickupLoot);
  const nearbyLootIndex = useGameStore((s) => s.nearbyLootIndex);

  const armor = useGameStore((s) => s.armor);
  const stamina = useGameStore((s) => s.stamina);
  const weaponSlots = useGameStore((s) => s.weaponSlots);
  const activeSlot = useGameStore((s) => s.activeSlot);
  const zonePhase = useGameStore((s) => s.zonePhase);
  const zoneTimer = useGameStore((s) => s.zoneTimer);
  const zoneShrinking = useGameStore((s) => s.zoneShrinking);
  const inZone = useGameStore((s) => s.inZone);
  const killStreakMsg = useGameStore((s) => s.killStreakMsg);
  const damageDir = useGameStore((s) => s.damageDir);
  const playersAlive = useGameStore((s) => s.playersAlive);
  const inventory = useGameStore((s) => s.inventory);
  const nearbyItemType = useGameStore((s) => s.nearbyItemType);
  const isSprinting = useGameStore((s) => s.isSprinting);

  const [showShop, setShowShop] = useState(false);
  const [minimapPos, setMinimapPos] = useState({ x: 0, z: 0, yaw: 0 });
  const [aimbot, setAimbot] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setMinimapPos({ x: playerPosX, z: playerPosZ, yaw: playerYaw });
      setAimbot(isAimbotActive());
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!killStreakMsg) return;
    const t = setTimeout(() => useGameStore.getState().setKillStreakMsg(null), 2500);
    return () => clearTimeout(t);
  }, [killStreakMsg]);

  const scoreboard = Object.values(remotePlayers).sort((a, b) => b.kills - a.kills);
  const kd = deaths > 0 ? (kills / deaths).toFixed(1) : kills.toString();
  const healthColor = health > 60 ? "#00e676" : health > 30 ? "#ffb300" : "#f44336";
  const isBarmuda = currentMap === "barmuda";

  const aliveCount = isBarmuda
    ? Object.values(remotePlayers).length + (eliminated ? 0 : 1)
    : Object.values(remotePlayers).length + 1;

  return (
    <>
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {eliminated && <EliminatedScreen />}

      {hitIndicator && (
        <div style={{ position: "fixed", inset: 0, border: "6px solid rgba(255,0,0,0.6)", pointerEvents: "none", zIndex: 50 }} />
      )}

      {!inZone && isBarmuda && !barmudaDropping && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 47,
          border: "4px solid rgba(0,170,255,0.4)",
          background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,100,255,0.08) 100%)",
        }} />
      )}

      {damageDir !== null && <DamageDirection angle={damageDir} />}
      {killStreakMsg && <KillStreakBanner msg={killStreakMsg} />}

      {isScoped && selectedGun === "Sniper" && <SniperScope />}
      {isScoped && selectedGun !== "Sniper" && <ADSCrosshair />}

      {!isScoped && hasGun && !barmudaDropping && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 40, pointerEvents: "none", width: 28, height: 28 }}>
          <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.9)", left: "50%", top: 0, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", width: 2, height: 10, background: "rgba(255,255,255,0.9)", left: "50%", bottom: 0, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.9)", top: "50%", left: 0, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", height: 2, width: 10, background: "rgba(255,255,255,0.9)", top: "50%", right: 0, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", width: 3, height: 3, background: "rgba(255,107,107,0.8)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        </div>
      )}

      {!isScoped && hasGun && selectedGun === "Sniper" && !barmudaDropping && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 40, pointerEvents: "none", background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "4px 12px", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
          RIGHT CLICK — SCOPE
        </div>
      )}

      {isBarmuda && barmudaDropping && <BarmudaDropOverlay altitude={barmudaDropAlt} />}
      {isBarmuda && !barmudaDropping && <PickupPrompt gun={nearbyLootGun} itemType={nearbyItemType} />}

      {isBarmuda && !hasGun && !barmudaDropping && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 40, pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: 10, padding: "8px 20px", border: "1px solid rgba(255,107,107,0.4)", fontSize: 13, color: "#ff6b6b", letterSpacing: 2 }}>
            FIND A GUN!
          </div>
        </div>
      )}

      {isSprinting && (
        <div style={{ position: "fixed", bottom: 200, left: "50%", transform: "translateX(-50%)", zIndex: 40, pointerEvents: "none", fontSize: 10, color: "rgba(255,136,255,0.6)", letterSpacing: 2 }}>
          SPRINTING
        </div>
      )}

      {aimbot && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%) translateY(30px)",
          zIndex: 55, pointerEvents: "none", fontSize: 9, fontWeight: "bold",
          color: "#ff2244", letterSpacing: 3, textShadow: "0 0 8px #ff2244",
        }}>
          AIM LOCK
        </div>
      )}

      {/* TOP BAR */}
      <div style={{
        position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
        zIndex: 42, display: "flex", alignItems: "center", gap: 12,
        background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "6px 16px",
        backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {isBarmuda && <LivesDisplay lives={livesLeft} />}
        {isBarmuda && (
          <div style={{ fontSize: 12, color: "#ffd93d", fontWeight: "bold" }}>
            &#128100; {aliveCount}
          </div>
        )}
        {isBarmuda && <ZoneInfo timer={zoneTimer} phase={zonePhase} shrinking={zoneShrinking} inZone={inZone} />}
        {!isBarmuda && (
          <div style={{ fontSize: 11, color: "#aaa" }}>{formatTime(matchTimeLeft)}</div>
        )}
        <button onClick={() => setIsTpp(!isTpp)} style={{
          background: isTpp ? "rgba(74,158,255,0.18)" : "rgba(0,0,0,0.4)",
          border: isTpp ? "1px solid rgba(74,158,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "4px 10px", color: isTpp ? "#4a9eff" : "#aaa",
          fontSize: 10, cursor: "pointer", fontWeight: "bold",
        }}>
          {isTpp ? "TPP" : "FPP"}
        </button>
        {!isBarmuda && (
          <button onClick={() => setShowShop(true)} style={{
            background: "rgba(255,217,61,0.12)", border: "1px solid rgba(255,217,61,0.25)",
            borderRadius: 8, padding: "4px 10px", color: "#ffd93d", fontSize: 10, cursor: "pointer", fontWeight: "bold",
          }}>
            SHOP
          </button>
        )}
        <button onClick={() => setPhase("results")} style={{
          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "4px 10px", color: "#555", fontSize: 10, cursor: "pointer",
        }}>
          END
        </button>
      </div>

      {/* MINIMAP (top-right) */}
      {isBarmuda && !barmudaDropping && (
        <Minimap playerX={minimapPos.x} playerZ={minimapPos.z} playerYaw={minimapPos.yaw} />
      )}

      {/* BOTTOM-LEFT: Health + Armor + Ammo */}
      <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 40 }}>
        <div style={{
          background: "rgba(0,0,0,0.6)", borderRadius: 14, padding: "14px 18px",
          backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 190,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>HP</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: healthColor, fontFamily: "monospace" }}>{Math.max(0, Math.round(health))}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: armor > 0 ? 6 : 14 }}>
            <div style={{ width: `${Math.max(0, health)}%`, height: "100%", background: `linear-gradient(90deg, ${healthColor}88, ${healthColor})`, borderRadius: 3, transition: "width 0.2s", boxShadow: `0 0 8px ${healthColor}55` }} />
          </div>

          {armor > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: "#4488ff", letterSpacing: 1 }}>ARMOR</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#4488ff", fontFamily: "monospace" }}>{Math.round(armor)}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ width: `${armor}%`, height: "100%", background: "linear-gradient(90deg, #224488, #4488ff)", borderRadius: 2, transition: "width 0.2s" }} />
              </div>
            </>
          )}

          {(!isBarmuda || hasGun) ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>{selectedGun}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: ammo <= 5 ? "#f44336" : "#fff", fontFamily: "monospace" }}>{ammo}</span>
                  <span style={{ fontSize: 11, color: "#444" }}>/{maxAmmo}</span>
                </div>
              </div>
              {isReloading ? (
                <div style={{ fontSize: 10, color: "#ffd93d", fontWeight: "bold", letterSpacing: 2 }}>RELOADING...</div>
              ) : (
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {Array.from({ length: Math.min(maxAmmo, 45) }).map((_, i) => (
                    <div key={i} style={{ width: 4, height: 10, borderRadius: 1, background: i < ammo ? "#ffcc44" : "rgba(255,255,255,0.1)", transition: "background 0.15s" }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 11, color: "#ff6b6b", letterSpacing: 1 }}>Search for weapons</div>
          )}

          {isBarmuda && <WeaponSlots slots={weaponSlots} activeSlot={activeSlot} />}
          {isBarmuda && <StaminaBar stamina={stamina} />}
          {isBarmuda && <InventoryBar inventory={inventory} />}
        </div>
      </div>

      {/* BOTTOM-RIGHT: Stats */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 40, textAlign: "right" }}>
        <div style={{
          background: "rgba(0,0,0,0.6)", borderRadius: 14, padding: "14px 18px",
          backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
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
              <div style={{ fontSize: 11, color: "#ffd93d", fontWeight: "bold" }}>{coins}</div>
              <div style={{ fontSize: 9, color: "#444" }}>COINS</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP-LEFT: Kill feed */}
      <div style={{ position: "fixed", top: 60, left: 20, zIndex: 40, display: "flex", flexDirection: "column", gap: 4, maxWidth: 240 }}>
        {killFeed.slice(0, 5).map((k) => (
          <div key={k.id} style={{
            background: "rgba(0,0,0,0.72)", padding: "5px 10px", borderRadius: 6,
            fontSize: 12, color: "#fff", display: "flex", gap: 6, alignItems: "center",
            backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.06)",
            borderLeft: k.headshot ? "3px solid #ffd93d" : "3px solid #ff6b6b",
          }}>
            <span style={{ color: "#88ccff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.killerName}</span>
            {k.headshot && <span style={{ color: "#ffd93d", fontSize: 10 }}>&#127919;</span>}
            <span style={{ color: "#ff6b6b" }}>&#8594;</span>
            <span style={{ color: "#ff9999", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.victimName}</span>
          </div>
        ))}
      </div>

      {/* TOP-LEFT (below kill feed): Scoreboard */}
      <div style={{ position: "fixed", top: 60 + killFeed.length * 30 + 10, left: 20, zIndex: 40 }}>
        <div style={{
          background: "rgba(0,0,0,0.62)", borderRadius: 10, padding: "10px 14px",
          minWidth: 175, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ color: "#ffd93d", fontSize: 9, fontWeight: "bold", marginBottom: 6, letterSpacing: 1 }}>SCOREBOARD</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2, padding: "2px 0" }}>
            <span style={{ color: "#4a9eff" }}>{myName.slice(0, 12)}</span>
            <span><span style={{ color: "#6bcb77" }}>{kills}</span>{" / "}<span style={{ color: "#ff6b6b" }}>{deaths}</span></span>
          </div>
          {scoreboard.slice(0, 5).map((p) => (
            <div key={p.id} style={{ fontSize: 11, display: "flex", justifyContent: "space-between", color: "#666", marginBottom: 2, padding: "2px 0" }}>
              <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.name || "Player").slice(0, 12)}</span>
              <span><span style={{ color: "#6bcb77" }}>{p.kills}</span>{" / "}<span style={{ color: "#ff6b6b" }}>{p.deaths}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE: Pickup button */}
      {isBarmuda && nearbyLootGun && nearbyLootIndex !== null && (
        <button
          onClick={() => pickupLoot(nearbyLootIndex!, nearbyLootGun!)}
          style={{
            position: "fixed", bottom: 160, left: "50%", transform: "translateX(-50%)",
            zIndex: 55, background: "rgba(255,204,68,0.9)", border: "none",
            borderRadius: 12, padding: "12px 28px", color: "#000", fontSize: 15,
            fontWeight: "bold", cursor: "pointer", letterSpacing: 1,
          }}
        >
          PICK UP {nearbyLootGun}
        </button>
      )}

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

      {/* Controls hint (bottom center) */}
      {!isBarmuda && (
        <div style={{
          position: "fixed", bottom: 5, left: "50%", transform: "translateX(-50%)",
          zIndex: 38, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 1,
        }}>
          WASD Move | SHIFT Sprint | C Crouch | R Reload | 1/2 Weapons | F Heal
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, -30%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
