import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, ZONE_PHASES } from "./store";

const PILLAR_COUNT = 24;

export default function ZoneSystem() {
  const ringRef = useRef<THREE.Mesh>(null!);
  const dangerRef = useRef<THREE.Mesh>(null!);
  const pillarsRef = useRef<THREE.InstancedMesh>(null!);
  const phaseStartRadius = useRef(74);
  const lastTimerWrite = useRef(0);
  const lastRadiusWrite = useRef(74);

  const pillarDummy = useMemo(() => new THREE.Object3D(), []);

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

      if (Math.abs(newRadius - lastRadiusWrite.current) > 0.3) {
        s.setZoneRadius(newRadius);
        lastRadiusWrite.current = newRadius;
      }

      if (newRadius <= phase.radius + 0.1) {
        s.setZoneRadius(phase.radius);
        lastRadiusWrite.current = phase.radius;
        s.setZoneShrinking(false);
        const nextPhase = s.zonePhase + 1;
        if (nextPhase < ZONE_PHASES.length) {
          s.setZonePhase(nextPhase);
          s.setZoneTimer(ZONE_PHASES[nextPhase]?.waitTime ?? 0);
          lastTimerWrite.current = ZONE_PHASES[nextPhase]?.waitTime ?? 0;
          s.setZoneTargetRadius(ZONE_PHASES[nextPhase]?.radius ?? 0);
          phaseStartRadius.current = phase.radius;
        }
      }
    } else {
      const newTimer = Math.max(0, s.zoneTimer - delta);
      if (Math.abs(newTimer - lastTimerWrite.current) >= 1 || newTimer <= 0) {
        s.setZoneTimer(newTimer);
        lastTimerWrite.current = newTimer;
      }

      if (newTimer <= 0 && s.zonePhase < ZONE_PHASES.length) {
        phaseStartRadius.current = s.zoneRadius;
        s.setZoneShrinking(true);
      }
    }

    const r = s.zoneRadius;

    if (ringRef.current) {
      ringRef.current.scale.set(r / 74, r / 74, 1);
    }
    if (dangerRef.current) {
      const s2 = r / 74;
      dangerRef.current.scale.set(s2, s2, 1);
    }

    if (pillarsRef.current) {
      for (let i = 0; i < PILLAR_COUNT; i++) {
        const angle = (i / PILLAR_COUNT) * Math.PI * 2;
        pillarDummy.position.set(Math.cos(angle) * r, 4, Math.sin(angle) * r);
        pillarDummy.updateMatrix();
        pillarsRef.current.setMatrixAt(i, pillarDummy.matrix);
      }
      pillarsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.15, 0]}
      >
        <ringGeometry args={[73.7, 74.3, 64]} />
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
        <ringGeometry args={[74.3, 200, 64]} />
        <meshBasicMaterial
          color="#ff2244"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, PILLAR_COUNT]}>
        <boxGeometry args={[0.15, 8, 0.15]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.2} />
      </instancedMesh>
    </group>
  );
}
