import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "./store";
import { getSocket } from "./socket";
import { ARENA_BOUNDS, ARENA_BOXES } from "./Arena";
import GunModel from "./GunModel";

const MOVE_SPEED = 7;
const PLAYER_RADIUS = 0.35;
const SEND_RATE = 1000 / 20;
const JUMP_FORCE = 9;
const GRAVITY = -22;

const CAM_DIST = 4.2;
const CAM_HEIGHT = 2.0;
const CAM_SIDE = 0.5;

// Gun barrel offset from player center in local character space
// local (right=+X, up=+Y, forward=-Z)
const GUN_LOCAL_X = 0.25;
const GUN_LOCAL_Y = 0.95;
const GUN_LOCAL_Z = -0.65;
const BARREL_EXTRA = 0.85; // how far the barrel extends beyond GUN_LOCAL_Z

interface Props {
  spawnPos: THREE.Vector3;
  onShoot: (origin: THREE.Vector3, dir: THREE.Vector3) => void;
}

/** Converts character-local offset to world position given player pos + yaw */
function localToWorld(
  pos: THREE.Vector3,
  yaw: number,
  lx: number,
  ly: number,
  lz: number,
): THREE.Vector3 {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  return new THREE.Vector3(
    pos.x + lx * cosY - lz * sinY,
    pos.y + ly,
    pos.z - lx * sinY + lz * cosY,
  );
}

