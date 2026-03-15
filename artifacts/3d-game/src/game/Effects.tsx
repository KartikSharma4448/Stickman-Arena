import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore, ShootEvent } from "./store";

interface MuzzleFlashProps {
  position: THREE.Vector3;
  dir: THREE.Vector3;
  onDone: () => void;
}

function MuzzleFlash({ position, onDone }: MuzzleFlashProps) {
  const ref = useRef<THREE.Group>(null!);
  const life = useRef(0.08);

  useFrame((_, delta) => {
    life.current -= delta;
    if (life.current <= 0) {
      onDone();
      return;
    }
    if (ref.current) {
      const t = life.current / 0.08;
      ref.current.scale.setScalar(t * 0.28);
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>
      <mesh scale={[2.2, 2.2, 2.2]}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

interface BulletTrailProps {
  start: THREE.Vector3;
  dir: THREE.Vector3;
  onDone: () => void;
}

// Bullet moves forward at high speed — simulates actual projectile travel
function BulletTrail({ start, dir, onDone }: BulletTrailProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const life = useRef(0.18);
  const BULLET_SPEED = 120; // units/sec — fast enough to feel instant but visible
  const TRAIL_LENGTH = 5;
  const traveled = useRef(0);

  useFrame((_, delta) => {
    life.current -= delta;
    if (life.current <= 0) {
      onDone();
      return;
    }
    if (!ref.current) return;

    traveled.current += BULLET_SPEED * delta;

    // Head of bullet
    const head = start.clone().addScaledVector(dir, traveled.current);
    // Tail of bullet
    const tail = start.clone().addScaledVector(dir, Math.max(0, traveled.current - TRAIL_LENGTH));
    // Midpoint = mesh center
    const mid = head.clone().lerp(tail, 0.5);
    const segLength = head.distanceTo(tail);

    ref.current.position.copy(mid);

    // Rotate cylinder to point along dir
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(up, dir.clone().normalize());
    ref.current.quaternion.copy(quat);

    // Scale length dynamically
    ref.current.scale.set(1, segLength, 1);

    // Fade out
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = (life.current / 0.18) * 0.9;
  });

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.018, 0.018, 1, 4]} />
      <meshBasicMaterial color="#ffe866" transparent opacity={0.9} />
    </mesh>
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
  localShots.push({
    id: ++localShotId,
    origin: origin.clone(),
    dir: dir.clone(),
    time: Date.now(),
  });
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
        const dir = new THREE.Vector3(ev.dirX, ev.dirY, ev.dirZ).normalize();
        const muzzle = origin.clone().addScaledVector(dir, 0.3);

        return (
          <group key={ev.id}>
            <MuzzleFlash
              position={muzzle}
              dir={dir}
              onDone={() => {
                clearShootEvent(ev.id);
                activeRef.current.delete(ev.id);
              }}
            />
            <BulletTrail start={origin} dir={dir} onDone={() => {}} />
          </group>
        );
      })}
    </>
  );
}
