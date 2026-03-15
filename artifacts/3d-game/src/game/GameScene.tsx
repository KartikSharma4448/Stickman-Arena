import { useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Arena from "./Arena";
import Stickman from "./Stickman";
import PlayerController from "./PlayerController";
import Effects, { addLocalShot } from "./Effects";
import { useGameStore } from "./store";
import { getSocket } from "./socket";

export default function GameScene() {
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const isDead = useGameStore((s) => s.isDead);
  const myId = useGameStore((s) => s.myId);
  const addShootEvent = useGameStore((s) => s.addShootEvent);
  const spawnRef = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const socket = getSocket();
    const onJoined = (data: { spawnX: number; spawnY: number; spawnZ: number }) => {
      spawnRef.current = new THREE.Vector3(data.spawnX, data.spawnY, data.spawnZ);
    };
    const onRespawn = (data: { x: number; y: number; z: number }) => {
      spawnRef.current = new THREE.Vector3(data.x, data.y, data.z);
    };
    socket.on("joined_room", onJoined);
    socket.on("respawn", onRespawn);
    return () => {
      socket.off("joined_room", onJoined);
      socket.off("respawn", onRespawn);
    };
  }, []);

  const handleShoot = useCallback(
    (origin: THREE.Vector3, dir: THREE.Vector3) => {
      addLocalShot(origin, dir);
      addShootEvent({
        shooterId: myId || "",
        originX: origin.x,
        originY: origin.y,
        originZ: origin.z,
        dirX: dir.x,
        dirY: dir.y,
        dirZ: dir.z,
        hitPlayerId: null,
      });
    },
    [myId, addShootEvent],
  );

  return (
    <Canvas
      camera={{ fov: 75, near: 0.05, far: 500 }}
      gl={{
        antialias: false,
        powerPreference: "low-power",
        precision: "lowp",
      }}
      shadows="soft"
      style={{ position: "fixed", inset: 0 }}
      frameloop="always"
    >
      <fog attach="fog" args={["#1a1a2e", 30, 80]} />

      <Arena />

      {!isDead && (
        <PlayerController
          spawnPos={spawnRef.current}
          onShoot={handleShoot}
        />
      )}

      {Object.values(remotePlayers)
        .filter((p) => p.id !== myId)
        .map((p) => (
          <Stickman key={p.id} player={p} />
        ))}

      <Effects />
    </Canvas>
  );
}
