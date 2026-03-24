import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "./store";
import { getSocket } from "./socket";
import { ARENA_BOUNDS } from "./Arena";
import { sharedArena } from "./arenaShared";
import GunModel from "./GunModel";
import { touchState, touchJumpPending, clearTouchJump, touchScopeActive, touchShootPending, clearTouchShoot } from "./TouchControls";
import { GUN_CONFIG } from "./gunConfig";
import { BARMUDA_LOOT } from "./Arena5";

const MOVE_SPEED = 7;
const PLAYER_RADIUS = 0.35;
const SEND_RATE = 1000 / 20;
const JUMP_FORCE = 9;
const GRAVITY = -22;
const PARACHUTE_GRAVITY = -3.5;
const LOOT_PICKUP_RADIUS = 2.0;

const EYE_HEIGHT = 1.63;
const FOV_DEFAULT = 75;
const FOV_ADS = 55;
const FOV_SNIPER = 18;
const GUN_LOCAL_X = 0.25;
const GUN_LOCAL_Y = 0.95;
const GUN_LOCAL_Z = -0.65;

interface Props {
  spawnPos: THREE.Vector3;
  onShoot: (origin: THREE.Vector3, dir: THREE.Vector3) => void;
}

function localToWorld(
  pos: THREE.Vector3, yaw: number,
  lx: number, ly: number, lz: number,
): THREE.Vector3 {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  return new THREE.Vector3(
    pos.x + lx * cosY + lz * sinY,
    pos.y + ly,
    pos.z - lx * sinY + lz * cosY,
  );
}

// ── Parachute visual (above local player during drop) ─────────────────────
function Parachute({ posRef }: { posRef: React.MutableRefObject<THREE.Vector3> }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(posRef.current.x, posRef.current.y + 5, posRef.current.z);
    }
  });
  return (
    <group ref={ref}>
      {/* Canopy */}
      <mesh>
        <sphereGeometry args={[2.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#ff6b35" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      {/* Cords */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 1.8, -1, Math.cos(a) * 1.8]} rotation={[0, 0, Math.atan2(Math.sin(a) * 1.8, -4)]}>
            <cylinderGeometry args={[0.015, 0.015, 4.5, 4]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
        );
      })}
    </group>
  );
}

