import * as THREE from "three";
import { useMemo, useEffect } from "react";
import { sharedArena } from "./arenaShared";

/**
 * MAP: "Urban Ruins"
 * Tight city ruins — crumbled buildings, alleyways, rooftops for CQC.
 */

const MAP_OBJECTS: [number, number, number, number, number, number][] = [
  // ─── BOUNDARY WALLS ────────────────────────────────────────────────
  [0,   3.5, -22, 46, 7, 1],
  [0,   3.5,  22, 46, 7, 1],
  [22,  3.5,   0, 1, 7, 46],
  [-22, 3.5,   0, 1, 7, 46],

  // ─── BUILDING A — NW (rooftop walkable, top=3.6) ───────────────────
  [-14, 1.8, -14, 8, 3.6, 8],
  // Ramp up to roof
  [-10, 0.6, -10, 3, 1.2, 3],   // L1
  [-11, 1.8, -11, 3, 1.2, 3],   // L2

  // ─── BUILDING B — NE (top=2.4) ────────────────────────────────────
  [14, 1.2, -14, 8, 2.4, 8],
  [10, 0.6, -10, 3, 1.2, 3],    // step up

  // ─── BUILDING C — SW (top=3.6) ────────────────────────────────────
  [-14, 1.8, 14, 8, 3.6, 8],
  [-10, 0.6, 10, 3, 1.2, 3],
  [-11, 1.8, 11, 3, 1.2, 3],

  // ─── BUILDING D — SE (tall, top=4.8) ──────────────────────────────
  [14, 2.4, 14, 8, 4.8, 8],
  [10, 0.6, 10, 3, 1.2, 3],
  [11, 1.8, 11, 3, 1.2, 3],
  [12, 3.0, 12, 3, 1.2, 3],

  // ─── CENTER COURTYARD COVER ──────────────────────────────────────
  [0, 0.6,  0,  6, 1.2, 6],     // center platform  top=1.2
  [-4, 0.6, 0,  1.5, 1.2, 4],   // west cover
  [ 4, 0.6, 0,  1.5, 1.2, 4],   // east cover
  [0,  0.6,-4,  4,   1.2, 1.5], // north cover
  [0,  0.6, 4,  4,   1.2, 1.5], // south cover

  // ─── CRUMBLED WALL CORRIDORS ────────────────────────────────────
  [-7, 1.5, 0,   1, 3, 8],
  [ 7, 1.5, 0,   1, 3, 8],
  [0,  1.5, -7,  8, 3, 1],
  [0,  1.5,  7,  8, 3, 1],

  // ─── RUBBLE / DEBRIS ────────────────────────────────────────────
  [ 3,  0.6, -9, 2, 1.2, 2],
  [-3,  0.6,  9, 2, 1.2, 2],
  [ 9,  0.6,  3, 2, 1.2, 2],
  [-9,  0.6, -3, 2, 1.2, 2],
];

interface ArenaBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  cy: number;
  h: number;
}

export default function Arena3() {
  const boxes = useMemo(() => {
    return MAP_OBJECTS.map(([cx, cy, cz, w, h, d]) => ({
      min: new THREE.Vector3(cx - w / 2, cy - h / 2, cz - d / 2),
      max: new THREE.Vector3(cx + w / 2, cy + h / 2, cz + d / 2),
      cy, h,
    }));
  }, []);

  useEffect(() => {
    sharedArena.boxes = boxes;
    sharedArena.bounds = 21;
  }, [boxes]);

  return (
    <group>
      {/* Ground — cracked concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial color="#4a4640" roughness={0.97} />
      </mesh>

      {/* Crack lines (decorative) */}
      {[[-5,0.01,3],[8,0.01,-4],[-10,0.01,7],[4,0.01,12]].map(([x,y,z],i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} rotation={[-Math.PI/2, 0, i*0.6]}>
          <planeGeometry args={[8, 0.08]} />
          <meshStandardMaterial color="#333030" roughness={1} />
        </mesh>
      ))}

      {/* Buildings / rubble */}
      {boxes.map((box, i) => {
        const w = box.max.x - box.min.x;
        const h = box.max.y - box.min.y;
        const d = box.max.z - box.min.z;
        const cx = (box.min.x + box.max.x) / 2;
        const cy = (box.min.y + box.max.y) / 2;
        const cz = (box.min.z + box.max.z) / 2;

        const isTall = h > 3;
        const isWall = (w < 2 || d < 2) && h > 2;
        const color = isTall
          ? "#5a5248"
          : isWall
          ? "#4e4a45"
          : "#635e58";

        return (
          <mesh key={i} position={[cx, cy, cz]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        );
      })}

      {/* Broken glass shards (decorative billboards) */}
      {[[-14,7,-14],[14,5,-14],[-14,7,14],[14,9,14]].map(([x,y,z],i) => (
        <mesh key={`board-${i}`} position={[x as number, y as number, z as number]}>
          <planeGeometry args={[4, 3]} />
          <meshStandardMaterial color="#222222" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Moody overcast sky */}
      <ambientLight intensity={0.7} color="#8090a0" />
      <directionalLight
        position={[-10, 30, -10]}
        intensity={1.4}
        color="#b0c0cc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={["#aab0bb", "#303035", 0.5]} />

      {/* Dark cloudy sky */}
      <mesh>
        <sphereGeometry args={[200, 16, 16]} />
        <meshBasicMaterial color="#3a3f48" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
