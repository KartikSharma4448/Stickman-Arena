import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "./store";
import { getSocket } from "./socket";
import { ARENA_BOUNDS, ARENA_BOXES } from "./Arena";

const MOVE_SPEED = 8;
const PLAYER_HEIGHT = 1.0;
const PLAYER_RADIUS = 0.35;
const SEND_RATE = 1000 / 20;

interface Props {
  spawnPos: THREE.Vector3;
  onShoot: (origin: THREE.Vector3, dir: THREE.Vector3) => void;
}

export default function PlayerController({ spawnPos, onShoot }: Props) {
  const { camera } = useThree();

  const posRef = useRef(spawnPos.clone());
  const velRef = useRef(new THREE.Vector3());
  const pitchRef = useRef(0);
  const yawRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastSendRef = useRef(0);
  const seqRef = useRef(0);
  const lastShotRef = useRef(0);
  const recoilRef = useRef(0);
  const isDead = useGameStore((s) => s.isDead);
  const setHealth = useGameStore((s) => s.setHealth);
  const setHitIndicator = useGameStore((s) => s.setHitIndicator);

  useEffect(() => {
    posRef.current.copy(spawnPos);
    camera.position.copy(spawnPos).setY(spawnPos.y + PLAYER_HEIGHT);
  }, [spawnPos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      keysRef.current[e.code] = down;
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return;
      const sens = 0.002;
      yawRef.current -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));
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

  const checkCollision = useCallback(
    (pos: THREE.Vector3): boolean => {
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
    },
    [],
  );

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (document.pointerLockElement !== document.body) return;
      if (isDead) return;

      const now = Date.now();
      if (now - lastShotRef.current < 150) return;
      lastShotRef.current = now;
      recoilRef.current = 0.04;

      const origin = camera.position.clone();
      const dir = new THREE.Vector3(0, 0, -1);
      dir.applyEuler(camera.rotation);
      dir.normalize();

      onShoot(origin, dir);

      getSocket().emit("shoot", {
        originX: origin.x,
        originY: origin.y,
        originZ: origin.z,
        dirX: dir.x,
        dirY: dir.y,
        dirZ: dir.z,
      });
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [isDead, onShoot]);

  useEffect(() => {
    const socket = getSocket();
    const onRespawn = (data: { x: number; y: number; z: number; health: number }) => {
      posRef.current.set(data.x, data.y, data.z);
      setHealth(data.health);
      recoilRef.current = 0;
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
    const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
    const right = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));
    const moveDir = new THREE.Vector3();

    if (k["KeyW"] || k["ArrowUp"]) moveDir.add(forward);
    if (k["KeyS"] || k["ArrowDown"]) moveDir.sub(forward);
    if (k["KeyA"] || k["ArrowLeft"]) moveDir.sub(right);
    if (k["KeyD"] || k["ArrowRight"]) moveDir.add(right);

    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const speed = MOVE_SPEED * delta;
    const newPosX = posRef.current.clone().addScaledVector(new THREE.Vector3(moveDir.x, 0, 0), speed);
    const newPosZ = posRef.current.clone().addScaledVector(new THREE.Vector3(0, 0, moveDir.z), speed);

    if (!checkCollision(newPosX)) posRef.current.x = newPosX.x;
    if (!checkCollision(newPosZ)) posRef.current.z = newPosZ.z;

    posRef.current.y = 0;

    if (recoilRef.current > 0) {
      recoilRef.current *= 0.8;
    }

    camera.position.set(posRef.current.x, posRef.current.y + PLAYER_HEIGHT, posRef.current.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current + recoilRef.current;

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

  return null;
}
