import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sharedArena } from "./arenaShared";
import { useGameStore } from "./store";

// ══════════════════════════════════════════════════════════════════════════
// BARMUDA MAP — 150×150 — Free Fire Bermuda style — Battle Royale
// Houses are WALKABLE with open doorways
// ══════════════════════════════════════════════════════════════════════════

// Helper: generate individual wall collision boxes for a walkable house
// Door is centered on the front (positive-Z) wall
function houseWalls(hx: number, hz: number, W: number, D: number, H: number) {
  const wT = 0.32;
  const doorW = 1.6;
  const segW = (W - doorW) / 2;
  const leftSegCx  = hx - doorW / 2 - segW / 2;
  const rightSegCx = hx + doorW / 2 + segW / 2;
  const frontZ = hz + D / 2 - wT / 2;
  return [
    // Back wall
    { cx: hx, cy: H / 2, cz: hz - D / 2 + wT / 2, w: W, h: H, d: wT },
    // Left wall
    { cx: hx - W / 2 + wT / 2, cy: H / 2, cz: hz, w: wT, h: H, d: D },
    // Right wall
    { cx: hx + W / 2 - wT / 2, cy: H / 2, cz: hz, w: wT, h: H, d: D },
    // Front wall — left segment (beside door)
    { cx: leftSegCx,  cy: H / 2, cz: frontZ, w: segW, h: H, d: wT },
    // Front wall — right segment (beside door)
    { cx: rightSegCx, cy: H / 2, cz: frontZ, w: segW, h: H, d: wT },
  ];
}

// Pre-computed collision boxes (module level, computed once)
export const BARMUDA_BOXES: Array<{
  cx: number; cy: number; cz: number; w: number; h: number; d: number;
}> = [
  // ── Border walls ────────────────────────────────────────────────────────
  { cx:   0, cy: 4, cz: -75, w: 150, h: 8, d: 1 },
  { cx:   0, cy: 4, cz:  75, w: 150, h: 8, d: 1 },
  { cx: -75, cy: 4, cz:   0, w:   1, h: 8, d: 150 },
  { cx:  75, cy: 4, cz:   0, w:   1, h: 8, d: 150 },

  // ── POCHINKI houses (center) — all walkable ──────────────────────────────
  ...houseWalls(-10, -8, 8, 7, 3.5),
  ...houseWalls(  2, -8, 7, 6, 3.5),
  ...houseWalls( 14, -8, 8, 7, 3.5),
  ...houseWalls(-10,  4, 7, 6, 3.5),
  ...houseWalls(  2,  4, 9, 7, 4.5),
  ...houseWalls( 14,  4, 7, 6, 3.5),
  ...houseWalls(-10, 14, 8, 6, 3.5),
  ...houseWalls(  4, 14, 7, 6, 3.5),
  ...houseWalls( 15, 14, 7, 7, 3.5),

  // Shop row (solid, can walk around)
  { cx: -2, cy: 1.5, cz: -18, w: 28, h: 3.0, d: 5 },

  // ── SCHOOL (north) — walkable ────────────────────────────────────────────
  ...houseWalls(  0, -52, 24, 12, 8),
  ...houseWalls( 16, -56,  8, 20, 8),

  // ── MILITARY BASE (NW) ──────────────────────────────────────────────────
  ...houseWalls(-52, -50, 16, 12, 7),
  ...houseWalls(-36, -50, 12, 10, 6),
  ...houseWalls(-52, -35, 10,  8, 5),
  // Bunker (solid)
  { cx: -42, cy: 1.5, cz: -40, w: 8, h: 3, d: 6 },
  // Watchtower legs
  { cx: -62, cy: 5, cz: -60, w: 3, h: 10, d: 3 },
  { cx: -32, cy: 5, cz: -60, w: 3, h: 10, d: 3 },

  // ── GEORGOPOL (NE industrial) ────────────────────────────────────────────
  ...houseWalls( 52, -48, 18, 14, 8),
  ...houseWalls( 35, -52, 12, 10, 7),
  // Storage tanks
  { cx: 58, cy: 3.5, cz: -35, w: 5, h: 7, d: 5 },
  { cx: 62, cy: 3.5, cz: -35, w: 5, h: 7, d: 5 },
  { cx: 58, cy: 3.5, cz: -40, w: 5, h: 7, d: 5 },
  { cx: 62, cy: 3.5, cz: -40, w: 5, h: 7, d: 5 },
  // Containers
  { cx: 44, cy: 1.4, cz: -40, w: 6, h: 2.8, d: 2.4 },
  { cx: 51, cy: 1.4, cz: -40, w: 6, h: 2.8, d: 2.4 },
  { cx: 58, cy: 1.4, cz: -43, w: 2.4, h: 2.8, d: 6 },
  { cx: 44, cy: 1.4, cz: -45, w: 6, h: 2.8, d: 2.4 },
  // Crane
  { cx: 65, cy: 8, cz: -50, w: 2, h: 16, d: 2 },

  // ── PRIMORSK (SW coastal) — walkable ────────────────────────────────────
  ...houseWalls(-52, 42, 7, 6, 3.5),
  ...houseWalls(-42, 42, 8, 6, 3.5),
  ...houseWalls(-52, 52, 7, 7, 3.5),
  ...houseWalls(-42, 52, 8, 6, 3.5),
  ...houseWalls(-58, 58, 7, 6, 3.5),
  ...houseWalls(-48, 62, 7, 6, 3.5),

  // ── LIPOVKA (SE farm) — walkable ────────────────────────────────────────
  ...houseWalls( 52, 50, 10, 8, 4.5),
  ...houseWalls( 65, 50,  7, 6, 3.5),
  // Barn
  { cx: 55, cy: 4.5, cz: 62, w: 14, h: 9, d: 10 },
  // Silo
  { cx: 65, cy: 5,   cz: 62, w: 5,  h: 10, d: 5  },

  // ── ROZHOK (center-east) — walkable ─────────────────────────────────────
  ...houseWalls( 32, -6, 7, 6, 3.5),
  ...houseWalls( 43, -6, 8, 6, 3.5),
  ...houseWalls( 32,  6, 7, 6, 3.5),
  ...houseWalls( 43,  6, 7, 7, 3.5),

  // ── FERRY PIER (center-west) — walkable ──────────────────────────────────
  ...houseWalls(-35, -6, 7, 6, 3.5),
  ...houseWalls(-46, -6, 8, 6, 3.5),
  ...houseWalls(-35,  6, 7, 6, 4.5),
  // Ferry terminal
  { cx: -58, cy: 2.5, cz: 0, w: 10, h: 5, d: 14 },

  // ── NOVOREPNOYE (south-center) — walkable ────────────────────────────────
  ...houseWalls(-10, 42, 7, 6, 3.5),
  ...houseWalls(  2, 42, 8, 6, 3.5),
  ...houseWalls( 14, 42, 7, 7, 3.5),
  ...houseWalls(-10, 54, 7, 6, 3.5),
  ...houseWalls(  4, 54, 9, 7, 3.5),

  // ── MID-MAP LANDMARKS ────────────────────────────────────────────────────
  { cx:   0, cy: 1.5,  cz: -30, w: 10, h: 3,  d: 6  },  // gas station
  { cx: -22, cy: 5,    cz: -22, w:  8, h: 10, d: 8  },  // church
  { cx:  22, cy: 6,    cz:  30, w:  3, h: 12, d: 3  },  // water tower

  // ── Barn roof (walkable roof collision)
  { cx: 55, cy: 9.4, cz: 62, w: 14.5, h: 1, d: 10.5 },
  // Gas station canopy
  { cx: 0, cy: 3.5, cz: -30, w: 12, h: 0.6, d: 8 },
  // Ferry pier
  { cx: -58, cy: 0.3, cz: 0, w: 10, h: 0.6, d: 14 },
  // Primorsk pier
  { cx: -68, cy: 0.3, cz: 55, w: 12, h: 0.6, d: 4 },
];

