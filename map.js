import * as CONSTANTS from "./constants.js";
import * as ITEM from "./item.js";
import * as LIGHT from "./light.js";
import * as MAPUTIL from "./mapUtil.js";
import * as OBJECT from "./object.js";
import * as PLAYER from "./player.js";
import * as RANDOMMAP from "./randomMap.js";
import * as SECRET from "./secret.js";
import * as SHADER from "./shader.js";
import * as SOUND from "./sound.js";
import * as STAGE from "./stage.js";

let map = {
    seed: 0,
    tileMap: [],
    numRows: 0,
    numColumns: 0,
    secrets: [],
    mesh: undefined,
    exitCoords: undefined
};

export function reset() {
    map = {
        seed: 0,
        tileMap: [],
        numRows: 0,
        numColumns: 0,
        secrets: [],
        mesh: undefined,
        exitCoords: undefined,
        wayPoints: []
    };

    PLAYER.reset();
    OBJECT.reset();
    SECRET.reset();
    ITEM.reset();
    RANDOMMAP.reset();
}

export function initialize(seed, numRows, numColumns, gameSeed, level) {
    LIGHT.levelReset(level);
    OBJECT.reset();
    SECRET.reset();
    ITEM.reset();

    const  {tileMap, start, exit, enemies, items, secrets, colors, wayPoints} = RANDOMMAP.create(seed, numRows, numColumns, gameSeed, level);

    map = {
        seed,
        tileMap,
        numRows,
        numColumns,
        secrets,
        mesh: undefined,
        exitCoords: MAPUTIL.tileToCenter(exit.i, exit.j),
        wayPoints
    };

    PLAYER.initialize(start.i, start.j);
    OBJECT.createEnemies(enemies);
    SECRET.createSecrets(secrets);
    ITEM.createItems(items);

    createTexture(colors);
    createMesh();
}

export function getTileMapInfo() {
    return {numColumns: map.numColumns, numRows: map.numRows};
}

export function getTile(i, j) {
    return map.tileMap[i * map.numColumns + j];
}

export function getExitCoords() {
    return map.exitCoords;
}

export function getFurthestWayPoint(position, maxDist) {
    for (const wayPoint of map.wayPoints)
        if (Math.hypot(wayPoint.x - position.x, wayPoint.y - position.y) <= maxDist) return wayPoint;
    return undefined;
}

function createTexture(colors) {
    const {numRows, numColumns} = map;
    const vertices = [];

    for (let i = 0; i < numRows; ++i) {
        for (let j = 0; j < numColumns; ++j) {
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
    SHADER.mapLightingUniforms.u_texture.value = STAGE.renderToTexture([mapMesh], {x: numColumns, y: numRows});
    SHADER.objectUniforms.u_texture.value = SHADER.mapLightingUniforms.u_texture.value;
    SHADER.objectUniforms.u_dimensions.value = [CONSTANTS.LIGHT_MAP_PRECISION * numColumns, CONSTANTS.LIGHT_MAP_PRECISION * numRows];
    SHADER.objectUniforms.u_lightPrecision.value = CONSTANTS.LIGHT_MAP_PRECISION;
}

function createMesh() {
    const geometry = new THREE.BufferGeometry();
    const dimensions = STAGE.getScreenWorldDimensions();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                   0,            0, 0,
        dimensions.x,            0, 0,
                   0, dimensions.y, 0,
        dimensions.x,            0, 0,
        dimensions.x, dimensions.y, 0,
                   0, dimensions.y, 0,
    ]), 3));

    geometry.addAttribute('a_texelCoords', new THREE.BufferAttribute(new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 0,
        1, 1,
        0, 1,
    ]), 2));

    map.mesh = new THREE.Mesh(geometry, SHADER.getMapMaterial());
    STAGE.addMesh(map.mesh);
}

export function center() {
    const {x, y} = PLAYER.getCenter();
    const dimensions = STAGE.getScreenWorldDimensions();
    map.mesh.position.x = x - dimensions.x / 2;
    map.mesh.position.y = y - dimensions.y / 2;
}

export function isNextTileOfType(x, y, dx, dy, tileTypes) {
    const currentTile = MAPUTIL.coordsToTile(x, y);
    
    for (const dir of CONSTANTS.DIRECTIONS) {
        const nextTile = {i: currentTile.i + dir.i, j: currentTile.j + dir.j};
        
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

export function isTileNotWall(i, j) {
    return !isTileWall(i, j);
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
        {x: -0.500, y: -0.500},
        {x: -0.500, y:  0.000},
        {x: -0.500, y:  0.499},
        {x:  0.000, y: -0.500},
        {x:  0.000, y:  0.000},
        {x:  0.000, y:  0.499},
        {x:  0.499, y: -0.500},
        {x:  0.499, y:  0.000},
        {x:  0.499, y:  0.499},
    ];

    for (const node of nodes) {
        for (const offset of vertexOffsets) {
            const {i, j} = MAPUTIL.coordsToTile(node.x + offset.x, node.y + offset.y);
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
    const nearestBeacon = PLAYER.getNearestSecret("beacon", (beacon) => {
        return beacon.light !== null;
    });

    if (nearestShrine) {
        SOUND.loop("shrine", 100, nearestShrine.position, 25);
    }
    if (nearestBeacon) {
        SOUND.loop("beacon2", 100, nearestBeacon.position, 50);
    }
}

//DEBUG
export function reinitializeMesh() {
    const geometry = new THREE.BufferGeometry();
    const dimensions = STAGE.getScreenWorldDimensions();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                   0,            0, 0,
        dimensions.x,            0, 0,
                   0, dimensions.y, 0,
        dimensions.x,            0, 0,
        dimensions.x, dimensions.y, 0,
                   0, dimensions.y, 0,
    ]), 3));

    geometry.addAttribute('a_texelCoords', new THREE.BufferAttribute(new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 0,
        1, 1,
        0, 1,
    ]), 2));

    STAGE.removeMesh(map.mesh);
    map.mesh = new THREE.Mesh(geometry, SHADER.getMapMaterial());
    STAGE.addMesh(map.mesh);
}
