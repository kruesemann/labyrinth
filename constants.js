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
export const TILE_BEACON        = 12;

export const GROUND_TILES = [
    TILE_DIRT,
    TILE_ROCK,
    TILE_GRASS,
    TILE_PAVED,
    TILE_EXIT,
    TILE_ENTRANCE,
    TILE_BEACON,
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
    TILE_SHRINE,
];
export const FORBIDDEN_BOX_TILES = [
    TILE_HIGHWALL,
    TILE_WALL,
    TILE_BRICKWALL,
    TILE_SHRINE,
];
export const FORBIDDEN_SNAKE_TILES = [
    TILE_HIGHWALL,
    TILE_WALL,
    TILE_BRICKWALL,
    TILE_SHRINE,
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
export const LIGHT_MAP_PRECISION    = 2;
export const LIGHT_MAX_RENDER_DIST  = 70;

export const LIGHT_MAXNUM   = 16;
export const LIGHT_MAXDIST  = 50 * LIGHT_MAP_PRECISION;
export const LIGHT_DISTEXP  = 1;

export const LIGHT_AMBIENT_INITIAL  = 3;
export const LIGHT_AMBIENT_DECREASE = 0.15;

export const LIGHT_PARTICLE_BRIGHTNESS  = 10 * LIGHT_MAP_PRECISION;
export const LIGHT_PARTICLE_FLICKER     = 1.5 * LIGHT_MAP_PRECISION;
export const LIGHT_PARTICLE_DECAY       = 0.15 * LIGHT_MAP_PRECISION;
export const LIGHT_PARTICLE_DEATH       = 1.5 * LIGHT_MAP_PRECISION;

export const LIGHT_WISP_JUMP            = 10;
export const LIGHT_WISP_FLICKER         = LIGHT_MAP_PRECISION;
export const LIGHT_WISP_BRIGHTNESS_MIN  = 2.5 * LIGHT_MAP_PRECISION;
export const LIGHT_WISP_BRIGHTNESS_MAX  = 8 * LIGHT_MAP_PRECISION;
export const LIGHT_WISP_INTERVAL_MIN    = 800;
export const LIGHT_WISP_INTERVAL_MAX    = 1500;
export const LIGHT_WISP_INTERVAL        = 4;
export const LIGHT_WISP_CHANGE_MIN      = 10 * LIGHT_MAP_PRECISION;
export const LIGHT_WISP_CHANGE_MAX      = 15 * LIGHT_MAP_PRECISION;

export const LIGHT_BEACON_BRIGHTNESS    = 15 * LIGHT_MAP_PRECISION;
export const LIGHT_BEACON_FLARE         = 25 * LIGHT_MAP_PRECISION;

export const LIGHT_FLARE_STEP_WIDTH     = 0.05;
export const LIGHT_FLARE_STEP_TIME      = 50;

export const LIGHT_HINTLIGHT_BRIGHTNESS = 7 * LIGHT_MAP_PRECISION;
export const LIGHT_HINTLIGHT_SPEED      = 1;
export const LIGHT_HINTLIGHT_DECAY      = 0.3 * LIGHT_MAP_PRECISION;

export const LIGHT_SENDLIGHT_SPEED      = 3;

// SECRET PARAMETERS
export const INVISIBLE_GLEAM_INTERVAL_MIN    = 500;
export const INVISIBLE_GLEAM_INTERVAL_MAX    = 1500;

// ANIMATION
export const ANIMATION_DANCE_SIZE       = 5;
export const ANIMATION_DANCE_FADE_TIME  = 500;
export const ANIMATION_DANCE_OPACITY    = 0.75;
export const ANIMATION_DANCE_TIME       = 2500;

export const ANIMATION_SPARKS_SIZE      = 10;
export const ANIMATION_SPARKS_TIME      = 250;

export const ANIMATION_GLEAM_SIZE       = 5;
export const ANIMATION_GLEAM_TIME       = 250;

// PATH FINDING
export const DIRECTIONS = [
    {i:  1, j:  0},
    {i:  0, j: -1},
    {i: -1, j:  0},
    {i:  0, j:  1},
    {i:  1, j: -1},
    {i: -1, j: -1},
    {i: -1, j:  1},
    {i:  1, j:  1}
];

// GAME TICK
export const MAX_COUNTER    = 10000;

// AI
export const ACTION_IDLE        = 0;
export const ACTION_CHARGING    = 1;

// PLAYER PARAMETERS
export const PLAYER_LUMINOSITY_HURT_FLARE    = 1 * LIGHT_MAP_PRECISION;
export const PLAYER_LUMINOSITY_HURT_HIT      = 0.3 * LIGHT_MAP_PRECISION;
export const PLAYER_LUMINOSITY_HEAL          = 1 * LIGHT_MAP_PRECISION;
export const PLAYER_LUMINOSITY_GROWTH        = 0.3 * LIGHT_MAP_PRECISION;
export const PLAYER_LIGHT_GROWTH_FACTOR     = 0.15 * LIGHT_MAP_PRECISION;
export const PLAYER_LUMINOSITY_START         = 3 * LIGHT_MAP_PRECISION;
export const PLAYER_LUMINOSITY_MAX_START     = 6 * LIGHT_MAP_PRECISION;
export const PLAYER_LUMINOSITY_MIN           = LIGHT_PARTICLE_DEATH + LIGHT_MAP_PRECISION;

export const DOT_LIGHT_COLOR    = [1, 1, 1];
export const BOX_LIGHT_COLOR    = [0.5, 1, 0.5];
export const SNAKE_LIGHT_COLOR    = [1, 0.5, 0.5];

// GAME STATE
export const STATE_MENU     = 0;
export const STATE_GAME     = 1;
export const STATE_DIALOG   = 2;
