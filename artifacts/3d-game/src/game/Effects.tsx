import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore, ShootEvent } from "./store";

interface MuzzleFlashProps {
  position: THREE.Vector3;
  onDone: () => void;
}

function MuzzleFlash({ position, onDone }: MuzzleFlashProps) {
  const ref = useRef<THREE.Mesh>(null);
  const life = useRef(0.12);

  useFrame((_, delta) => {
    life.current -= delta;
    if (life.current <= 0) {
      onDone();
      return;
    }
    if (ref.current) {
      const s = (life.current / 0.12) * 0.25;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffdd44" transparent opacity={0.9} />
    </mesh>
  );
}

interface BulletTrailProps {
  event: ShootEvent;
  onDone: () => void;
}

function BulletTrail({ event, onDone }: BulletTrailProps) {
  const ref = useRef<THREE.Line>(null);
  const life = useRef(0.08);
  const TRAIL_LENGTH = 6;

  useFrame((_, delta) => {
    life.current -= delta;
    if (life.current <= 0) {
      onDone();
    }
  });

  const start = new THREE.Vector3(event.originX, event.originY, event.originZ);
  const end = new THREE.Vector3(
    event.originX + event.dirX * TRAIL_LENGTH,
    event.originY + event.dirY * TRAIL_LENGTH,
    event.originZ + event.dirZ * TRAIL_LENGTH,
  );

  const points = [start, end];
  const geom = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line ref={ref} geometry={geom}>
      <lineBasicMaterial color="#ffff88" transparent opacity={0.7} />
    </line>
  );
}

interface LocalShot {
  id: number;
  origin: THREE.Vector3;
  dir: THREE.Vector3;
  time: number;
}

const localShots: LocalShot[] = [];
let localShotId = 0;

export function addLocalShot(origin: THREE.Vector3, dir: THREE.Vector3) {
  localShots.push({ id: ++localShotId, origin: origin.clone(), dir: dir.clone(), time: Date.now() });
}

export default function Effects() {
  const shootEvents = useGameStore((s) => s.shootEvents);
  const clearShootEvent = useGameStore((s) => s.clearShootEvent);
  const activeRef = useRef<Set<number>>(new Set());

  return (
    <>
      {shootEvents.map((ev) => {
        if (activeRef.current.has(ev.id)) return null;
        activeRef.current.add(ev.id);
        const origin = new THREE.Vector3(ev.originX, ev.originY, ev.originZ);
        const muzzle = origin
          .clone()
          .addScaledVector(
            new THREE.Vector3(ev.dirX, ev.dirY, ev.dirZ),
            0.5,
          );
        return (
          <group key={ev.id}>
            <MuzzleFlash
              position={muzzle}
              onDone={() => {
                clearShootEvent(ev.id);
                activeRef.current.delete(ev.id);
              }}
            />
            <BulletTrail
              event={ev}
              onDone={() => {}}
            />
          </group>
        );
      })}
    </>
  );
}
