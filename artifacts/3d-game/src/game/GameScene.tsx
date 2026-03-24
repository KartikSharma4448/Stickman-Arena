import { useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Arena from "./Arena";
import Arena2 from "./Arena2";
import Arena3 from "./Arena3";
import Arena4 from "./Arena4";
import Arena5 from "./Arena5";
import ZoneSystem from "./ZoneSystem";
import Stickman from "./Stickman";
import PlayerController from "./PlayerController";
import Effects, { addLocalShot } from "./Effects";
import { useGameStore } from "./store";
import { getSocket } from "./socket";

const MAP_FOG: Record<string, { bg: string; fog: string; near: number; far: number }> = {
  highlands: { bg: "#1a1e2a", fog: "#1a1e2a", near: 30, far: 80 },
  desert:    { bg: "#e8c080", fog: "#c8a060", near: 40, far: 120 },
  ruins:     { bg: "#3a3f48", fog: "#30353e", near: 20, far: 60  },
  bgmk:      { bg: "#a8bca0", fog: "#9aae92", near: 45, far: 130 },
  barmuda:   { bg: "#87ceeb", fog: "#aadaf0", near: 80, far: 220 },
};

export default function GameScene() {
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const isDead = useGameStore((s) => s.isDead);
  const eliminated = useGameStore((s) => s.eliminated);
  const myId = useGameStore((s) => s.myId);
  const addShootEvent = useGameStore((s) => s.addShootEvent);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const reload = useGameStore((s) => s.reload);
  const currentMap = useGameStore((s) => s.currentMap);
  const setHasGun = useGameStore((s) => s.setHasGun);
  const setSelectedGun = useGameStore((s) => s.setSelectedGun);
  const spawnRef = useRef(new THREE.Vector3(0, 0, 0));
  const mapFog = MAP_FOG[currentMap] ?? MAP_FOG.highlands;

  const antialias = graphicsQuality === "high";
  const shadows = graphicsQuality !== "low";

  // For non-Barmuda maps: restore gun state
  useEffect(() => {
    if (currentMap !== "barmuda") {
      setHasGun(true);
      setTimeout(() => setSelectedGun("AK-47"), 0);
    }
  }, [currentMap]);

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "KeyR") reload();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [reload]);

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

  const showPlayer = !isDead && !eliminated;

  return (
    <Canvas
      camera={{ fov: 75, near: 0.05, far: 500 }}
      gl={{
        antialias,
        powerPreference: graphicsQuality === "low" ? "low-power" : "high-performance",
        precision: graphicsQuality === "low" ? "lowp" : "mediump",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      shadows={shadows ? "soft" : false}
      style={{ position: "fixed", inset: 0 }}
      frameloop="always"
    >
      <color attach="background" args={[mapFog.bg]} />
      <fog attach="fog" args={[mapFog.fog, mapFog.near, mapFog.far]} />

      {currentMap === "highlands" && <Arena />}
      {currentMap === "desert"    && <Arena2 />}
      {currentMap === "ruins"     && <Arena3 />}
      {currentMap === "bgmk"      && <Arena4 />}
      {currentMap === "barmuda"   && <Arena5 />}
      {currentMap === "barmuda"   && <ZoneSystem />}
      {!["highlands","desert","ruins","bgmk","barmuda"].includes(currentMap) && <Arena />}

      {showPlayer && (
        <PlayerController
          spawnPos={spawnRef.current}
          onShoot={handleShoot}
        />
      )}

      {myId && Object.values(remotePlayers)
        .filter((p) => p.id !== myId)
        .map((p) => (
          <Stickman key={p.id} player={p} />
        ))}

      <Effects />
    </Canvas>
  );
}
