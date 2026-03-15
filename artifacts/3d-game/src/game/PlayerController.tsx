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

// PUBG-style third-person camera
const CAM_DIST = 3.5;
const CAM_HEIGHT = 1.55;
const CAM_SIDE = -0.55;
const CAM_SMOOTH = 12;

// FOV settings
const FOV_DEFAULT = 75;
const FOV_ADS = 55;       // ADS zoom for AK/SMG/Shotgun
const FOV_SNIPER = 18;    // Full scope zoom for Sniper

// Gun barrel offset from player center in local character space
const GUN_LOCAL_X = 0.25;
const GUN_LOCAL_Y = 0.95;
const GUN_LOCAL_Z = -0.65;
const BARREL_EXTRA = 0.85;

interface Props {
  spawnPos: THREE.Vector3;
  onShoot: (origin: THREE.Vector3, dir: THREE.Vector3) => void;
}

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
    pos.x + lx * cosY + lz * sinY,
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

    const COMBAT_X = -1.25;

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

    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.7;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.7;

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

      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.26, 1.28, 0]} rotation={[-1.25, 0.12, 0.16]}>
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.072, 0.28, 4, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <sphereGeometry args={[0.075, 6, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.52, 0]}>
          <capsuleGeometry args={[0.062, 0.22, 4, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.68, 0]}>
          <sphereGeometry args={[0.065, 6, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
      </group>

      {/* RIGHT ARM */}
      <group ref={rightArmRef} position={[0.28, 1.25, 0]} rotation={[-1.15, -0.08, -0.14]}>
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.072, 0.28, 4, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <sphereGeometry args={[0.075, 6, 6]} />
          <meshStandardMaterial color="#1a3a7a" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.52, 0]}>
          <capsuleGeometry args={[0.062, 0.22, 4, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.68, 0]}>
          <sphereGeometry args={[0.065, 6, 6]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.7} />
        </mesh>
      </group>

      {/* GUN */}
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

      {/* Shadow */}
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
  const pitchRef = useRef(-0.15);
  const yawRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastSendRef = useRef(0);
  const seqRef = useRef(0);
  const lastShotRef = useRef(0);

  // Smooth camera target
  const camPosRef = useRef(new THREE.Vector3());
  const camInitRef = useRef(false);

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
  const setIsScoped = useGameStore((s) => s.setIsScoped);

  const isScopedRef = useRef(false);

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
    camInitRef.current = false;
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
      const sens = 0.002;
      yawRef.current -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      // PUBG-like vertical range: can look up to ~80deg up/down
      pitchRef.current = Math.max(-1.3, Math.min(0.7, pitchRef.current));
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

  // Right-click = scope / ADS toggle
  useEffect(() => {
    const onRightDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      if (document.pointerLockElement !== document.body) return;
      isScopedRef.current = true;
      setIsScoped(true);
    };
    const onRightUp = (e: MouseEvent) => {
      if (e.button !== 2) return;
      isScopedRef.current = false;
      setIsScoped(false);
    };
    const onCtx = (e: Event) => e.preventDefault();
    window.addEventListener("mousedown", onRightDown);
    window.addEventListener("mouseup", onRightUp);
    document.addEventListener("contextmenu", onCtx);
    return () => {
      window.removeEventListener("mousedown", onRightDown);
      window.removeEventListener("mouseup", onRightUp);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, [setIsScoped]);

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

      // Bullet direction = exactly where crosshair (camera center) aims
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.normalize();

      // Visual origin = gun barrel tip (for muzzle flash placement)
      const yaw = yawRef.current;
      const barrelTip = localToWorld(
        posRef.current,
        yaw,
        GUN_LOCAL_X,
        GUN_LOCAL_Y + 0.05,
        GUN_LOCAL_Z - BARREL_EXTRA,
      );

      // For accuracy: bullet travels from camera's aim point, not barrel offset
      // This ensures crosshair = bullet path (PUBG behavior)
      const aimOrigin = camera.position.clone().addScaledVector(dir, 1.2);

      recordShot(false);
      onShoot(aimOrigin, dir);

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
      camInitRef.current = false;
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

    // --- PUBG-STYLE THIRD-PERSON CAMERA with smooth lerp ---
    // Target position: behind + right-side offset so player appears to the right of crosshair
    const targetCamX = posRef.current.x + sinY * CAM_DIST + cosY * CAM_SIDE;
    const targetCamY = posRef.current.y + CAM_HEIGHT;
    const targetCamZ = posRef.current.z + cosY * CAM_DIST - sinY * CAM_SIDE;

    const targetPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);

    if (!camInitRef.current) {
      // Instant snap on first frame / respawn
      camPosRef.current.copy(targetPos);
      camInitRef.current = true;
    } else {
      // Smooth follow — fast enough to feel responsive, smooth enough to avoid jitter
      const lerpFactor = 1 - Math.exp(-CAM_SMOOTH * delta);
      camPosRef.current.lerp(targetPos, lerpFactor);
    }

    camera.position.copy(camPosRef.current);

    // Camera rotation: use YXZ order for FPS/TPS look (yaw then pitch)
    camera.rotation.order = "YXZ";
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;
    camera.rotation.z = 0;

    // Smooth FOV zoom for scope / ADS
    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = isScopedRef.current
      ? selectedGun === "Sniper" ? FOV_SNIPER : FOV_ADS
      : FOV_DEFAULT;
    cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 1 - Math.exp(-14 * delta));
    cam.updateProjectionMatrix();

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
