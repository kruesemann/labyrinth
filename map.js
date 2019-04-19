import * as STAGE from "./stage.js";
import * as SHADER from "./shader.js";
import * as PLAYER from "./player.js";
import * as RANDOMMAP from "./randomMap.js";
import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import * as ITEM from "./item.js";
import * as OBJECT from "./object.js";
import * as SOUND from "./sound.js";
import * as MAPUTIL from "./mapUtil.js";
import * as SECRET from "./secret.js";

let map = undefined;

export function reset(seed, numRows, numColumns, gameSeed, level) {
    OBJECT.reset();
    LIGHT.reset(numRows, numColumns, level);
    ITEM.reset();
    SECRET.reset();

    const  { tileMap, start, exit, enemies, items, secrets, colors } = RANDOMMAP.create(seed, numRows, numColumns, gameSeed, level);

    map = {
        seed,
        tileMap,
        numRows,
        numColumns,
        secrets,
        mesh: undefined,
        exitCoords: MAPUTIL.tileToCenter(exit.i, exit.j)
    };

    PLAYER.reset(start.i, start.j);
    OBJECT.createEnemies(enemies);
    ITEM.createItems(items);
    SECRET.createSecrets(secrets);

    createTexture(colors);
    createMesh();
}

export function getTileMapInfo() {
    return { numColumns: map.numColumns, numRows: map.numRows };
}

export function getTile(i, j) {
    return map.tileMap[i * map.numColumns + j];
}

export function getExitCoords() {
    return map.exitCoords;
}

function createTexture(colors) {
    const { numRows, numColumns } = map;
    const vertices = [];

    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numColumns; j++) {
            vertices.push(j);
            vertices.push(i);
            vertices.push(0);
            vertices.push(j + 1);
            vertices.push(i);
            vertices.push(0);
            vertices.push(j);
            vertices.push(i + 1);
            vertices.push(0);
            vertices.push(j + 1);
            vertices.push(i);
            vertices.push(0);
            vertices.push(j + 1);
            vertices.push(i + 1);
            vertices.push(0);
            vertices.push(j);
            vertices.push(i + 1);
            vertices.push(0);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    SHADER.mapTextureUniforms.u_dimensions.value = [numColumns, numRows];

    const mapMesh = new THREE.Mesh(geometry, SHADER.getMapTextureMaterial());
    SHADER.mapLightingUniforms.u_texture.value = STAGE.renderToTexture([mapMesh], numColumns, numRows);
    SHADER.objectUniforms.u_texture.value = SHADER.mapLightingUniforms.u_texture.value;
    SHADER.objectUniforms.u_dimensions.value = [CONSTANTS.LIGHT_MAP_PRECISION * numColumns, CONSTANTS.LIGHT_MAP_PRECISION * numRows];
    SHADER.objectUniforms.u_lightPrecision.value = CONSTANTS.LIGHT_MAP_PRECISION;
}

function createMesh() {
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                     0,           0, 0,
        map.numColumns,           0, 0,
                     0, map.numRows, 0,
        map.numColumns,           0, 0,
        map.numColumns, map.numRows, 0,
                     0, map.numRows, 0,
    ]), 3));
    geometry.addAttribute('a_texelCoords', new THREE.BufferAttribute(new Float32Array([
        0,0,
        1,0,
        0,1,
        1,0,
        1,1,
        0,1,
    ]), 2));

    map.mesh = new THREE.Mesh(geometry, SHADER.getMapMaterial());
    STAGE.addMesh(map.mesh);
}

