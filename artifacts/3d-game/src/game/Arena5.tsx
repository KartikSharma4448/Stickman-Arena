import { useEffect } from "react";
import * as THREE from "three";
import { sharedArena } from "./arenaShared";

// ══════════════════════════════════════════════════════════════════════════
// BARMUDA MAP — 150×150 — Free Fire Bermuda style — 30 players
// ══════════════════════════════════════════════════════════════════════════

// Pre-computed collision boxes (module level, computed once)
export const BARMUDA_BOXES: Array<{
  cx: number; cy: number; cz: number; w: number; h: number; d: number;
}> = [
  // ── Border walls ────────────────────────────────────────────────────────
  { cx:   0, cy: 4, cz: -75, w: 150, h: 8, d: 1 },
  { cx:   0, cy: 4, cz:  75, w: 150, h: 8, d: 1 },
  { cx: -75, cy: 4, cz:   0, w:   1, h: 8, d: 150 },
  { cx:  75, cy: 4, cz:   0, w:   1, h: 8, d: 150 },
  // ── POCHINKI houses (center) ─────────────────────────────────────────────
  { cx: -10, cy: 1.75, cz:  -8, w:  8, h: 3.5, d: 7 },
  { cx:   2, cy: 1.75, cz:  -8, w:  7, h: 3.5, d: 6 },
  { cx:  14, cy: 1.75, cz:  -8, w:  8, h: 3.5, d: 7 },
  { cx: -10, cy: 1.75, cz:   4, w:  7, h: 3.5, d: 6 },
  { cx:   2, cy: 2.25, cz:   4, w:  9, h: 4.5, d: 7 },  // 2-story
  { cx:  14, cy: 1.75, cz:   4, w:  7, h: 3.5, d: 6 },
  { cx: -10, cy: 1.75, cz:  14, w:  8, h: 3.5, d: 6 },
  { cx:   4, cy: 1.75, cz:  14, w:  7, h: 3.5, d: 6 },
  { cx:  15, cy: 1.75, cz:  14, w:  7, h: 3.5, d: 7 },
  { cx:  -2, cy: 1.5,  cz: -18, w: 28, h: 3.0, d: 5 },  // town shops
  // ── SCHOOL (north) ──────────────────────────────────────────────────────
  { cx:   0, cy: 4,    cz: -52, w: 24, h: 8,   d: 12 },
  { cx:  16, cy: 4,    cz: -56, w:  8, h: 8,   d: 20 },
  // ── MILITARY BASE (NW) ──────────────────────────────────────────────────
  { cx: -52, cy: 3.5,  cz: -50, w: 16, h: 7,   d: 12 },
  { cx: -36, cy: 3,    cz: -50, w: 12, h: 6,   d: 10 },
  { cx: -52, cy: 2.5,  cz: -35, w: 10, h: 5,   d:  8 },
  { cx: -42, cy: 1.5,  cz: -40, w:  8, h: 3,   d:  6 },  // bunker
  { cx: -62, cy: 5,    cz: -60, w:  3, h: 10,  d:  3 },  // watchtower
  { cx: -32, cy: 5,    cz: -60, w:  3, h: 10,  d:  3 },
  // ── GEORGOPOL (NE industrial) ────────────────────────────────────────────
  { cx:  52, cy: 4,    cz: -48, w: 18, h: 8,   d: 14 },
  { cx:  35, cy: 3.5,  cz: -52, w: 12, h: 7,   d: 10 },
  { cx:  58, cy: 3.5,  cz: -35, w:  5, h: 7,   d:  5 },  // storage tank 1
  { cx:  62, cy: 3.5,  cz: -35, w:  5, h: 7,   d:  5 },  // storage tank 2
  { cx:  58, cy: 3.5,  cz: -40, w:  5, h: 7,   d:  5 },  // storage tank 3
  { cx:  62, cy: 3.5,  cz: -40, w:  5, h: 7,   d:  5 },  // storage tank 4
  { cx:  44, cy: 1.4,  cz: -40, w:  6, h: 2.8, d: 2.4 }, // container
  { cx:  51, cy: 1.4,  cz: -40, w:  6, h: 2.8, d: 2.4 },
  { cx:  58, cy: 1.4,  cz: -40, w: 2.4,h: 2.8, d:  6 },
  { cx:  65, cy: 8,    cz: -50, w:  2, h: 16,  d:  2 },  // crane
  // ── PRIMORSK (SW coastal) ────────────────────────────────────────────────
  { cx: -52, cy: 1.75, cz:  42, w:  7, h: 3.5, d:  6 },
  { cx: -42, cy: 1.75, cz:  42, w:  8, h: 3.5, d:  6 },
  { cx: -52, cy: 1.75, cz:  52, w:  7, h: 3.5, d:  7 },
  { cx: -42, cy: 1.75, cz:  52, w:  8, h: 3.5, d:  6 },
  { cx: -58, cy: 1.75, cz:  58, w:  7, h: 3.5, d:  6 },
  { cx: -48, cy: 1.75, cz:  62, w:  7, h: 3.5, d:  6 },
  // ── LIPOVKA (SE farm) ────────────────────────────────────────────────────
  { cx:  52, cy: 2.25, cz:  50, w: 10, h: 4.5, d:  8 },  // 2-story farmhouse
  { cx:  65, cy: 1.75, cz:  50, w:  7, h: 3.5, d:  6 },
  { cx:  55, cy: 4.5,  cz:  62, w: 14, h: 9,   d: 10 },  // barn
  { cx:  65, cy: 5,    cz:  62, w:  5, h: 10,  d:  5 },  // silo
  // ── ROZHOK (center-east) ─────────────────────────────────────────────────
  { cx:  32, cy: 1.75, cz:  -6, w:  7, h: 3.5, d:  6 },
  { cx:  43, cy: 1.75, cz:  -6, w:  8, h: 3.5, d:  6 },
  { cx:  32, cy: 1.75, cz:   6, w:  7, h: 3.5, d:  6 },
  { cx:  43, cy: 1.75, cz:   6, w:  7, h: 3.5, d:  7 },
  // ── FERRY PIER (center-west) ──────────────────────────────────────────────
  { cx: -35, cy: 1.75, cz:  -6, w:  7, h: 3.5, d:  6 },
  { cx: -46, cy: 1.75, cz:  -6, w:  8, h: 3.5, d:  6 },
  { cx: -35, cy: 2.25, cz:   6, w:  7, h: 4.5, d:  6 },  // 2-story
  { cx: -58, cy: 2.5,  cz:   0, w: 10, h: 5,   d: 14 },  // ferry terminal
  // ── NOVOREPNOYE (south-center) ────────────────────────────────────────────
  { cx: -10, cy: 1.75, cz:  42, w:  7, h: 3.5, d:  6 },
  { cx:   2, cy: 1.75, cz:  42, w:  8, h: 3.5, d:  6 },
  { cx:  14, cy: 1.75, cz:  42, w:  7, h: 3.5, d:  7 },
  { cx: -10, cy: 1.75, cz:  54, w:  7, h: 3.5, d:  6 },
  { cx:   4, cy: 1.75, cz:  54, w:  9, h: 3.5, d:  7 },
  // ── Misc structures ────────────────────────────────────────────────────────
  { cx:   0, cy: 1.5,  cz: -30, w: 10, h: 3,   d:  6 },  // gas station
  { cx: -22, cy: 5,    cz: -22, w:  8, h: 10,  d:  8 },  // church
  { cx:  22, cy: 6,    cz:  30, w:  3, h: 12,  d:  3 },  // water tower
];

