import { useRef, useEffect, useCallback } from "react";
import { useGameStore } from "./store";

const MAP_SIZE = 150;
const MINIMAP_SIZE = 160;
const SCALE = MINIMAP_SIZE / MAP_SIZE;

interface MinimapProps {
  playerX: number;
  playerZ: number;
  playerYaw: number;
}

export default function Minimap({ playerX, playerZ, playerYaw }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const zoneRadius = useGameStore((s) => s.zoneRadius);
  const zoneCenterX = useGameStore((s) => s.zoneCenterX);
  const zoneCenterZ = useGameStore((s) => s.zoneCenterZ);
  const zoneTargetRadius = useGameStore((s) => s.zoneTargetRadius);
  const currentMap = useGameStore((s) => s.currentMap);
  const pickedUpLoot = useGameStore((s) => s.pickedUpLoot);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = MINIMAP_SIZE * 2;
    if (canvas.width !== size) canvas.width = size;
    if (canvas.height !== size) canvas.height = size;
    const center = size / 2;
    const scale = size / MAP_SIZE;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = currentMap === "barmuda" ? "#2a5a28" : "#1a2a1a";
    ctx.fillRect(0, 0, size, size);

    if (currentMap === "barmuda") {
      ctx.fillStyle = "#0a4a7a";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#3a7a30";
      const islandSize = 148 * scale;
      const offset = (size - islandSize) / 2;
      ctx.fillRect(offset, offset, islandSize, islandSize);

      ctx.fillStyle = "#666";
      ctx.fillRect(center - 2 * scale, (size - 140 * scale) / 2, 4 * scale, 140 * scale);
      ctx.fillRect((size - 140 * scale) / 2, center - 2 * scale, 140 * scale, 4 * scale);
    }

    if (currentMap === "barmuda") {
      const zr = zoneRadius * scale;
      const zcx = center + zoneCenterX * scale;
      const zcz = center + zoneCenterZ * scale;

      ctx.strokeStyle = "rgba(0,170,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(zcx, zcz, zr, 0, Math.PI * 2);
      ctx.stroke();

      if (zoneTargetRadius < zoneRadius) {
        const tr = zoneTargetRadius * scale;
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(zcx, zcz, tr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const players = Object.values(remotePlayers);
    for (const p of players) {
      const px = center + p.x * scale;
      const pz = center + p.z * scale;
      const dist = Math.sqrt((p.x - playerX) ** 2 + (p.z - playerZ) ** 2);
      if (dist > 50) continue;
      ctx.fillStyle = "#ff4444";
      ctx.beginPath();
      ctx.arc(px, pz, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const myPx = center + playerX * scale;
    const myPz = center + playerZ * scale;

    ctx.save();
    ctx.translate(myPx, myPz);
    ctx.rotate(-playerYaw + Math.PI);

    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 4);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(0,255,136,0.15)";
    ctx.beginPath();
    const fovAngle = 0.7;
    ctx.moveTo(myPx, myPz);
    ctx.arc(myPx, myPz, 30, -playerYaw - fovAngle + Math.PI / 2, -playerYaw + fovAngle + Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [playerX, playerZ, playerYaw, remotePlayers, zoneRadius, zoneCenterX, zoneCenterZ, zoneTargetRadius, currentMap, pickedUpLoot]);

  useEffect(() => {
    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  }, [draw]);

  return (
    <div style={{
      position: "fixed",
      top: 18,
      right: 18,
      zIndex: 42,
      width: MINIMAP_SIZE,
      height: MINIMAP_SIZE,
      borderRadius: "50%",
      overflow: "hidden",
      border: "2px solid rgba(255,255,255,0.2)",
      boxShadow: "0 0 20px rgba(0,0,0,0.5)",
      background: "#111",
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
      />
      <div style={{
        position: "absolute",
        bottom: 4,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 8,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: 1,
      }}>
        {Math.round(playerX)}, {Math.round(playerZ)}
      </div>
    </div>
  );
}
