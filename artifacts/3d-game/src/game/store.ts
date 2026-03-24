import { create } from "zustand";
import { GUN_CONFIG } from "./gunConfig";

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
  map?: string;
  mode?: "solo" | "squad";
  type?: "public" | "private";
  code?: string | null;
  matchActive?: boolean;
  timeLeft?: number;
}

export type GamePhase = "splash" | "login" | "lobby" | "matchmaking" | "playing" | "results";

export interface MatchResult {
  kills: number;
  deaths: number;
  accuracy: number;
  xpGained: number;
  placement: number;
}

interface GameState {
  phase: GamePhase;
  myId: string | null;
  myName: string;
  myLevel: number;
  myXp: number;
  myRegion: string;
  coins: number;
  ownedItems: string[];
  health: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
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
  matchResult: MatchResult | null;
  graphicsQuality: "low" | "medium" | "high";
  selectedGun: string;
  matchTime: number;
  totalShots: number;
  hitShots: number;
  isScoped: boolean;
  isTpp: boolean;
  currentMap: string;
  matchMode: "solo" | "squad";
  myTeamId: number;
  matchTimeLeft: number;
  killTarget: number;
  matchLeaderboard: Array<{ id: string; name: string; kills: number; deaths: number; teamId: number }>;
  roomCode: string | null;

  // ── Barmuda Battle Royale ──────────────────────────────────────────────────
  hasGun: boolean;
  livesLeft: number;
  barmudaDropping: boolean;
  barmudaDropAlt: number;
  nearbyLootGun: string | null;
  nearbyLootIndex: number | null;
  pickedUpLoot: number[];
  eliminated: boolean;

  setPhase: (p: GamePhase) => void;
  setMyId: (id: string) => void;
  setMyName: (n: string) => void;
  setMyRegion: (r: string) => void;
  setHealth: (h: number) => void;
  setAmmo: (a: number) => void;
  setIsReloading: (r: boolean) => void;
  reload: () => void;
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
  setMatchResult: (r: MatchResult | null) => void;
  setGraphicsQuality: (q: "low" | "medium" | "high") => void;
  setSelectedGun: (g: string) => void;
  setIsScoped: (s: boolean) => void;
  setIsTpp: (t: boolean) => void;
  recordShot: (hit: boolean) => void;
  resetMatchStats: () => void;
  setCurrentMap: (m: string) => void;
  setMatchMode: (m: "solo" | "squad") => void;
  setMyTeamId: (t: number) => void;
  setMatchTimeLeft: (t: number) => void;
  setKillTarget: (k: number) => void;
  setMatchLeaderboard: (lb: Array<{ id: string; name: string; kills: number; deaths: number; teamId: number }>) => void;
  setRoomCode: (c: string | null) => void;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  buyItem: (itemId: string, price: number) => void;

  // ── Barmuda setters ────────────────────────────────────────────────────────
  setHasGun: (v: boolean) => void;
  setLivesLeft: (v: number) => void;
  setBarmudaDropping: (v: boolean) => void;
  setBarmudaDropAlt: (v: number) => void;
  setNearbyLoot: (gun: string | null, idx: number | null) => void;
  pickupLoot: (idx: number, gunType: string) => void;
  setEliminated: (v: boolean) => void;
  resetBarmuda: () => void;
}

let killFeedIdCounter = 0;
let shootEventIdCounter = 0;

