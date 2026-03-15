import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GunModelProps {
  gunType: string;
  isShootingRef?: React.MutableRefObject<boolean>;
  isReloadingRef?: React.MutableRefObject<boolean>;
}

export default function GunModel({ gunType, isShootingRef, isReloadingRef }: GunModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const recoilRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const isShooting = isShootingRef?.current ?? false;
    const isReloading = isReloadingRef?.current ?? false;

    if (isShooting) recoilRef.current = 0.08;
    recoilRef.current *= 0.7;
    groupRef.current.position.z = recoilRef.current;

    if (isReloading) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        Math.sin(Date.now() * 0.005) * 0.4 - 0.5,
        0.12,
      );
    } else {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0,
        0.15,
      );
    }
  });

  const metalMat = { metalness: 0.85, roughness: 0.15 };
  const woodColor = "#5a3a1a";
  const metalColor = "#1e1e1e";
  const darkMetal = "#111111";

  if (gunType === "AK-47") {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0.28]}>
          <boxGeometry args={[0.055, 0.095, 0.56]} />
          <meshStandardMaterial color={metalColor} {...metalMat} />
        </mesh>
        <mesh position={[0, 0.01, 0.64]}>
          <boxGeometry args={[0.032, 0.032, 0.32]} />
          <meshStandardMaterial color={darkMetal} metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[0, -0.105, 0.3]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.045, 0.185, 0.065]} />
          <meshStandardMaterial color={darkMetal} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.015, -0.05]}>
          <boxGeometry args={[0.045, 0.065, 0.28]} />
          <meshStandardMaterial color={woodColor} metalness={0} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.052, 0.28]}>
          <boxGeometry args={[0.018, 0.018, 0.42]} />
          <meshStandardMaterial color={metalColor} {...metalMat} />
        </mesh>
      </group>
    );
  }

  if (gunType === "SMG") {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0.18]}>
          <boxGeometry args={[0.05, 0.085, 0.38]} />
          <meshStandardMaterial color="#2a2a3a" {...metalMat} />
        </mesh>
        <mesh position={[0, 0, 0.42]}>
          <boxGeometry args={[0.028, 0.028, 0.22]} />
          <meshStandardMaterial color={darkMetal} metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[0, -0.09, 0.22]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.04, 0.15, 0.055]} />
          <meshStandardMaterial color={darkMetal} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.01, -0.02]}>
          <boxGeometry args={[0.04, 0.055, 0.14]} />
          <meshStandardMaterial color="#222233" {...metalMat} />
        </mesh>
      </group>
    );
  }

  if (gunType === "Sniper") {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0.35]}>
          <boxGeometry args={[0.048, 0.08, 0.7]} />
          <meshStandardMaterial color={metalColor} {...metalMat} />
        </mesh>
        <mesh position={[0, 0.005, 0.82]}>
          <boxGeometry args={[0.028, 0.028, 0.42]} />
          <meshStandardMaterial color={darkMetal} metalness={0.95} roughness={0.04} />
        </mesh>
        <mesh position={[0, -0.095, 0.38]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.038, 0.16, 0.055]} />
          <meshStandardMaterial color={darkMetal} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.008, -0.08]}>
          <boxGeometry args={[0.042, 0.072, 0.36]} />
          <meshStandardMaterial color={woodColor} metalness={0} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.06, 0.35]}>
          <boxGeometry args={[0.022, 0.035, 0.22]} />
          <meshStandardMaterial color="#1a3a1a" metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (gunType === "Shotgun") {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0.25]}>
          <boxGeometry args={[0.065, 0.065, 0.5]} />
          <meshStandardMaterial color={metalColor} {...metalMat} />
        </mesh>
        <mesh position={[0, 0, 0.52]}>
          <boxGeometry args={[0.055, 0.055, 0.16]} />
          <meshStandardMaterial color={darkMetal} metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.01, -0.05]}>
          <boxGeometry args={[0.05, 0.07, 0.3]} />
          <meshStandardMaterial color={woodColor} metalness={0} roughness={0.9} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[0.05, 0.08, 0.4]} />
        <meshStandardMaterial color={metalColor} {...metalMat} />
      </mesh>
    </group>
  );
}
