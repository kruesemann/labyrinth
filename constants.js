export const TILE_HIGHWALL              = 0;
export const TILE_WALL                  = 1;
export const TILE_BRICKWALL             = 2;
export const TILE_DEEPWATER             = 3;
export const TILE_WATER                 = 4;
export const TILE_SHALLOWWATER          = 5;
export const TILE_DIRT                  = 6;
export const TILE_GRASS                 = 7;
export const TILE_PAVED                 = 8;
export const TILE_EXIT                  = 9;
export const TILE_ENTRANCE              = 10;

export const OBJECT_STRIDE              = 0.5;

export const LIGHTMAP_PRECISION         = 2;

export const LIGHT_MAXNUM               = 16;
export const LIGHT_MAXDIST              = 50 * LIGHTMAP_PRECISION;
export const LIGHT_DISTEXP              = 1;

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