// ── Sub-components (purely visual, no collision registration) ─────────────

function House({ x, z, w = 7, d = 6, h = 3.5, color = "#d4c5a9", hasSecondFloor = false }: {
  x: number; z: number; w?: number; d?: number; h?: number; color?: string; hasSecondFloor?: boolean;
}) {
  const wallT = 0.3;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color="#999" />
      </mesh>
      {/* Walls */}
      {[
        { pos: [0, h / 2, d / 2]  as [number,number,number], args: [w, h, wallT] as [number,number,number] },
        { pos: [0, h / 2, -d / 2] as [number,number,number], args: [w, h, wallT] as [number,number,number] },
        { pos: [w / 2, h / 2, 0]  as [number,number,number], args: [wallT, h, d] as [number,number,number] },
        { pos: [-w / 2, h / 2, 0] as [number,number,number], args: [wallT, h, d] as [number,number,number] },
      ].map(({ pos, args }, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* Roof */}
      <mesh position={[0, h + 0.5, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 1, d + 0.4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1, d / 2 + 0.01]}>
        <boxGeometry args={[1.2, 2.2, 0.05]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      {/* Windows */}
      {[[-w * 0.3, 2, d / 2 + 0.01] as [number,number,number], [w * 0.3, 2, d / 2 + 0.01] as [number,number,number]].map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[1, 0.9, 0.05]} />
          <meshStandardMaterial color="#7db8d4" transparent opacity={0.7} />
        </mesh>
      ))}
      {/* Second floor */}
      {hasSecondFloor && (
        <group position={[0, h, 0]}>
          {[
            { pos: [0, h / 2, d / 2 - 0.3]  as [number,number,number], args: [w - 0.5, h, wallT] as [number,number,number] },
            { pos: [0, h / 2, -(d / 2 - 0.3)] as [number,number,number], args: [w - 0.5, h, wallT] as [number,number,number] },
            { pos: [(w / 2 - 0.3), h / 2, 0]  as [number,number,number], args: [wallT, h, d - 0.5] as [number,number,number] },
            { pos: [-(w / 2 - 0.3), h / 2, 0] as [number,number,number], args: [wallT, h, d - 0.5] as [number,number,number] },
          ].map(({ pos, args }, i) => (
            <mesh key={i} position={pos} castShadow>
              <boxGeometry args={args} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
          <mesh position={[0, h + 0.5, 0]} castShadow>
            <boxGeometry args={[w + 0.2, 1, d + 0.2]} />
            <meshStandardMaterial color="#722b0d" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Warehouse({ x, z, w = 14, d = 10, h = 6, color = "#8a8a7a" }: {
  x: number; z: number; w?: number; d?: number; h?: number; color?: string;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]}>
        <boxGeometry args={[w + 0.5, 0.6, d + 0.5]} />
        <meshStandardMaterial color="#5a6a5a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, h * 0.4, d / 2 + 0.01]}>
        <boxGeometry args={[4, h * 0.8, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  );
}

function Watchtower({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[2.5, 10, 2.5]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      <mesh position={[0, 10.5, 0]} castShadow>
        <boxGeometry args={[4.5, 0.4, 4.5]} />
        <meshStandardMaterial color="#7a6245" />
      </mesh>
      {[[-2, 0], [2, 0], [0, -2], [0, 2]].map(([rx, rz], i) => (
        <mesh key={i} position={[rx, 11.5, rz]}>
          <boxGeometry args={[0.15, 2, 0.15]} />
          <meshStandardMaterial color="#5a4535" />
        </mesh>
      ))}
    </group>
  );
}

function Container({ x, z, rotY = 0, color = "#2d6a2d" }: {
  x: number; z: number; rotY?: number; color?: string;
}) {
  return (
    <mesh position={[x, 1.4, z]} rotation={[0, rotY, 0]} castShadow receiveShadow>
      <boxGeometry args={[6, 2.8, 2.4]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
    </mesh>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 4, 6]} />
        <meshStandardMaterial color="#6b4226" />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <coneGeometry args={[2.8, 5, 7]} />
        <meshStandardMaterial color="#2d5a1b" />
      </mesh>
      <mesh position={[0, 7.5, 0]}>
        <coneGeometry args={[1.8, 4, 7]} />
        <meshStandardMaterial color="#3a7022" />
      </mesh>
    </group>
  );
}

function Rock({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <mesh position={[x, s * 0.4, z]} castShadow receiveShadow>
      <boxGeometry args={[s * 1.4, s * 0.8, s * 1.2]} />
      <meshStandardMaterial color="#888" roughness={0.95} />
    </mesh>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function Arena5() {
  // Register collision with shared arena (once on mount)
  useEffect(() => {
    sharedArena.boxes = BARMUDA_BOXES.map(({ cx, cy, cz, w, h, d }) => ({
      min: new THREE.Vector3(cx - w / 2, cy - h / 2, cz - d / 2),
      max: new THREE.Vector3(cx + w / 2, cy + h / 2, cz + d / 2),
      cy,
      h,
    }));
    sharedArena.bounds = 74;
    return () => { sharedArena.bounds = 27; };
  }, []);

  const borderH = 8;

  return (
    <group>
      {/* ── OCEAN ──────────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#1a5276" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* ── ISLAND GRASS ───────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[148, 148]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} />
      </mesh>
      {/* ── BEACH RING ─────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <ringGeometry args={[70, 80, 64]} />
        <meshStandardMaterial color="#d4b483" side={THREE.DoubleSide} />
      </mesh>
      {/* ── ROADS ──────────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[140, 4]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4, 140]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0.5, 0]} position={[-28, 0.02, -28]}>
        <planeGeometry args={[3.5, 55]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, -0.5, 0]} position={[28, 0.02, -28]}>
        <planeGeometry args={[3.5, 55]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      {/* ── BORDER WALLS ───────────────────────────────────────────────── */}
      {[
        [0, borderH / 2, -75, 150, borderH, 1],
        [0, borderH / 2,  75, 150, borderH, 1],
        [-75, borderH / 2, 0, 1, borderH, 150],
        [75,  borderH / 2, 0, 1, borderH, 150],
      ].map(([cx, cy, cz, w, h, d], i) => (
        <mesh key={`b${i}`} position={[cx, cy, cz]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#2a3a1a" />
        </mesh>
      ))}

      {/* ══ POCHINKI — CENTER TOWN ═════════════════════════════════════ */}
      <House x={-10} z={-8} w={8} d={7} hasSecondFloor color="#d9c9a3" />
      <House x={2}   z={-8} w={7} d={6} hasSecondFloor color="#c8b89a" />
      <House x={14}  z={-8} w={8} d={7} hasSecondFloor color="#dbc4a0" />
      <House x={-10} z={4}  w={7} d={6} color="#ccc0a5" />
      <House x={2}   z={4}  w={9} d={7} hasSecondFloor color="#d2c5a8" />
      <House x={14}  z={4}  w={7} d={6} color="#c4b89a" />
      <House x={-10} z={14} w={8} d={6} color="#d0c2a0" />
      <House x={4}   z={14} w={7} d={6} hasSecondFloor color="#ccc0a5" />
      <House x={15}  z={14} w={7} d={7} color="#d8c9a6" />
      {/* Shop row */}
      <mesh position={[-2, 1.5, -18]} castShadow>
        <boxGeometry args={[28, 3, 5]} />
        <meshStandardMaterial color="#b8a085" />
      </mesh>
      <mesh position={[-2, 3.1, -18]}>
        <boxGeometry args={[28.5, 0.4, 5.5]} />
        <meshStandardMaterial color="#7a5c3a" />
      </mesh>

      {/* ══ SCHOOL — NORTH ════════════════════════════════════════════════ */}
      <mesh position={[0, 4, -52]} castShadow receiveShadow>
        <boxGeometry args={[24, 8, 12]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      <mesh position={[0, 8.4, -52]}>
        <boxGeometry args={[24.5, 0.8, 12.5]} />
        <meshStandardMaterial color="#6b4c2a" />
      </mesh>
      <mesh position={[16, 4, -56]} castShadow>
        <boxGeometry args={[8, 8, 20]} />
        <meshStandardMaterial color="#e0d4bc" />
      </mesh>
      <mesh position={[16, 8.4, -56]}>
        <boxGeometry args={[8.5, 0.8, 20.5]} />
        <meshStandardMaterial color="#6b4c2a" />
      </mesh>
      {/* Fence posts */}
      {[-30,-32,-34,-36,-38,-40,-42,-44,-46].map((z, i) => (
        <mesh key={`sf${i}`} position={[-14, 1.2, z]}>
          <boxGeometry args={[0.2, 2.4, 1.8]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      ))}

      {/* ══ MILITARY BASE — NW ════════════════════════════════════════════ */}
      <Warehouse x={-52} z={-50} w={16} d={12} h={7} color="#7a8a70" />
      <Warehouse x={-36} z={-50} w={12} d={10} h={6} color="#8a9a80" />
      <Warehouse x={-52} z={-35} w={10} d={8}  h={5} color="#7a8570" />
      {/* Bunker */}
      <mesh position={[-42, 1.5, -40]} castShadow>
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
      <Warehouse x={52} z={-48} w={18} d={14} h={8} color="#7a7a8a" />
      <Warehouse x={35} z={-52} w={12} d={10} h={7} color="#8a8a9a" />
      {/* Storage tanks */}
      {[[58,-35],[62,-35],[58,-40],[62,-40]].map(([cx,cz],i) => (
        <mesh key={`tk${i}`} position={[cx, 3.5, cz]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, 7, 12]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.5} />
        </mesh>
      ))}
      <Container x={44} z={-40} color="#2d6a2d" />
      <Container x={51} z={-40} color="#6a2d2d" />
      <Container x={58} z={-40} rotY={Math.PI / 2} color="#2d4a6a" />
      <Container x={44} z={-45} color="#6a5a2d" />
      {/* Crane */}
      <mesh position={[65, 8, -50]} castShadow>
        <boxGeometry args={[2, 16, 2]} />
        <meshStandardMaterial color="#8a7a3a" metalness={0.4} />
      </mesh>
      <mesh position={[65, 16, -42]} castShadow>
        <boxGeometry args={[2, 1.5, 18]} />
        <meshStandardMaterial color="#8a7a3a" metalness={0.4} />
      </mesh>

      {/* ══ PRIMORSK — SW ═════════════════════════════════════════════════ */}
      <House x={-52} z={42} w={7} d={6} color="#ddd0b5" />
      <House x={-42} z={42} w={8} d={6} hasSecondFloor color="#d4c8aa" />
      <House x={-52} z={52} w={7} d={7} color="#d8cbb2" />
      <House x={-42} z={52} w={8} d={6} color="#e0d4bc" />
      <House x={-58} z={58} w={7} d={6} color="#d4c5a9" />
      <House x={-48} z={62} w={7} d={6} color="#ccc0a5" />
      {/* Pier */}
      <mesh position={[-68, 0.3, 55]} castShadow>
        <boxGeometry args={[12, 0.6, 4]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>

      {/* ══ LIPOVKA — SE ══════════════════════════════════════════════════ */}
      <House x={52} z={50} w={10} d={8} hasSecondFloor color="#c8b090" />
      <House x={65} z={50} w={7}  d={6} color="#d0b898" />
      {/* Barn */}
      <mesh position={[55, 4.5, 62]} castShadow>
        <boxGeometry args={[14, 9, 10]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[55, 9.4, 62]}>
        <boxGeometry args={[14.5, 1, 10.5]} />
        <meshStandardMaterial color="#6b3010" />
      </mesh>
      {/* Silo */}
      <mesh position={[65, 5, 62]} castShadow>
        <cylinderGeometry args={[2.5, 2.5, 10, 10]} />
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
      <House x={32} z={-6} w={7} d={6} color="#d0c8b0" />
      <House x={43} z={-6} w={8} d={6} hasSecondFloor color="#c8c0a5" />
      <House x={32} z={6}  w={7} d={6} color="#d4ccb8" />
      <House x={43} z={6}  w={7} d={7} color="#ccc4a8" />
      {/* Kiosks */}
      {[28, 34, 40].map((x,i) => (
        <mesh key={`ki${i}`} position={[x, 1.5, -14]}>
          <boxGeometry args={[5, 3, 4]} />
          <meshStandardMaterial color="#d0a870" />
        </mesh>
      ))}

      {/* ══ FERRY PIER — CENTER WEST ══════════════════════════════════════ */}
      <House x={-35} z={-6} w={7} d={6} color="#d0ccb8" />
      <House x={-46} z={-6} w={8} d={6} color="#c8c4aa" />
      <House x={-35} z={6}  w={7} d={6} hasSecondFloor color="#d4c8b0" />
      {/* Ferry terminal */}
      <mesh position={[-58, 2.5, 0]} castShadow>
        <boxGeometry args={[10, 5, 14]} />
        <meshStandardMaterial color="#c0b090" />
      </mesh>
      <mesh position={[-68, 0.3, 0]}>
        <boxGeometry args={[3, 0.6, 20]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>

      {/* ══ NOVOREPNOYE — SOUTH ═══════════════════════════════════════════ */}
      <House x={-10} z={42} w={7} d={6} color="#d8ccb0" />
      <House x={2}   z={42} w={8} d={6} hasSecondFloor color="#d4c8ac" />
      <House x={14}  z={42} w={7} d={7} color="#d0c4a8" />
      <House x={-10} z={54} w={7} d={6} color="#ccc0a4" />
      <House x={4}   z={54} w={9} d={7} color="#d8cbb0" />

      {/* ══ MID-MAP LANDMARKS ══════════════════════════════════════════════ */}
      {/* Gas station */}
      <mesh position={[0, 1.5, -30]} castShadow>
        <boxGeometry args={[10, 3, 6]} />
        <meshStandardMaterial color="#d8d0b8" />
      </mesh>
      <mesh position={[0, 3.5, -30]}>
        <boxGeometry args={[16, 0.4, 10]} />
        <meshStandardMaterial color="#aa3333" />
      </mesh>
      {/* Church */}
      <mesh position={[-22, 4, -22]} castShadow>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial color="#e8e0d0" />
      </mesh>
      <mesh position={[-22, 10, -22]} castShadow>
        <cylinderGeometry args={[2, 2.5, 4, 8]} />
        <meshStandardMaterial color="#888080" />
      </mesh>
      {/* Water tower */}
      <mesh position={[22, 5, 30]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 10, 8]} />
        <meshStandardMaterial color="#9a8a6a" />
      </mesh>
      <mesh position={[22, 11, 30]}>
        <cylinderGeometry args={[2.5, 2.5, 3.5, 10]} />
        <meshStandardMaterial color="#7a6a4a" />
      </mesh>
      {/* Ruins */}
      {[[-28,30],[-22,30],[-28,36],[-22,36]].map(([rx,rz],i) => (
        <mesh key={`ru${i}`} position={[rx, 2, rz]} rotation={[0, i * 0.3, 0]} castShadow>
          <boxGeometry args={[3, 4, 0.5]} />
          <meshStandardMaterial color="#c0b090" />
        </mesh>
      ))}

      {/* ══ TREES ══════════════════════════════════════════════════════════ */}
      {[
        [-35,-35],[35,-35],[-35,30],[35,30],[-65,0],[65,0],[0,-70],[0,70],
        [-20,-60],[20,-60],[-60,-20],[60,-20],[-55,25],[55,25],[-25,55],[25,55],
        [-70,-30],[70,30],[-30,70],[30,-70],[-45,-60],[45,-60],[-60,45],[60,45],
        [15,-25],[-15,25],[25,-15],[-25,15],[-48,-15],[48,15],[15,48],[-15,-48],
        [60,15],[-60,-15],[15,60],[-15,-60],[40,30],[-40,-30],[30,-40],[-30,40],
      ].map(([tx,tz],i) => <Tree key={`tr${i}`} x={tx} z={tz} />)}

      {/* ══ ROCKS ══════════════════════════════════════════════════════════ */}
      {[
        {x:-25,z:-15,s:1.5},{x:20,z:-18,s:1.2},{x:-10,z:22,s:1.8},
        {x:30,z:20,s:1.3},{x:-40,z:10,s:2},{x:40,z:-15,s:1.5},
        {x:10,z:-40,s:1.6},{x:-18,z:38,s:1.4},{x:18,z:36,s:1.2},
        {x:-35,z:-10,s:1.8},{x:35,z:12,s:1.4},{x:0,z:-20,s:1.5},
      ].map(({x,z,s},i) => <Rock key={`ro${i}`} x={x} z={z} s={s} />)}

      {/* ══ HILLS ══════════════════════════════════════════════════════════ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
        <circleGeometry args={[10, 16]} />
        <meshStandardMaterial color="#5a8c4f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, 1.5, -45]}>
        <circleGeometry args={[14, 16]} />
        <meshStandardMaterial color="#5a8c4f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, 1, -40]}>
        <circleGeometry args={[12, 16]} />
        <meshStandardMaterial color="#558840" />
      </mesh>

      {/* ══ LIGHTING ════════════════════════════════════════════════════════ */}
      <ambientLight intensity={0.6} color="#d4e8ff" />
      <directionalLight
        position={[40, 60, 30]}
        intensity={1.8}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <hemisphereLight args={["#87ceeb", "#4a7c3f", 0.5]} />
    </group>
  );
}
