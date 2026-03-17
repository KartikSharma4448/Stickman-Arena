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

const MOVE_SPEED = 7;
const PLAYER_RADIUS = 0.35;
const SEND_RATE = 1000 / 20;
const JUMP_FORCE = 9;
const GRAVITY = -22;

// First-person camera eye height (feet = 0, eyes ≈ 1.63)
const EYE_HEIGHT = 1.63;

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
    // +π flips character so its BACK faces the TPP camera (camera is behind player)
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
      {/* ===== HEAD - Minecraft block style ===== */}
      <mesh position={[0, 1.65, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#f5b78f" roughness={0.9} />
      </mesh>
      {/* Hair block */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.42, 0.22, 0.42]} />
        <meshStandardMaterial color="#6b3a1a" roughness={0.9} />
      </mesh>
      {/* Left eye */}
      <mesh position={[-0.09, 1.66, 0.201]}>
        <boxGeometry args={[0.09, 0.07, 0.01]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Right eye */}
      <mesh position={[0.09, 1.66, 0.201]}>
        <boxGeometry args={[0.09, 0.07, 0.01]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, 1.58, 0.201]}>
        <boxGeometry args={[0.14, 0.04, 0.01]} />
        <meshBasicMaterial color="#8b4513" />
      </mesh>

      {/* ===== BODY - Minecraft block style ===== */}
      <mesh ref={bodyRef} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.44, 0.52, 0.22]} />
        <meshStandardMaterial color="#3a6bc4" roughness={0.85} />
      </mesh>
      {/* Shirt front detail */}
      <mesh position={[0, 0.95, 0.112]}>
        <boxGeometry args={[0.44, 0.52, 0.01]} />
        <meshStandardMaterial color="#2a5aaa" roughness={0.85} />
      </mesh>

      {/* ===== LEFT ARM - Minecraft block style ===== */}
      <group ref={leftArmRef} position={[-0.26, 1.28, 0]} rotation={[-1.25, 0.12, 0.16]}>
        {/* Sleeve */}
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.2, 0.48, 0.22]} />
          <meshStandardMaterial color="#3a6bc4" roughness={0.85} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color="#f5b78f" roughness={0.85} />
        </mesh>
      </group>

      {/* ===== RIGHT ARM - Minecraft block style ===== */}
      <group ref={rightArmRef} position={[0.28, 1.25, 0]} rotation={[-1.15, -0.08, -0.14]}>
        {/* Sleeve */}
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.2, 0.48, 0.22]} />
          <meshStandardMaterial color="#3a6bc4" roughness={0.85} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color="#f5b78f" roughness={0.85} />
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

      {/* ===== LEFT LEG - Minecraft block style ===== */}
      <group ref={leftLegRef} position={[-0.11, 0.68, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.2, 0.64, 0.22]} />
          <meshStandardMaterial color="#2a3a9c" roughness={0.85} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.67, 0.02]}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* ===== RIGHT LEG - Minecraft block style ===== */}
      <group ref={rightLegRef} position={[0.11, 0.68, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.2, 0.64, 0.22]} />
          <meshStandardMaterial color="#2a3a9c" roughness={0.85} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.67, 0.02]}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
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

  const isScopedRef = useRef(false);
  const mouseHeldRef = useRef(false);
  const singleShotFiredRef = useRef(false);

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
      const cfg = GUN_CONFIG[selectedGun] ?? GUN_CONFIG["AK-47"];
      if (down && e.code === "KeyR" && !isReloadingRef.current && ammo < cfg.ammoCapacity) {
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

  // Track left mouse button held (for auto-fire in useFrame)
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
        // Allow walking if player feet are at or above the box top (standing on it)
        if (pos.y >= box.max.y - 0.06) continue;
        return true;
      }
    }
    return false;
  }, []);

  // Shooting is handled in useFrame below (supports auto + single fire)

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

    // ─── Touch look (delta-based, consume after use) ───────────────────
    if (touchState.lookJoystick.deltaX !== 0 || touchState.lookJoystick.deltaY !== 0) {
      yawRef.current -= touchState.lookJoystick.deltaX * 0.005;
      pitchRef.current -= touchState.lookJoystick.deltaY * 0.005;
      pitchRef.current = Math.max(-1.3, Math.min(0.7, pitchRef.current));
      touchState.lookJoystick.deltaX = 0;
      touchState.lookJoystick.deltaY = 0;
    }

    const moveDir = new THREE.Vector3();
    if (k["KeyW"] || k["ArrowUp"]) moveDir.add(new THREE.Vector3(fwX, 0, fwZ));
    if (k["KeyS"] || k["ArrowDown"]) moveDir.sub(new THREE.Vector3(fwX, 0, fwZ));
    if (k["KeyA"] || k["ArrowLeft"]) moveDir.sub(new THREE.Vector3(rtX, 0, rtZ));
    if (k["KeyD"] || k["ArrowRight"]) moveDir.add(new THREE.Vector3(rtX, 0, rtZ));

    // ─── Touch movement joystick ────────────────────────────────────────
    if (touchState.moveJoystick.active) {
      const tdx = Math.min(1, Math.max(-1, touchState.moveJoystick.dx));
      const tdy = Math.min(1, Math.max(-1, touchState.moveJoystick.dy));
      if (Math.abs(tdx) > 0.05 || Math.abs(tdy) > 0.05) {
        moveDir.add(new THREE.Vector3(
          fwX * -tdy + rtX * tdx,
          0,
          fwZ * -tdy + rtZ * tdx,
        ));
      }
    }

    isMovingRef.current = moveDir.lengthSq() > 0.01;
    if (isMovingRef.current) moveDir.normalize();

    const speed = MOVE_SPEED * delta;
    const tryX = posRef.current.clone().addScaledVector(new THREE.Vector3(moveDir.x, 0, 0), speed);
    const tryZ = posRef.current.clone().addScaledVector(new THREE.Vector3(0, 0, moveDir.z), speed);
    if (!checkCollision(tryX)) posRef.current.x = tryX.x;
    if (!checkCollision(tryZ)) posRef.current.z = tryZ.z;

    // ─── Touch jump ────────────────────────────────────────────────────
    if (touchJumpPending && onGroundRef.current) {
      velYRef.current = JUMP_FORCE;
      onGroundRef.current = false;
      clearTouchJump();
    }

    // ─── Gravity ────────────────────────────────────────────────────────
    velYRef.current += GRAVITY * delta;
    posRef.current.y += velYRef.current * delta;
    onGroundRef.current = false;

    // Find highest surface the player is standing on (floor or platform top)
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
        // Player over this box — snap to top if falling onto it
        if (velYRef.current <= 0.05) {
          groundY = Math.max(groundY, box.max.y);
        }
        // Ceiling: jumping into bottom of a platform
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

    // --- CAMERA (FPP or TPP) ---
    camera.rotation.order = "YXZ";
    camera.rotation.z = 0;

    if (isTppRef.current) {
      // Third-person: position camera behind and above the player
      const tppDist = 3.8;
      const tppHeight = 1.5;
      const cosY = Math.cos(yawRef.current);
      const sinY = Math.sin(yawRef.current);
      // Slight right-shoulder offset (over-the-shoulder like PUBG)
      const rightX = cosY * 0.4;
      const rightZ = -sinY * 0.4;
      camera.position.set(
        posRef.current.x + tppDist * sinY + rightX,
        posRef.current.y + tppHeight,
        posRef.current.z + tppDist * cosY + rightZ,
      );
      camera.rotation.y = yawRef.current;
      // Full pitch (no scaling) so crosshair goes exactly where player aims
      camera.rotation.x = Math.max(-0.7, Math.min(0.5, pitchRef.current));
    } else {
      // First-person: camera at eye level
      camera.position.set(
        posRef.current.x,
        posRef.current.y + EYE_HEIGHT,
        posRef.current.z,
      );
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;
    }

    // Merge mouse scope + touch ADS for FOV and HUD
    const effectiveScoped = isScopedRef.current || touchScopeActive;
    setIsScoped(effectiveScoped);

    // Smooth FOV zoom for scope / ADS
    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = effectiveScoped
      ? selectedGun === "Sniper" ? FOV_SNIPER : FOV_ADS
      : FOV_DEFAULT;
    cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 1 - Math.exp(-14 * delta));
    cam.updateProjectionMatrix();

    // ─── SHOOTING SYSTEM (auto + single fire) ───────────────────────────
    const cfg = GUN_CONFIG[selectedGun] ?? GUN_CONFIG["AK-47"];
    const nowMs = Date.now();

    // Determine trigger intent (PC mouse OR mobile FIRE button)
    const pcTrigger = mouseHeldRef.current && document.pointerLockElement === document.body;
    const mobileTrigger = touchShootPending;
    const triggerActive = pcTrigger || mobileTrigger;
    if (mobileTrigger) clearTouchShoot();

    // For single-shot guns: only fire ONCE per trigger press
    const wantFire = triggerActive && !isDead && !isReloadingRef.current
      && (cfg.auto || !singleShotFiredRef.current);

    // Auto-reload when empty
    if (triggerActive && ammo <= 0 && !isReloadingRef.current) {
      isReloadingRef.current = true;
      setIsReloading(true);
      setTimeout(() => { reload(); isReloadingRef.current = false; }, cfg.reloadTime);
    }

    // Reset single-shot flag when trigger released
    if (!triggerActive) singleShotFiredRef.current = false;

    if (wantFire && ammo > 0 && nowMs - lastShotRef.current >= cfg.fireRate) {
      lastShotRef.current = nowMs;
      singleShotFiredRef.current = true;

      isShootingRef.current = true;
      setTimeout(() => { isShootingRef.current = false; }, 80);

      // Base aim direction from camera center
      const baseDir = new THREE.Vector3();
      camera.getWorldDirection(baseDir);
      baseDir.normalize();

      // Accurate origin for server hit detection
      const aimOrigin = camera.position.clone().addScaledVector(baseDir, 0.3);

      // Visual muzzle flash origin
      // TPP: compute from the character's gun barrel world position
      // FPP: push in front of camera to avoid trail passing through screen
      let barrelTip: THREE.Vector3;
      if (isTppRef.current) {
        // Right vector perpendicular to look direction in XZ plane
        const right = new THREE.Vector3(-baseDir.z, 0, baseDir.x).normalize();
        barrelTip = posRef.current.clone()
          .addScaledVector(right, 0.38)        // gun on right shoulder
          .add(new THREE.Vector3(0, 1.25, 0))  // shoulder/arm height
          .addScaledVector(baseDir, 0.65);     // extend to barrel tip
      } else {
        barrelTip = camera.position.clone().addScaledVector(baseDir, 1.8);
      }

      // Build pellet directions with spread
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

      // Consume ammo + record stat
      recordShot(false);

      // Local visual effect (muzzle + bullet trail)
      onShoot(barrelTip, new THREE.Vector3(pellets[0].dirX, pellets[0].dirY, pellets[0].dirZ));

      // Network: send to server with gun type + pellets
      getSocket().emit("shoot", {
        originX: aimOrigin.x,
        originY: aimOrigin.y,
        originZ: aimOrigin.z,
        gunType: selectedGun,
        pellets,
      });
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

  // In TPP mode show own body; in FPP hide it (camera is inside the head)
  if (!isTpp) return null;
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
