/**
 * Shared gun config — imported by both client (PlayerController) and
 * can be mirrored on server for damage calculations.
 */
export interface GunConfig {
  fireRate: number;       // ms between shots (minimum)
  auto: boolean;          // true = hold-to-fire, false = single click per shot
  ammoCapacity: number;   // rounds per magazine
  reloadTime: number;     // ms to reload
  pellets: number;        // bullets per trigger pull (8 for shotgun)
  spreadRad: number;      // random cone half-angle in radians
  bodyDamage: number;     // HP damage on body hit
  headDamage: number;     // HP damage on head hit
  range: number;          // max effective range (server-side distance cap)
}

export const GUN_CONFIG: Record<string, GunConfig> = {
  "AK-47": {
    fireRate: 110,
    auto: true,
    ammoCapacity: 30,
    reloadTime: 2200,
    pellets: 1,
    spreadRad: 0.022,
    bodyDamage: 32,
    headDamage: 80,
    range: 120,
  },
  "SMG": {
    fireRate: 62,
    auto: true,
    ammoCapacity: 45,
    reloadTime: 1600,
    pellets: 1,
    spreadRad: 0.048,
    bodyDamage: 18,
    headDamage: 48,
    range: 60,
  },
  "Sniper": {
    fireRate: 1500,
    auto: false,
    ammoCapacity: 5,
    reloadTime: 3200,
    pellets: 1,
    spreadRad: 0,
    bodyDamage: 85,
    headDamage: 150,
    range: 300,
  },
  "Shotgun": {
    fireRate: 800,
    auto: false,
    ammoCapacity: 8,
    reloadTime: 2800,
    pellets: 8,
    spreadRad: 0.10,
    bodyDamage: 14,
    headDamage: 28,
    range: 28,
  },
  "Pistol": {
    fireRate: 230,
    auto: false,
    ammoCapacity: 15,
    reloadTime: 1400,
    pellets: 1,
    spreadRad: 0.012,
    bodyDamage: 28,
    headDamage: 70,
    range: 80,
  },
};
