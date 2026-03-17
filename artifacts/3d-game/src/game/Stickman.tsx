import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RemotePlayer } from "./store";
import GunModel from "./GunModel";

interface StickmanProps {
  player: RemotePlayer;
}

export default function Stickman({ player }: StickmanProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Mesh>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  const lerpedPos = useRef(new THREE.Vector3(player.x, player.y, player.z));
  const lerpedRotY = useRef(player.rotY);
  const walkCycle = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetPos = new THREE.Vector3(player.x, player.y, player.z);
    const dist = lerpedPos.current.distanceTo(targetPos);
    const isMoving = dist > 0.02;

    lerpedPos.current.lerp(targetPos, 0.2);
    lerpedRotY.current += (player.rotY - lerpedRotY.current) * 0.2;

    groupRef.current.position.copy(lerpedPos.current);
    groupRef.current.rotation.y = lerpedRotY.current;

    if (isMoving) {
      walkCycle.current += delta * 9;
    } else {
      walkCycle.current *= 0.85;
    }

    const swing = Math.sin(walkCycle.current) * 0.5;
    const bobY = Math.abs(Math.sin(walkCycle.current)) * (isMoving ? 0.04 : 0);

    if (bodyRef.current) bodyRef.current.position.y = 0.95 + bobY;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.7;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.7;
  });

  const isDead = player.health <= 0;
  const skinColor = isDead ? "#888888" : "#f5b78f";
  const bodyColor = isDead ? "#444444" : "#3a6bc4";
  const legColor = isDead ? "#333333" : "#2a3a9c";
  const hairColor = isDead ? "#555555" : "#6b3a1a";

  return (
    <group ref={groupRef} position={[player.x, player.y, player.z]}>

      {/* ===== HEAD ===== */}
      {/* Main head cube - Minecraft style */}
      <mesh position={[0, 1.65, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={skinColor} roughness={0.9} />
      </mesh>
      {/* Hair block on top */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.42, 0.22, 0.42]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>
      {/* Left eye */}
      <mesh position={[-0.09, 1.66, 0.201]}>
        <boxGeometry args={[0.09, 0.07, 0.01]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Right eye */}
      <mesh position={[0.09, 1.66, 0.201]}>
        <boxGeometry args={[0.09, 0.07, 0.01]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, 1.58, 0.201]}>
        <boxGeometry args={[0.14, 0.04, 0.01]} />
        <meshBasicMaterial color="#8b4513" />
      </mesh>

      {/* ===== BODY ===== */}
      <mesh ref={bodyRef} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.44, 0.52, 0.22]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>
      {/* Shirt detail stripe */}
      <mesh position={[0, 0.95, 0.112]}>
        <boxGeometry args={[0.44, 0.52, 0.01]} />
        <meshStandardMaterial color={isDead ? "#333" : "#2a5aaa"} roughness={0.85} />
      </mesh>

      {/* ===== LEFT ARM ===== */}
      <group ref={leftArmRef} position={[-0.32, 1.16, 0]}>
        <mesh position={[0, -0.26, 0]}>
          <boxGeometry args={[0.2, 0.52, 0.22]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} />
        </mesh>
        {/* Hand (skin colour block at bottom) */}
        <mesh position={[0, -0.55, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color={skinColor} roughness={0.85} />
        </mesh>
      </group>

      {/* ===== RIGHT ARM + GUN ===== */}
      <group ref={rightArmRef} position={[0.32, 1.16, 0]}>
        <mesh position={[0, -0.26, 0]}>
          <boxGeometry args={[0.2, 0.52, 0.22]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.55, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color={skinColor} roughness={0.85} />
        </mesh>
        {!isDead && (
          <group position={[0.05, -0.6, 0.32]} rotation={[-0.45, 0, 0.1]}>
            <GunModel gunType="AK-47" />
          </group>
        )}
      </group>

      {/* ===== LEFT LEG ===== */}
      <group ref={leftLegRef} position={[-0.11, 0.68, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.2, 0.64, 0.22]} />
          <meshStandardMaterial color={legColor} roughness={0.85} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.67, 0.02]}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
          <meshStandardMaterial color={isDead ? "#222" : "#1a1a1a"} roughness={0.9} />
        </mesh>
      </group>

      {/* ===== RIGHT LEG ===== */}
      <group ref={rightLegRef} position={[0.11, 0.68, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.2, 0.64, 0.22]} />
          <meshStandardMaterial color={legColor} roughness={0.85} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.67, 0.02]}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
          <meshStandardMaterial color={isDead ? "#222" : "#1a1a1a"} roughness={0.9} />
        </mesh>
      </group>

      {/* Shadow */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 12]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>

      {/* Health bar */}
      {!isDead && (
        <group position={[0, 2.18, 0]}>
          <mesh>
            <boxGeometry args={[0.55, 0.07, 0.005]} />
            <meshBasicMaterial color="#111" />
          </mesh>
          <mesh
            position={[-(0.55 - (0.55 * player.health) / 100) / 2, 0, 0.001]}
            scale={[Math.max(0, player.health / 100), 1, 1]}
          >
            <boxGeometry args={[0.55, 0.07, 0.005]} />
            <meshBasicMaterial
              color={player.health > 60 ? "#00e676" : player.health > 30 ? "#ffb300" : "#f44336"}
            />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.4, 0.001, 0.001]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      )}
    </group>
  );
}
