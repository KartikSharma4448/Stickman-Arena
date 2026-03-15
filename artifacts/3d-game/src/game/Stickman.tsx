import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RemotePlayer } from "./store";

interface StickmanProps {
  player: RemotePlayer;
  isLocal?: boolean;
}

export default function Stickman({ player, isLocal }: StickmanProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lerpedPos = useRef(new THREE.Vector3(player.x, player.y, player.z));
  const lerpedRotY = useRef(player.rotY);

  useFrame(() => {
    if (!groupRef.current || isLocal) return;
    lerpedPos.current.lerp(
      new THREE.Vector3(player.x, player.y, player.z),
      0.25,
    );
    lerpedRotY.current +=
      (player.rotY - lerpedRotY.current) * 0.25;
    groupRef.current.position.copy(lerpedPos.current);
    groupRef.current.rotation.y = lerpedRotY.current;
  });

  const isDead = player.health <= 0;
  const headColor = isDead ? "#888" : "#ffcc88";
  const bodyColor = isDead ? "#555" : "#3366cc";
  const limbColor = isDead ? "#555" : "#3366cc";

  return (
    <group
      ref={groupRef}
      position={[player.x, player.y, player.z]}
      rotation={[0, player.rotY, 0]}
    >
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshLambertMaterial color={headColor} />
      </mesh>

      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.4, 0.7, 0.2]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>

      <mesh position={[-0.3, 1.0, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 6]} />
        <meshLambertMaterial color={limbColor} />
      </mesh>
      <mesh position={[0.3, 1.0, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 6]} />
        <meshLambertMaterial color={limbColor} />
      </mesh>

      <mesh position={[-0.12, 0.3, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 6]} />
        <meshLambertMaterial color={limbColor} />
      </mesh>
      <mesh position={[0.12, 0.3, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 6]} />
        <meshLambertMaterial color={limbColor} />
      </mesh>

      {!isDead && (
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.005]} />
          <meshBasicMaterial color="#333" />
        </mesh>
      )}
      {!isDead && (
        <mesh
          position={[0, 2.1, 0.001]}
          scale={[Math.max(0, player.health / 100), 1, 1]}
        >
          <boxGeometry args={[0.5, 0.08, 0.005]} />
          <meshBasicMaterial
            color={
              player.health > 60
                ? "#00ff44"
                : player.health > 30
                  ? "#ffaa00"
                  : "#ff2200"
            }
          />
        </mesh>
      )}
    </group>
  );
}
