import * as THREE from "three";
import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { sharedArena } from "./arenaShared";

/**
 * MAP: "BGMK" — Boot Ground Military Kompound
 * Inspired by PUBG Bootcamp-style compound.
 * Central large warehouse, shipping containers, small outbuildings, compound walls.
 *
 * Format: [cx, cy, cz,  w, h, d]
 */

const MAP_OBJECTS: [number, number, number, number, number, number][] = [
  // ─── OUTER COMPOUND WALLS ─────────────────────────────────────────────────
  [0,    2,  -31, 58, 4, 1.5],   // North wall
  [0,    2,   31, 58, 4, 1.5],   // South wall
  [-30,  2,    0, 1.5, 4, 62],   // West wall
  [30,   2,    0, 1.5, 4, 62],   // East wall
  // Corner angled walls (cutting corners for hexagonal feel)
  [-22,  2,  -26, 16, 4, 1.5],   // NW angled
  [22,   2,  -26, 16, 4, 1.5],   // NE angled
  [-22,  2,   26, 16, 4, 1.5],   // SW angled
  [22,   2,   26, 16, 4, 1.5],   // SE angled

  // ─── MAIN WAREHOUSE BUILDING (CENTER) ─────────────────────────────────────
  // North wall (split for doorway gap in middle)
  [-6.5, 3.5, -6.5, 7, 7, 1],   // NW wall section
  [6.5,  3.5, -6.5, 7, 7, 1],   // NE wall section
  // South wall (split for doorway)
  [-6.5, 3.5,  6.5, 7, 7, 1],   // SW wall section
  [6.5,  3.5,  6.5, 7, 7, 1],   // SE wall section
  // West wall (full)
  [-9.5, 3.5,  0, 1, 7, 13],    // West wall
  // East wall (full)
  [9.5,  3.5,  0, 1, 7, 13],    // East wall
  // Roof (solid slab — players can stand on top of building)
  [0,    7.5,  0, 19, 1, 13],   // Main roof
  // Roof raised ridge (center spine)
  [0,    8.5,  0, 12, 1, 4],    // Roof ridge

  // Interior dividing wall (inside warehouse, creates two rooms)
  [0,   2.5,  0, 1, 5, 8],      // Interior wall
  // Interior raised platform (floor level 1.2)
  [0,   0.6,  0, 5, 1.2, 5],    // Platform inside

  // ─── SMALL BUILDING — NORTH (just above main building) ────────────────────
  [0,   1.8, -20, 10, 3.6, 7],  // North outbuilding
  // Ramp/step up to north building roof
  [-3,  0.6, -17, 3, 1.2, 2],
  [3,   0.6, -17, 3, 1.2, 2],
  [-3,  1.8, -19, 3, 1.2, 2],

  // ─── SMALL BUILDING — SOUTH ───────────────────────────────────────────────
  [0,   1.8,  20, 10, 3.6, 7],  // South outbuilding
  [3,   0.6,  17, 3, 1.2, 2],
  [-3,  0.6,  17, 3, 1.2, 2],

  // ─── CORNER OUTBUILDINGS ──────────────────────────────────────────────────
  // NW corner compound building
  [-21, 1.8, -22, 9, 3.6, 7],
  // NE corner
  [21,  1.8, -22, 9, 3.6, 7],
  // SW corner
  [-21, 1.8,  22, 9, 3.6, 7],
  // SE corner
  [21,  1.8,  22, 9, 3.6, 7],

  // ─── WEST SIDE LEAN-TO SHED ───────────────────────────────────────────────
  [-22, 1.5,  3, 5, 3, 9],
  // EAST SIDE SHED
  [22,  1.5,  3, 5, 3, 9],

  // ─── SHIPPING CONTAINERS (h=2.5, jumpable) ────────────────────────────────
  // West cluster
  [-16, 1.25, -4, 2.5, 2.5, 7],   // vertical container W
  [-16, 1.25,  5, 7, 2.5, 2.5],   // horizontal container W
  // East cluster
  [16,  1.25, -4, 2.5, 2.5, 7],   // vertical E
  [16,  1.25,  5, 7, 2.5, 2.5],   // horizontal E
  // North area containers
  [-5,  1.25, -14, 7, 2.5, 2.5],  // NW approach
  [5,   1.25, -14, 7, 2.5, 2.5],  // NE approach
  // South containers
  [-5,  1.25,  14, 7, 2.5, 2.5],
  [5,   1.25,  14, 7, 2.5, 2.5],
  // Single containers near main building
  [-13, 1.25,  0, 2.5, 2.5, 4],
  [13,  1.25,  0, 2.5, 2.5, 4],

  // ─── STACKED LOGS / TIMBER PILES ──────────────────────────────────────────
  [-24, 0.5,  -8, 6, 1, 1.5],
  [24,  0.5,  -8, 6, 1, 1.5],
  [-24, 0.5,  14, 6, 1, 1.5],
  [24,  0.5,  14, 6, 1, 1.5],

  // ─── LOW BARRICADES / SANDBAGS ────────────────────────────────────────────
  [-11, 0.5, -10, 4, 1, 1],
  [11,  0.5, -10, 4, 1, 1],
  [-11, 0.5,  10, 4, 1, 1],
  [11,  0.5,  10, 4, 1, 1],
  // Near compound wall barricades
  [-6,  0.5, -26, 3, 1, 1],
  [6,   0.5, -26, 3, 1, 1],
  [-6,  0.5,  26, 3, 1, 1],
  [6,   0.5,  26, 3, 1, 1],

  // ─── SCATTERED CRATES ─────────────────────────────────────────────────────
  [-4,  0.5, -11, 1.5, 1, 1.5],
  [4,   0.5, -11, 1.5, 1, 1.5],
  [-4,  0.5,  11, 1.5, 1, 1.5],
  [4,   0.5,  11, 1.5, 1, 1.5],
  [0,   0.5, -25, 2, 1, 1.5],
  [0,   0.5,  25, 2, 1, 1.5],
  [-27, 0.5,   0, 1.5, 1, 2],
  [27,  0.5,   0, 1.5, 1, 2],
];

