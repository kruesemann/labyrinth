import * as SCENE from "./scene.js";
import * as SHADER from "./shader.js";
import * as PLAYER from "./player.js";
import * as NOISE from "./noise.js";
import * as CONSTANTS from "./constants.js";
import { createObject } from "./object.js";

let initialSeed = undefined;
let tileSize = 1;
let tileMap = [];
let numRows = 0;
let numColumns = 0;
let mesh = undefined;
let objects = [];

export function getTileMapInfo() {
    return { tileMap, numColumns, numRows };
}

export function getTileSize() {
    return tileSize;
}

export function initialize(seed, rows, columns) {
    initialSeed = seed;
    tileSize = 1;
    tileMap = [];
    numRows = rows;
    numColumns = columns;
    SCENE.removeMesh(mesh);
    mesh = undefined;
    for (let object of objects) {
        SCENE.removeMesh(object.form.mesh);
    }
    objects = [];

    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numColumns; j++) {
            tileMap.push(0);
        }
    }
}

function createMesh() {

    const vertices = [];
    const colors = []; // replace with texture coordinates

    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numColumns; j++) {
            vertices.push(j * tileSize);
            vertices.push(i * tileSize);
            vertices.push(-0.01);
            vertices.push((j + 1) * tileSize);
            vertices.push(i * tileSize);
            vertices.push(-0.01);
            vertices.push(j * tileSize);
            vertices.push((i + 1) * tileSize);
            vertices.push(-0.01);
            vertices.push((j + 1) * tileSize);
            vertices.push(i * tileSize);
            vertices.push(-0.01);
            vertices.push((j + 1) * tileSize);
            vertices.push((i + 1) * tileSize);
            vertices.push(-0.01);
            vertices.push(j * tileSize);
            vertices.push((i + 1) * tileSize);
            vertices.push(-0.01);

            if (tileMap[i * numColumns + j] == CONSTANTS.TILE_WALL) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(0.0);
                    colors.push(0.0);
                }
            } else if (tileMap[i * numColumns + j] == CONSTANTS.TILE_DIRT) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.24);
                    colors.push(0.15);
                    colors.push(0.0);
                }
            } else if (tileMap[i * numColumns + j] == CONSTANTS.TILE_WATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(0.2);
                    colors.push(0.6);
                }
            } else if (tileMap[i * numColumns + j] == CONSTANTS.TILE_DEEPWATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(0.1);
                    colors.push(0.3);
                }
            } else if (tileMap[i * numColumns + j] == CONSTANTS.TILE_GRASS) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.1);
                    colors.push(0.3);
                    colors.push(0.0);
                }
            }
        }
    }

    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    return new THREE.Mesh(geometry, SHADER.getMaterial());
}

function norm(x, y) {
    return Math.sqrt(x * x + y * y);
}

function dist(x1, y1, x2, y2) {
    return norm(x1 - x2, y1 - y2);
}

function ellipseDist(x, y, mx, my, rx, ry) {
    return Math.sqrt(ry * ry * (x - mx) * (x - mx) + rx * rx * (y - my) * (y - my));
}