// ── Loot spawns: guns placed on the map for players to pick up ─────────────
export interface LootItem {
  x: number;
  z: number;
  gun: string;
  color: string;
}
export const BARMUDA_LOOT: LootItem[] = [
  // Pochinki center
  { x: -8,  z: -5,  gun: "AK-47",   color: "#ff6b35" },
  { x:  3,  z: -4,  gun: "SMG",     color: "#4ecdc4" },
  { x: 14,  z: -6,  gun: "Pistol",  color: "#c8d6e5" },
  { x: -9,  z:  6,  gun: "Shotgun", color: "#ffd93d" },
  { x:  3,  z:  7,  gun: "AK-47",  color: "#ff6b35" },
  { x: 15,  z:  6,  gun: "Sniper",  color: "#9b59b6" },
  { x: -9,  z: 16,  gun: "SMG",     color: "#4ecdc4" },
  { x:  5,  z: 16,  gun: "Pistol",  color: "#c8d6e5" },
  // School
  { x:  0,  z: -50, gun: "AK-47",   color: "#ff6b35" },
  { x: 16,  z: -54, gun: "Sniper",  color: "#9b59b6" },
  { x: -4,  z: -48, gun: "SMG",     color: "#4ecdc4" },
  // Military base
  { x: -52, z: -48, gun: "AK-47",   color: "#ff6b35" },
  { x: -36, z: -48, gun: "Sniper",  color: "#9b59b6" },
  { x: -52, z: -33, gun: "Shotgun", color: "#ffd93d" },
  { x: -44, z: -38, gun: "AK-47",   color: "#ff6b35" },
  // Georgopol
  { x:  52, z: -46, gun: "SMG",     color: "#4ecdc4" },
  { x:  35, z: -50, gun: "AK-47",   color: "#ff6b35" },
  { x:  44, z: -42, gun: "Shotgun", color: "#ffd93d" },
  // Primorsk
  { x: -52, z:  44, gun: "Pistol",  color: "#c8d6e5" },
  { x: -42, z:  54, gun: "SMG",     color: "#4ecdc4" },
  { x: -48, z:  60, gun: "AK-47",   color: "#ff6b35" },
  // Lipovka farm
  { x:  52, z:  52, gun: "Shotgun", color: "#ffd93d" },
  { x:  65, z:  52, gun: "Pistol",  color: "#c8d6e5" },
  // Rozhok
  { x:  32, z: -4,  gun: "AK-47",  color: "#ff6b35" },
  { x:  43, z:  4,  gun: "SMG",    color: "#4ecdc4" },
  // Novorepnoye
  { x:  -9, z:  44, gun: "Pistol", color: "#c8d6e5" },
  { x:   3, z:  56, gun: "AK-47",  color: "#ff6b35" },
];

