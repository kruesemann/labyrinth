import * as STAGE from "./stage.js";
import * as SHADER from "./shader.js";
import * as PLAYER from "./player.js";
import * as RANDOMMAP from "./randomMap.js";
import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import * as ITEM from "./item.js";
import * as OBJECT from "./object.js";
import * as MAPUTIL from "./mapUtil.js";

let map = undefined;

export function reset(seed, numRows, numColumns, level) {
    OBJECT.reset();
    LIGHT.reset(numRows, numColumns, level);
    ITEM.reset();

    const  { tileMap, start, enemies, lights, items, colors } = RANDOMMAP.create(seed, numRows, numColumns, level);

    map = {
        seed,
        tileMap,
        numRows,
        numColumns,
        mesh: undefined,
    };

    PLAYER.reset(start.i, start.j);
    OBJECT.createEnemies(enemies);
    LIGHT.createLights(lights);
    ITEM.createItems(items);

    createTexture(colors);
    createMesh();
}

export function getTileMapInfo() {
    return { numColumns: map.numColumns, numRows: map.numRows };
}

export function getTile(i, j) {
    return map.tileMap[i * map.numColumns + j];
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
    SHADER.objectUniforms.u_dimensions.value = [CONSTANTS.LIGHTMAP_PRECISION * numColumns, CONSTANTS.LIGHTMAP_PRECISION * numRows];
    SHADER.objectUniforms.u_lightPrecision.value = CONSTANTS.LIGHTMAP_PRECISION;
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

export function isOnExit(nodes) {
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
            if (getTile(i, j).type == CONSTANTS.TILE_EXIT)
            {
                return true;
            }
        }
    }

    return false;
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
