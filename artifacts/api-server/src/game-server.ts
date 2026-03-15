import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

// ─── Gun damage table (keep in sync with client gunConfig.ts) ─────────────
const GUN_DAMAGE: Record<string, { body: number; head: number; range: number }> = {
  "AK-47":   { body: 32,  head: 80,  range: 120 },
  "SMG":     { body: 18,  head: 48,  range: 60  },
  "Sniper":  { body: 85,  head: 150, range: 300 },
  "Shotgun": { body: 14,  head: 28,  range: 28  }, // per pellet
  "Pistol":  { body: 28,  head: 70,  range: 80  },
};

interface Player {
  id: string;
  name: string;
  roomId: string | null;
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitchX: number;
  health: number;
  kills: number;
  deaths: number;
  lastInputSeq: number;
}

interface Room {
  id: string;
  name: string;
  players: Map<string, Player>;
  maxPlayers: number;
  gameStarted: boolean;
}

const SPAWN_POINTS = [
  { x: 0, y: 1, z: 0 },
  { x: 15, y: 1, z: 15 },
  { x: -15, y: 1, z: 15 },
  { x: 15, y: 1, z: -15 },
  { x: -15, y: 1, z: -15 },
  { x: 20, y: 1, z: 0 },
  { x: -20, y: 1, z: 0 },
  { x: 0, y: 1, z: 20 },
  { x: 0, y: 1, z: -20 },
];

const MAX_HP = 100;
const TICK_RATE = 20;
const rooms = new Map<string, Room>();
const players = new Map<string, Player>();

function getSpawnPoint(room: Room): { x: number; y: number; z: number } {
  const used = Array.from(room.players.values()).map((p) => ({
    x: p.x,
    z: p.z,
  }));
  for (const sp of SPAWN_POINTS) {
    const occupied = used.some(
      (u) => Math.abs(u.x - sp.x) < 3 && Math.abs(u.z - sp.z) < 3,
    );
    if (!occupied) return { ...sp };
  }
  const idx = Math.floor(Math.random() * SPAWN_POINTS.length);
  return { ...SPAWN_POINTS[idx] };
}

