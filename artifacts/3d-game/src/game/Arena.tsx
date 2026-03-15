import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const BOX_POSITIONS: Array<[number, number, number, number, number, number]> = [
  // Corner crates
  [9, 1, 9, 3.5, 2, 3.5],
  [-9, 1, 9, 3.5, 2, 3.5],
  [9, 1, -9, 3.5, 2, 3.5],
  [-9, 1, -9, 3.5, 2, 3.5],
  // Side walls
  [0, 1.5, 14, 7, 3, 1.5],
  [0, 1.5, -14, 7, 3, 1.5],
  [14, 1.5, 0, 1.5, 3, 7],
  [-14, 1.5, 0, 1.5, 3, 7],
  // Center low covers
  [0, 0.4, 5.5, 2.5, 0.8, 2.5],
  [0, 0.4, -5.5, 2.5, 0.8, 2.5],
  [5.5, 0.4, 0, 2.5, 0.8, 2.5],
  [-5.5, 0.4, 0, 2.5, 0.8, 2.5],
  // Pillars
  [18, 2, 10, 1.5, 4, 1.5],
  [-18, 2, 10, 1.5, 4, 1.5],
  [18, 2, -10, 1.5, 4, 1.5],
  [-18, 2, -10, 1.5, 4, 1.5],
  // Extra cover
  [12, 0.75, 5, 1.5, 1.5, 3.5],
  [-12, 0.75, -5, 1.5, 1.5, 3.5],
  [5, 0.75, 12, 3.5, 1.5, 1.5],
  [-5, 0.75, -12, 3.5, 1.5, 1.5],
];

export const ARENA_BOXES = BOX_POSITIONS.map(([x, y, z, w, h, d]) => ({
  position: new THREE.Vector3(x, y, z),
  size: new THREE.Vector3(w, h, d),
  min: new THREE.Vector3(x - w / 2, 0, z - d / 2),
  max: new THREE.Vector3(x + w / 2, h, z + d / 2),
}));

export const ARENA_BOUNDS = 24;

function FlickerLight({
  position,
  color,
  baseIntensity,
  flickerSpeed = 1,
}: {
  position: [number, number, number];
  color: string;
  baseIntensity: number;
  flickerSpeed?: number;
}) {
  const ref = useRef<THREE.PointLight>(null!);
  const offset = useRef(Math.random() * 100);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * flickerSpeed + offset.current;
    const flicker = Math.sin(t * 3.7) * 0.08 + Math.sin(t * 11.3) * 0.04;
    ref.current.intensity = baseIntensity + flicker;
  });
  return (
    <pointLight
      ref={ref}
      position={position}
      color={color}
      intensity={baseIntensity}
      distance={14}
      decay={2}
    />
  );
}

function HangingLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.14, 0.4]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} emissive="#ffee88" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.25, 4]} />
        <meshStandardMaterial color="#444" metalness={0.9} />
      </mesh>
      <pointLight color="#ffe8aa" intensity={3.5} distance={18} decay={2} />
    </group>
  );
}

function WallLamp({ position, color = "#ff2200" }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.PointLight>(null!);
  const offset = useRef(Math.random() * 100);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 2 + offset.current;
    ref.current.intensity = 1.5 + Math.sin(t * 4.1) * 0.2 + Math.sin(t * 7.3) * 0.1;
  });
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.2, 0.35, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      <pointLight ref={ref} color={color} intensity={1.5} distance={10} decay={2} />
    </group>
  );
}

function DangerStripe({ x, z, angle = 0 }: { x: number; z: number; angle?: number }) {
  return (
    <mesh position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, angle]}>
      <planeGeometry args={[6, 0.18]} />
      <meshBasicMaterial color="#ffcc00" transparent opacity={0.18} />
    </mesh>
  );
}

