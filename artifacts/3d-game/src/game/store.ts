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

  hasGun: boolean;
  livesLeft: number;
  barmudaDropping: boolean;
  barmudaDropAlt: number;
  nearbyLootGun: string | null;
  nearbyLootIndex: number | null;
  pickedUpLoot: number[];
  eliminated: boolean;

  armor: number;
  isSprinting: boolean;
  isCrouching: boolean;
  stamina: number;
  weaponSlots: [string | null, string | null];
  activeSlot: number;
  zonePhase: number;
  zoneTimer: number;
  zoneCenterX: number;
  zoneCenterZ: number;
  zoneRadius: number;
  zoneTargetRadius: number;
  zoneShrinking: boolean;
  inZone: boolean;
  killStreak: number;
  killStreakMsg: string | null;
  damageDir: number | null;
  playersAlive: number;
  inventory: { medkits: number; bandages: number; ammoBoxes: number };
  nearbyItemType: string | null;
  nearbyItemIndex: number | null;
  pickedUpItems: number[];
  boostBar: number;

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

  setHasGun: (v: boolean) => void;
  setLivesLeft: (v: number) => void;
  setBarmudaDropping: (v: boolean) => void;
  setBarmudaDropAlt: (v: number) => void;
  setNearbyLoot: (gun: string | null, idx: number | null) => void;
  pickupLoot: (idx: number, gunType: string) => void;
  setEliminated: (v: boolean) => void;
  resetBarmuda: () => void;

  setArmor: (v: number) => void;
  setIsSprinting: (v: boolean) => void;
  setIsCrouching: (v: boolean) => void;
  setStamina: (v: number) => void;
  setActiveSlot: (slot: number) => void;
  switchWeapon: (slot: number) => void;
  setZonePhase: (p: number) => void;
  setZoneTimer: (t: number) => void;
  setZoneRadius: (r: number) => void;
  setZoneTargetRadius: (r: number) => void;
  setZoneShrinking: (v: boolean) => void;
  setZoneCenter: (x: number, z: number) => void;
  setInZone: (v: boolean) => void;
  setKillStreak: (v: number) => void;
  setKillStreakMsg: (msg: string | null) => void;
  setDamageDir: (d: number | null) => void;
  setPlayersAlive: (n: number) => void;
  addInventory: (type: "medkits" | "bandages" | "ammoBoxes", count: number) => void;
  useMedkit: () => void;
  useBandage: () => void;
  setNearbyItem: (type: string | null, idx: number | null) => void;
  pickupItem: (idx: number) => void;
  setBoostBar: (v: number) => void;
}

let killFeedIdCounter = 0;
let shootEventIdCounter = 0;

