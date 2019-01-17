export const TILE_HIGHWALL      = 0;
export const TILE_WALL          = 1;
export const TILE_BRICKWALL     = 2;
export const TILE_DEEPWATER     = 3;
export const TILE_WATER         = 4;
export const TILE_SHALLOWWATER  = 5;
export const TILE_DIRT          = 6;
export const TILE_GRASS         = 7;
export const TILE_PAVED         = 8;
export const TILE_EXIT          = 9;
export const TILE_ENTRANCE      = 10;

export const GROUND_TILES = [
    TILE_DIRT,
    TILE_GRASS,
    TILE_PAVED,
    TILE_EXIT,
    TILE_ENTRANCE,
];
export const WATER_TILES = [
    TILE_DEEPWATER,
    TILE_WATER,
    TILE_SHALLOWWATER,
    TILE_EXIT,
    TILE_ENTRANCE,
];
export const WALL_TILES = [
    TILE_HIGHWALL,
    TILE_WALL,
    TILE_BRICKWALL,
];
export const FORBIDDEN_DOT_TILES = [
    TILE_DEEPWATER,
    TILE_WATER,
    TILE_SHALLOWWATER,
    TILE_HIGHWALL,
    TILE_WALL,
    TILE_BRICKWALL,
];
export const FORBIDDEN_BOX_TILES = [
    TILE_HIGHWALL,
    TILE_WALL,
    TILE_BRICKWALL,
];
export const FORBIDDEN_SNAKE_TILES = [
    TILE_HIGHWALL,
    TILE_WALL,
    TILE_BRICKWALL,
];

export const WIDE_GROUND_BIOME      = 0;
export const NARROW_GROUND_BIOME    = 1;
export const WIDE_WATER_BIOME       = 2;
export const NARROW_WATER_BIOME     = 3;

export const LOCATION_RADIUS    = 5;
export const LOCATION_DIST      = 10;

export const OBJECT_STRIDE  = 0.5;

export const LIGHTMAP_PRECISION = 2;

export const LIGHT_MAXNUM   = 16;
export const LIGHT_MAXDIST  = 50 * LIGHTMAP_PRECISION;
export const LIGHT_DISTEXP  = 1;

export const LIGHT_AMBIENT_INITIAL  = 3;
export const LIGHT_AMBIENT_DECREASE = 0.03;

export const LIGHTPARTICLE_BRIGHTNESS   = 10 * LIGHTMAP_PRECISION;
export const LIGHTPARTICLE_FLICKER      = LIGHTMAP_PRECISION;
export const LIGHTPARTICLE_DECAY        = 0.15 * LIGHTMAP_PRECISION;
export const LIGHTPARTICLE_DEATH        = 1.5 * LIGHTMAP_PRECISION;

export const DIRECTIONS = [
    { i: 1, j: 0 },
    { i: 0, j: -1 },
    { i: -1, j: 0 },
    { i: 0, j: 1 },
    { i: 1, j: -1 },
    { i: -1, j: -1 },
    { i: -1, j: 1 },
    { i: 1, j: 1 }
];

export const MAX_COUNTER    = 1000;

export const ACTION_IDLE        = 0;
export const ACTION_CHARGING    = 1;
export const ACTION_LOST        = 2;
