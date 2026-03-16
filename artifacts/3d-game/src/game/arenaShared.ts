import * as THREE from "three";

export interface ArenaBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  cy: number;
  h: number;
}

// Shared mutable arena state — each map writes here on mount.
// Pre-populated with Highlands so PlayerController never reads empty.
export const sharedArena = {
  boxes: [] as ArenaBox[],
  bounds: 27,
};
