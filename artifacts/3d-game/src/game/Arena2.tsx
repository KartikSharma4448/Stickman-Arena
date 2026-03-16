import * as THREE from "three";
import { useMemo, useEffect } from "react";
import { sharedArena } from "./arenaShared";

/**
 * MAP: "Desert Storm"
 * Open sandy battlefield with long sight-lines, sand dunes, bunkers,
 * and ruined oil drums scattered throughout.
 */

const MAP_OBJECTS: [number, number, number, number, number, number][] = [
  // ─── OUTER WALLS ─────────────────────────────────────────────────────
  [0,    3,  -26, 54, 6, 1],
  [0,    3,   26, 54, 6, 1],
  [26,   3,    0, 1, 6, 54],
  [-26,  3,    0, 1, 6, 54],

  // ─── CENTRAL BUNKER ──────────────────────────────────────────────────
  [0, 1.0, 0, 10, 2, 5],        // main slab  top=2.0
  [5, 1.5, 0,  1, 3, 7],        // side wall east
  [-5,1.5, 0,  1, 3, 7],        // side wall west

  // ─── SAND DUNE RIDGES (gentle ramps — climable top ~1.2) ─────────────
  [12,  0.6, -10, 8, 1.2, 5],   // NE ridge
  [-12, 0.6, -10, 8, 1.2, 5],   // NW ridge
  [12,  0.6,  10, 8, 1.2, 5],   // SE ridge
  [-12, 0.6,  10, 8, 1.2, 5],   // SW ridge

  // ─── SNIPER MOUNDS (tall dunes, top~2.4) ──────────────────────────────
  [20,  1.8, -20, 6, 2.4, 6],
  [-20, 1.8, -20, 6, 2.4, 6],
  [20,  1.8,  20, 6, 2.4, 6],
  [-20, 1.8,  20, 6, 2.4, 6],

  // ─── RAMP UP TO MOUNDS ───────────────────────────────────────────────
  [16, 0.6, -16, 4, 1.2, 4],
  [-16,0.6, -16, 4, 1.2, 4],
  [16, 0.6,  16, 4, 1.2, 4],
  [-16,0.6,  16, 4, 1.2, 4],

  // ─── OIL DRUM CRATES ─────────────────────────────────────────────────
  [ 7,  0.6, -6, 1.5, 1.2, 1.5],
  [-7,  0.6,  6, 1.5, 1.2, 1.5],
  [ 7,  0.6,  6, 1.5, 1.2, 1.5],
  [-7,  0.6, -6, 1.5, 1.2, 1.5],
  [ 0,  0.6, 14, 2,   1.2, 2  ],
  [ 0,  0.6,-14, 2,   1.2, 2  ],

  // ─── RUINED WALL SEGMENTS ────────────────────────────────────────────
  [-18, 1.5, 0,  1, 3, 10],
  [ 18, 1.5, 0,  1, 3, 10],
];

interface ArenaBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  cy: number;
  h: number;
}

export default function Arena2() {
  const boxes = useMemo(() => {
    return MAP_OBJECTS.map(([cx, cy, cz, w, h, d]) => ({
      min: new THREE.Vector3(cx - w / 2, cy - h / 2, cz - d / 2),
      max: new THREE.Vector3(cx + w / 2, cy + h / 2, cz + d / 2),
      cy, h,
    }));
  }, []);

  useEffect(() => {
    sharedArena.boxes = boxes;
    sharedArena.bounds = 25;
  }, [boxes]);

  return (
    <group>
      {/* Ground — sandy desert */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[56, 56]} />
        <meshStandardMaterial color="#c8a96e" roughness={0.98} />
      </mesh>

      {/* Sand detail patches */}
      {[[-8,0,-12],[12,0,4],[-14,0,8],[5,0,16]].map(([x,_,z],i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={[x as number,0.01,z as number]}>
          <planeGeometry args={[5+i,4+i]} />
          <meshStandardMaterial color="#b8956a" roughness={0.99} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Buildings / dunes */}
      {boxes.map((box, i) => {
        const w = box.max.x - box.min.x;
        const h = box.max.y - box.min.y;
        const d = box.max.z - box.min.z;
        const cx = (box.min.x + box.max.x) / 2;
        const cy = (box.min.y + box.max.y) / 2;
        const cz = (box.min.z + box.max.z) / 2;

        const isWall = h > 2.5;
        const isDune = w > 6 && h < 2;
        const color = isWall
          ? "#8b7355"
          : isDune
          ? "#c4a06a"
          : "#a08050";

        return (
          <mesh key={i} position={[cx, cy, cz]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.92} />
          </mesh>
        );
      })}

      {/* Distant haze pillars (decorative) */}
      {[[-22,3,-5],[22,3,5],[-5,3,22],[5,3,-22]].map(([x,y,z],i) => (
        <mesh key={`haze-${i}`} position={[x as number, y as number, z as number]}>
          <cylinderGeometry args={[0.3, 0.3, 6, 6]} />
          <meshStandardMaterial color="#6e5a3a" roughness={0.9} />
        </mesh>
      ))}

      {/* Sky light */}
      <ambientLight intensity={0.9} color="#ffe0b0" />
      <directionalLight
        position={[20, 40, 15]}
        intensity={2.2}
        color="#ffd090"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={["#ffe0a0", "#c89050", 0.6]} />

      {/* Sky */}
      <mesh>
        <sphereGeometry args={[200, 16, 16]} />
        <meshBasicMaterial color="#e8c080" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
