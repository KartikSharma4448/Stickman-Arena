import { useEffect, useRef } from "react";
import { useGameStore } from "./game/store";
import { getSocket } from "./game/socket";
import SplashScreen from "./game/SplashScreen";
import LoginScreen from "./game/LoginScreen";
import MainLobby from "./game/MainLobby";
import MatchEnd from "./game/MatchEnd";
import GameScene from "./game/GameScene";
import HUD from "./game/HUD";
import TouchControls from "./game/TouchControls";

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const setMyId = useGameStore((s) => s.setMyId);
  const setRooms = useGameStore((s) => s.setRooms);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const addRemotePlayer = useGameStore((s) => s.addRemotePlayer);
  const updateRemotePlayers = useGameStore((s) => s.updateRemotePlayers);
  const removeRemotePlayer = useGameStore((s) => s.removeRemotePlayer);
  const addKillFeed = useGameStore((s) => s.addKillFeed);
  const addShootEvent = useGameStore((s) => s.addShootEvent);
  const setHealth = useGameStore((s) => s.setHealth);
  const setIsDead = useGameStore((s) => s.setIsDead);
  const setRespawnCountdown = useGameStore((s) => s.setRespawnCountdown);
  const addKill = useGameStore((s) => s.addKill);
  const addDeath = useGameStore((s) => s.addDeath);
  const setLatency = useGameStore((s) => s.setLatency);
  const setHitIndicator = useGameStore((s) => s.setHitIndicator);
  const recordShot = useGameStore((s) => s.recordShot);
  const myId = useGameStore((s) => s.myId);
  const respawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingStart = useRef(0);
  const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("init", (data: { id: string; rooms: any[] }) => {
      setMyId(data.id);
      setRooms(data.rooms);
    });

    socket.on("rooms_list", (rooms: any[]) => {
      setRooms(rooms);
    });

    socket.on(
      "joined_room",
      (data: {
        roomId: string;
        roomName: string;
        playerId: string;
        spawnX: number;
        spawnY: number;
        spawnZ: number;
        existingPlayers: any[];
      }) => {
        setCurrentRoom(data.roomId, data.roomName);
        setPhase("playing");
        setHealth(100);
        setIsDead(false);

        for (const p of data.existingPlayers) {
          addRemotePlayer(p);
        }
      },
    );

    socket.on("player_joined", (p: any) => {
      addRemotePlayer(p);
    });

    socket.on("player_left", ({ id }: { id: string }) => {
      removeRemotePlayer(id);
    });

    socket.on("world_state", (data: { players: any[] }) => {
      updateRemotePlayers(data.players);
    });

    socket.on("shoot_event", (ev: any) => {
      addShootEvent({
        shooterId: ev.shooterId,
        originX: ev.originX,
        originY: ev.originY,
        originZ: ev.originZ,
        dirX: ev.dirX,
        dirY: ev.dirY,
        dirZ: ev.dirZ,
        hitPlayerId: ev.hitPlayerId,
      });
    });

    socket.on(
      "player_hit",
      (data: { damage: number; shooterId: string }) => {
        setHitIndicator(true);
        recordShot(true);
        if (hitTimer.current) clearTimeout(hitTimer.current);
        hitTimer.current = setTimeout(() => setHitIndicator(false), 350);
      },
    );

    socket.on(
      "player_killed",
      (data: {
        killerId: string;
        killerName: string;
        victimId: string;
        victimName: string;
        headshot: boolean;
      }) => {
        addKillFeed({
          killerName: data.killerName,
          victimName: data.victimName,
          headshot: data.headshot,
        });

        if (data.killerId === socket.id) addKill();

        if (data.victimId === socket.id) {
          addDeath();
          setIsDead(true);
          setHealth(0);

          let countdown = 3;
          setRespawnCountdown(countdown);
          if (respawnTimer.current) clearInterval(respawnTimer.current);
          respawnTimer.current = setInterval(() => {
            countdown--;
            setRespawnCountdown(countdown);
            if (countdown <= 0) {
              clearInterval(respawnTimer.current!);
            }
          }, 1000);

          setTimeout(() => {
            setIsDead(false);
            setHealth(100);
          }, 3000);
        }
      },
    );

    pingTimer.current = setInterval(() => {
      pingStart.current = Date.now();
      socket.emit("ping");
    }, 2000);

    socket.on("pong", () => {
      setLatency(Date.now() - pingStart.current);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    return () => {
      socket.off("init");
      socket.off("rooms_list");
      socket.off("joined_room");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("world_state");
      socket.off("shoot_event");
      socket.off("player_hit");
      socket.off("player_killed");
      socket.off("pong");
      if (respawnTimer.current) clearInterval(respawnTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (hitTimer.current) clearTimeout(hitTimer.current);
    };
  }, []);

  const handleTouchShoot = () => {
    const socket = getSocket();
    socket.emit("shoot", {
      originX: 0, originY: 1, originZ: 0,
      dirX: 0, dirY: 0, dirZ: -1,
    });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#050510" }}>
      {phase === "splash" && <SplashScreen />}
      {phase === "login" && <LoginScreen />}
      {phase === "lobby" && <MainLobby />}
      {phase === "results" && <MatchEnd />}
      {phase === "playing" && (
        <>
          <GameScene />
          <HUD />
          <TouchControls onShoot={handleTouchShoot} />
        </>
      )}
    </div>
  );
}
