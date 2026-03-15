import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "./store";
import GunModel from "./GunModel";

function IdleCharacter({ selectedGun }: { selectedGun: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const breathe = Math.sin(t * 1.5) * 0.012;
    if (groupRef.current) groupRef.current.position.y = breathe;
    if (leftArmRef.current) leftArmRef.current.rotation.z = 0.15 + Math.sin(t * 1.5) * 0.03;
    if (rightArmRef.current) rightArmRef.current.rotation.z = -0.25 + Math.sin(t * 1.5) * 0.03;
    if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 1.5) * 0.02;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * 1.5) * 0.02;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.21, 12, 12]} />
        <meshStandardMaterial color="#ffcc88" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.68, 0.05]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color="#ffaa66" roughness={0.8} />
      </mesh>
      <mesh position={[-0.07, 1.72, 0.16]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#1a1a4a" />
      </mesh>
      <mesh position={[0.07, 1.72, 0.16]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#1a1a4a" />
      </mesh>

      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.42, 0.72, 0.22]} />
        <meshStandardMaterial color="#1a3a7a" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.96, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.44, 0.08, 0.24]} />
        <meshStandardMaterial color="#2a4a8a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.44, 0.01]}>
        <boxGeometry args={[0.18, 0.04, 0.23]} />
        <meshStandardMaterial color="#2a4a8a" roughness={0.6} />
      </mesh>

      <group ref={leftArmRef} position={[-0.28, 1.08, 0]} rotation={[0, 0, 0.15]}>
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.46, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.58, 0]}>
          <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.28, 1.08, 0]} rotation={[0, 0, -0.25]}>
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.46, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.58, 0]}>
          <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
        <group position={[0.05, -0.72, 0.3]} rotation={[-0.4, 0, 0.15]}>
          <GunModel gunType={selectedGun} />
        </group>
      </group>

      <group ref={leftLegRef} position={[-0.13, 0.6, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.16, 0.42, 0.18]} />
          <meshStandardMaterial color="#1a1a4a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
          <meshStandardMaterial color="#0a0a2a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.54, 0.04]}>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.13, 0.6, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.16, 0.42, 0.18]} />
          <meshStandardMaterial color="#1a1a4a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
          <meshStandardMaterial color="#0a0a2a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.54, 0.04]}>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export default function LobbyScene() {
  const selectedGun = useGameStore((s) => s.selectedGun);

  return (
    <div
      style={{
        width: "100%",
        height: 220,
        borderRadius: 14,
        overflow: "hidden",
        background: "radial-gradient(ellipse at center, #0d1b3e 0%, #050510 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 10,
          color: "#444",
          letterSpacing: 1,
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        DRAG TO ROTATE
      </div>
      <Canvas camera={{ position: [0, 1.4, 3.2], fov: 45 }} style={{ width: "100%", height: "100%" }}>
        <ambientLight intensity={0.5} color="#334488" />
        <directionalLight position={[2, 4, 3]} intensity={1.4} color="#fff" />
        <directionalLight position={[-2, 2, -2]} intensity={0.4} color="#4466aa" />
        <pointLight position={[0, 3, 0]} color="#ff3333" intensity={0.6} distance={8} />

        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.2, 32]} />
          <meshStandardMaterial color="#0a0a2a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.18, 1.22, 32]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff1111" emissiveIntensity={0.4} />
        </mesh>

        <IdleCharacter selectedGun={selectedGun} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          target={[0, 1.0, 0]}
          autoRotate
          autoRotateSpeed={1.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}