// ── Item pickups (medkits, bandages, armor, ammo) ─────────────────────────
export interface ItemSpawn {
  x: number;
  z: number;
  type: "medkit" | "bandage" | "armor" | "ammo";
  color: string;
  label: string;
}
export const BARMUDA_ITEMS: ItemSpawn[] = [
  { x: -8, z: -10, type: "medkit", color: "#ff4444", label: "MED" },
  { x: 5, z: -6, type: "bandage", color: "#ff8888", label: "BND" },
  { x: 14, z: 2, type: "armor", color: "#4488ff", label: "ARM" },
  { x: -10, z: 8, type: "ammo", color: "#ffaa00", label: "AMO" },
  { x: 2, z: 10, type: "medkit", color: "#ff4444", label: "MED" },
  { x: 16, z: 16, type: "bandage", color: "#ff8888", label: "BND" },
  { x: 0, z: -55, type: "medkit", color: "#ff4444", label: "MED" },
  { x: 14, z: -50, type: "armor", color: "#4488ff", label: "ARM" },
  { x: -50, z: -48, type: "medkit", color: "#ff4444", label: "MED" },
  { x: -38, z: -48, type: "armor", color: "#4488ff", label: "ARM" },
  { x: -54, z: -38, type: "ammo", color: "#ffaa00", label: "AMO" },
  { x: 50, z: -46, type: "bandage", color: "#ff8888", label: "BND" },
  { x: 38, z: -50, type: "medkit", color: "#ff4444", label: "MED" },
  { x: 46, z: -44, type: "armor", color: "#4488ff", label: "ARM" },
  { x: -50, z: 44, type: "bandage", color: "#ff8888", label: "BND" },
  { x: -44, z: 54, type: "medkit", color: "#ff4444", label: "MED" },
  { x: -56, z: 60, type: "ammo", color: "#ffaa00", label: "AMO" },
  { x: 54, z: 52, type: "medkit", color: "#ff4444", label: "MED" },
  { x: 62, z: 50, type: "armor", color: "#4488ff", label: "ARM" },
  { x: 34, z: -4, type: "bandage", color: "#ff8888", label: "BND" },
  { x: 40, z: 4, type: "medkit", color: "#ff4444", label: "MED" },
  { x: -34, z: -4, type: "ammo", color: "#ffaa00", label: "AMO" },
  { x: -44, z: 4, type: "armor", color: "#4488ff", label: "ARM" },
  { x: -8, z: 44, type: "bandage", color: "#ff8888", label: "BND" },
  { x: 4, z: 52, type: "medkit", color: "#ff4444", label: "MED" },
  { x: 12, z: 44, type: "armor", color: "#4488ff", label: "ARM" },
  { x: 0, z: -28, type: "medkit", color: "#ff4444", label: "MED" },
  { x: -20, z: -20, type: "bandage", color: "#ff8888", label: "BND" },
  { x: 20, z: 28, type: "ammo", color: "#ffaa00", label: "AMO" },
];

function ItemPickup({ item, index }: { item: ItemSpawn; index: number }) {
  const pickedUpItems = useGameStore((s) => s.pickedUpItems);
  const ref = useRef<THREE.Group>(null!);
  const t = useRef(Math.random() * Math.PI * 2);

  const pickedUp = pickedUpItems.indexOf(index) !== -1;

  useFrame((_, delta) => {
    if (pickedUp || !ref.current) return;
    t.current += delta * 2;
    ref.current.position.y = 0.45 + Math.sin(t.current) * 0.12;
    ref.current.rotation.y += delta * 0.8;
  });

  if (pickedUp) return null;

  const iconGeo = item.type === "medkit" || item.type === "bandage"
    ? [0.3, 0.3, 0.15] as [number, number, number]
    : item.type === "armor"
    ? [0.35, 0.28, 0.12] as [number, number, number]
    : [0.25, 0.2, 0.2] as [number, number, number];

  return (
    <group position={[item.x, 0, item.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.2, 0.4, 8]} />
        <meshBasicMaterial color={item.color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <group ref={ref}>
        <mesh>
          <boxGeometry args={iconGeo} />
          <meshBasicMaterial color={item.color} />
        </mesh>
        {(item.type === "medkit" || item.type === "bandage") && (
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.08, 0.18, 0.01]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
        )}
        {(item.type === "medkit" || item.type === "bandage") && (
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.18, 0.08, 0.01]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
        )}
      </group>
    </group>
  );
}