export function isNextTileOfType(x, y, dx, dy, tileTypes) {
    const currentTile = MAPUTIL.coordsToTile(x, y);
    
    for (let dir of CONSTANTS.DIRECTIONS) {
        const nextTile = { i: currentTile.i + dir.i, j: currentTile.j + dir.j };
        
        if (MAPUTIL.isTileOfType(nextTile.i, nextTile.j, tileTypes, getTile)) {
            const nextTileCoords = MAPUTIL.tileToCenter(nextTile.i, nextTile.j);
            if (x + dx >= nextTileCoords.x && x + dx < nextTileCoords.x + 1) {
                if (y + dy >= nextTileCoords.y && y + dy < nextTileCoords.y + 1) {
                    return true;
                } else if (nextTileCoords.y >= y + dy && nextTileCoords.y < y + dy + 1) {
                    return true;
                }
            } else if (nextTileCoords.x >= x + dx && nextTileCoords.x < x + dx + 1) {
                if (y + dy >= nextTileCoords.y && y + dy < nextTileCoords.y + 1) {
                    return true;
                } else if (nextTileCoords.y >= y + dy && nextTileCoords.y < y + dy + 1) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

export function isTileGround(i, j) {
    return MAPUTIL.isTileGround(i, j, getTile);
}

export function isTileWall(i, j) {
    return MAPUTIL.isTileWall(i, j, getTile);
}

export function isTileWater(i, j) {
    return MAPUTIL.isTileWater(i, j, getTile);
}

export function isTileWideGround(i, j) {
    return MAPUTIL.isTileWideGround(i, j, getTile);
}

export function isTileNarrowGround(i, j) {
    return MAPUTIL.isTileNarrowGround(i, j, getTile);
}

export function isTileWideWater(i, j) {
    return MAPUTIL.isTileWideWater(i, j, getTile);
}

export function isTileNarrowWater(i, j) {
    return MAPUTIL.isTileNarrowWater(i, j, getTile);
}

function isOnTileType(nodes, tileType) {
    const vertexOffsets = [
        { x: -0.5, y: -0.5 },
        { x: -0.5, y: 0 },
        { x: -0.5, y: 0.499 },
        { x: 0, y: -0.5 },
        { x: 0, y: 0 },
        { x: 0, y: 0.499 },
        { x: 0.499, y: -0.5 },
        { x: 0.499, y: 0 },
        { x: 0.499, y: 0.499 },
    ];

    for (let node of nodes) {
        for (let offset of vertexOffsets) {
            const { i, j } = MAPUTIL.coordsToTile(node.x + offset.x, node.y + offset.y);
            if (getTile(i, j).type === tileType)
            {
                return true;
            }
        }
    }

    return false;
}

export function isOnExit(nodes) {
    return isOnTileType(nodes, CONSTANTS.TILE_EXIT);
}

export function isOnBeacon(nodes) {
    return isOnTileType(nodes, CONSTANTS.TILE_BEACON);
}

export function rayCast(start, target) {
    const startTile = MAPUTIL.coordsToTile(start.x, start.y);
    const targetTile = MAPUTIL.coordsToTile(target.x, target.y);

    let di = Math.abs(targetTile.i - startTile.i);
    let dj = Math.abs(targetTile.j - startTile.j);
    let i = startTile.i;
    let j = startTile.j;
    let n = 1 + di + dj;
    const i_inc = (targetTile.i > startTile.i) ? 1 : -1;
    const j_inc = (targetTile.j > startTile.j) ? 1 : -1;
    let error = di - dj;
    di *= 2;
    dj *= 2;

    for (; n > 0; --n) {
        if (isTileWall(i, j)) {
            return false;
        }

        if (error > 0) {
            i += i_inc;
            error -= dj;
        } else if (error < 0) {
            j += j_inc;
            error += di;
        } else {
            i += i_inc;
            j += j_inc;
            error -= dj;
            error += di;
            --n;
        }
    }

    return true;
}

export function ambientSound(counter) {
    if (counter % 10 !== 0) return;

    const nearestShrine = PLAYER.getNearestSecret("shrine");
    const nearestBeacon = PLAYER.getNearestSecret("beacon", (beacon) => { return beacon.light !== null; });

    if (nearestShrine) {
        SOUND.loop("shrine", 100, { x: nearestShrine.x, y: nearestShrine.y }, 25);
    }
    if (nearestBeacon) {
        SOUND.loop("beacon2", 100, { x: nearestBeacon.x, y: nearestBeacon.y }, 50);
    }
}
