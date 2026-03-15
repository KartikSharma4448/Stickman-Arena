import * as THREE from "three";
import { useMemo } from "react";

const BOX_POSITIONS: Array<[number, number, number, number, number, number]> = [
  [8, 1, 8, 4, 2, 4],
  [-8, 1, 8, 4, 2, 4],
  [8, 1, -8, 4, 2, 4],
  [-8, 1, -8, 4, 2, 4],
  [0, 1.5, 12, 6, 3, 2],
  [0, 1.5, -12, 6, 3, 2],
  [12, 1.5, 0, 2, 3, 6],
  [-12, 1.5, 0, 2, 3, 6],
  [0, 0.5, 5, 3, 1, 3],
  [0, 0.5, -5, 3, 1, 3],
  [5, 0.5, 0, 3, 1, 3],
  [-5, 0.5, 0, 3, 1, 3],
  [16, 1.5, 8, 2, 3, 2],
  [-16, 1.5, 8, 2, 3, 2],
  [16, 1.5, -8, 2, 3, 2],
  [-16, 1.5, -8, 2, 3, 2],
];

export const ARENA_BOXES = BOX_POSITIONS.map(([x, y, z, w, h, d]) => ({
  position: new THREE.Vector3(x, y, z),
  size: new THREE.Vector3(w, h, d),
  min: new THREE.Vector3(x - w / 2, 0, z - d / 2),
  max: new THREE.Vector3(x + w / 2, h, z + d / 2),
}));

export const ARENA_BOUNDS = 24;

export default function Arena() {
  const floorGeom = useMemo(() => new THREE.PlaneGeometry(50, 50), []);
  const wallGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const floorMat = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: 0x4a5240,
      }),
    [],
  );

  const wallMat = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: 0x6b6b6b,
      }),
    [],
  );

  const coverMat = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: 0x8b7355,
      }),
    [],
  );

  return (
    <group>
      <mesh
        geometry={floorGeom}
        material={floorMat}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />

      <mesh
        geometry={wallGeom}
        material={wallMat}
        position={[0, 2, -25]}
        scale={[50, 4, 1]}
        receiveShadow
        castShadow
      />
      <mesh
        geometry={wallGeom}
        material={wallMat}
        position={[0, 2, 25]}
        scale={[50, 4, 1]}
        receiveShadow
        castShadow
      />
      <mesh
        geometry={wallGeom}
        material={wallMat}
        position={[25, 2, 0]}
        scale={[1, 4, 50]}
        receiveShadow
        castShadow
      />
      <mesh
        geometry={wallGeom}
        material={wallMat}
        position={[-25, 2, 0]}
        scale={[1, 4, 50]}
        receiveShadow
        castShadow
      />

      {BOX_POSITIONS.map(([x, y, z, w, h, d], i) => (
        <mesh
          key={i}
          geometry={wallGeom}
          material={coverMat}
          position={[x, y, z]}
          scale={[w, h, d]}
          castShadow
          receiveShadow
        />
      ))}

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
    </group>
  );
}