function LocalCharacter({
  posRef,
  yawRef,
  isMovingRef,
  isShootingRef,
  isReloadingRef,
  selectedGun,
}: {
  posRef: React.MutableRefObject<THREE.Vector3>;
  yawRef: React.MutableRefObject<number>;
  isMovingRef: React.MutableRefObject<boolean>;
  isShootingRef: React.MutableRefObject<boolean>;
  isReloadingRef: React.MutableRefObject<boolean>;
  selectedGun: string;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Mesh>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const gunGroupRef = useRef<THREE.Group>(null!);
  const walkCycle = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.position.copy(posRef.current);
    groupRef.current.rotation.y = yawRef.current;

    if (isMovingRef.current) {
      walkCycle.current += delta * 8.5;
    } else {
      walkCycle.current *= 0.88;
    }

    const swing = Math.sin(walkCycle.current) * 0.38;
    const bobY = Math.abs(Math.sin(walkCycle.current)) * (isMovingRef.current ? 0.038 : 0);

    if (bodyRef.current) bodyRef.current.position.y = 0.95 + bobY;

    // Arms stay in combat grip — just slight sway while walking
    const COMBAT_X = -1.25; // arms raised forward

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.x,
        isReloadingRef.current
          ? COMBAT_X + Math.sin(Date.now() * 0.005) * 0.4
          : COMBAT_X - swing * 0.12,
        0.2,
      );
    }

    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x,
        isReloadingRef.current
          ? COMBAT_X + Math.sin(Date.now() * 0.005 + 1.5) * 0.35
          : COMBAT_X + swing * 0.12,
        0.2,
      );
    }

    // Legs swing as normal
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.7;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.7;

    // Gun recoil / reload
    if (gunGroupRef.current) {
      if (isShootingRef.current) {
        gunGroupRef.current.position.z = THREE.MathUtils.lerp(
          gunGroupRef.current.position.z,
          0.14,
          0.4,
        );
      } else {
        gunGroupRef.current.position.z = THREE.MathUtils.lerp(
          gunGroupRef.current.position.z,
          0,
          0.25,
        );
      }
      if (isReloadingRef.current) {
        gunGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          gunGroupRef.current.rotation.x,
          -0.5 + Math.sin(Date.now() * 0.004) * 0.25,
          0.1,
        );
      } else {
        gunGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          gunGroupRef.current.rotation.x,
          0,
          0.15,
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.21, 10, 10]} />
        <meshStandardMaterial color="#ffcc88" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.68, 0.13]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color="#ffaa66" roughness={0.8} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.07, 1.72, 0.19]}>
        <sphereGeometry args={[0.025, 5, 5]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.07, 1.72, 0.19]}>
        <sphereGeometry args={[0.025, 5, 5]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.228, 8, 6]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.55} metalness={0.38} />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.44, 0.7, 0.22]} />
        <meshStandardMaterial color="#1a3a7a" roughness={0.7} metalness={0.08} />
      </mesh>
      {/* Tactical vest */}
      <mesh position={[0, 0.98, 0.01]}>
        <boxGeometry args={[0.36, 0.5, 0.24]} />
        <meshStandardMaterial color="#1e2e1e" roughness={0.85} />
      </mesh>
      {/* Vest pockets */}
      <mesh position={[-0.1, 1.05, 0.13]}>
        <boxGeometry args={[0.1, 0.1, 0.05]} />
        <meshStandardMaterial color="#161e16" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 1.05, 0.13]}>
        <boxGeometry args={[0.1, 0.1, 0.05]} />
        <meshStandardMaterial color="#161e16" roughness={0.9} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.64, 0]}>
        <boxGeometry args={[0.46, 0.07, 0.24]} />
        <meshStandardMaterial color="#111" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* LEFT ARM — combat grip (forward raise) */}
      <group ref={leftArmRef} position={[-0.26, 1.28, 0]} rotation={[-1.25, 0.12, 0.16]}>
        {/* Upper arm */}
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.072, 0.28, 4, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.7} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.38, 0]}>
          <sphereGeometry args={[0.075, 6, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.6} />
        </mesh>
        {/* Lower arm */}
        <mesh position={[0, -0.52, 0]}>
          <capsuleGeometry args={[0.062, 0.22, 4, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.75} />
        </mesh>
        {/* Left hand (grips gun front) */}
        <mesh position={[0, -0.68, 0]}>
          <sphereGeometry args={[0.065, 6, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
      </group>

      {/* RIGHT ARM — trigger hand, slight less forward angle */}
      <group ref={rightArmRef} position={[0.28, 1.25, 0]} rotation={[-1.15, -0.08, -0.14]}>
        {/* Upper arm */}
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.072, 0.28, 4, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.7} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.38, 0]}>
          <sphereGeometry args={[0.075, 6, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.6} />
        </mesh>
        {/* Lower arm */}
        <mesh position={[0, -0.52, 0]}>
          <capsuleGeometry args={[0.062, 0.22, 4, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.75} />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.68, 0]}>
          <sphereGeometry args={[0.065, 6, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
      </group>

      {/* GUN — attached to character (not arm) for precise world placement */}
      {/* position = local offset matching right hand position, rotation.y = PI to flip barrel forward */}
      <group
        ref={gunGroupRef}
        position={[GUN_LOCAL_X, GUN_LOCAL_Y, GUN_LOCAL_Z]}
        rotation={[0, Math.PI, 0]}
      >
        <GunModel
          gunType={selectedGun}
          isShootingRef={isShootingRef}
          isReloadingRef={isReloadingRef}
        />
      </group>

      {/* LEFT LEG */}
      <group ref={leftLegRef} position={[-0.13, 0.62, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.38, 0.17]} />
          <meshStandardMaterial color="#1a1a4a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.29, 0]}>
          <capsuleGeometry args={[0.072, 0.35, 4, 6]} />
          <meshStandardMaterial color="#0d0d2a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, 0.05]}>
          <boxGeometry args={[0.13, 0.09, 0.24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* RIGHT LEG */}
      <group ref={rightLegRef} position={[0.13, 0.62, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.38, 0.17]} />
          <meshStandardMaterial color="#1a1a4a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.29, 0]}>
          <capsuleGeometry args={[0.072, 0.35, 4, 6]} />
          <meshStandardMaterial color="#0d0d2a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, 0.05]}>
          <boxGeometry args={[0.13, 0.09, 0.24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* Soft shadow blob */}
      <mesh position={[0, -0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 12]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export default function PlayerController({ spawnPos, onShoot }: Props) {
  const { camera } = useThree();

  const posRef = useRef(spawnPos.clone());
  const velYRef = useRef(0);
  const onGroundRef = useRef(true);
  const pitchRef = useRef(-0.2);
  const yawRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastSendRef = useRef(0);
  const seqRef = useRef(0);
  const lastShotRef = useRef(0);

  const isMovingRef = useRef(false);
  const isShootingRef = useRef(false);
  const isReloadingRef = useRef(false);

  const isDead = useGameStore((s) => s.isDead);
  const setHealth = useGameStore((s) => s.setHealth);
  const setHitIndicator = useGameStore((s) => s.setHitIndicator);
  const ammo = useGameStore((s) => s.ammo);
  const reload = useGameStore((s) => s.reload);
  const setIsReloading = useGameStore((s) => s.setIsReloading);
  const recordShot = useGameStore((s) => s.recordShot);
  const selectedGun = useGameStore((s) => s.selectedGun);

  const fireRate: Record<string, number> = {
    "AK-47": 110,
    "SMG": 65,
    "Sniper": 850,
    "Shotgun": 520,
  };

  useEffect(() => {
    posRef.current.copy(spawnPos);
    velYRef.current = 0;
    onGroundRef.current = true;
  }, [spawnPos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      keysRef.current[e.code] = down;
      if (down && e.code === "Space" && onGroundRef.current && !isDead) {
        velYRef.current = JUMP_FORCE;
        onGroundRef.current = false;
      }
      if (down && e.code === "KeyR" && !isReloadingRef.current && ammo < 30) {
        isReloadingRef.current = true;
        setIsReloading(true);
        setTimeout(() => {
          reload();
          isReloadingRef.current = false;
        }, 1800);
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [isDead, ammo, reload, setIsReloading]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return;
      const sens = 0.0022;
      yawRef.current -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current));
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const onClick = () => {
      if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const checkCollision = useCallback((pos: THREE.Vector3): boolean => {
    if (Math.abs(pos.x) > ARENA_BOUNDS - PLAYER_RADIUS) return true;
    if (Math.abs(pos.z) > ARENA_BOUNDS - PLAYER_RADIUS) return true;
    for (const box of ARENA_BOXES) {
      if (
        pos.x + PLAYER_RADIUS > box.min.x &&
        pos.x - PLAYER_RADIUS < box.max.x &&
        pos.z + PLAYER_RADIUS > box.min.z &&
        pos.z - PLAYER_RADIUS < box.max.z
      ) {
        return true;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    const rate = fireRate[selectedGun] ?? 150;
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (document.pointerLockElement !== document.body) return;
      if (isDead || isReloadingRef.current) return;

      if (ammo <= 0) {
        if (!isReloadingRef.current) {
          isReloadingRef.current = true;
          setIsReloading(true);
          setTimeout(() => { reload(); isReloadingRef.current = false; }, 1800);
        }
        return;
      }

      const now = Date.now();
      if (now - lastShotRef.current < rate) return;
      lastShotRef.current = now;

      isShootingRef.current = true;
      setTimeout(() => { isShootingRef.current = false; }, 80);

      // Shoot origin = gun barrel world position
      const yaw = yawRef.current;
      const barrelTip = localToWorld(
        posRef.current,
        yaw,
        GUN_LOCAL_X,
        GUN_LOCAL_Y + 0.05,
        GUN_LOCAL_Z - BARREL_EXTRA,
      );

      // Direction = where camera looks (crosshair aim)
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.normalize();

      recordShot(false);
      onShoot(barrelTip, dir);

      getSocket().emit("shoot", {
        originX: barrelTip.x,
        originY: barrelTip.y,
        originZ: barrelTip.z,
        dirX: dir.x,
        dirY: dir.y,
        dirZ: dir.z,
      });
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [isDead, onShoot, ammo, reload, setIsReloading, recordShot, selectedGun]);

  useEffect(() => {
    const socket = getSocket();
    const onRespawn = (data: { x: number; y: number; z: number; health: number }) => {
      posRef.current.set(data.x, 0, data.z);
      velYRef.current = 0;
      onGroundRef.current = true;
      setHealth(data.health);
      isReloadingRef.current = false;
    };
    const onDamage = (data: { health: number }) => {
      setHealth(data.health);
      setHitIndicator(true);
      setTimeout(() => setHitIndicator(false), 300);
    };
    socket.on("respawn", onRespawn);
    socket.on("take_damage", onDamage);
    return () => {
      socket.off("respawn", onRespawn);
      socket.off("take_damage", onDamage);
    };
  }, []);

  useFrame((_, delta) => {
    if (isDead) return;

    const k = keysRef.current;
    const sinY = Math.sin(yawRef.current);
    const cosY = Math.cos(yawRef.current);
    const fwX = -sinY, fwZ = -cosY;
    const rtX = cosY, rtZ = -sinY;

    const moveDir = new THREE.Vector3();
    if (k["KeyW"] || k["ArrowUp"]) moveDir.add(new THREE.Vector3(fwX, 0, fwZ));
    if (k["KeyS"] || k["ArrowDown"]) moveDir.sub(new THREE.Vector3(fwX, 0, fwZ));
    if (k["KeyA"] || k["ArrowLeft"]) moveDir.sub(new THREE.Vector3(rtX, 0, rtZ));
    if (k["KeyD"] || k["ArrowRight"]) moveDir.add(new THREE.Vector3(rtX, 0, rtZ));

    isMovingRef.current = moveDir.lengthSq() > 0.01;
    if (isMovingRef.current) moveDir.normalize();

    const speed = MOVE_SPEED * delta;
    const tryX = posRef.current.clone().addScaledVector(new THREE.Vector3(moveDir.x, 0, 0), speed);
    const tryZ = posRef.current.clone().addScaledVector(new THREE.Vector3(0, 0, moveDir.z), speed);
    if (!checkCollision(tryX)) posRef.current.x = tryX.x;
    if (!checkCollision(tryZ)) posRef.current.z = tryZ.z;

    // Gravity + jump
    velYRef.current += GRAVITY * delta;
    posRef.current.y += velYRef.current * delta;
    if (posRef.current.y <= 0) {
      posRef.current.y = 0;
      velYRef.current = 0;
      onGroundRef.current = true;
    }

    // --- THIRD-PERSON CAMERA (PUBG) ---
    const camX = posRef.current.x + sinY * CAM_DIST + cosY * CAM_SIDE;
    const camY = posRef.current.y + CAM_HEIGHT;
    const camZ = posRef.current.z + cosY * CAM_DIST - sinY * CAM_SIDE;
    camera.position.set(camX, camY, camZ);

    const lookDist = 7.5;
    const pitch = pitchRef.current;
    const lookX = posRef.current.x - sinY * lookDist;
    const lookY = posRef.current.y + 1.15 + Math.sin(pitch) * 3;
    const lookZ = posRef.current.z - cosY * lookDist;
    camera.lookAt(lookX, lookY, lookZ);

    // Network send
    const now = Date.now();
    if (now - lastSendRef.current > SEND_RATE) {
      lastSendRef.current = now;
      seqRef.current++;
      getSocket().emit("player_input", {
        x: posRef.current.x,
        y: posRef.current.y,
        z: posRef.current.z,
        rotY: yawRef.current,
        pitchX: pitchRef.current,
        seq: seqRef.current,
      });
    }
  });

  return (
    <LocalCharacter
      posRef={posRef}
      yawRef={yawRef}
      isMovingRef={isMovingRef}
      isShootingRef={isShootingRef}
      isReloadingRef={isReloadingRef}
      selectedGun={selectedGun}
    />
  );
}