function LocalCharacter({
  posRef, yawRef, isMovingRef, isShootingRef, isReloadingRef, selectedGun, hasGun,
}: {
  posRef: React.MutableRefObject<THREE.Vector3>;
  yawRef: React.MutableRefObject<number>;
  isMovingRef: React.MutableRefObject<boolean>;
  isShootingRef: React.MutableRefObject<boolean>;
  isReloadingRef: React.MutableRefObject<boolean>;
  selectedGun: string;
  hasGun: boolean;
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
    groupRef.current.rotation.y = yawRef.current + Math.PI;

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
        isReloadingRef.current ? COMBAT_X + Math.sin(Date.now() * 0.005) * 0.4 : COMBAT_X - swing * 0.12,
        0.2,
      );
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x,
        isReloadingRef.current ? COMBAT_X + Math.sin(Date.now() * 0.005 + 1.5) * 0.35 : COMBAT_X + swing * 0.12,
        0.2,
      );
    }
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.7;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.7;

    if (gunGroupRef.current) {
      if (isShootingRef.current) {
        gunGroupRef.current.position.z = THREE.MathUtils.lerp(gunGroupRef.current.position.z, 0.14, 0.4);
      } else {
        gunGroupRef.current.position.z = THREE.MathUtils.lerp(gunGroupRef.current.position.z, 0, 0.25);
      }
      if (isReloadingRef.current) {
        gunGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          gunGroupRef.current.rotation.x, -0.5 + Math.sin(Date.now() * 0.004) * 0.25, 0.1,
        );
      } else {
        gunGroupRef.current.rotation.x = THREE.MathUtils.lerp(gunGroupRef.current.rotation.x, 0, 0.15);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* HEAD */}
      <mesh position={[0, 1.65, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#f5b78f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.42, 0.22, 0.42]} />
        <meshStandardMaterial color="#6b3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.09, 1.66, 0.201]}>
        <boxGeometry args={[0.09, 0.07, 0.01]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[0.09, 1.66, 0.201]}>
        <boxGeometry args={[0.09, 0.07, 0.01]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[0, 1.58, 0.201]}>
        <boxGeometry args={[0.14, 0.04, 0.01]} />
        <meshBasicMaterial color="#8b4513" />
      </mesh>

      {/* BODY */}
      <mesh ref={bodyRef} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.44, 0.52, 0.22]} />
        <meshStandardMaterial color="#3a6bc4" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.95, 0.112]}>
        <boxGeometry args={[0.44, 0.52, 0.01]} />
        <meshStandardMaterial color="#2a5aaa" roughness={0.85} />
      </mesh>

      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.26, 1.28, 0]} rotation={[-1.25, 0.12, 0.16]}>
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.2, 0.48, 0.22]} />
          <meshStandardMaterial color="#3a6bc4" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color="#f5b78f" roughness={0.85} />
        </mesh>
      </group>

      {/* RIGHT ARM */}
      <group ref={rightArmRef} position={[0.28, 1.25, 0]} rotation={[-1.15, -0.08, -0.14]}>
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.2, 0.48, 0.22]} />
          <meshStandardMaterial color="#3a6bc4" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color="#f5b78f" roughness={0.85} />
        </mesh>
      </group>

      {/* GUN — only shown when player has one */}
      {hasGun && (
        <group ref={gunGroupRef} position={[GUN_LOCAL_X, GUN_LOCAL_Y, GUN_LOCAL_Z]} rotation={[0, Math.PI, 0]}>
          <GunModel gunType={selectedGun} isShootingRef={isShootingRef} isReloadingRef={isReloadingRef} />
        </group>
      )}

      {/* LEFT LEG */}
      <group ref={leftLegRef} position={[-0.11, 0.68, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.2, 0.64, 0.22]} />
          <meshStandardMaterial color="#2a3a9c" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.67, 0.02]}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* RIGHT LEG */}
      <group ref={rightLegRef} position={[0.11, 0.68, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.2, 0.64, 0.22]} />
          <meshStandardMaterial color="#2a3a9c" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.67, 0.02]}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* SHADOW */}
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
  const isTpp = useGameStore((s) => s.isTpp);
  const isTppRef = useRef(isTpp);
  useEffect(() => { isTppRef.current = isTpp; }, [isTpp]);

  const currentMap = useGameStore((s) => s.currentMap);
  const currentMapRef = useRef(currentMap);
  useEffect(() => { currentMapRef.current = currentMap; }, [currentMap]);

  // Barmuda-specific
  const hasGun = useGameStore((s) => s.hasGun);
  const hasGunRef = useRef(hasGun);
  useEffect(() => { hasGunRef.current = hasGun; }, [hasGun]);

  const barmudaDropping = useGameStore((s) => s.barmudaDropping);
  const barmudaDroppingRef = useRef(barmudaDropping);
  useEffect(() => { barmudaDroppingRef.current = barmudaDropping; }, [barmudaDropping]);

  const setBarmudaDropping = useGameStore((s) => s.setBarmudaDropping);
  const setBarmudaDropAlt = useGameStore((s) => s.setBarmudaDropAlt);
  const setNearbyLoot = useGameStore((s) => s.setNearbyLoot);
  const pickupLoot = useGameStore((s) => s.pickupLoot);
  const pickedUpLoot = useGameStore((s) => s.pickedUpLoot);
  const pickedUpLootRef = useRef(pickedUpLoot);
  useEffect(() => { pickedUpLootRef.current = pickedUpLoot; }, [pickedUpLoot]);

  const livesLeft = useGameStore((s) => s.livesLeft);
  const setLivesLeft = useGameStore((s) => s.setLivesLeft);
  const livesLeftRef = useRef(livesLeft);
  useEffect(() => { livesLeftRef.current = livesLeft; }, [livesLeft]);

  const setEliminated = useGameStore((s) => s.setEliminated);
  const setIsDead = useGameStore((s) => s.setIsDead);
  const addDeath = useGameStore((s) => s.addDeath);

  const isScopedRef = useRef(false);
  const mouseHeldRef = useRef(false);
  const singleShotFiredRef = useRef(false);

  // ── Barmuda drop: set high Y on spawn ─────────────────────────────────
  useEffect(() => {
    if (currentMap === "barmuda" && barmudaDropping) {
      posRef.current.set(
        (Math.random() - 0.5) * 20,
        80,
        (Math.random() - 0.5) * 20,
      );
      velYRef.current = 0;
      onGroundRef.current = false;
    }
  }, [barmudaDropping, currentMap]);

  useEffect(() => {
    posRef.current.copy(spawnPos);
    velYRef.current = 0;
    onGroundRef.current = true;
  }, [spawnPos]);

  // ── Lives: when player dies on Barmuda ──────────────────────────────────
  useEffect(() => {
    if (!isDead) return;
    if (currentMapRef.current !== "barmuda") return;
    const newLives = livesLeftRef.current - 1;
    setLivesLeft(newLives);
    if (newLives <= 0) {
      setEliminated(true);
    }
  }, [isDead]);

  // ── E key: pickup loot ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && currentMapRef.current === "barmuda") {
        const store = useGameStore.getState();
        if (store.nearbyLootIndex !== null && store.nearbyLootGun !== null) {
          pickupLoot(store.nearbyLootIndex, store.nearbyLootGun);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickupLoot]);

  // ── Standard key/mouse controls ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      keysRef.current[e.code] = down;
      if (down && e.code === "Space" && onGroundRef.current && !isDead && !barmudaDroppingRef.current) {
        velYRef.current = JUMP_FORCE;
        onGroundRef.current = false;
      }
      const cfg = GUN_CONFIG[selectedGun] ?? GUN_CONFIG["AK-47"];
      if (down && e.code === "KeyR" && hasGunRef.current && !isReloadingRef.current && ammo < cfg.ammoCapacity) {
        isReloadingRef.current = true;
        setIsReloading(true);
        setTimeout(() => { reload(); isReloadingRef.current = false; }, cfg.reloadTime);
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
  }, [isDead, ammo, reload, setIsReloading, selectedGun]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return;
      const sens = 0.002;
      yawRef.current -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      pitchRef.current = Math.max(-1.3, Math.min(0.7, pitchRef.current));
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const onClick = () => {
      if (document.pointerLockElement !== document.body) document.body.requestPointerLock();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

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

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button === 0) { mouseHeldRef.current = true; singleShotFiredRef.current = false; }
    };
    const onUp = (e: MouseEvent) => {
      if (e.button === 0) { mouseHeldRef.current = false; singleShotFiredRef.current = false; }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const checkCollision = useCallback((pos: THREE.Vector3): boolean => {
    const bounds = sharedArena.bounds || ARENA_BOUNDS;
    if (Math.abs(pos.x) > bounds - PLAYER_RADIUS) return true;
    if (Math.abs(pos.z) > bounds - PLAYER_RADIUS) return true;
    for (const box of sharedArena.boxes) {
      if (
        pos.x + PLAYER_RADIUS > box.min.x &&
        pos.x - PLAYER_RADIUS < box.max.x &&
        pos.z + PLAYER_RADIUS > box.min.z &&
        pos.z - PLAYER_RADIUS < box.max.z
      ) {
        if (pos.y >= box.max.y - 0.06) continue;
        return true;
      }
    }
    return false;
  }, []);

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
    const onKilled = () => {
      if (currentMapRef.current === "barmuda") {
        const newLives = livesLeftRef.current - 1;
        setLivesLeft(newLives);
        livesLeftRef.current = newLives;
        if (newLives <= 0) {
          setEliminated(true);
        }
      }
    };
    socket.on("respawn", onRespawn);
    socket.on("take_damage", onDamage);
    socket.on("killed", onKilled);
    return () => {
      socket.off("respawn", onRespawn);
      socket.off("take_damage", onDamage);
      socket.off("killed", onKilled);
    };
  }, []);

  useFrame((_, delta) => {
    if (isDead) return;

    const k = keysRef.current;
    const sinY = Math.sin(yawRef.current);
    const cosY = Math.cos(yawRef.current);
    const fwX = -sinY, fwZ = -cosY;
    const rtX = cosY, rtZ = -sinY;

    // Touch look
    if (touchState.lookJoystick.deltaX !== 0 || touchState.lookJoystick.deltaY !== 0) {
      yawRef.current -= touchState.lookJoystick.deltaX * 0.005;
      pitchRef.current -= touchState.lookJoystick.deltaY * 0.005;
      pitchRef.current = Math.max(-1.3, Math.min(0.7, pitchRef.current));
      touchState.lookJoystick.deltaX = 0;
      touchState.lookJoystick.deltaY = 0;
    }

    const moveDir = new THREE.Vector3();
    if (k["KeyW"] || k["ArrowUp"])    moveDir.add(new THREE.Vector3(fwX, 0, fwZ));
    if (k["KeyS"] || k["ArrowDown"])  moveDir.sub(new THREE.Vector3(fwX, 0, fwZ));
    if (k["KeyA"] || k["ArrowLeft"])  moveDir.sub(new THREE.Vector3(rtX, 0, rtZ));
    if (k["KeyD"] || k["ArrowRight"]) moveDir.add(new THREE.Vector3(rtX, 0, rtZ));

    // Touch movement
    if (touchState.moveJoystick.active) {
      const tdx = Math.min(1, Math.max(-1, touchState.moveJoystick.dx));
      const tdy = Math.min(1, Math.max(-1, touchState.moveJoystick.dy));
      if (Math.abs(tdx) > 0.05 || Math.abs(tdy) > 0.05) {
        moveDir.add(new THREE.Vector3(fwX * -tdy + rtX * tdx, 0, fwZ * -tdy + rtZ * tdx));
      }
    }

    isMovingRef.current = moveDir.lengthSq() > 0.01;
    if (isMovingRef.current) moveDir.normalize();

    const speed = MOVE_SPEED * delta;

    // ── BARMUDA DROP phase — no collision, gentle gravity ─────────────────
    if (barmudaDroppingRef.current) {
      const hSpeed = MOVE_SPEED * 0.7 * delta;
      posRef.current.x += moveDir.x * hSpeed;
      posRef.current.z += moveDir.z * hSpeed;
      velYRef.current += PARACHUTE_GRAVITY * delta;
      posRef.current.y += velYRef.current * delta;

      setBarmudaDropAlt(Math.max(0, posRef.current.y));

      if (posRef.current.y <= 0) {
        posRef.current.y = 0;
        velYRef.current = 0;
        onGroundRef.current = true;
        setBarmudaDropping(false);
        barmudaDroppingRef.current = false;
      }
    } else {
      // Normal movement with collision
      const tryX = posRef.current.clone().addScaledVector(new THREE.Vector3(moveDir.x, 0, 0), speed);
      const tryZ = posRef.current.clone().addScaledVector(new THREE.Vector3(0, 0, moveDir.z), speed);
      if (!checkCollision(tryX)) posRef.current.x = tryX.x;
      if (!checkCollision(tryZ)) posRef.current.z = tryZ.z;

      // Touch jump
      if (touchJumpPending && onGroundRef.current) {
        velYRef.current = JUMP_FORCE;
        onGroundRef.current = false;
        clearTouchJump();
      }

      // Gravity
      velYRef.current += GRAVITY * delta;
      posRef.current.y += velYRef.current * delta;
      onGroundRef.current = false;

      // Ground / platform detection
      let groundY = 0;
      const px = posRef.current.x;
      const pz = posRef.current.z;
      for (const box of sharedArena.boxes) {
        if (
          px + PLAYER_RADIUS > box.min.x &&
          px - PLAYER_RADIUS < box.max.x &&
          pz + PLAYER_RADIUS > box.min.z &&
          pz - PLAYER_RADIUS < box.max.z
        ) {
          if (velYRef.current <= 0.05) {
            groundY = Math.max(groundY, box.max.y);
          }
          if (velYRef.current > 0) {
            const headY = posRef.current.y + EYE_HEIGHT;
            if (headY > box.min.y && headY - velYRef.current * delta <= box.min.y) {
              velYRef.current = 0;
            }
          }
        }
      }

      if (posRef.current.y <= groundY) {
        posRef.current.y = groundY;
        velYRef.current = 0;
        onGroundRef.current = true;
      }
    }

    // ── Loot proximity check (Barmuda only) ─────────────────────────────
    if (currentMapRef.current === "barmuda" && !barmudaDroppingRef.current) {
      let closestDist = LOOT_PICKUP_RADIUS;
      let closestIdx: number | null = null;
      let closestGun: string | null = null;
      for (let i = 0; i < BARMUDA_LOOT.length; i++) {
        if (pickedUpLootRef.current.includes(i)) continue;
        const item = BARMUDA_LOOT[i];
        const dx = posRef.current.x - item.x;
        const dz = posRef.current.z - item.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
          closestGun = item.gun;
        }
      }
      setNearbyLoot(closestGun, closestIdx);
    } else if (currentMapRef.current !== "barmuda") {
      // Clear nearby loot on non-barmuda maps
    }

    // ── Camera (FPP or TPP) ──────────────────────────────────────────────
    camera.rotation.order = "YXZ";
    camera.rotation.z = 0;

    if (isTppRef.current) {
      const tppDist = 3.8;
      const tppHeight = barmudaDroppingRef.current ? 6 : 1.5;
      const cosYc = Math.cos(yawRef.current);
      const sinYc = Math.sin(yawRef.current);
      const rightX = cosYc * 0.4;
      const rightZ = -sinYc * 0.4;
      camera.position.set(
        posRef.current.x + tppDist * sinYc + rightX,
        posRef.current.y + tppHeight,
        posRef.current.z + tppDist * cosYc + rightZ,
      );
      camera.rotation.y = yawRef.current;
      camera.rotation.x = Math.max(-0.7, Math.min(0.5, pitchRef.current));
    } else {
      camera.position.set(posRef.current.x, posRef.current.y + EYE_HEIGHT, posRef.current.z);
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;
    }

    const effectiveScoped = isScopedRef.current || touchScopeActive;
    setIsScoped(effectiveScoped);

    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = effectiveScoped
      ? selectedGun === "Sniper" ? FOV_SNIPER : FOV_ADS
      : FOV_DEFAULT;
    cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 1 - Math.exp(-14 * delta));
    cam.updateProjectionMatrix();

    // ── SHOOTING SYSTEM — disabled while dropping or without a gun ─────────
    if (!barmudaDroppingRef.current && hasGunRef.current) {
      const cfg = GUN_CONFIG[selectedGun] ?? GUN_CONFIG["AK-47"];
      const nowMs = Date.now();

      const pcTrigger = mouseHeldRef.current && document.pointerLockElement === document.body;
      const mobileTrigger = touchShootPending;
      const triggerActive = pcTrigger || mobileTrigger;
      if (mobileTrigger) clearTouchShoot();

      const wantFire = triggerActive && !isDead && !isReloadingRef.current
        && (cfg.auto || !singleShotFiredRef.current);

      if (triggerActive && ammo <= 0 && !isReloadingRef.current) {
        isReloadingRef.current = true;
        setIsReloading(true);
        setTimeout(() => { reload(); isReloadingRef.current = false; }, cfg.reloadTime);
      }

      if (!triggerActive) singleShotFiredRef.current = false;

      if (wantFire && ammo > 0 && nowMs - lastShotRef.current >= cfg.fireRate) {
        lastShotRef.current = nowMs;
        singleShotFiredRef.current = true;
        isShootingRef.current = true;
        setTimeout(() => { isShootingRef.current = false; }, 80);

        const baseDir = new THREE.Vector3();
        camera.getWorldDirection(baseDir);
        baseDir.normalize();

        const aimOrigin = camera.position.clone().addScaledVector(baseDir, 0.3);

        let barrelTip: THREE.Vector3;
        if (isTppRef.current) {
          const right = new THREE.Vector3(-baseDir.z, 0, baseDir.x).normalize();
          barrelTip = posRef.current.clone()
            .addScaledVector(right, 0.38)
            .add(new THREE.Vector3(0, 1.25, 0))
            .addScaledVector(baseDir, 0.65);
        } else {
          barrelTip = camera.position.clone().addScaledVector(baseDir, 1.8);
        }

        const pellets: Array<{ dirX: number; dirY: number; dirZ: number }> = [];
        for (let pi = 0; pi < cfg.pellets; pi++) {
          const d = baseDir.clone();
          if (cfg.spreadRad > 0) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * cfg.spreadRad;
            const right = new THREE.Vector3(0, 1, 0).cross(d).normalize();
            if (right.lengthSq() < 0.001) right.set(1, 0, 0);
            const up2 = new THREE.Vector3().crossVectors(right, d).normalize();
            d.addScaledVector(right, Math.sin(phi) * Math.cos(theta));
            d.addScaledVector(up2, Math.sin(phi) * Math.sin(theta));
            d.normalize();
          }
          pellets.push({ dirX: d.x, dirY: d.y, dirZ: d.z });
        }

        recordShot(false);
        onShoot(barrelTip, new THREE.Vector3(pellets[0].dirX, pellets[0].dirY, pellets[0].dirZ));
        getSocket().emit("shoot", {
          originX: aimOrigin.x,
          originY: aimOrigin.y,
          originZ: aimOrigin.z,
          gunType: selectedGun,
          pellets,
        });
      }
    }

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

  // TPP: show own body + parachute; FPP: show parachute only during drop
  if (!isTpp) {
    return barmudaDropping ? <Parachute posRef={posRef} /> : null;
  }

  return (
    <>
      <LocalCharacter
        posRef={posRef}
        yawRef={yawRef}
        isMovingRef={isMovingRef}
        isShootingRef={isShootingRef}
        isReloadingRef={isReloadingRef}
        selectedGun={selectedGun}
        hasGun={hasGun}
      />
      {barmudaDropping && <Parachute posRef={posRef} />}
    </>
  );
}
