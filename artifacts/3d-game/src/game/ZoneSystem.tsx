import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, ZONE_PHASES } from "./store";

export default function ZoneSystem() {
  const ringRef = useRef<THREE.Mesh>(null!);
  const dangerRef = useRef<THREE.Mesh>(null!);
  const phaseStartRadius = useRef(74);

  const zoneRadius = useGameStore((s) => s.zoneRadius);

  useFrame((_, delta) => {
    const s = useGameStore.getState();
    if (s.currentMap !== "barmuda") return;
    if (s.barmudaDropping) return;
    if (s.eliminated) return;

    if (s.zoneShrinking) {
      const phase = ZONE_PHASES[s.zonePhase];
      if (!phase) return;
      const totalShrink = phaseStartRadius.current - phase.radius;
      const shrinkRate = totalShrink / Math.max(1, phase.shrinkTime);
      const newRadius = Math.max(phase.radius, s.zoneRadius - shrinkRate * delta);
      s.setZoneRadius(newRadius);

      if (newRadius <= phase.radius + 0.1) {
        s.setZoneRadius(phase.radius);
        s.setZoneShrinking(false);
        const nextPhase = s.zonePhase + 1;
        if (nextPhase < ZONE_PHASES.length) {
          s.setZonePhase(nextPhase);
          s.setZoneTimer(ZONE_PHASES[nextPhase]?.waitTime ?? 0);
          s.setZoneTargetRadius(ZONE_PHASES[nextPhase]?.radius ?? 0);
          phaseStartRadius.current = phase.radius;
        }
      }
    } else {
      const newTimer = Math.max(0, s.zoneTimer - delta);
      s.setZoneTimer(newTimer);

      if (newTimer <= 0 && s.zonePhase < ZONE_PHASES.length) {
        phaseStartRadius.current = s.zoneRadius;
        s.setZoneShrinking(true);
      }
    }

    if (ringRef.current) {
      const r = s.zoneRadius;
      const geo = ringRef.current.geometry as THREE.RingGeometry;
      if (Math.abs(r - (geo.parameters as any)?.outerRadius) > 0.5) {
        ringRef.current.geometry.dispose();
        ringRef.current.geometry = new THREE.RingGeometry(r - 0.3, r + 0.3, 128);
      }
    }
    if (dangerRef.current) {
      const r = s.zoneRadius;
      const geo = dangerRef.current.geometry as THREE.RingGeometry;
      if (Math.abs(r - (geo.parameters as any)?.innerRadius) > 0.5) {
        dangerRef.current.geometry.dispose();
        dangerRef.current.geometry = new THREE.RingGeometry(r + 0.3, 200, 128);
      }
    }
  });

  return (
    <group>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.15, 0]}
      >
        <ringGeometry args={[zoneRadius - 0.3, zoneRadius + 0.3, 128]} />
        <meshBasicMaterial
          color="#00aaff"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        ref={dangerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.12, 0]}
      >
        <ringGeometry args={[zoneRadius + 0.3, 200, 128]} />
        <meshBasicMaterial
          color="#ff2244"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 64 }).map((_, i) => {
        const angle = (i / 64) * Math.PI * 2;
        const x = Math.cos(angle) * zoneRadius;
        const z = Math.sin(angle) * zoneRadius;
        return (
          <mesh key={i} position={[x, 4, z]}>
            <boxGeometry args={[0.15, 8, 0.15]} />
            <meshBasicMaterial color="#00aaff" transparent opacity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}