export const ARENA_BOXES_BGMK = MAP_OBJECTS.map(([cx, cy, cz, w, h, d]) => ({
  position: new THREE.Vector3(cx, cy, cz),
  size: new THREE.Vector3(w, h, d),
  min: new THREE.Vector3(cx - w / 2, cy - h / 2, cz - d / 2),
  max: new THREE.Vector3(cx + w / 2, cy + h / 2, cz + d / 2),
}));

export const ARENA_BOUNDS_BGMK = 29;

function SwayingTree({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null!);
  const offset = useRef(Math.random() * 10);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.4 + offset.current;
    ref.current.rotation.z = Math.sin(t) * 0.025;
    ref.current.rotation.x = Math.cos(t * 0.7) * 0.015;
  });
  return (
    <group ref={ref} position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 3, 6]} />
        <meshStandardMaterial color="#4a3020" roughness={1} />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 4.2, 0]}>
        <coneGeometry args={[1.8, 3.5, 7]} />
        <meshStandardMaterial color="#1e4a1a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <coneGeometry args={[1.2, 2.5, 7]} />
        <meshStandardMaterial color="#255220" roughness={0.95} />
      </mesh>
      <mesh position={[0, 6.5, 0]}>
        <coneGeometry args={[0.7, 2, 7]} />
        <meshStandardMaterial color="#2a6024" roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function Arena4() {
  useEffect(() => {
    sharedArena.boxes = ARENA_BOXES_BGMK;
    sharedArena.bounds = ARENA_BOUNDS_BGMK;
  }, []);

  const wallGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // Materials
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3a5c28, roughness: 0.98, metalness: 0,
  }), []);
  const dirtMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x7a6040, roughness: 0.97, metalness: 0,
  }), []);
  const concreteWallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x7a7a72, roughness: 0.9, metalness: 0.05,
  }), []);
  const warehouseWallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x5a3820, roughness: 0.85, metalness: 0.1,
  }), []);
  const rustRoofMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x7a3010, roughness: 0.8, metalness: 0.25,
  }), []);
  const containerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x4a5c38, roughness: 0.85, metalness: 0.12,
  }), []);
  const containerMat2 = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x7a5a28, roughness: 0.85, metalness: 0.12,
  }), []);
  const outbuildMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3a2c1a, roughness: 0.9, metalness: 0.05,
  }), []);
  const crateMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x8a7040, roughness: 0.9, metalness: 0.05,
  }), []);
  const barrMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x888068, roughness: 0.9, metalness: 0,
  }), []);
  const logMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x6a4a28, roughness: 1, metalness: 0,
  }), []);

  function Box({ obj, mat }: {
    obj: [number, number, number, number, number, number];
    mat: THREE.Material;
  }) {
    const [cx, cy, cz, w, h, d] = obj;
    return (
      <mesh position={[cx, cy, cz]} geometry={wallGeom} material={mat} castShadow receiveShadow
        scale={[w, h, d]} />
    );
  }

  return (
    <group>
      {/* ─── LIGHTING ────────────────────────────────────────────────── */}
      <ambientLight intensity={0.55} color="#c8d8b0" />
      <directionalLight
        position={[20, 40, 15]}
        intensity={1.4}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.001}
      />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#ffeecc" distance={25} decay={2} />
      <pointLight position={[-20, 5, -20]} intensity={0.2} color="#aaccaa" distance={20} decay={2} />
      <pointLight position={[20, 5, 20]} intensity={0.2} color="#aaccaa" distance={20} decay={2} />

      {/* ─── GROUND PLANES ───────────────────────────────────────────── */}
      {/* Outer grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <primitive object={groundMat} />
      </mesh>
      {/* Inner compound dirt floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[58, 60]} />
        <primitive object={dirtMat} />
      </mesh>
      {/* Courtyard around main building (slightly lighter) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color={0x6a5030} roughness={0.98} />
      </mesh>

      {/* ─── OUTER COMPOUND WALLS ────────────────────────────────────── */}
      {/* North wall */}
      <Box obj={[0, 2, -31, 58, 4, 1.5]} mat={concreteWallMat} />
      {/* South wall */}
      <Box obj={[0, 2, 31, 58, 4, 1.5]} mat={concreteWallMat} />
      {/* West wall */}
      <Box obj={[-30, 2, 0, 1.5, 4, 62]} mat={concreteWallMat} />
      {/* East wall */}
      <Box obj={[30, 2, 0, 1.5, 4, 62]} mat={concreteWallMat} />
      {/* Corner angled walls */}
      <Box obj={[-22, 2, -26, 16, 4, 1.5]} mat={concreteWallMat} />
      <Box obj={[22, 2, -26, 16, 4, 1.5]} mat={concreteWallMat} />
      <Box obj={[-22, 2, 26, 16, 4, 1.5]} mat={concreteWallMat} />
      <Box obj={[22, 2, 26, 16, 4, 1.5]} mat={concreteWallMat} />

      {/* ─── MAIN WAREHOUSE ──────────────────────────────────────────── */}
      {/* North wall NW section */}
      <Box obj={[-6.5, 3.5, -6.5, 7, 7, 1]} mat={warehouseWallMat} />
      {/* North wall NE section */}
      <Box obj={[6.5, 3.5, -6.5, 7, 7, 1]} mat={warehouseWallMat} />
      {/* South wall SW */}
      <Box obj={[-6.5, 3.5, 6.5, 7, 7, 1]} mat={warehouseWallMat} />
      {/* South wall SE */}
      <Box obj={[6.5, 3.5, 6.5, 7, 7, 1]} mat={warehouseWallMat} />
      {/* West wall */}
      <Box obj={[-9.5, 3.5, 0, 1, 7, 13]} mat={warehouseWallMat} />
      {/* East wall */}
      <Box obj={[9.5, 3.5, 0, 1, 7, 13]} mat={warehouseWallMat} />
      {/* Main roof */}
      <Box obj={[0, 7.5, 0, 19, 1, 13]} mat={rustRoofMat} />
      {/* Roof ridge */}
      <Box obj={[0, 8.5, 0, 12, 1, 4]} mat={rustRoofMat} />
      {/* Interior dividing wall */}
      <Box obj={[0, 2.5, 0, 1, 5, 8]} mat={warehouseWallMat} />
      {/* Interior platform */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 1.2, 5]} />
        <meshStandardMaterial color={0x5a4030} roughness={0.9} />
      </mesh>
      {/* Door frame markers (dark strips for visual doorways) */}
      <mesh position={[0, 2, -6.5]}>
        <boxGeometry args={[3, 4, 0.2]} />
        <meshStandardMaterial color={0x1a1008} roughness={1} />
      </mesh>
      <mesh position={[0, 2, 6.5]}>
        <boxGeometry args={[3, 4, 0.2]} />
        <meshStandardMaterial color={0x1a1008} roughness={1} />
      </mesh>

      {/* ─── NORTH OUTBUILDING ───────────────────────────────────────── */}
      <Box obj={[0, 1.8, -20, 10, 3.6, 7]} mat={outbuildMat} />
      <mesh position={[0, 4, -20]}>
        <boxGeometry args={[10, 0.5, 7]} />
        <primitive object={rustRoofMat} />
      </mesh>
      <Box obj={[-3, 0.6, -17, 3, 1.2, 2]} mat={crateMat} />
      <Box obj={[3, 0.6, -17, 3, 1.2, 2]} mat={crateMat} />
      <Box obj={[-3, 1.8, -19, 3, 1.2, 2]} mat={crateMat} />

      {/* ─── SOUTH OUTBUILDING ───────────────────────────────────────── */}
      <Box obj={[0, 1.8, 20, 10, 3.6, 7]} mat={outbuildMat} />
      <mesh position={[0, 4, 20]}>
        <boxGeometry args={[10, 0.5, 7]} />
        <primitive object={rustRoofMat} />
      </mesh>
      <Box obj={[3, 0.6, 17, 3, 1.2, 2]} mat={crateMat} />
      <Box obj={[-3, 0.6, 17, 3, 1.2, 2]} mat={crateMat} />

      {/* ─── CORNER BUILDINGS ────────────────────────────────────────── */}
      <Box obj={[-21, 1.8, -22, 9, 3.6, 7]} mat={outbuildMat} />
      <mesh position={[-21, 3.8, -22]}>
        <boxGeometry args={[9, 0.5, 7]} />
        <primitive object={rustRoofMat} />
      </mesh>

      <Box obj={[21, 1.8, -22, 9, 3.6, 7]} mat={outbuildMat} />
      <mesh position={[21, 3.8, -22]}>
        <boxGeometry args={[9, 0.5, 7]} />
        <primitive object={rustRoofMat} />
      </mesh>

      <Box obj={[-21, 1.8, 22, 9, 3.6, 7]} mat={outbuildMat} />
      <mesh position={[-21, 3.8, 22]}>
        <boxGeometry args={[9, 0.5, 7]} />
        <primitive object={rustRoofMat} />
      </mesh>

      <Box obj={[21, 1.8, 22, 9, 3.6, 7]} mat={outbuildMat} />
      <mesh position={[21, 3.8, 22]}>
        <boxGeometry args={[9, 0.5, 7]} />
        <primitive object={rustRoofMat} />
      </mesh>

      {/* ─── SIDE SHEDS ──────────────────────────────────────────────── */}
      <Box obj={[-22, 1.5, 3, 5, 3, 9]} mat={outbuildMat} />
      <Box obj={[22, 1.5, 3, 5, 3, 9]} mat={outbuildMat} />

      {/* ─── SHIPPING CONTAINERS ─────────────────────────────────────── */}
      <Box obj={[-16, 1.25, -4, 2.5, 2.5, 7]} mat={containerMat} />
      <Box obj={[-16, 1.25, 5, 7, 2.5, 2.5]} mat={containerMat2} />
      <Box obj={[16, 1.25, -4, 2.5, 2.5, 7]} mat={containerMat} />
      <Box obj={[16, 1.25, 5, 7, 2.5, 2.5]} mat={containerMat2} />
      <Box obj={[-5, 1.25, -14, 7, 2.5, 2.5]} mat={containerMat2} />
      <Box obj={[5, 1.25, -14, 7, 2.5, 2.5]} mat={containerMat} />
      <Box obj={[-5, 1.25, 14, 7, 2.5, 2.5]} mat={containerMat} />
      <Box obj={[5, 1.25, 14, 7, 2.5, 2.5]} mat={containerMat2} />
      <Box obj={[-13, 1.25, 0, 2.5, 2.5, 4]} mat={containerMat} />
      <Box obj={[13, 1.25, 0, 2.5, 2.5, 4]} mat={containerMat2} />

      {/* Container stripe details */}
      {([-16, 16] as number[]).map((x) => (
        <mesh key={x} position={[x, 1.25, -4]}>
          <boxGeometry args={[0.05, 2.5, 7.05]} />
          <meshStandardMaterial color={0x2a3a20} roughness={0.9} />
        </mesh>
      ))}

      {/* ─── LOGS / TIMBER PILES ─────────────────────────────────────── */}
      <Box obj={[-24, 0.5, -8, 6, 1, 1.5]} mat={logMat} />
      <Box obj={[24, 0.5, -8, 6, 1, 1.5]} mat={logMat} />
      <Box obj={[-24, 0.5, 14, 6, 1, 1.5]} mat={logMat} />
      <Box obj={[24, 0.5, 14, 6, 1, 1.5]} mat={logMat} />

      {/* ─── BARRICADES / SANDBAGS ───────────────────────────────────── */}
      <Box obj={[-11, 0.5, -10, 4, 1, 1]} mat={barrMat} />
      <Box obj={[11, 0.5, -10, 4, 1, 1]} mat={barrMat} />
      <Box obj={[-11, 0.5, 10, 4, 1, 1]} mat={barrMat} />
      <Box obj={[11, 0.5, 10, 4, 1, 1]} mat={barrMat} />
      <Box obj={[-6, 0.5, -26, 3, 1, 1]} mat={barrMat} />
      <Box obj={[6, 0.5, -26, 3, 1, 1]} mat={barrMat} />
      <Box obj={[-6, 0.5, 26, 3, 1, 1]} mat={barrMat} />
      <Box obj={[6, 0.5, 26, 3, 1, 1]} mat={barrMat} />

      {/* ─── SCATTERED CRATES ────────────────────────────────────────── */}
      <Box obj={[-4, 0.5, -11, 1.5, 1, 1.5]} mat={crateMat} />
      <Box obj={[4, 0.5, -11, 1.5, 1, 1.5]} mat={crateMat} />
      <Box obj={[-4, 0.5, 11, 1.5, 1, 1.5]} mat={crateMat} />
      <Box obj={[4, 0.5, 11, 1.5, 1, 1.5]} mat={crateMat} />
      <Box obj={[0, 0.5, -25, 2, 1, 1.5]} mat={crateMat} />
      <Box obj={[0, 0.5, 25, 2, 1, 1.5]} mat={crateMat} />
      <Box obj={[-27, 0.5, 0, 1.5, 1, 2]} mat={crateMat} />
      <Box obj={[27, 0.5, 0, 1.5, 1, 2]} mat={crateMat} />

      {/* ─── TREES (outside compound) ─────────────────────────────────── */}
      {/* North trees */}
      <SwayingTree position={[-15, 0, -40]} />
      <SwayingTree position={[0,  0, -42]} />
      <SwayingTree position={[15, 0, -40]} />
      <SwayingTree position={[-30, 0, -38]} />
      <SwayingTree position={[30, 0, -38]} />
      {/* South trees */}
      <SwayingTree position={[-15, 0, 40]} />
      <SwayingTree position={[0,  0, 42]} />
      <SwayingTree position={[15, 0, 40]} />
      <SwayingTree position={[-30, 0, 38]} />
      <SwayingTree position={[30, 0, 38]} />
      {/* East/West trees */}
      <SwayingTree position={[-42, 0, -15]} />
      <SwayingTree position={[-42, 0, 0]} />
      <SwayingTree position={[-42, 0, 15]} />
      <SwayingTree position={[42, 0, -15]} />
      <SwayingTree position={[42, 0, 0]} />
      <SwayingTree position={[42, 0, 15]} />
      {/* Corner clusters */}
      <SwayingTree position={[-38, 0, -35]} />
      <SwayingTree position={[38, 0, -35]} />
      <SwayingTree position={[-38, 0, 35]} />
      <SwayingTree position={[38, 0, 35]} />

      {/* ─── GRASS TUFTS (decorative patches) ───────────────────────── */}
      {[[-35,-20],[-40,10],[35,22],[38,-12],[-20,45],[18,45]] .map(([gx, gz], i) => (
        <mesh key={i} position={[gx, 0.02, gz]} rotation={[-Math.PI/2, 0, Math.random()]}>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color={0x2a5018} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