export default function Arena() {
  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x2a2e2a,
        roughness: 0.92,
        metalness: 0.05,
      }),
    [],
  );

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x2e2e3a,
        roughness: 0.8,
        metalness: 0.2,
      }),
    [],
  );

  const crateMatBrown = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x4a3520,
        roughness: 0.8,
        metalness: 0.1,
      }),
    [],
  );

  const crateMatMetal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x2a3040,
        roughness: 0.5,
        metalness: 0.5,
      }),
    [],
  );

  const crateMatConcrete = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x383a36,
        roughness: 0.92,
        metalness: 0.03,
      }),
    [],
  );

  const coverMats = [crateMatBrown, crateMatMetal, crateMatConcrete];

  const wallGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[52, 52]} />
        <primitive object={floorMat} />
      </mesh>

      {/* Subtle floor grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[50, 50, 24, 24]} />
        <meshBasicMaterial color={0x1a1a22} wireframe transparent opacity={0.08} />
      </mesh>

      {/* Danger stripes */}
      <DangerStripe x={0} z={0} />
      <DangerStripe x={0} z={0} angle={Math.PI / 2} />
      <DangerStripe x={10} z={0} />
      <DangerStripe x={-10} z={0} />
      <DangerStripe x={0} z={10} angle={Math.PI / 2} />
      <DangerStripe x={0} z={-10} angle={Math.PI / 2} />

      {/* Center circle marker */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.0, 32]} />
        <meshBasicMaterial color="#ff2200" transparent opacity={0.22} />
      </mesh>

      {/* Outer walls - thick, dark */}
      <mesh geometry={wallGeom} material={wallMat} position={[0, 3, -25]} scale={[52, 6, 1.2]} receiveShadow castShadow />
      <mesh geometry={wallGeom} material={wallMat} position={[0, 3, 25]} scale={[52, 6, 1.2]} receiveShadow castShadow />
      <mesh geometry={wallGeom} material={wallMat} position={[25, 3, 0]} scale={[1.2, 6, 52]} receiveShadow castShadow />
      <mesh geometry={wallGeom} material={wallMat} position={[-25, 3, 0]} scale={[1.2, 6, 52]} receiveShadow castShadow />

      {/* Ceiling */}
      <mesh geometry={wallGeom} material={wallMat} position={[0, 6, 0]} scale={[52, 0.3, 52]} />

      {/* Cover objects */}
      {BOX_POSITIONS.map(([x, y, z, w, h, d], i) => (
        <group key={i}>
          <mesh
            geometry={wallGeom}
            material={coverMats[i % coverMats.length]}
            position={[x, y, z]}
            scale={[w, h, d]}
            castShadow
            receiveShadow
          />
          {/* Edge highlight on top of covers */}
          <mesh
            geometry={wallGeom}
            position={[x, y * 2 + h / 2 - 0.03, z]}
            scale={[w, 0.05, d]}
          >
            <meshStandardMaterial color="#1a1a22" metalness={0.7} roughness={0.3} emissive="#222233" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* LIGHTING - Bright industrial arena */}
      <ambientLight intensity={0.55} color="#aabbcc" />

      {/* Main overhead sun-like directional */}
      <directionalLight
        position={[5, 22, 8]}
        intensity={1.6}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.001}
      />

      {/* Fill light from opposite side */}
      <directionalLight position={[-8, 14, -10]} intensity={0.8} color="#cce0ff" />

      {/* Hanging industrial lights - warm bright pools */}
      <HangingLight position={[0, 5.6, 0]} />
      <HangingLight position={[10, 5.6, 10]} />
      <HangingLight position={[-10, 5.6, 10]} />
      <HangingLight position={[10, 5.6, -10]} />
      <HangingLight position={[-10, 5.6, -10]} />
      <HangingLight position={[0, 5.6, 14]} />
      <HangingLight position={[0, 5.6, -14]} />
      <HangingLight position={[14, 5.6, 0]} />
      <HangingLight position={[-14, 5.6, 0]} />

      {/* Colored accent wall lamps */}
      <WallLamp position={[0, 3.2, -24.4]} color="#ff4400" />
      <WallLamp position={[0, 3.2, 24.4]} color="#ff4400" />
      <WallLamp position={[24.4, 3.2, 0]} color="#ff4400" />
      <WallLamp position={[-24.4, 3.2, 0]} color="#ff4400" />
      <WallLamp position={[12, 3.2, -24.4]} color="#ff4400" />
      <WallLamp position={[-12, 3.2, 24.4]} color="#ff4400" />

      {/* Blue/purple corner accent lights */}
      <FlickerLight position={[22, 2, 22]} color="#4466ff" baseIntensity={1.8} flickerSpeed={0.5} />
      <FlickerLight position={[-22, 2, -22]} color="#4466ff" baseIntensity={1.8} flickerSpeed={0.7} />
      <FlickerLight position={[22, 2, -22]} color="#6633ff" baseIntensity={1.5} flickerSpeed={0.4} />
      <FlickerLight position={[-22, 2, 22]} color="#6633ff" baseIntensity={1.5} flickerSpeed={0.8} />

      {/* Center pulsing accent */}
      <FlickerLight position={[0, 4, 0]} color="#ff3300" baseIntensity={1.4} flickerSpeed={1.2} />
    </group>
  );
}
