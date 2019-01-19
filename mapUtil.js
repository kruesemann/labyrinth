import * as CONSTANTS from "./constants.js";

export function manhattan(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

export function coordsToTile(x, y) {
    return { i: Math.floor(y), j: Math.floor(x) };
}

export function tileToCoords(i, j) {
    return { x: j, y: i };
}

export function tileToCenter(i, j) {
    return { x: j + 0.5, y: i + 0.5 };
}

export function isTileOfType(i, j, tileTypes, tileGetter) {
    if (!tileGetter) console.log(i, j, tileTypes);
    const tileType = tileGetter(i, j).type;
    for (let i = 0; i < tileTypes.length; i++) {
        if (tileType == tileTypes[i]) {
            return true;
        }
    }
    return false;
}

export function isTileGround(i, j, tileGetter) {
    return isTileOfType(i, j, CONSTANTS.GROUND_TILES, tileGetter);
}

export function isTileWall(i, j, tileGetter) {
    return isTileOfType(i, j, CONSTANTS.WALL_TILES, tileGetter);
}

export function isTileWater(i, j, tileGetter) {
    return isTileOfType(i, j, CONSTANTS.WATER_TILES, tileGetter);
}

export function isTileWideGround(i, j, tileGetter) {
    if (!isTileGround(i, j, tileGetter)) return false;

    if (isTileGround(i, j - 1, tileGetter)
    && isTileGround(i - 1, j, tileGetter)
    && isTileGround(i - 1, j - 1, tileGetter)
    || isTileGround(i, j + 1, tileGetter)
    && isTileGround(i - 1, j, tileGetter)
    && isTileGround(i - 1, j + 1, tileGetter)
    || isTileGround(i, j - 1, tileGetter)
    && isTileGround(i + 1, j, tileGetter)
    && isTileGround(i + 1, j - 1, tileGetter)
    || isTileGround(i, j + 1, tileGetter)
    && isTileGround(i + 1, j, tileGetter)
    && isTileGround(i + 1, j + 1, tileGetter)) {
        return true;
    }
    return false;
}

export function isTileNarrowGround(i, j, tileGetter) {
    return isTileGround(i, j, tileGetter) && !isTileWideGround(i, j, tileGetter);
}

export function isTileWideWater(i, j, tileGetter) {
    if (!isTileWater(i, j, tileGetter)) return false;

    if (isTileWater(i, j - 1, tileGetter)
    && isTileWater(i - 1, j, tileGetter)
    && isTileWater(i - 1, j - 1, tileGetter)
    || isTileWater(i, j + 1, tileGetter)
    && isTileWater(i - 1, j, tileGetter)
    && isTileWater(i - 1, j + 1, tileGetter)
    || isTileWater(i, j - 1, tileGetter)
    && isTileWater(i + 1, j, tileGetter)
    && isTileWater(i + 1, j - 1, tileGetter)
    || isTileWater(i, j + 1, tileGetter)
    && isTileWater(i + 1, j, tileGetter)
    && isTileWater(i + 1, j + 1, tileGetter)) {
        return true;
    }
    return false;
}

export function isTileNarrowWater(i, j, tileGetter) {
    return isTileWater(i, j, tileGetter) && !isTileWideWater(i, j, tileGetter);
}
