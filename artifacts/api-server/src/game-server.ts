import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

// ─── Gun damage table ─────────────────────────────────────────────────────
const GUN_DAMAGE: Record<string, { body: number; head: number; range: number }> = {
  "AK-47":   { body: 32,  head: 80,  range: 120 },
  "SMG":     { body: 18,  head: 48,  range: 60  },
  "Sniper":  { body: 85,  head: 150, range: 300 },
  "Shotgun": { body: 14,  head: 28,  range: 28  },
  "Pistol":  { body: 28,  head: 70,  range: 80  },
};

// ─── Maps ─────────────────────────────────────────────────────────────────
type MapId = "highlands" | "desert" | "ruins" | "bgmk";
const MAPS: MapId[] = ["highlands", "desert", "ruins", "bgmk"];

const MAP_SPAWNS: Record<MapId, Array<{ x: number; y: number; z: number }>> = {
  highlands: [
    { x: 0,   y: 0, z: 0  }, { x: 14,  y: 0, z: 14  }, { x: -14, y: 0, z: 14 },
    { x: 14,  y: 0, z: -14}, { x: -14, y: 0, z: -14 }, { x: 20,  y: 0, z: 0  },
    { x: -20, y: 0, z: 0  }, { x: 0,   y: 0, z: 20  }, { x: 0,   y: 0, z: -20},
    { x: 8,   y: 0, z: -8 }, { x: -8,  y: 0, z: 8   },
  ],
  desert: [
    { x: 0,   y: 0, z: 0  }, { x: 12,  y: 0, z: 12  }, { x: -12, y: 0, z: 12 },
    { x: 12,  y: 0, z: -12}, { x: -12, y: 0, z: -12 }, { x: 18,  y: 0, z: 0  },
    { x: -18, y: 0, z: 0  }, { x: 0,   y: 0, z: 18  }, { x: 0,   y: 0, z: -18},
    { x: 6,   y: 0, z: -6 }, { x: -6,  y: 0, z: 6   },
  ],
  ruins: [
    { x: 0,   y: 0, z: 0  }, { x: 10,  y: 0, z: 10  }, { x: -10, y: 0, z: 10 },
    { x: 10,  y: 0, z: -10}, { x: -10, y: 0, z: -10 }, { x: 16,  y: 0, z: 0  },
    { x: -16, y: 0, z: 0  }, { x: 0,   y: 0, z: 16  }, { x: 0,   y: 0, z: -16},
    { x: 7,   y: 0, z: -7 }, { x: -7,  y: 0, z: 7   },
  ],
  bgmk: [
    { x: 0,   y: 0, z: -26 }, { x: 0,   y: 0, z: 26  },
    { x: -26, y: 0, z: 0   }, { x: 26,  y: 0, z: 0   },
    { x: -18, y: 0, z: -20 }, { x: 18,  y: 0, z: -20 },
    { x: -18, y: 0, z: 20  }, { x: 18,  y: 0, z: 20  },
    { x: -26, y: 0, z: -12 }, { x: 26,  y: 0, z: -12 },
    { x: 0,   y: 0, z: 0   },
  ],
};

// ─── Interfaces ───────────────────────────────────────────────────────────
interface Player {
  id: string;
  name: string;
  roomId: string | null;
  x: number; y: number; z: number;
  rotY: number; pitchX: number;
  health: number;
  kills: number; deaths: number;
  lastInputSeq: number;
  teamId: number; // 0 or 1 for squad, -1 for solo
}

interface Room {
  id: string;
  name: string;
  players: Map<string, Player>;
  maxPlayers: number;
  gameStarted: boolean;
  map: MapId;
  mode: "solo" | "squad";
  type: "public" | "private";
  code: string | null;
  matchActive: boolean;
  matchStartTime: number | null;
  matchDuration: number; // ms
  killTarget: number;
  matchTimerRef: ReturnType<typeof setTimeout> | null;
}

const MAX_HP = 100;
const TICK_RATE = 20;
const KILL_TARGET = 40;
const MATCH_DURATION = 5 * 60 * 1000; // 5 minutes in ms
const MAX_PLAYERS = 8;

