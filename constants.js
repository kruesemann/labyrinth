// CAMERA
export const CAMERA_DIST        = 50;
export const CAMERA_FOV         = 45;
export const CAMERA_NEAR        = 1;
export const CAMERA_FAR         = 1001;
export const CAMERA_SCROLLSPEED = 0.001;

// MAP TYPES
export const MAP_TYPE_GROUND        = 0;
export const MAP_TYPE_FLOODEDGROUND = 1;
export const MAP_TYPE_DEVELOPED     = 2;
export const MAP_TYPE_ROCK          = 3;
export const MAP_TYPE_FLOODEDROCK   = 4;

export const MAP_TYPE_FREQ_GROUND = [
    70,
    40,
    15,
];
export const MAP_TYPE_FREQ_FLOODEDGROUND = [
    0,
    20,
    25,
];
export const MAP_TYPE_FREQ_DEVELOPED = [
    0,
    0,
    5
];
export const MAP_TYPE_FREQ_ROCK = [
    30,
    30,
    20
];
export const MAP_TYPE_FREQ_FLOODEDROCK = [
    0,
    10,
    35,
];

export const MAP_TYPE_LEVEL_THRESHHOLDS = [
    //0,
    5,
    10,
];

// CAVE TYPES
export const CAVE_TYPE_CAVESYSTEM   = 0;
export const CAVE_TYPE_GRANDCAVERN  = 1;
export const CAVE_TYPE_NARROWS      = 2;

// TILE TYPES
export const TILE_HIGHWALL      = 0;
export const TILE_WALL          = 1;
export const TILE_BRICKWALL     = 2;
export const TILE_DEEPWATER     = 3;
export const TILE_WATER         = 4;
export const TILE_ROCK          = 5;
export const TILE_DIRT          = 6;
export const TILE_GRASS         = 7;
export const TILE_PAVED         = 8;
export const TILE_EXIT          = 9;
export const TILE_ENTRANCE      = 10;
export const TILE_SHRINE        = 11;

export const GROUND_TILES = [
    TILE_DIRT,
    TILE_ROCK,
    TILE_GRASS,
    TILE_PAVED,
    TILE_EXIT,
    TILE_ENTRANCE,
];
export const WATER_TILES = [
    TILE_DEEPWATER,
    TILE_WATER,
    TILE_EXIT,
    TILE_ENTRANCE,
];
export const WALL_TILES = [
    TILE_HIGHWALL,
    TILE_WALL,
    TILE_BRICKWALL,
    TILE_SHRINE,
];
export const FORBIDDEN_DOT_TILES = [
    TILE_DEEPWATER,
    TILE_WATER,
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

// BIOME TYPES
export const WIDE_GROUND_BIOME      = 0;
export const NARROW_GROUND_BIOME    = 1;
export const WIDE_WATER_BIOME       = 2;
export const NARROW_WATER_BIOME     = 3;

// LOCATION GRID PARAMETERS
export const LOCATION_RADIUS    = 5;
export const LOCATION_DIST      = 10;

// NOISE PARAMETERS
export const NOISE_CHANNELS = 5;
export const NOISE_COLORS = [
    [1.0, 2.0, 8.0, 3.0, 5.0, 1.0],
    [4.0, 3.0, 2.5, 2.0, 1.5, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    [30.0, 15.0, 7.5, 4.0, 2.0, 1.0],
    [2.0, 0.0, 2.0, 0.0, 1.0, 1.0],
];
export const NOISE_EXPONENTS = [
    2,
    1,
    3,
    1,
    2,
];

// OBJECT PARAMETERS
export const OBJECT_STRIDE  = 0.5;

// LIGHTING
export const LIGHTMAP_PRECISION = 2;

export const LIGHT_MAXNUM   = 16;
export const LIGHT_MAXDIST  = 50 * LIGHTMAP_PRECISION;
export const LIGHT_DISTEXP  = 1;

export const LIGHT_AMBIENT_INITIAL  = 3;
export const LIGHT_AMBIENT_DECREASE = 0.15;

export const LIGHTPARTICLE_BRIGHTNESS   = 10 * LIGHTMAP_PRECISION;
export const LIGHTPARTICLE_FLICKER      = LIGHTMAP_PRECISION;
export const LIGHTPARTICLE_DECAY        = 0.15 * LIGHTMAP_PRECISION;
export const LIGHTPARTICLE_DEATH        = 1.5 * LIGHTMAP_PRECISION;

export const LIGHT_PLAYER_GROWTH    = 1.3;

export const LIGHT_WISP_JUMP            = 10;
export const LIGHT_WISP_FLICKER         = LIGHTMAP_PRECISION * 0.5;
export const LIGHT_WISP_BRIGHTNESS_MIN  = 2.5 * LIGHTMAP_PRECISION;
export const LIGHT_WISP_BRIGHTNESS_MAX  = 8 * LIGHTMAP_PRECISION;
export const LIGHT_WISP_INTERVAL_MIN    = 1000;
export const LIGHT_WISP_INTERVAL_MAX    = 2000;
export const LIGHT_WISP_CHANGE_MIN      = 2.5 * LIGHTMAP_PRECISION;
export const LIGHT_WISP_CHANGE_MAX      = 12 * LIGHTMAP_PRECISION;

// ANIMATION
export const ANIMATION_FADE_TIME    = 500;
export const ANIMATION_OPACITY      = 0.5;
export const ANIMATION_DANCE_TIME   = 2500;

// PATH FINDING
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

// GAME TICK
export const MAX_COUNTER    = 10000;

// AI
export const ACTION_IDLE        = 0;
export const ACTION_CHARGING    = 1;

// PLAYER PARAMETERS
export const IMMUNE_TIME    = 50;
export const HEALTH_HURT    = 34;
export const HEALTH_HEAL    = 34;
