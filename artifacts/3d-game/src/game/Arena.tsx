import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * MAP: "Operation Highlands" - outdoor multi-level compound
 * Format: [cx, cy, cz,  w, h, d]
 *   cy = center Y  →  top = cy + h/2
 *
 * Level 1 platforms: top ≈ 1.2  (cy=0.6, h=1.2) — jump from ground ✓
 * Level 2 platforms: top ≈ 2.4  (cy=1.8, h=1.2) — jump from L1 ✓
 * Level 3 platforms: top ≈ 3.6  (cy=3.0, h=1.2) — jump from L2 ✓
 * Sniper towers:     top ≈ 5.0  (cy=4.4, h=1.2) — jump from L3 ✓
 *
 * Jump physics: v²/(2g) = 81/44 ≈ 1.84m max height per jump
 */

const MAP_OBJECTS: [number, number, number, number, number, number][] = [
  // ─── OUTER BOUNDARY WALLS ───────────────────────────────────────────
  [0,   3, -28,  58, 6, 1.2],
  [0,   3,  28,  58, 6, 1.2],
  [28,  3,   0, 1.2, 6,  58],
  [-28, 3,   0, 1.2, 6,  58],

  // ─── CORNER SNIPER TOWERS (top ≈ 5) ─────────────────────────────────
  [-22, 2.5, -22, 6, 5, 6],
  [ 22, 2.5, -22, 6, 5, 6],
  [-22, 2.5,  22, 6, 5, 6],
  [ 22, 2.5,  22, 6, 5, 6],

  // ─── STAIRCASE TO NW TOWER ─────────────────────────────────────────
  [-13, 0.6, -13, 3.5, 1.2, 3.5],   // L1 step
  [-16, 1.8, -16, 3.5, 1.2, 3.5],   // L2 step
  [-19, 3.0, -19, 3.5, 1.2, 3.5],   // L3 step → jump to tower top (top=5)

  // ─── STAIRCASE TO NE TOWER ─────────────────────────────────────────
  [ 13, 0.6, -13, 3.5, 1.2, 3.5],
  [ 16, 1.8, -16, 3.5, 1.2, 3.5],
  [ 19, 3.0, -19, 3.5, 1.2, 3.5],

  // ─── STAIRCASE TO SW TOWER ─────────────────────────────────────────
  [-13, 0.6,  13, 3.5, 1.2, 3.5],
  [-16, 1.8,  16, 3.5, 1.2, 3.5],
  [-19, 3.0,  19, 3.5, 1.2, 3.5],

  // ─── STAIRCASE TO SE TOWER ─────────────────────────────────────────
  [ 13, 0.6,  13, 3.5, 1.2, 3.5],
  [ 16, 1.8,  16, 3.5, 1.2, 3.5],
  [ 19, 3.0,  19, 3.5, 1.2, 3.5],

  // ─── CENTER ELEVATED PLATFORM (top=2.4) ────────────────────────────
  [0, 1.8, 0, 7, 1.2, 7],           // top = 2.4
  // Approach steps to center:
  [-5, 0.6, 0, 3, 1.2, 3],          // west L1
  [ 5, 0.6, 0, 3, 1.2, 3],          // east L1
  [0, 0.6, -5, 3, 1.2, 3],          // north L1
  [0, 0.6,  5, 3, 1.2, 3],          // south L1

  // ─── NORTH BUNKER (solid building, top=3) ──────────────────────────
  [0, 1.5, -18, 8, 3, 6],           // main building body top=3
  [-5, 0.6, -15, 3, 1.2, 3],        // approach L1
  [ 5, 0.6, -15, 3, 1.2, 3],        // approach L1
  [-5, 1.8, -17, 3, 1.2, 3],        // approach L2 → jump to roof at 3

  // ─── SOUTH BUNKER ──────────────────────────────────────────────────
  [0, 1.5,  18, 8, 3, 6],
  [-5, 0.6,  15, 3, 1.2, 3],
  [ 5, 0.6,  15, 3, 1.2, 3],
  [ 5, 1.8,  17, 3, 1.2, 3],

  // ─── WEST CORRIDOR (elevated walkway, top=2.4) ─────────────────────
  [-14, 1.8, 0, 2, 1.2, 10],        // walkway platform
  [-14, 0.6, 5, 2, 1.2, 2],         // step up S
  [-14, 0.6,-5, 2, 1.2, 2],         // step up N

  // ─── EAST CORRIDOR ─────────────────────────────────────────────────
  [14, 1.8, 0, 2, 1.2, 10],
  [14, 0.6, 5, 2, 1.2, 2],
  [14, 0.6,-5, 2, 1.2, 2],

  // ─── GROUND COVER (low walls, h=1.2, can't climb but blocks bullets) ─
  [-8,  0.6, -8, 1, 1.2, 4],
  [ 8,  0.6, -8, 1, 1.2, 4],
  [-8,  0.6,  8, 1, 1.2, 4],
  [ 8,  0.6,  8, 1, 1.2, 4],
  [0,   0.6, -20, 4, 1.2, 1],
  [0,   0.6,  20, 4, 1.2, 1],
  [-20, 0.6,  0, 1, 1.2, 4],
  [ 20, 0.6,  0, 1, 1.2, 4],

  // ─── SCATTERED CRATES ──────────────────────────────────────────────
  [-10, 0.5,  2, 1.5, 1, 1.5],
  [ 10, 0.5, -2, 1.5, 1, 1.5],
  [-3,  0.5,-10, 1.5, 1, 1.5],
  [ 3,  0.5, 10, 1.5, 1, 1.5],
];

