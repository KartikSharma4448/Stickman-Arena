import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

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

function FloorGrid() {
  const ref = useRef<THREE.Mesh>(null!);
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[50, 50, 25, 25]} />
      <meshBasicMaterial
        color={0x1a2a1a}
        wireframe={true}
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

function GlowLight({ position, color, intensity }: {
  position: [number, number, number];
  color: string;
  intensity: number;
}) {
  const ref = useRef<THREE.PointLight>(null!);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.intensity = intensity + Math.sin(Date.now() * 0.003) * 0.2;
    }
  });
  return <pointLight ref={ref} position={position} color={color} intensity={intensity} distance={15} />;
}

export default function Arena() {
  const floorGeom = useMemo(() => new THREE.PlaneGeometry(50, 50), []);
  const wallGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x1a2218,
        roughness: 0.95,
        metalness: 0.05,
      }),
    [],
  );

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.8,
        metalness: 0.2,
      }),
    [],
  );

  const coverMats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.7, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.6, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.8, metalness: 0.05 }),
    ],
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
      <FloorGrid />

      <mesh geometry={wallGeom} material={wallMat} position={[0, 2, -25]} scale={[50, 4, 1]} receiveShadow castShadow />
      <mesh geometry={wallGeom} material={wallMat} position={[0, 2, 25]} scale={[50, 4, 1]} receiveShadow castShadow />
      <mesh geometry={wallGeom} material={wallMat} position={[25, 2, 0]} scale={[1, 4, 50]} receiveShadow castShadow />
      <mesh geometry={wallGeom} material={wallMat} position={[-25, 2, 0]} scale={[1, 4, 50]} receiveShadow castShadow />

      <mesh geometry={wallGeom} material={wallMat} position={[0, 4, -25]} scale={[50, 0.1, 1]} />
      <mesh geometry={wallGeom} material={wallMat} position={[0, 4, 25]} scale={[50, 0.1, 1]} />
      <mesh geometry={wallGeom} material={wallMat} position={[25, 4, 0]} scale={[1, 0.1, 50]} />
      <mesh geometry={wallGeom} material={wallMat} position={[-25, 4, 0]} scale={[1, 0.1, 50]} />

      {BOX_POSITIONS.map(([x, y, z, w, h, d], i) => (
        <mesh
          key={i}
          geometry={wallGeom}
          material={coverMats[i % coverMats.length]}
          position={[x, y, z]}
          scale={[w, h, d]}
          castShadow
          receiveShadow
        />
      ))}

      {BOX_POSITIONS.map(([x, y, z, w, h, d], i) => (
        <mesh
          key={`top-${i}`}
          geometry={wallGeom}
          material={new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.5,
            emissive: 0x222222,
          })}
          position={[x, y * 2 + h / 2 - 0.02, z]}
          scale={[w, 0.06, d]}
        />
      ))}

      <ambientLight intensity={0.35} color={0x334466} />

      <directionalLight
        position={[8, 18, 8]}
        intensity={1.2}
        color={0xffeedd}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={70}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-bias={-0.001}
      />

      <directionalLight
        position={[-10, 12, -10]}
        intensity={0.4}
        color={0x4466aa}
      />

      <GlowLight position={[0, 5, 0]} color="#ff3333" intensity={1.5} />
      <GlowLight position={[18, 3, 18]} color="#3333ff" intensity={1.2} />
      <GlowLight position={[-18, 3, -18]} color="#33ff66" intensity={1.0} />
      <GlowLight position={[18, 3, -18]} color="#ff6600" intensity={0.8} />
      <GlowLight position={[-18, 3, 18]} color="#cc33ff" intensity={0.8} />

      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <shadowMaterial opacity={0.4} />
      </mesh>
    </group>
  );
}
