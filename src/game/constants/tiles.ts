// Mapping with:
// - Single index for putTileAt
// - Array of weights for weightedRandomize
// - Array or 2D array for putTilesAt
const TILE_MAPPING = {
  WALL: {
    TOP_LEFT: 9,
    BOTTOM_RIGHT: 10,
    TOP_RIGHT: 11,
    BOTTOM_LEFT: 12,
    // Let's add some randomization to the walls while we are refactoring:
    TOP: [{ index: 6, weight: 1 }],
    LEFT: [{ index: 5, weight: 1 }],
    RIGHT: [{ index: 8, weight: 1 }],
    BOTTOM: [{ index: 7, weight: 1 }],
  },
  WALLS: [5, 6, 7, 8, 9, 10, 11, 12],
  ITEMS: [15, 16],
  DOORS: [3, 4, 13, 14],
  BLANK: 1,
  FLOOR: [{ index: 0, weight: 1 }, { index: 2, weight: 1 }, { index: 1, weight: 4 }],
  ROCK: 15,
  BARREL: 16,
  DOOR: {
    TOP: 3,
    LEFT: 14,
    BOTTOM: 13,
    RIGHT: 4
  },
  // CHEST: 166,
  // STAIRS: 81,
  // TOWER: [
    // [186],
    // [205]
  // ]
  MINIMAP: {
    EMPTY: 0,
    FULL: 1,
    FELLER: 2,
    ENEMY: 3
  },
  DUNGEON_TILES: {
    EMPTY: 0,
    WALL: 1,
    FLOOR: 2,
    DOOR: 3,
  }
};

export default TILE_MAPPING;