// Build collision boxes — proper center-based min/max for all axes
export const ARENA_BOXES = MAP_OBJECTS.map(([cx, cy, cz, w, h, d]) => ({
  position: new THREE.Vector3(cx, cy, cz),
  size: new THREE.Vector3(w, h, d),
  min: new THREE.Vector3(cx - w / 2, cy - h / 2, cz - d / 2),
  max: new THREE.Vector3(cx + w / 2, cy + h / 2, cz + d / 2),
}));

export const ARENA_BOUNDS = 27;

function FlickerLight({
  position, color, baseIntensity, flickerSpeed = 1,
}: {
  position: [number, number, number]; color: string; baseIntensity: number; flickerSpeed?: number;
}) {
  const ref = useRef<THREE.PointLight>(null!);
  const offset = useRef(Math.random() * 100);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * flickerSpeed + offset.current;
    ref.current.intensity = baseIntensity + Math.sin(t * 3.7) * 0.08 + Math.sin(t * 11.3) * 0.04;
  });
  return <pointLight ref={ref} position={position} color={color} intensity={baseIntensity} distance={18} decay={2} />;
}

export default function Arena() {
  const wallGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3a4030, roughness: 0.95, metalness: 0.02,
  }), []);

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3e3830, roughness: 0.85, metalness: 0.1,
  }), []);

  const towerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x2a3228, roughness: 0.75, metalness: 0.18,
  }), []);

  const stepMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x4a4238, roughness: 0.88, metalness: 0.08,
  }), []);

  const walkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x282e26, roughness: 0.78, metalness: 0.22,
  }), []);

  const coverMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x4e3c28, roughness: 0.85, metalness: 0.05,
  }), []);

  const getMat = (i: number) => {
    if (i < 4) return wallMat;       // outer walls
    if (i < 8) return towerMat;      // corner towers
    if (i < 20) return stepMat;      // staircases
    if (i < 24) return towerMat;     // center platform
    if (i < 28) return stepMat;      // center steps
    if (i < 34) return walkMat;      // bunkers
    if (i < 38) return walkMat;      // corridors
    return coverMat;                 // cover + crates
  };

  return (
    <group>
      {/* ─── SKY ─── */}
      <color attach="background" args={["#1a2232"]} />
      <fog attach="fog" args={["#1a2232", 40, 100]} />

      {/* ─── GROUND ─── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 40, 40]} />
        <primitive object={floorMat} />
      </mesh>

      {/* Ground detail pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[58, 58, 28, 28]} />
        <meshBasicMaterial color={0x252c22} wireframe transparent opacity={0.06} />
      </mesh>

      {/* Center marker */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.0, 2.3, 32]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.3} />
      </mesh>

      {/* ─── ALL MAP OBJECTS ─── */}
      {MAP_OBJECTS.map(([cx, cy, cz, w, h, d], i) => (
        <group key={i}>
          <mesh
            geometry={wallGeom}
            material={getMat(i)}
            position={[cx, cy, cz]}
            scale={[w, h, d]}
            castShadow
            receiveShadow
          />
          {/* Top edge accent on climbable platforms */}
          {i >= 8 && i < 44 && (
            <mesh
              position={[cx, cy + h / 2, cz]}
              scale={[w + 0.04, 0.06, d + 0.04]}
            >
              <boxGeometry />
              <meshStandardMaterial color="#3a4a38" metalness={0.5} roughness={0.4} emissive="#2a3a28" emissiveIntensity={0.2} />
            </mesh>
          )}
        </group>
      ))}

      {/* ─── LIGHTING ─── */}
      <ambientLight intensity={0.45} color="#8899aa" />

      {/* Moon-like directional (cool outdoor light) */}
      <directionalLight
        position={[10, 35, 15]}
        intensity={1.4}
        color="#ddeeff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0008}
      />

      {/* Warm fill from opposite side */}
      <directionalLight position={[-12, 18, -18]} intensity={0.5} color="#ffcc88" />

      {/* Tower spotlights */}
      <FlickerLight position={[-22, 6, -22]} color="#4488ff" baseIntensity={2.2} flickerSpeed={0.4} />
      <FlickerLight position={[ 22, 6, -22]} color="#4488ff" baseIntensity={2.2} flickerSpeed={0.6} />
      <FlickerLight position={[-22, 6,  22]} color="#4488ff" baseIntensity={2.2} flickerSpeed={0.5} />
      <FlickerLight position={[ 22, 6,  22]} color="#4488ff" baseIntensity={2.2} flickerSpeed={0.7} />

      {/* Center combat zone light */}
      <FlickerLight position={[0, 5, 0]} color="#ff6622" baseIntensity={1.8} flickerSpeed={1.0} />

      {/* North/South area lights */}
      <pointLight position={[0, 5, -18]} color="#ffe8aa" intensity={3} distance={20} decay={2} />
      <pointLight position={[0, 5,  18]} color="#ffe8aa" intensity={3} distance={20} decay={2} />
      <pointLight position={[-14, 4, 0]} color="#88ccff" intensity={2} distance={14} decay={2} />
      <pointLight position={[ 14, 4, 0]} color="#88ccff" intensity={2} distance={14} decay={2} />

      {/* Stars (simple instanced points) */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        const r = 46 + (i % 4) * 4;
        const h2 = 22 + (i % 5) * 5;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, h2, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.15, 3, 3]} />
            <meshBasicMaterial color="#e8eeff" />
          </mesh>
        );
      })}
    </group>
  );
}