const rooms = new Map<string, Room>();
const players = new Map<string, Player>();
const codesToRooms = new Map<string, string>(); // code -> roomId

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (codesToRooms.has(code));
  return code;
}

function getSpawnPoint(room: Room, playerCount: number): { x: number; y: number; z: number } {
  const spawns = MAP_SPAWNS[room.map];
  const used = Array.from(room.players.values()).map((p) => ({ x: p.x, z: p.z }));
  for (const sp of spawns) {
    const occupied = used.some((u) => Math.abs(u.x - sp.x) < 3 && Math.abs(u.z - sp.z) < 3);
    if (!occupied) return { ...sp };
  }
  return { ...spawns[playerCount % spawns.length] };
}

function createRoom(
  name: string,
  mode: "solo" | "squad" = "solo",
  type: "public" | "private" = "public",
  map?: MapId,
): Room {
  const id = `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const code = type === "private" ? generateCode() : null;
  const selectedMap = map ?? MAPS[Math.floor(Math.random() * MAPS.length)];

  const room: Room = {
    id, name,
    players: new Map(),
    maxPlayers: MAX_PLAYERS,
    gameStarted: false,
    map: selectedMap,
    mode,
    type,
    code,
    matchActive: false,
    matchStartTime: null,
    matchDuration: MATCH_DURATION,
    killTarget: KILL_TARGET,
    matchTimerRef: null,
  };

  rooms.set(id, room);
  if (code) codesToRooms.set(code, id);
  return room;
}

function getRoomList() {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    playerCount: r.players.size,
    maxPlayers: r.maxPlayers,
    gameStarted: r.gameStarted,
    map: r.map,
    mode: r.mode,
    type: r.type,
    code: r.code,
    matchActive: r.matchActive,
    timeLeft: r.matchStartTime
      ? Math.max(0, r.matchDuration - (Date.now() - r.matchStartTime))
      : r.matchDuration,
  }));
}

function getRoomPublicList() {
  return getRoomList().filter((r) => r.type === "public");
}

export function initGameServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    path: "/socket.io/",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 5000,
    pingTimeout: 10000,
  });

  // ─── Game tick: broadcast world state + check match end ──────────────
  const updateInterval = setInterval(() => {
    for (const room of rooms.values()) {
      if (room.players.size === 0) continue;

      // Send world state
      const snapshot = Array.from(room.players.values()).map((p) => ({
        id: p.id, x: p.x, y: p.y, z: p.z,
        rotY: p.rotY, pitchX: p.pitchX,
        health: p.health, kills: p.kills, deaths: p.deaths,
        seq: p.lastInputSeq, teamId: p.teamId,
      }));
      io.to(room.id).emit("world_state", { players: snapshot });

      // Match timer check
      if (room.matchActive && room.matchStartTime) {
        const elapsed = Date.now() - room.matchStartTime;
        const timeLeft = Math.max(0, room.matchDuration - elapsed);

        // Send match state every 5 ticks (~250ms)
        io.to(room.id).emit("match_state", {
          timeLeft,
          killTarget: room.killTarget,
          leaderboard: Array.from(room.players.values())
            .map((p) => ({ id: p.id, name: p.name, kills: p.kills, deaths: p.deaths, teamId: p.teamId }))
            .sort((a, b) => b.kills - a.kills),
        });

        // Check timer expiry
        if (timeLeft <= 0 && room.matchActive) {
          endMatch(io, room, "timeout");
        }
      }
    }
  }, 1000 / TICK_RATE);

  // ─── Socket connection ────────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`[game] player connected: ${socket.id}`);

    const player: Player = {
      id: socket.id,
      name: `Player_${socket.id.slice(0, 4)}`,
      roomId: null,
      x: 0, y: 0, z: 0,
      rotY: 0, pitchX: 0,
      health: MAX_HP,
      kills: 0, deaths: 0,
      lastInputSeq: 0,
      teamId: -1,
    };
    players.set(socket.id, player);

    socket.emit("init", { id: socket.id, rooms: getRoomPublicList() });

    socket.on("get_rooms", () => {
      socket.emit("rooms_list", getRoomPublicList());
    });

    // ─ Quick join: auto-find or create public room ──────────────────
    socket.on("quick_join", ({ mode }: { mode?: "solo" | "squad" }) => {
      const m = mode ?? "solo";
      const available = Array.from(rooms.values()).find(
        (r) => r.type === "public" && r.mode === m && r.players.size < r.maxPlayers
      );
      resetMatchStats(player);
      if (available) {
        joinRoom(socket, player, available);
      } else {
        const room = createRoom(`${m === "squad" ? "Squad" : "Solo"} Battle`, m, "public");
        joinRoom(socket, player, room);
      }
    });

    // ─ Create public room (custom name + mode + map choice) ──────────
    socket.on("create_room", ({ name, mode, map }: { name?: string; mode?: "solo" | "squad"; map?: MapId }) => {
      const room = createRoom(name || "Arena", mode ?? "solo", "public", map);
      resetMatchStats(player);
      joinRoom(socket, player, room);
    });

    // ─ Create PRIVATE room (friend code) ─────────────────────────────
    socket.on("create_private", ({ name, mode }: { name?: string; mode?: "solo" | "squad" }) => {
      const room = createRoom(name || "Private Room", mode ?? "solo", "private");
      resetMatchStats(player);
      joinRoom(socket, player, room);
    });

    // ─ Join by room ID ────────────────────────────────────────────────
    socket.on("join_room", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId);
      if (!room) { socket.emit("error", { message: "Room not found" }); return; }
      if (room.players.size >= room.maxPlayers) { socket.emit("error", { message: "Room is full" }); return; }
      resetMatchStats(player);
      joinRoom(socket, player, room);
    });

    // ─ Join by private code ───────────────────────────────────────────
    socket.on("join_by_code", ({ code }: { code: string }) => {
      const roomId = codesToRooms.get(code.toUpperCase().trim());
      if (!roomId) { socket.emit("error", { message: "Invalid room code" }); return; }
      const room = rooms.get(roomId);
      if (!room) { socket.emit("error", { message: "Room not found" }); return; }
      if (room.players.size >= room.maxPlayers) { socket.emit("error", { message: "Room is full" }); return; }
      resetMatchStats(player);
      joinRoom(socket, player, room);
    });

    // ─ Player input ──────────────────────────────────────────────────
    socket.on("player_input", (data: { x: number; y: number; z: number; rotY: number; pitchX: number; seq: number }) => {
      if (!player.roomId) return;
      player.x = data.x; player.y = data.y; player.z = data.z;
      player.rotY = data.rotY; player.pitchX = data.pitchX;
      player.lastInputSeq = data.seq;
    });

    // ─ Shoot ─────────────────────────────────────────────────────────
    socket.on("shoot", (data: {
      originX: number; originY: number; originZ: number;
      gunType?: string;
      pellets: Array<{ dirX: number; dirY: number; dirZ: number }>;
    }) => {
      if (!player.roomId) return;
      const room = rooms.get(player.roomId);
      if (!room) return;

      const ox = data.originX, oy = data.originY, oz = data.originZ;
      const gunType = data.gunType ?? "AK-47";
      const gunDmg = GUN_DAMAGE[gunType] ?? GUN_DAMAGE["AK-47"];
      const pellets = Array.isArray(data.pellets) && data.pellets.length > 0
        ? data.pellets : [{ dirX: 0, dirY: 0, dirZ: -1 }];

      // Broadcast visual event
      const fp = pellets[0];
      io.to(player.roomId).emit("shoot_event", {
        shooterId: socket.id,
        originX: ox, originY: oy, originZ: oz,
        dirX: fp.dirX, dirY: fp.dirY, dirZ: fp.dirZ,
        hitPlayerId: null, hitType: "body", gunType,
      });

      // Process pellets
      const dmgMap = new Map<string, { dmg: number; hitType: "body" | "head" }>();

      for (const pellet of pellets) {
        const dx = pellet.dirX, dy = pellet.dirY, dz = pellet.dirZ;
        let bestId: string | null = null;
        let bestType: "body" | "head" = "body";
        let minDist = Infinity;

        for (const [pid, target] of room.players) {
          if (pid === socket.id) continue;
          if (target.health <= 0) continue;
          // Squad: friendly fire off
          if (room.mode === "squad" && target.teamId === player.teamId && player.teamId !== -1) continue;

          const res = rayCastHit(ox, oy, oz, dx, dy, dz, target.x, target.y, target.z, gunDmg.range);
          if (res && res.dist < minDist) {
            minDist = res.dist;
            bestId = pid;
            bestType = res.isHead ? "head" : "body";
          }
        }
        if (bestId) {
          const prev = dmgMap.get(bestId);
          const dmg = bestType === "head" ? gunDmg.head : gunDmg.body;
          dmgMap.set(bestId, {
            dmg: (prev?.dmg ?? 0) + dmg,
            hitType: prev?.hitType === "head" ? "head" : bestType,
          });
        }
      }

      // Apply damage
      for (const [hitId, { dmg, hitType }] of dmgMap) {
        const target = room.players.get(hitId);
        if (!target) continue;

        target.health = Math.max(0, target.health - dmg);

        if (target.health <= 0) {
          player.kills++;
          target.deaths++;

          io.to(player.roomId).emit("player_killed", {
            killerId: socket.id, killerName: player.name,
            victimId: hitId, victimName: target.name,
            headshot: hitType === "head",
          });

          // Check kill target
          if (room.matchActive && player.kills >= room.killTarget) {
            endMatch(io, room, "kills");
            return;
          }

          // Respawn victim in 3s
          setTimeout(() => {
            if (!player.roomId) return;
            const spawnRoom = rooms.get(target.roomId ?? "");
            if (!spawnRoom) return;
            const sp = getSpawnPoint(spawnRoom, spawnRoom.players.size);
            target.x = sp.x; target.y = sp.y; target.z = sp.z;
            target.health = MAX_HP;
            const tSocket = io.sockets.sockets.get(hitId);
            if (tSocket) {
              tSocket.emit("respawn", { x: sp.x, y: sp.y, z: sp.z, health: MAX_HP });
            }
          }, 3000);
        } else {
          const tSocket = io.sockets.sockets.get(hitId);
          if (tSocket) {
            tSocket.emit("take_damage", { health: target.health, fromId: socket.id, hitType });
          }
        }
      }
    });

    socket.on("set_name", ({ name }: { name: string }) => {
      player.name = name.slice(0, 20) || player.name;
    });

    socket.on("ping", () => { socket.emit("pong"); });

    socket.on("leave_room", () => { leaveRoom(socket, player); });

    socket.on("disconnect", () => {
      console.log(`[game] player disconnected: ${socket.id}`);
      leaveRoom(socket, player);
      players.delete(socket.id);
    });
  });

  // ─── joinRoom helper ──────────────────────────────────────────────────
  function joinRoom(socket: any, player: Player, room: Room) {
    if (!socket) return;
    if (player.roomId) leaveRoom(socket, player);

    // Assign team for squad mode
    if (room.mode === "squad") {
      const team0 = Array.from(room.players.values()).filter((p) => p.teamId === 0).length;
      const team1 = Array.from(room.players.values()).filter((p) => p.teamId === 1).length;
      player.teamId = team0 <= team1 ? 0 : 1;
    } else {
      player.teamId = -1;
    }

    const sp = getSpawnPoint(room, room.players.size);
    player.roomId = room.id;
    player.x = sp.x; player.y = sp.y; player.z = sp.z;
    player.health = MAX_HP;
    player.kills = 0; player.deaths = 0;

    room.players.set(player.id, player);
    socket.join(room.id);

    // Start match when first player joins
    if (!room.matchActive) {
      room.matchActive = true;
      room.matchStartTime = Date.now();
    }

    const existingPlayers = Array.from(room.players.values())
      .filter((p) => p.id !== player.id)
      .map((p) => ({
        id: p.id, name: p.name,
        x: p.x, y: p.y, z: p.z,
        rotY: p.rotY, pitchX: p.pitchX,
        health: p.health, kills: p.kills, deaths: p.deaths,
        teamId: p.teamId,
      }));

    socket.emit("joined_room", {
      roomId: room.id, roomName: room.name,
      playerId: player.id,
      spawnX: sp.x, spawnY: sp.y, spawnZ: sp.z,
      existingPlayers,
      map: room.map,
      mode: room.mode,
      code: room.code,
      teamId: player.teamId,
      killTarget: room.killTarget,
      matchDuration: room.matchDuration,
      timeLeft: Math.max(0, room.matchDuration - (Date.now() - (room.matchStartTime ?? Date.now()))),
    });

    socket.to(room.id).emit("player_joined", {
      id: player.id, name: player.name,
      x: sp.x, y: sp.y, z: sp.z,
      rotY: 0, pitchX: 0,
      health: MAX_HP, kills: 0, deaths: 0, teamId: player.teamId,
    });
  }

  // ─── leaveRoom helper ─────────────────────────────────────────────────
  function leaveRoom(socket: any, player: Player) {
    if (!socket || !player.roomId) return;
    const room = rooms.get(player.roomId);
    if (room) {
      room.players.delete(player.id);
      socket.to(room.id).emit("player_left", { id: player.id });
      if (room.players.size === 0) {
        if (room.matchTimerRef) clearTimeout(room.matchTimerRef);
        if (room.code) codesToRooms.delete(room.code);
        rooms.delete(room.id);
      }
    }
    socket.leave(player.roomId);
    player.roomId = null;
    player.teamId = -1;
  }

  // ─── endMatch helper ──────────────────────────────────────────────────
  function endMatch(io: SocketServer, room: Room, reason: "kills" | "timeout") {
    if (!room.matchActive) return;
    room.matchActive = false;

    const results = Array.from(room.players.values())
      .map((p) => ({ id: p.id, name: p.name, kills: p.kills, deaths: p.deaths, teamId: p.teamId }))
      .sort((a, b) => b.kills - a.kills);

    let winnerId: string | null = null;
    let winnerName = "";
    let winnerTeam = -1;

    if (room.mode === "squad") {
      const teamKills = [0, 1].map((tid) =>
        results.filter((r) => r.teamId === tid).reduce((s, r) => s + r.kills, 0)
      );
      winnerTeam = teamKills[0] >= teamKills[1] ? 0 : 1;
    } else {
      const top = results[0];
      if (top) { winnerId = top.id; winnerName = top.name; }
    }

    io.to(room.id).emit("match_end", {
      reason,
      results,
      winnerId, winnerName, winnerTeam,
      map: room.map, mode: room.mode,
    });

    // Kick all players back to lobby after 6 seconds
    setTimeout(() => {
      for (const [pid] of room.players) {
        const sock = io.sockets.sockets.get(pid);
        const p = players.get(pid);
        if (sock && p) leaveRoom(sock, p);
      }
    }, 6000);
  }

  httpServer.on("close", () => clearInterval(updateInterval));
}

// ─── Ray cast hit detection ────────────────────────────────────────────────
function rayCastHit(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  tx: number, ty: number, tz: number,
  maxRange = 120,
): { dist: number; isHead: boolean } | null {
  const BODY_RADIUS = 0.42;
  const HEAD_RADIUS = 0.28;
  const BODY_CY = ty + 0.85;
  const HEAD_CY = ty + 1.62;

  const checkSphere = (cx: number, cy: number, cz: number, r: number): number | null => {
    const ex = ox - cx, ey = oy - cy, ez = oz - cz;
    const b = 2 * (ex * dx + ey * dy + ez * dz);
    const c = ex * ex + ey * ey + ez * ez - r * r;
    const disc = b * b - 4 * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / 2;
    if (t < 0 || t > maxRange) return null;
    return t;
  };

  const headDist = checkSphere(tx, HEAD_CY, tz, HEAD_RADIUS);
  if (headDist !== null) return { dist: headDist, isHead: true };
  const bodyDist = checkSphere(tx, BODY_CY, tz, BODY_RADIUS);
  if (bodyDist !== null) return { dist: bodyDist, isHead: false };
  return null;
}

function resetMatchStats(player: Player) {
  player.kills = 0;
  player.deaths = 0;
}
