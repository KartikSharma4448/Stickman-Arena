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
  const wasMoving = useRef(false);

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
  const skinColor = isDead ? "#888888" : "#ffcc88";
  const bodyColor = isDead ? "#444444" : "#1a3a7a";
  const legColor = isDead ? "#333333" : "#1a1a4a";

  return (
    <group ref={groupRef} position={[player.x, player.y, player.z]}>
      {/* Head */}
      <mesh position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.21, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.68, 0.14]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color={isDead ? "#666" : "#ffaa66"} roughness={0.8} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.84, 0]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color={isDead ? "#333" : "#1a2a1a"} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.44, 0.7, 0.22]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.98, 0.01]}>
        <boxGeometry args={[0.36, 0.5, 0.24]} />
        <meshStandardMaterial color={isDead ? "#333" : "#2a3a2a"} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.46, 0.07, 0.24]} />
        <meshStandardMaterial color="#111" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.3, 1.08, 0]} rotation={[0, 0, 0.18]}>
        <mesh position={[0, -0.2, 0]}>
          <capsuleGeometry args={[0.07, 0.3, 4, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <sphereGeometry args={[0.075, 6, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <capsuleGeometry args={[0.06, 0.2, 4, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
      </group>

      {/* Right Arm + Gun */}
      <group ref={rightArmRef} position={[0.3, 1.08, 0]} rotation={[0, 0, -0.22]}>
        <mesh position={[0, -0.2, 0]}>
          <capsuleGeometry args={[0.07, 0.3, 4, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <sphereGeometry args={[0.075, 6, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <capsuleGeometry args={[0.06, 0.2, 4, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {!isDead && (
          <group position={[0.05, -0.7, 0.32]} rotation={[-0.45, 0, 0.1]}>
            <GunModel gunType="AK-47" />
          </group>
        )}
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.12, 0.62, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.38, 0.17]} />
          <meshStandardMaterial color={legColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 4, 6]} />
          <meshStandardMaterial color={isDead ? "#222" : "#0a0a2a"} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, 0.05]}>
          <boxGeometry args={[0.12, 0.08, 0.22]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.12, 0.62, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.38, 0.17]} />
          <meshStandardMaterial color={legColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 4, 6]} />
          <meshStandardMaterial color={isDead ? "#222" : "#0a0a2a"} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, 0.05]}>
          <boxGeometry args={[0.12, 0.08, 0.22]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
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
            <meshBasicMaterial color="#0000" />
          </mesh>
        </group>
      )}
    </group>
  );
}
