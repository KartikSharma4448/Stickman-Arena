import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore, ShootEvent } from "./store";

interface MuzzleFlashProps {
  position: THREE.Vector3;
  dir: THREE.Vector3;
  onDone: () => void;
}

function MuzzleFlash({ position, dir, onDone }: MuzzleFlashProps) {
  const ref = useRef<THREE.Group>(null!);
  const life = useRef(0.1);

  useFrame((_, delta) => {
    life.current -= delta;
    if (life.current <= 0) {
      onDone();
      return;
    }
    if (ref.current) {
      const s = (life.current / 0.1) * 0.22;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* bright core */}
      <mesh>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>
      {/* outer glow */}
      <mesh scale={[2, 2, 2]}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

interface BulletTrailProps {
  start: THREE.Vector3;
  dir: THREE.Vector3;
  onDone: () => void;
}

function BulletTrail({ start, dir, onDone }: BulletTrailProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const life = useRef(0.12);
  const TRAIL_LENGTH = 8;

  useFrame((_, delta) => {
    life.current -= delta;
    if (life.current <= 0) {
      onDone();
      return;
    }
    if (ref.current) {
      ref.current.material.opacity = (life.current / 0.12) * 0.85;
    }
  });

  const end = start.clone().addScaledVector(dir, TRAIL_LENGTH);
  const mid = start.clone().lerp(end, 0.5);
  const length = TRAIL_LENGTH;

  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const axis = up.clone().cross(dir.clone().normalize());
  if (axis.lengthSq() > 0.001) {
    axis.normalize();
    const angle = Math.acos(Math.min(1, up.dot(dir.clone().normalize())));
    quaternion.setFromAxisAngle(axis, angle);
  } else if (dir.y < 0) {
    quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  }

  return (
    <mesh position={mid} quaternion={quaternion} ref={ref}>
      <cylinderGeometry args={[0.015, 0.015, length, 4]} />
      <meshBasicMaterial color="#ffee66" transparent opacity={0.85} />
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
        const muzzle = origin.clone().addScaledVector(dir, 0.4);

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