function createRoom(name: string): Room {
  const id = `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const room: Room = {
    id,
    name,
    players: new Map(),
    maxPlayers: 8,
    gameStarted: false,
  };
  rooms.set(id, room);
  return room;
}

function getRoomList() {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    playerCount: r.players.size,
    maxPlayers: r.maxPlayers,
    gameStarted: r.gameStarted,
  }));
}

export function initGameServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    path: "/socket.io/",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 5000,
    pingTimeout: 10000,
  });

  const updateInterval = setInterval(() => {
    for (const room of rooms.values()) {
      if (room.players.size === 0) continue;
      const snapshot = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        rotY: p.rotY,
        pitchX: p.pitchX,
        health: p.health,
        kills: p.kills,
        deaths: p.deaths,
        seq: p.lastInputSeq,
      }));
      io.to(room.id).emit("world_state", { players: snapshot });
    }
  }, 1000 / TICK_RATE);

  io.on("connection", (socket) => {
    console.log(`[game] player connected: ${socket.id}`);

    const player: Player = {
      id: socket.id,
      name: `Player_${socket.id.slice(0, 4)}`,
      roomId: null,
      x: 0,
      y: 1,
      z: 0,
      rotY: 0,
      pitchX: 0,
      health: MAX_HP,
      kills: 0,
      deaths: 0,
      lastInputSeq: 0,
    };
    players.set(socket.id, player);

    socket.emit("init", {
      id: socket.id,
      rooms: getRoomList(),
    });

    socket.on("get_rooms", () => {
      socket.emit("rooms_list", getRoomList());
    });

    socket.on("create_room", ({ name }: { name: string }) => {
      const room = createRoom(name || `Room ${rooms.size + 1}`);
      joinRoom(socket, player, room);
    });

    socket.on("join_room", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      if (room.players.size >= room.maxPlayers) {
        socket.emit("error", { message: "Room is full" });
        return;
      }
      joinRoom(socket, player, room);
    });

    socket.on(
      "player_input",
      (data: {
        x: number;
        y: number;
        z: number;
        rotY: number;
        pitchX: number;
        seq: number;
      }) => {
        if (!player.roomId) return;
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
        player.rotY = data.rotY;
        player.pitchX = data.pitchX;
        player.lastInputSeq = data.seq;
      },
    );

    socket.on(
      "shoot",
      (data: {
        originX: number;
        originY: number;
        originZ: number;
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
          ? data.pellets
          : [{ dirX: 0, dirY: 0, dirZ: -1 }]; // fallback

        // Broadcast the first pellet for visual effects
        const firstPellet = pellets[0];
        const shootEvent = {
          shooterId: socket.id,
          originX: ox, originY: oy, originZ: oz,
          dirX: firstPellet.dirX, dirY: firstPellet.dirY, dirZ: firstPellet.dirZ,
          hitPlayerId: null as string | null,
          hitType: "body" as "body" | "head",
          gunType,
        };
        io.to(player.roomId).emit("shoot_event", shootEvent);

        // Process every pellet for hit detection
        const totalDamageByPlayer = new Map<string, number>();
        let lastHitType: "body" | "head" = "body";

        for (const pellet of pellets) {
          const dx = pellet.dirX, dy = pellet.dirY, dz = pellet.dirZ;
          let hitPlayerId: string | null = null;
          let hitType: "body" | "head" = "body";
          let minDist = Infinity;

          for (const [pid, target] of room.players) {
            if (pid === socket.id) continue;
            if (target.health <= 0) continue;

            const result = rayCastHit(ox, oy, oz, dx, dy, dz, target.x, target.y, target.z, gunDmg.range);
            if (result && result.dist < minDist) {
              minDist = result.dist;
              hitPlayerId = pid;
              hitType = result.isHead ? "head" : "body";
            }
          }

          if (hitPlayerId) {
            const dmg = hitType === "head" ? gunDmg.head : gunDmg.body;
            totalDamageByPlayer.set(hitPlayerId, (totalDamageByPlayer.get(hitPlayerId) ?? 0) + dmg);
            lastHitType = hitType;
          }
        }

        // Apply accumulated damage
        for (const [hitPlayerId, totalDmg] of totalDamageByPlayer) {
          const target = room.players.get(hitPlayerId);
          if (target) {
            const hitType = lastHitType;
            target.health = Math.max(0, target.health - totalDmg);

            if (target.health <= 0) {
              player.kills++;
              target.deaths++;

              io.to(player.roomId).emit("player_killed", {
                killerId: socket.id,
                killerName: player.name,
                victimId: hitPlayerId,
                victimName: target.name,
                headshot: hitType === "head",
              });

              setTimeout(() => {
                if (!player.roomId) return;
                const spawnRoom = rooms.get(player.roomId);
                if (!spawnRoom) return;
                const sp = getSpawnPoint(spawnRoom);
                target.x = sp.x;
                target.y = sp.y;
                target.z = sp.z;
                target.health = MAX_HP;
                const tSocket = io.sockets.sockets.get(hitPlayerId!);
                if (tSocket) {
                  tSocket.emit("respawn", {
                    x: sp.x,
                    y: sp.y,
                    z: sp.z,
                    health: MAX_HP,
                  });
                }
              }, 3000);
            } else {
              const tSocket = io.sockets.sockets.get(hitPlayerId);
              if (tSocket) {
                tSocket.emit("take_damage", {
                  health: target.health,
                  fromId: socket.id,
                  hitType,
                });
              }
            }
          }
        }
      },
    );

    socket.on("set_name", ({ name }: { name: string }) => {
      player.name = name.slice(0, 20) || player.name;
    });

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("leave_room", () => {
      leaveRoom(socket, player);
    });

    socket.on("disconnect", () => {
      console.log(`[game] player disconnected: ${socket.id}`);
      leaveRoom(socket, player);
      players.delete(socket.id);
    });
  });

  function joinRoom(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket: any,
    player: Player,
    room: Room,
  ) {
    if (!socket) return;
    if (player.roomId) leaveRoom(socket, player);

    const sp = getSpawnPoint(room);
    player.roomId = room.id;
    player.x = sp.x;
    player.y = sp.y;
    player.z = sp.z;
    player.health = MAX_HP;
    player.kills = 0;
    player.deaths = 0;

    room.players.set(player.id, player);
    socket.join(room.id);

    const existingPlayers = Array.from(room.players.values())
      .filter((p) => p.id !== player.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        z: p.z,
        rotY: p.rotY,
        pitchX: p.pitchX,
        health: p.health,
        kills: p.kills,
        deaths: p.deaths,
      }));

    socket.emit("joined_room", {
      roomId: room.id,
      roomName: room.name,
      playerId: player.id,
      spawnX: sp.x,
      spawnY: sp.y,
      spawnZ: sp.z,
      existingPlayers,
    });

    socket.to(room.id).emit("player_joined", {
      id: player.id,
      name: player.name,
      x: sp.x,
      y: sp.y,
      z: sp.z,
      rotY: 0,
      pitchX: 0,
      health: MAX_HP,
      kills: 0,
      deaths: 0,
    });
  }

  function leaveRoom(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket: any,
    player: Player,
  ) {
    if (!socket || !player.roomId) return;
    const room = rooms.get(player.roomId);
    if (room) {
      room.players.delete(player.id);
      socket.to(room.id).emit("player_left", { id: player.id });
      if (room.players.size === 0) {
        rooms.delete(room.id);
      }
    }
    socket.leave(player.roomId);
    player.roomId = null;
  }

  httpServer.on("close", () => clearInterval(updateInterval));
}

function rayCastHit(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  tx: number,
  ty: number,
  tz: number,
): { dist: number; isHead: boolean } | null {
  const MAX_RANGE = 100;
  const BODY_RADIUS = 0.4;
  const HEAD_RADIUS = 0.25;
  const BODY_CY = ty + 0.8;
  const HEAD_CY = ty + 1.6;

  const checkSphere = (
    cx: number,
    cy: number,
    cz: number,
    r: number,
  ): number | null => {
    const ex = ox - cx,
      ey = oy - cy,
      ez = oz - cz;
    const b = 2 * (ex * dx + ey * dy + ez * dz);
    const c = ex * ex + ey * ey + ez * ez - r * r;
    const disc = b * b - 4 * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / 2;
    if (t < 0 || t > MAX_RANGE) return null;
    return t;
  };

  const headDist = checkSphere(tx, HEAD_CY, tz, HEAD_RADIUS);
  if (headDist !== null) return { dist: headDist, isHead: true };

  const bodyDist = checkSphere(tx, BODY_CY, tz, BODY_RADIUS);
  if (bodyDist !== null) return { dist: bodyDist, isHead: false };

  return null;
}
