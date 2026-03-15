import { create } from "zustand";

export interface RemotePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitchX: number;
  health: number;
  kills: number;
  deaths: number;
}

export interface KillFeed {
  id: number;
  killerName: string;
  victimName: string;
  headshot: boolean;
  time: number;
}

export interface ShootEvent {
  id: number;
  shooterId: string;
  originX: number;
  originY: number;
  originZ: number;
  dirX: number;
  dirY: number;
  dirZ: number;
  hitPlayerId: string | null;
  time: number;
}

export interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
}

type GamePhase = "lobby" | "playing";

interface GameState {
  phase: GamePhase;
  myId: string | null;
  myName: string;
  health: number;
  kills: number;
  deaths: number;
  isDead: boolean;
  respawnCountdown: number;
  remotePlayers: Record<string, RemotePlayer>;
  killFeed: KillFeed[];
  shootEvents: ShootEvent[];
  rooms: Room[];
  currentRoom: string | null;
  currentRoomName: string;
  hitIndicator: boolean;
  headshotIndicator: boolean;
  latency: number;

  setPhase: (p: GamePhase) => void;
  setMyId: (id: string) => void;
  setMyName: (n: string) => void;
  setHealth: (h: number) => void;
  addKill: () => void;
  addDeath: () => void;
  setIsDead: (d: boolean) => void;
  setRespawnCountdown: (c: number) => void;
  updateRemotePlayer: (p: RemotePlayer) => void;
  updateRemotePlayers: (ps: RemotePlayer[]) => void;
  addRemotePlayer: (p: RemotePlayer) => void;
  removeRemotePlayer: (id: string) => void;
  addKillFeed: (k: Omit<KillFeed, "id" | "time">) => void;
  addShootEvent: (e: Omit<ShootEvent, "id" | "time">) => void;
  clearShootEvent: (id: number) => void;
  setRooms: (r: Room[]) => void;
  setCurrentRoom: (id: string | null, name: string) => void;
  setHitIndicator: (h: boolean) => void;
  setHeadshotIndicator: (h: boolean) => void;
  setLatency: (l: number) => void;
}

let killFeedIdCounter = 0;
let shootEventIdCounter = 0;

export const useGameStore = create<GameState>((set) => ({
  phase: "lobby",
  myId: null,
  myName: "Player",
  health: 100,
  kills: 0,
  deaths: 0,
  isDead: false,
  respawnCountdown: 0,
  remotePlayers: {},
  killFeed: [],
  shootEvents: [],
  rooms: [],
  currentRoom: null,
  currentRoomName: "",
  hitIndicator: false,
  headshotIndicator: false,
  latency: 0,

  setPhase: (phase) => set({ phase }),
  setMyId: (myId) => set({ myId }),
  setMyName: (myName) => set({ myName }),
  setHealth: (health) => set({ health }),
  addKill: () => set((s) => ({ kills: s.kills + 1 })),
  addDeath: () => set((s) => ({ deaths: s.deaths + 1 })),
  setIsDead: (isDead) => set({ isDead }),
  setRespawnCountdown: (respawnCountdown) => set({ respawnCountdown }),

  updateRemotePlayer: (p) =>
    set((s) => ({
      remotePlayers: { ...s.remotePlayers, [p.id]: p },
    })),

  updateRemotePlayers: (ps) =>
    set((s) => {
      const next = { ...s.remotePlayers };
      for (const p of ps) {
        if (s.myId && p.id === s.myId) continue;
        next[p.id] = { ...next[p.id], ...p };
      }
      return { remotePlayers: next };
    }),

  addRemotePlayer: (p) =>
    set((s) => ({ remotePlayers: { ...s.remotePlayers, [p.id]: p } })),

  removeRemotePlayer: (id) =>
    set((s) => {
      const next = { ...s.remotePlayers };
      delete next[id];
      return { remotePlayers: next };
    }),

  addKillFeed: (k) =>
    set((s) => ({
      killFeed: [
        { ...k, id: ++killFeedIdCounter, time: Date.now() },
        ...s.killFeed.slice(0, 4),
      ],
    })),

  addShootEvent: (e) =>
    set((s) => ({
      shootEvents: [
        ...s.shootEvents,
        { ...e, id: ++shootEventIdCounter, time: Date.now() },
      ].slice(-20),
    })),

  clearShootEvent: (id) =>
    set((s) => ({ shootEvents: s.shootEvents.filter((e) => e.id !== id) })),

  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (currentRoom, currentRoomName) =>
    set({ currentRoom, currentRoomName }),

  setHitIndicator: (hitIndicator) => set({ hitIndicator }),
  setHeadshotIndicator: (headshotIndicator) => set({ headshotIndicator }),
  setLatency: (latency) => set({ latency }),
}));
