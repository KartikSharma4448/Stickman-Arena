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
  const setCurrentMap = useGameStore((s) => s.setCurrentMap);
  const setMatchMode = useGameStore((s) => s.setMatchMode);
  const setMyTeamId = useGameStore((s) => s.setMyTeamId);
  const setMatchTimeLeft = useGameStore((s) => s.setMatchTimeLeft);
  const setKillTarget = useGameStore((s) => s.setKillTarget);
  const setMatchLeaderboard = useGameStore((s) => s.setMatchLeaderboard);
  const setMatchResult = useGameStore((s) => s.setMatchResult);
  const kills = useGameStore((s) => s.kills);
  const deaths = useGameStore((s) => s.deaths);
  const totalShots = useGameStore((s) => s.totalShots);
  const hitShots = useGameStore((s) => s.hitShots);
  const setRoomCode = useGameStore((s) => s.setRoomCode);
  const resetMatchStats = useGameStore((s) => s.resetMatchStats);

  const respawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingStart = useRef(0);
  const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track latest stats for match_end handler
  const killsRef = useRef(0);
  const deathsRef = useRef(0);
  const totalShotsRef = useRef(0);
  const hitShotsRef = useRef(0);
  useEffect(() => { killsRef.current = kills; }, [kills]);
  useEffect(() => { deathsRef.current = deaths; }, [deaths]);
  useEffect(() => { totalShotsRef.current = totalShots; }, [totalShots]);
  useEffect(() => { hitShotsRef.current = hitShots; }, [hitShots]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("init", (data: { id: string; rooms: any[] }) => {
      setMyId(data.id);
      setRooms(data.rooms);
    });

    socket.on("rooms_list", (rooms: any[]) => {
      setRooms(rooms);
    });

    socket.on("joined_room", (data: {
      roomId: string;
      roomName: string;
      playerId: string;
      spawnX: number; spawnY: number; spawnZ: number;
      existingPlayers: any[];
      map?: string;
      mode?: "solo" | "squad";
      code?: string | null;
      teamId?: number;
      killTarget?: number;
      matchDuration?: number;
      timeLeft?: number;
    }) => {
      setCurrentRoom(data.roomId, data.roomName);
      setPhase("playing");
      setHealth(100);
      setIsDead(false);
      if (data.map) setCurrentMap(data.map);
      if (data.mode) setMatchMode(data.mode);
      if (data.teamId !== undefined) setMyTeamId(data.teamId);
      if (data.killTarget) setKillTarget(data.killTarget);
      if (data.timeLeft !== undefined) setMatchTimeLeft(data.timeLeft);
      if (data.code !== undefined) setRoomCode(data.code ?? null);

      for (const p of data.existingPlayers) {
        addRemotePlayer(p);
      }
    });

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
        originX: ev.originX, originY: ev.originY, originZ: ev.originZ,
        dirX: ev.dirX, dirY: ev.dirY, dirZ: ev.dirZ,
        hitPlayerId: ev.hitPlayerId,
      });
    });

    socket.on("take_damage", (data: { damage: number; shooterId: string }) => {
      setHitIndicator(true);
      recordShot(true);
      if (hitTimer.current) clearTimeout(hitTimer.current);
      hitTimer.current = setTimeout(() => setHitIndicator(false), 350);
    });

    socket.on("player_hit", (data: { damage: number; shooterId: string }) => {
      setHitIndicator(true);
      recordShot(true);
      if (hitTimer.current) clearTimeout(hitTimer.current);
      hitTimer.current = setTimeout(() => setHitIndicator(false), 350);
    });

    socket.on("player_killed", (data: {
      killerId: string; killerName: string;
      victimId: string; victimName: string;
      headshot: boolean;
    }) => {
      addKillFeed({ killerName: data.killerName, victimName: data.victimName, headshot: data.headshot });

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
          if (countdown <= 0) clearInterval(respawnTimer.current!);
        }, 1000);
      }
    });

    // ─── Match state (timer + leaderboard) ─────────────────────────────
    socket.on("match_state", (data: {
      timeLeft: number;
      killTarget: number;
      leaderboard: any[];
    }) => {
      setMatchTimeLeft(data.timeLeft);
      setKillTarget(data.killTarget);
      setMatchLeaderboard(data.leaderboard);
    });

    // ─── Match end ──────────────────────────────────────────────────────
    socket.on("match_end", (data: {
      reason: "kills" | "timeout";
      results: Array<{ id: string; name: string; kills: number; deaths: number }>;
      winnerId: string | null; winnerName: string;
      winnerTeam: number; map: string; mode: string;
    }) => {
      const myKills = killsRef.current;
      const myDeaths = deathsRef.current;
      const shots = totalShotsRef.current;
      const hits = hitShotsRef.current;
      const myResult = data.results.find((r) => r.id === socket.id);
      const placement = data.results.findIndex((r) => r.id === socket.id) + 1;

      setMatchResult({
        kills: myKills,
        deaths: myDeaths,
        accuracy: shots > 0 ? Math.round((hits / shots) * 100) : 0,
        xpGained: myKills * 30 + (placement === 1 ? 200 : 0),
        placement,
      });
      setPhase("results");
    });

    // ─── Respawn ────────────────────────────────────────────────────────
    socket.on("respawn", (data: { x: number; y: number; z: number; health: number }) => {
      setIsDead(false);
      setHealth(data.health);
    });

    pingTimer.current = setInterval(() => {
      pingStart.current = Date.now();
      socket.emit("ping");
    }, 2000);

    socket.on("pong", () => setLatency(Date.now() - pingStart.current));

    socket.on("connect_error", (err) => console.warn("Socket error:", err.message));

    return () => {
      socket.off("init");
      socket.off("rooms_list");
      socket.off("joined_room");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("world_state");
      socket.off("shoot_event");
      socket.off("take_damage");
      socket.off("player_hit");
      socket.off("player_killed");
      socket.off("match_state");
      socket.off("match_end");
      socket.off("respawn");
      socket.off("pong");
      if (respawnTimer.current) clearInterval(respawnTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (hitTimer.current) clearTimeout(hitTimer.current);
    };
  }, []);

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
          <TouchControls onShoot={() => {}} />
        </>
      )}
    </div>
  );
}