export const useGameStore = create<GameState>((set) => ({
  phase: "splash",
  myId: null,
  myName: "Player",
  myLevel: 1,
  myXp: 0,
  myRegion: "Asia",
  coins: 500,
  ownedItems: [],
  health: 100,
  ammo: 0,
  maxAmmo: 0,
  isReloading: false,
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
  matchResult: null,
  graphicsQuality: "medium",
  selectedGun: "AK-47",
  matchTime: 0,
  totalShots: 0,
  hitShots: 0,
  isScoped: false,
  isTpp: false,
  currentMap: "highlands",
  matchMode: "solo",
  myTeamId: -1,
  matchTimeLeft: 300000,
  killTarget: 40,
  matchLeaderboard: [],
  roomCode: null,

  hasGun: true,
  livesLeft: 2,
  barmudaDropping: false,
  barmudaDropAlt: 0,
  nearbyLootGun: null,
  nearbyLootIndex: null,
  pickedUpLoot: [],
  eliminated: false,

  setPhase: (phase) => set({ phase }),
  setMyId: (myId) => set({ myId }),
  setMyName: (myName) => set({ myName }),
  setMyRegion: (myRegion) => set({ myRegion }),
  setHealth: (health) => set({ health }),
  setAmmo: (ammo) => set({ ammo }),
  setIsReloading: (isReloading) => set({ isReloading }),
  reload: () => set((s) => ({ ammo: s.maxAmmo, isReloading: false })),
  addKill: () => set((s) => ({ kills: s.kills + 1, coins: s.coins + 10 })),
  addDeath: () => set((s) => ({ deaths: s.deaths + 1 })),
  setIsDead: (isDead) => set({ isDead }),
  setRespawnCountdown: (respawnCountdown) => set({ respawnCountdown }),

  updateRemotePlayer: (p) =>
    set((s) => ({ remotePlayers: { ...s.remotePlayers, [p.id]: p } })),

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
  setMatchResult: (matchResult) => set({ matchResult }),
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  setSelectedGun: (selectedGun) => set((s) => ({
    selectedGun,
    ammo: s.hasGun ? (GUN_CONFIG[selectedGun]?.ammoCapacity ?? 30) : 0,
    maxAmmo: s.hasGun ? (GUN_CONFIG[selectedGun]?.ammoCapacity ?? 30) : 0,
    isReloading: false,
  })),
  setIsScoped: (isScoped) => set({ isScoped }),
  setIsTpp: (isTpp) => set({ isTpp }),

  recordShot: (hit) =>
    set((s) => ({
      totalShots: s.totalShots + 1,
      hitShots: hit ? s.hitShots + 1 : s.hitShots,
      ammo: Math.max(0, s.ammo - 1),
    })),

  resetMatchStats: () =>
    set({ kills: 0, deaths: 0, totalShots: 0, hitShots: 0, ammo: 0, maxAmmo: 0, isReloading: false, matchTimeLeft: 300000, matchLeaderboard: [] }),
  setCurrentMap: (currentMap) => set({ currentMap }),
  setMatchMode: (matchMode) => set({ matchMode }),
  setMyTeamId: (myTeamId) => set({ myTeamId }),
  setMatchTimeLeft: (matchTimeLeft) => set({ matchTimeLeft }),
  setKillTarget: (killTarget) => set({ killTarget }),
  setMatchLeaderboard: (matchLeaderboard) => set({ matchLeaderboard }),
  setRoomCode: (roomCode) => set({ roomCode }),

  addXp: (amount) =>
    set((s) => {
      const newXp = s.myXp + amount;
      const xpPerLevel = 500;
      const newLevel = Math.floor(newXp / xpPerLevel) + 1;
      return { myXp: newXp, myLevel: newLevel };
    }),

  addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

  buyItem: (itemId, price) =>
    set((s) => {
      if (s.coins < price || s.ownedItems.includes(itemId)) return s;
      return { coins: s.coins - price, ownedItems: [...s.ownedItems, itemId] };
    }),

  setHasGun: (hasGun) => set({ hasGun }),
  setLivesLeft: (livesLeft) => set({ livesLeft }),
  setBarmudaDropping: (barmudaDropping) => set({ barmudaDropping }),
  setBarmudaDropAlt: (barmudaDropAlt) => set({ barmudaDropAlt }),
  setNearbyLoot: (nearbyLootGun, nearbyLootIndex) => set({ nearbyLootGun, nearbyLootIndex }),
  pickupLoot: (idx, gunType) =>
    set((s) => {
      const cfg = GUN_CONFIG[gunType];
      return {
        hasGun: true,
        selectedGun: gunType,
        ammo: cfg?.ammoCapacity ?? 30,
        maxAmmo: cfg?.ammoCapacity ?? 30,
        pickedUpLoot: [...s.pickedUpLoot, idx],
        nearbyLootGun: null,
        nearbyLootIndex: null,
      };
    }),
  setEliminated: (eliminated) => set({ eliminated }),
  resetBarmuda: () =>
    set({
      hasGun: false,
      livesLeft: 2,
      barmudaDropping: true,
      barmudaDropAlt: 80,
      nearbyLootGun: null,
      nearbyLootIndex: null,
      pickedUpLoot: [],
      eliminated: false,
      ammo: 0,
      maxAmmo: 0,
      selectedGun: "AK-47",
    }),
}));