// ── Parachute / helicopter drop animation ─────────────────────────────────
function Helicopter({ dropping }: { dropping: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      ref.current.position.set(
        Math.sin(t.current * 0.3) * 60,
        55 + Math.sin(t.current * 0.6) * 3,
        -80 + t.current * 8,
      );
      ref.current.rotation.y = Math.sin(t.current * 0.3) * 0.15;
    }
  });
  if (!dropping) return null;
  return (
    <group ref={ref}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[6, 2, 3]} />
        <meshStandardMaterial color="#4a6a4a" metalness={0.4} />
      </mesh>
      {/* Tail */}
      <mesh position={[4.5, 0, 0]} castShadow>
        <boxGeometry args={[3, 0.8, 0.8]} />
        <meshStandardMaterial color="#3a5a3a" />
      </mesh>
      {/* Rotor hub */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Rotor blades — spin fast */}
      <RotorBlade />
      {/* Skids */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[0, -1.2, s * 1.4]}>
          <boxGeometry args={[5, 0.15, 0.2]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

function RotorBlade() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 20;
  });
  return (
    <group ref={ref} position={[0, 1.5, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[8, 0.08, 0.4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8, 0.08, 0.4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

// ── Visual-only sub-components ─────────────────────────────────────────────

function WalkableHouse({
  x, z, w = 7, d = 6, h = 3.5, color = "#d4c5a9",
  hasSecondFloor = false,
}: {
  x: number; z: number; w?: number; d?: number; h?: number;
  color?: string; hasSecondFloor?: boolean;
}) {
  const wT = 0.32;
  const doorW = 1.6;
  const segW = (w - doorW) / 2;
  const leftCx  = -doorW / 2 - segW / 2;
  const rightCx =  doorW / 2 + segW / 2;
  const frontZ  = d / 2 - wT / 2;

  return (
    <group position={[x, 0, z]}>
      {/* Floor */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w - 0.1, 0.1, d - 0.1]} />
        <meshStandardMaterial color="#bbb" />
      </mesh>
      {/* Interior floor (darker) */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[w - 0.7, 0.02, d - 0.7]} />
        <meshStandardMaterial color="#a09070" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, h / 2, -d / 2 + wT / 2]}>
        <boxGeometry args={[w, h, wT]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-w / 2 + wT / 2, h / 2, 0]}>
        <boxGeometry args={[wT, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Right wall */}
      <mesh position={[w / 2 - wT / 2, h / 2, 0]}>
        <boxGeometry args={[wT, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Front wall — left seg */}
      <mesh position={[leftCx, h / 2, frontZ]}>
        <boxGeometry args={[segW, h, wT]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Front wall — right seg */}
      <mesh position={[rightCx, h / 2, frontZ]}>
        <boxGeometry args={[segW, h, wT]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Door frame top (lintel) */}
      <mesh position={[0, h - 0.5, frontZ]}>
        <boxGeometry args={[doorW + 0.1, 1, wT + 0.02]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, h + 0.5, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 1, d + 0.4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Windows on side walls */}
      {[[-w * 0.3, h * 0.55, d / 2 - wT - 0.01], [w * 0.3, h * 0.55, d / 2 - wT - 0.01]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[1, 0.9, 0.04]} />
          <meshStandardMaterial color="#7db8d4" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Interior props — table */}
      <mesh position={[0, 0.45, -1]}>
        <boxGeometry args={[1.2, 0.9, 0.7]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>

      {/* Second floor */}
      {hasSecondFloor && (
        <group position={[0, h, 0]}>
          <mesh position={[0, h / 2, -d / 2 + wT / 2]}>
            <boxGeometry args={[w - 0.4, h, wT]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[-w / 2 + wT / 2, h / 2, 0]}>
            <boxGeometry args={[wT, h, d - 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[w / 2 - wT / 2, h / 2, 0]}>
            <boxGeometry args={[wT, h, d - 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[leftCx, h / 2, frontZ]}>
            <boxGeometry args={[segW - 0.2, h, wT]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[rightCx, h / 2, frontZ]}>
            <boxGeometry args={[segW - 0.2, h, wT]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, h + 0.5, 0]} castShadow>
            <boxGeometry args={[w + 0.2, 1, d + 0.2]} />
            <meshStandardMaterial color="#722b0d" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function PalmTree({ x, z }: { x: number; z: number }) {
  const t = useRef(Math.random() * Math.PI * 2);
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    t.current += delta * 0.4;
    if (ref.current) {
      ref.current.rotation.z = Math.sin(t.current) * 0.04;
    }
  });
  return (
    <group position={[x, 0, z]} ref={ref}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 6, 5]} />
        <meshStandardMaterial color="#8b6914" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[0, 5.8, 0]} rotation={[0.5, a, 0]}>
            <mesh position={[1.4, -0.2, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[2.8, 0.08, 0.9]} />
              <meshStandardMaterial color="#2d8b2d" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Rock({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <mesh position={[x, s * 0.4, z]}>
      <boxGeometry args={[s * 1.4, s * 0.8, s * 1.2]} />
      <meshStandardMaterial color="#888" roughness={0.95} />
    </mesh>
  );
}

function Container({ x, z, rotY = 0, color = "#2d6a2d" }: {
  x: number; z: number; rotY?: number; color?: string;
}) {
  return (
    <mesh position={[x, 1.4, z]} rotation={[0, rotY, 0]}>
      <boxGeometry args={[6, 2.8, 2.4]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
    </mesh>
  );
}

function Watchtower({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[2.5, 10, 2.5]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      <mesh position={[0, 10.5, 0]}>
        <boxGeometry args={[4.5, 0.4, 4.5]} />
        <meshStandardMaterial color="#7a6245" />
      </mesh>
      {[-2, 2].map((rx, i) => (
        <mesh key={i} position={[rx, 11.5, 0]}>
          <boxGeometry args={[0.15, 2, 0.15]} />
          <meshStandardMaterial color="#5a4535" />
        </mesh>
      ))}
    </group>
  );
}

// ── Floating gun loot pickup ───────────────────────────────────────────────
function LootPickup({
  item, index,
}: {
  item: LootItem;
  index: number;
}) {
  const pickedUpLoot = useGameStore((s) => s.pickedUpLoot);
  const ref = useRef<THREE.Group>(null!);
  const t = useRef(Math.random() * Math.PI * 2);

  const pickedUp = pickedUpLoot.indexOf(index) !== -1;

  useFrame((_, delta) => {
    if (pickedUp || !ref.current) return;
    t.current += delta * 1.5;
    ref.current.position.y = 0.6 + Math.sin(t.current) * 0.18;
    ref.current.rotation.y += delta * 1.2;
  });

  if (pickedUp) return null;

  return (
    <group position={[item.x, 0, item.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.3, 0.55, 8]} />
        <meshBasicMaterial color={item.color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <group ref={ref}>
        <mesh>
          <boxGeometry args={[0.5, 0.18, 0.14]} />
          <meshBasicMaterial color={item.color} />
        </mesh>
      </group>
    </group>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function Arena5() {
  const barmudaDropping = useGameStore((s) => s.barmudaDropping);
  const resetBarmuda = useGameStore((s) => s.resetBarmuda);

  useEffect(() => {
    // Set collision boxes
    sharedArena.boxes = BARMUDA_BOXES.map(({ cx, cy, cz, w, h, d }) => ({
      min: new THREE.Vector3(cx - w / 2, cy - h / 2, cz - d / 2),
      max: new THREE.Vector3(cx + w / 2, cy + h / 2, cz + d / 2),
      cy,
      h,
    }));
    sharedArena.bounds = 74;
    // Reset Barmuda state on mount (helicopter drop)
    resetBarmuda();
    return () => { sharedArena.bounds = 27; };
  }, []);

  const borderH = 8;

  return (
    <group>
      {/* ── OCEAN ──────────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#0a4a7a" roughness={0.15} metalness={0.4} />
      </mesh>
      {/* Ocean animated shimmer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#1a6aaa" transparent opacity={0.3} roughness={0.05} metalness={0.6} />
      </mesh>

      {/* ── ISLAND GRASS ───────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[148, 148]} />
        <meshStandardMaterial color="#4a8a38" roughness={0.88} />
      </mesh>
      {/* Paths / dirt zones */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[10, 148]} />
        <meshStandardMaterial color="#8a7a50" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[148, 10]} />
        <meshStandardMaterial color="#8a7a50" roughness={0.95} />
      </mesh>

      {/* ── BEACH RING ─────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <ringGeometry args={[68, 80, 64]} />
        <meshStandardMaterial color="#d4b483" side={THREE.DoubleSide} roughness={0.95} />
      </mesh>

      {/* ── ROADS ──────────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[140, 4]} />
        <meshStandardMaterial color="#555" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4, 140]} />
        <meshStandardMaterial color="#555" roughness={0.9} />
      </mesh>
      {/* Diagonal roads */}
      <mesh rotation={[-Math.PI / 2, 0.5, 0]} position={[-28, 0.02, -28]}>
        <planeGeometry args={[3.5, 55]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, -0.5, 0]} position={[28, 0.02, -28]}>
        <planeGeometry args={[3.5, 55]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      {/* ── BORDER WALLS ───────────────────────────────────────────────── */}
      {([
        [0, borderH / 2, -75, 150, borderH, 1],
        [0, borderH / 2,  75, 150, borderH, 1],
        [-75, borderH / 2, 0, 1, borderH, 150],
        [75,  borderH / 2, 0, 1, borderH, 150],
      ] as [number, number, number, number, number, number][]).map(([cx, cy, cz, w, h, d], i) => (
        <mesh key={`b${i}`} position={[cx, cy, cz]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#2a3a1a" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* ══ POCHINKI — CENTER TOWN ═════════════════════════════════════ */}
      <WalkableHouse x={-10} z={-8}  w={8} d={7} hasSecondFloor color="#d9c9a3" />
      <WalkableHouse x={2}   z={-8}  w={7} d={6} hasSecondFloor color="#c8b89a" />
      <WalkableHouse x={14}  z={-8}  w={8} d={7} hasSecondFloor color="#dbc4a0" />
      <WalkableHouse x={-10} z={4}   w={7} d={6}               color="#ccc0a5" />
      <WalkableHouse x={2}   z={4}   w={9} d={7} hasSecondFloor color="#d2c5a8" />
      <WalkableHouse x={14}  z={4}   w={7} d={6}               color="#c4b89a" />
      <WalkableHouse x={-10} z={14}  w={8} d={6}               color="#d0c2a0" />
      <WalkableHouse x={4}   z={14}  w={7} d={6} hasSecondFloor color="#ccc0a5" />
      <WalkableHouse x={15}  z={14}  w={7} d={7}               color="#d8c9a6" />
      {/* Shop strip */}
      <mesh position={[-2, 1.5, -18]}>
        <boxGeometry args={[28, 3, 5]} />
        <meshStandardMaterial color="#b8a085" />
      </mesh>
      <mesh position={[-2, 3.1, -18]}>
        <boxGeometry args={[28.5, 0.4, 5.5]} />
        <meshStandardMaterial color="#7a5c3a" />
      </mesh>
      {/* Shop windows */}
      {[-12, -4, 4, 12].map((ox, i) => (
        <mesh key={i} position={[ox, 1.5, -15.55]}>
          <boxGeometry args={[3, 1.5, 0.06]} />
          <meshStandardMaterial color="#7db8d4" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* ══ SCHOOL — NORTH ════════════════════════════════════════════════ */}
      {/* Main building — open interior via 4-wall system */}
      {[
        // Back wall
        [0, 4, -58, 24, 8, 0.32],
        // Left wall
        [-12, 4, -52, 0.32, 8, 12],
        // Right wall
        [12, 4, -52, 0.32, 8, 12],
        // Front wall left
        [-5.8, 4, -46.16, 10.4, 8, 0.32],
        // Front wall right
        [5.8, 4, -46.16, 10.4, 8, 0.32],
      ].map(([cx, cy, cz, w, h, d], i) => (
        <mesh key={`sch${i}`} position={[cx as number, cy as number, cz as number]}>
          <boxGeometry args={[w as number, h as number, d as number]} />
          <meshStandardMaterial color="#e8dcc8" />
        </mesh>
      ))}
      <mesh position={[0, 8.4, -52]}>
        <boxGeometry args={[24.5, 0.8, 12.5]} />
        <meshStandardMaterial color="#6b4c2a" />
      </mesh>
      {/* Annex building */}
      <mesh position={[16, 4, -56]}>
        <boxGeometry args={[8, 8, 20]} />
        <meshStandardMaterial color="#e0d4bc" />
      </mesh>
      <mesh position={[16, 8.4, -56]}>
        <boxGeometry args={[8.5, 0.8, 20.5]} />
        <meshStandardMaterial color="#6b4c2a" />
      </mesh>
      {/* Fence */}
      {[-30,-32,-34,-36,-38,-40,-42,-44,-46].map((z, i) => (
        <mesh key={`sf${i}`} position={[-14, 1.2, z]}>
          <boxGeometry args={[0.2, 2.4, 1.8]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      ))}

      {/* ══ MILITARY BASE — NW ════════════════════════════════════════════ */}
      <WalkableHouse x={-52} z={-50} w={16} d={12} h={7} color="#7a8a70" />
      <WalkableHouse x={-36} z={-50} w={12} d={10} h={6} color="#8a9a80" />
      <WalkableHouse x={-52} z={-35} w={10} d={8}  h={5} color="#7a8570" />
      {/* Bunker */}
      <mesh position={[-42, 1.5, -40]}>
        <boxGeometry args={[8, 3, 6]} />
        <meshStandardMaterial color="#6a7060" />
      </mesh>
      <Watchtower x={-62} z={-60} />
      <Watchtower x={-32} z={-60} />
      {/* Perimeter fence */}
      {[-66,-60,-54,-48,-42,-36,-30].map((x, i) => (
        <mesh key={`mf${i}`} position={[x, 1.5, -65]}>
          <boxGeometry args={[5.5, 3, 0.3]} />
          <meshStandardMaterial color="#5a6050" />
        </mesh>
      ))}
      {[-65,-60,-55,-50,-45,-40,-35,-30].map((z, i) => (
        <mesh key={`mfz${i}`} position={[-68, 1.5, z]}>
          <boxGeometry args={[0.3, 3, 5.5]} />
          <meshStandardMaterial color="#5a6050" />
        </mesh>
      ))}
      {/* Ammo crates */}
      {[[-48,-45],[-50,-45],[-44,-38],[-46,-38]].map(([cx,cz],i) => (
        <mesh key={`cr${i}`} position={[cx, 0.5, cz]}>
          <boxGeometry args={[1.2, 1, 1]} />
          <meshStandardMaterial color="#5a7a3a" />
        </mesh>
      ))}

      {/* ══ GEORGOPOL — NE ════════════════════════════════════════════════ */}
      <WalkableHouse x={52} z={-48} w={18} d={14} h={8} color="#7a7a8a" />
      <WalkableHouse x={35} z={-52} w={12} d={10} h={7} color="#8a8a9a" />
      {/* Storage tanks */}
      {[[58,-35],[62,-35],[58,-40],[62,-40]].map(([cx,cz],i) => (
        <mesh key={`tk${i}`} position={[cx, 3.5, cz]}>
          <cylinderGeometry args={[2.5, 2.5, 7, 6]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.5} />
        </mesh>
      ))}
      <Container x={44} z={-40} color="#2d6a2d" />
      <Container x={51} z={-40} color="#6a2d2d" />
      <Container x={58} z={-43} rotY={Math.PI / 2} color="#2d4a6a" />
      <Container x={44} z={-45} color="#6a5a2d" />
      {/* Crane */}
      <mesh position={[65, 8, -50]}>
        <boxGeometry args={[2, 16, 2]} />
        <meshStandardMaterial color="#8a7a3a" metalness={0.4} />
      </mesh>
      <mesh position={[65, 16, -42]}>
        <boxGeometry args={[2, 1.5, 18]} />
        <meshStandardMaterial color="#8a7a3a" metalness={0.4} />
      </mesh>

      {/* ══ PRIMORSK — SW ═════════════════════════════════════════════════ */}
      <WalkableHouse x={-52} z={42} w={7} d={6}               color="#ddd0b5" />
      <WalkableHouse x={-42} z={42} w={8} d={6} hasSecondFloor color="#d4c8aa" />
      <WalkableHouse x={-52} z={52} w={7} d={7}               color="#d8cbb2" />
      <WalkableHouse x={-42} z={52} w={8} d={6}               color="#e0d4bc" />
      <WalkableHouse x={-58} z={58} w={7} d={6}               color="#d4c5a9" />
      <WalkableHouse x={-48} z={62} w={7} d={6}               color="#ccc0a5" />
      {/* Pier */}
      <mesh position={[-68, 0.3, 55]}>
        <boxGeometry args={[12, 0.6, 4]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>

      {/* ══ LIPOVKA — SE ══════════════════════════════════════════════════ */}
      <WalkableHouse x={52} z={50} w={10} d={8} hasSecondFloor color="#c8b090" />
      <WalkableHouse x={65} z={50} w={7}  d={6}               color="#d0b898" />
      {/* Barn */}
      <mesh position={[55, 4.5, 62]}>
        <boxGeometry args={[14, 9, 10]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[55, 9.4, 62]}>
        <boxGeometry args={[14.5, 1, 10.5]} />
        <meshStandardMaterial color="#6b3010" />
      </mesh>
      {/* Silo */}
      <mesh position={[65, 5, 62]}>
        <cylinderGeometry args={[2.5, 2.5, 10, 6]} />
        <meshStandardMaterial color="#c8c0a0" />
      </mesh>
      {/* Farm fence */}
      {[40,44,48,52,56,60,64,68].map((x,i) => (
        <mesh key={`ff${i}`} position={[x, 0.7, 42]}>
          <boxGeometry args={[3.5, 1.4, 0.2]} />
          <meshStandardMaterial color="#8b6914" />
        </mesh>
      ))}

      {/* ══ ROZHOK — CENTER EAST ══════════════════════════════════════════ */}
      <WalkableHouse x={32} z={-6} w={7} d={6}               color="#d0c8b0" />
      <WalkableHouse x={43} z={-6} w={8} d={6} hasSecondFloor color="#c8c0a5" />
      <WalkableHouse x={32} z={6}  w={7} d={6}               color="#d4ccb8" />
      <WalkableHouse x={43} z={6}  w={7} d={7}               color="#ccc4a8" />
      {/* Kiosks */}
      {[28, 34, 40].map((x,i) => (
        <mesh key={`ki${i}`} position={[x, 1.5, -14]}>
          <boxGeometry args={[5, 3, 4]} />
          <meshStandardMaterial color="#d0a870" />
        </mesh>
      ))}

      {/* ══ FERRY PIER — CENTER WEST ══════════════════════════════════════ */}
      <WalkableHouse x={-35} z={-6} w={7} d={6}               color="#d0ccb8" />
      <WalkableHouse x={-46} z={-6} w={8} d={6}               color="#c8c4aa" />
      <WalkableHouse x={-35} z={6}  w={7} d={6} hasSecondFloor color="#d4c8b0" />
      {/* Ferry terminal */}
      <mesh position={[-58, 2.5, 0]}>
        <boxGeometry args={[10, 5, 14]} />
        <meshStandardMaterial color="#c0b090" />
      </mesh>
      {/* Pier planks */}
      <mesh position={[-68, 0.3, 0]}>
        <boxGeometry args={[3, 0.6, 20]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>

      {/* ══ NOVOREPNOYE — SOUTH ═══════════════════════════════════════════ */}
      <WalkableHouse x={-10} z={42} w={7} d={6}               color="#d8ccb0" />
      <WalkableHouse x={2}   z={42} w={8} d={6} hasSecondFloor color="#d4c8ac" />
      <WalkableHouse x={14}  z={42} w={7} d={7}               color="#d0c4a8" />
      <WalkableHouse x={-10} z={54} w={7} d={6}               color="#ccc0a4" />
      <WalkableHouse x={4}   z={54} w={9} d={7}               color="#d8cbb0" />

      {/* ══ MID-MAP LANDMARKS ══════════════════════════════════════════════ */}
      {/* Gas station */}
      <mesh position={[0, 1.5, -30]}>
        <boxGeometry args={[10, 3, 6]} />
        <meshStandardMaterial color="#d8d0b8" />
      </mesh>
      <mesh position={[0, 3.5, -30]}>
        <boxGeometry args={[14, 0.3, 8]} />
        <meshStandardMaterial color="#8a9a8a" metalness={0.3} />
      </mesh>
      {/* Fuel pumps */}
      {[-3, 3].map((ox, i) => (
        <mesh key={i} position={[ox, 0.8, -27]}>
          <boxGeometry args={[0.6, 1.6, 0.4]} />
          <meshStandardMaterial color="#cc4444" />
        </mesh>
      ))}
      {/* Church */}
      <mesh position={[-22, 5, -22]}>
        <boxGeometry args={[8, 10, 8]} />
        <meshStandardMaterial color="#ddd8cc" />
      </mesh>
      <mesh position={[-22, 11.5, -22]}>
        <coneGeometry args={[3, 5, 4]} />
        <meshStandardMaterial color="#8a4a2a" />
      </mesh>
      <mesh position={[-22, 14.5, -22]}>
        <boxGeometry args={[0.3, 2, 0.3]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      {/* Water tower */}
      <mesh position={[22, 6, 30]}>
        <cylinderGeometry args={[2, 2, 6, 6]} />
        <meshStandardMaterial color="#c8b890" />
      </mesh>
      <mesh position={[22, 3, 30]}>
        <cylinderGeometry args={[0.2, 0.2, 6, 4]} />
        <meshStandardMaterial color="#888" />
      </mesh>

      {/* ══ PALM TREES — scattered around island ═══════════════════════════ */}
      {[
        [-20, -35], [20, -35], [-35, 0], [35, 0],
        [-60, 20], [60, 20], [-60, -20], [60, -20],
        [0, 30], [-15, 30], [15, 30],
        [-40, -65], [40, -65], [-40, 65], [40, 65],
        [-65, 35], [65, 35], [-65, -35], [65, -35],
        [5, -65], [-10, -65], [10, 60], [-8, 62],
        [70, 0], [-70, 0], [0, 70], [0, -70],
      ].map(([px, pz], i) => (
        <PalmTree key={i} x={px} z={pz} />
      ))}

      {/* ══ ROCKS ═════════════════════════════════════════════════════════ */}
      {[
        [-25, -55, 1.8], [25, -55, 1.5], [-55, -25, 2],
        [55, -25, 1.3], [-55, 25, 1.6], [55, 25, 2.2],
        [0, -68, 1.4], [-68, 0, 1.8], [68, 0, 1.5],
        [20, 60, 1.2], [-20, 60, 1.4],
      ].map(([px, pz, ps], i) => (
        <Rock key={i} x={px} z={pz} s={ps} />
      ))}

      {/* ══ LOOT PICKUPS ══════════════════════════════════════════════════ */}
      {BARMUDA_LOOT.map((item, i) => (
        <LootPickup key={`loot${i}`} item={item} index={i} />
      ))}

      {/* ══ ITEM PICKUPS (medkits, armor, etc) ═══════════════════════════ */}
      {BARMUDA_ITEMS.map((item, i) => (
        <ItemPickup key={`item${i}`} item={item} index={i} />
      ))}

      {/* ══ HELICOPTER ═════════════════════════════════════════════════════ */}
      <Helicopter dropping={barmudaDropping} />

      {/* ── AMBIENT LIGHTING ────────────────────────────────────────────── */}
      <ambientLight intensity={0.55} color="#e8f0ff" />
      <directionalLight
        position={[40, 80, 30]}
        intensity={1.8}
        color="#fff8e0"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <hemisphereLight args={["#87ceeb", "#4a8a38", 0.4]} />
    </group>
  );
}
