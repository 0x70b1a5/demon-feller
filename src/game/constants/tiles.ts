// Mapping with:
// - Single index for putTileAt
// - Array of weights for weightedRandomize
// - Array or 2D array for putTilesAt
const TILE_MAPPING = {
  WALL: {
    // TOP_LEFT: 3,
    // TOP_RIGHT: 4,
    // BOTTOM_RIGHT: 23,
    // BOTTOM_LEFT: 22,
    // Let's add some randomization to the walls while we are refactoring:
    TOP: [{ index: 6, weight: 1 }],
    LEFT: [{ index: 5, weight: 1 }],
    RIGHT: [{ index: 8, weight: 1 }],
    BOTTOM: [{ index: 7, weight: 1 }],
  },
  BLANK: 1,
  FLOOR: [{ index: 0, weight: 1 }, { index: 2, weight: 1 }, { index: 1, weight: 4 }],
  // ROCK: [{ index: 13, weight: 1 }, { index: 32, weight: 1 }, { index: 51, weight: 1 }],
  // BARREL: [{ index: 13, weight: 1 }, { index: 32, weight: 1 }, { index: 51, weight: 1 }],
  DOOR: {
    TOP: [3, 3, 3],
    LEFT: [
      [3],
      [3],
      [3]
    ],
    BOTTOM: [3, 3, 3],
    RIGHT: [
      [3],
      [3],
      [3]
    ]
  },
  // CHEST: 166,
  // STAIRS: 81,
  // TOWER: [
    // [186],
    // [205]
  // ]
};

export default TILE_MAPPING;