export const ZONE_PHASES = [
  { radius: 74, waitTime: 60, shrinkTime: 30, damage: 1 },
  { radius: 55, waitTime: 45, shrinkTime: 25, damage: 2 },
  { radius: 38, waitTime: 35, shrinkTime: 20, damage: 3 },
  { radius: 22, waitTime: 25, shrinkTime: 15, damage: 5 },
  { radius: 10, waitTime: 15, shrinkTime: 10, damage: 8 },
  { radius: 0, waitTime: 0, shrinkTime: 10, damage: 15 },
];

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
  currentMap: "barmuda",
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

  armor: 0,
  isSprinting: false,
  isCrouching: false,
  stamina: 100,
  weaponSlots: [null, null],
  activeSlot: 0,
  zonePhase: 0,
  zoneTimer: 60,
  zoneCenterX: 0,
  zoneCenterZ: 0,
  zoneRadius: 74,
  zoneTargetRadius: 74,
  zoneShrinking: false,
  inZone: true,
  killStreak: 0,
  killStreakMsg: null,
  damageDir: null,
  playersAlive: 1,
  inventory: { medkits: 0, bandages: 0, ammoBoxes: 0 },
  nearbyItemType: null,
  nearbyItemIndex: null,
  pickedUpItems: [],
  boostBar: 0,

  setPhase: (phase) => set({ phase }),
  setMyId: (myId) => set({ myId }),
  setMyName: (myName) => set({ myName }),
  setMyRegion: (myRegion) => set({ myRegion }),
  setHealth: (health) => set({ health }),
  setAmmo: (ammo) => set({ ammo }),
  setIsReloading: (isReloading) => set({ isReloading }),
  reload: () => set((s) => ({ ammo: s.maxAmmo, isReloading: false })),
  addKill: () => set((s) => {
    const newStreak = s.killStreak + 1;
    let msg: string | null = null;
    if (s.kills === 0) msg = "FIRST BLOOD";
    else if (newStreak === 2) msg = "DOUBLE KILL";
    else if (newStreak === 3) msg = "TRIPLE KILL";
    else if (newStreak === 4) msg = "QUAD KILL";
    else if (newStreak >= 5) msg = "RAMPAGE!";
    return { kills: s.kills + 1, coins: s.coins + 10, killStreak: newStreak, killStreakMsg: msg };
  }),
  addDeath: () => set((s) => ({ deaths: s.deaths + 1, killStreak: 0 })),
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
    set({
      kills: 0, deaths: 0, totalShots: 0, hitShots: 0, ammo: 0, maxAmmo: 0,
      isReloading: false, matchTimeLeft: 300000, matchLeaderboard: [],
      killStreak: 0, killStreakMsg: null, armor: 0,
      inventory: { medkits: 0, bandages: 0, ammoBoxes: 0 },
      pickedUpItems: [], boostBar: 0,
      zonePhase: 0, zoneTimer: 60, zoneRadius: 74, zoneTargetRadius: 74,
      zoneShrinking: false, zoneCenterX: 0, zoneCenterZ: 0, inZone: true,
      weaponSlots: [null, null] as [string | null, string | null], activeSlot: 0,
      nearbyItemType: null, nearbyItemIndex: null,
      nearbyLootGun: null, nearbyLootIndex: null,
      isSprinting: false, isCrouching: false, stamina: 100,
      damageDir: null, playersAlive: 1,
    }),
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
      const slots = [...s.weaponSlots] as [string | null, string | null];
      let activeSlot = s.activeSlot;
      if (slots[0] === null) {
        slots[0] = gunType;
        activeSlot = 0;
      } else if (slots[1] === null) {
        slots[1] = gunType;
        activeSlot = 1;
      } else {
        slots[activeSlot] = gunType;
      }
      return {
        hasGun: true,
        selectedGun: gunType,
        ammo: cfg?.ammoCapacity ?? 30,
        maxAmmo: cfg?.ammoCapacity ?? 30,
        pickedUpLoot: [...s.pickedUpLoot, idx],
        nearbyLootGun: null,
        nearbyLootIndex: null,
        weaponSlots: slots,
        activeSlot,
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
      armor: 0,
      weaponSlots: [null, null],
      activeSlot: 0,
      stamina: 100,
      isSprinting: false,
      isCrouching: false,
      killStreak: 0,
      killStreakMsg: null,
      inventory: { medkits: 0, bandages: 0, ammoBoxes: 0 },
      pickedUpItems: [],
      boostBar: 0,
      zonePhase: 0,
      zoneTimer: 60,
      zoneRadius: 74,
      zoneTargetRadius: 74,
      zoneShrinking: false,
      zoneCenterX: 0,
      zoneCenterZ: 0,
      inZone: true,
      playersAlive: Object.keys(useGameStore.getState().remotePlayers).length + 1,
    }),

  setArmor: (armor) => set({ armor: Math.min(100, Math.max(0, armor)) }),
  setIsSprinting: (isSprinting) => set({ isSprinting }),
  setIsCrouching: (isCrouching) => set({ isCrouching }),
  setStamina: (stamina) => set({ stamina: Math.min(100, Math.max(0, stamina)) }),
  setActiveSlot: (activeSlot) => set({ activeSlot }),
  switchWeapon: (slot) =>
    set((s) => {
      const gun = s.weaponSlots[slot];
      if (!gun) return s;
      const cfg = GUN_CONFIG[gun];
      return {
        activeSlot: slot,
        selectedGun: gun,
        ammo: cfg?.ammoCapacity ?? 30,
        maxAmmo: cfg?.ammoCapacity ?? 30,
        isReloading: false,
      };
    }),
  setZonePhase: (zonePhase) => set({ zonePhase }),
  setZoneTimer: (zoneTimer) => set({ zoneTimer }),
  setZoneRadius: (zoneRadius) => set({ zoneRadius }),
  setZoneTargetRadius: (zoneTargetRadius) => set({ zoneTargetRadius }),
  setZoneShrinking: (zoneShrinking) => set({ zoneShrinking }),
  setZoneCenter: (zoneCenterX, zoneCenterZ) => set({ zoneCenterX, zoneCenterZ }),
  setInZone: (inZone) => set({ inZone }),
  setKillStreak: (killStreak) => set({ killStreak }),
  setKillStreakMsg: (killStreakMsg) => set({ killStreakMsg }),
  setDamageDir: (damageDir) => set({ damageDir }),
  setPlayersAlive: (playersAlive) => set({ playersAlive }),
  addInventory: (type, count) =>
    set((s) => ({
      inventory: { ...s.inventory, [type]: s.inventory[type] + count },
    })),
  useMedkit: () =>
    set((s) => {
      if (s.inventory.medkits <= 0 || s.health >= 100) return s;
      return {
        health: Math.min(100, s.health + 50),
        inventory: { ...s.inventory, medkits: s.inventory.medkits - 1 },
      };
    }),
  useBandage: () =>
    set((s) => {
      if (s.inventory.bandages <= 0 || s.health >= 75) return s;
      return {
        health: Math.min(75, s.health + 15),
        inventory: { ...s.inventory, bandages: s.inventory.bandages - 1 },
      };
    }),
  setNearbyItem: (nearbyItemType, nearbyItemIndex) => set({ nearbyItemType, nearbyItemIndex }),
  pickupItem: (idx) =>
    set((s) => {
      return {
        pickedUpItems: [...s.pickedUpItems, idx],
        nearbyItemType: null,
        nearbyItemIndex: null,
      };
    }),
  setBoostBar: (boostBar) => set({ boostBar: Math.min(100, Math.max(0, boostBar)) }),
}));