export function create() {
    const numCaves = 8;
    const caves = [];
    const caveSizeMin = 5;
    const caveSizeMaxMin = 10;
    const caveSizeMaxMax = 50;

    for (let i = 0; i < numCaves; i++) {
        caves.push({
            x: numColumns * NOISE.random(),
            y: numRows * NOISE.random(),
            caveSizeX: caveSizeMaxMin + (caveSizeMaxMax - caveSizeMaxMin) * NOISE.random(),
            caveSizeY: caveSizeMaxMin + (caveSizeMaxMax - caveSizeMaxMin) * NOISE.random(),
        });
    }

    const numChannels = 3;
    const noiseColors = [
        //[1.0, 0.5, 0.25, 0.13, 0.06, 0.03],
        [0.0, 0.8, 0.8, 0.6, 0.5, 0.0],
        [1.0, 0.75, 0.625, 0.5, 0.375, 0.25],
        [0.05, 0.1, 0.4, 0.15, 0.25, 0.05],
    ];
    const noiseExponents = [
        3,
        1,
        2,
    ];

    const colorMap = NOISE.doubleNoise2D(initialSeed, numChannels, numRows, numColumns, noiseColors, noiseExponents);

    for (let i = 1; i < numRows - 1; i++) {
        for (let j = 1; j < numColumns - 1; j++) {
            let tileCenter = tileToCenter(i, j);
            for (let k = 0; k < numCaves; k++) {
                let distToCenter = dist(tileCenter.x, tileCenter.y, caves[k].x, caves[k].y);

                if (distToCenter < caveSizeMin) {
                    if (colorMap[i * numColumns + j][1] > 0.5) {
                        if (colorMap[i * numColumns + j][1] > 0.6) {
                            tileMap[i * numColumns + j] = CONSTANTS.TILE_DEEPWATER;
                        } else {
                            tileMap[i * numColumns + j] = CONSTANTS.TILE_WATER;
                        }
                    } else {
                        tileMap[i * numColumns + j] = CONSTANTS.TILE_GRASS;
                    }
                } else {
                    let ellipseRadius = caves[k].caveSizeX * caves[k].caveSizeY;
                    let distToMax = ellipseRadius - ellipseDist(tileCenter.x, tileCenter.y, caves[k].x, caves[k].y, caves[k].caveSizeX, caves[k].caveSizeY);
                    if (colorMap[i * numColumns + j][2] < distToMax / (1.5 * ellipseRadius)) {
                        if (colorMap[i * numColumns + j][1] > 0.5) {
                            if (colorMap[i * numColumns + j][1] > 0.6) {
                                tileMap[i * numColumns + j] = CONSTANTS.TILE_DEEPWATER;
                            } else {
                                tileMap[i * numColumns + j] = CONSTANTS.TILE_WATER;
                            }
                        } else {
                            tileMap[i * numColumns + j] = CONSTANTS.TILE_DIRT;
                        }
                    }
                }
            }
        }
    }

    mesh = createMesh();
    SCENE.addMesh(mesh);

    let object1 = createObject(10, 10, [1, 0, 0], 0.1, "dot", "test");
    objects.push(object1);
    let object2 = createObject(50, 80, [1, 0, 1], 0.5, "snake", "test");
    objects.push(object2);
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

function isTileBlocked(i, j, forbiddenTileTypes) {
    const tileType = tileMap[i * numColumns + j];
    for (let i = 0; i < forbiddenTileTypes.length; i++) {
        if (tileType == forbiddenTileTypes[i]) {
            return true;
        }
    }
    return false;
}

const directions = [
    { i: 1, j: 0 },
    { i: 1, j: -1 },
    { i: 0, j: -1 },
    { i: -1, j: -1 },
    { i: -1, j: 0 },
    { i: -1, j: 1 },
    { i: 0, j: 1 },
    { i: 1, j: 1 }
];

function isNextTileBlocked(x, y, dx, dy, forbiddenTileTypes) {
    const currentTile = coordsToTile(x, y);
    
    for (let dir of directions) {
        const nextTile = { i: currentTile.i + dir.i, j: currentTile.j + dir.j };
        
        if (isTileBlocked(nextTile.i, nextTile.j, forbiddenTileTypes)) {
            let nextTileCoords = tileToCenter(nextTile.i, nextTile.j);
            if (x + dx >= nextTileCoords.x && x + dx < nextTileCoords.x + tileSize) {
                if (y + dy >= nextTileCoords.y && y + dy < nextTileCoords.y + tileSize) {
                    return true;
                } else if (nextTileCoords.y >= y + dy && nextTileCoords.y < y + dy + tileSize) {
                    return true;
                }
            } else if (nextTileCoords.x >= x + dx && nextTileCoords.x < x + dx + tileSize) {
                if (y + dy >= nextTileCoords.y && y + dy < nextTileCoords.y + tileSize) {
                    return true;
                } else if (nextTileCoords.y >= y + dy && nextTileCoords.y < y + dy + tileSize) {
                    return true;
                }
            }
        }
    }

    return false;
}

export function isNextTileGround(x, y, dx, dy) {
    return !isNextTileBlocked(x, y, dx, dy, [CONSTANTS.TILE_WALL, CONSTANTS.TILE_WATER, CONSTANTS.TILE_DEEPWATER]);
}

export function isTileGround(i, j) {
    return !isTileBlocked(i, j, [CONSTANTS.TILE_WALL, CONSTANTS.TILE_WATER, CONSTANTS.TILE_DEEPWATER]);
}

export function isNextTileWall(x, y, dx, dy) {
    return isNextTileBlocked(x, y, dx, dy, [CONSTANTS.TILE_WALL]);
}

export function isTileWall(i, j) {
    return isTileBlocked(i, j, [CONSTANTS.TILE_WALL]);
}

export function planObjects(counter) {
    for (let object of objects) {
        object.plan(counter);
    }
}

export function moveObjects() {
    for (let object of objects) {
        object.move();
    }
}

export function collisionWithPlayer() {
    let pNodes = PLAYER.get().form.nodes;

    for (let object of objects) {
        let oNodes = object.form.nodes;

        for (let pNode of pNodes) {
            for (let oNode of oNodes) {
                if (pNode.x >= oNode.x && pNode.x < oNode.x + tileSize) {
                    if (pNode.y >= oNode.y && pNode.y < oNode.y + tileSize) {
                        return true;
                    } else if (pNode.y <= oNode.y && pNode.y + tileSize > oNode.y) {
                        return true;
                    }
                } else if (pNode.x <= oNode.x && pNode.x + tileSize > oNode.x) {
                    if (pNode.y >= oNode.y && pNode.y < oNode.y + tileSize) {
                        return true;
                    } else if (pNode.y <= oNode.y && pNode.y + tileSize > oNode.y) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}
