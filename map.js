import * as SCENE from "./scene.js";
import * as SHADER from "./shader.js";
import * as PLAYER from "./player.js";
import * as NOISE from "./noise.js";
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
    const numChannels = 3;
    const noiseColors = [
        [1.0, 0.5, 0.25, 0.13, 0.06, 0.03],
        [1.0, 0.75, 0.625, 0.5, 0.375, 0.25],
        [0.0, 0.25, 0.25, 0.5, 0.02, 0.01],
    ];
    const noiseExponents = [
        3,
        1,
        0.5,
    ];

    const colorMap = NOISE.doubleNoise2D(initialSeed, numChannels, numRows, numColumns, noiseColors, noiseExponents);

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

            if (colorMap[i * numColumns + j][0] < 0.05) {
                tileMap[i * numColumns + j] = 1;
            }

            if (tileMap[i * numColumns + j] == 1) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(0.0);
                    colors.push(0.0);
                }
            } else {
                for (let k = 0; k < 6; k++) {
                    colors.push(colorMap[i * numColumns + j][0]);
                    colors.push(colorMap[i * numColumns + j][1]);
                    colors.push(colorMap[i * numColumns + j][2]);
                }
            }
        }
    }

    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    return new THREE.Mesh(geometry, SHADER.getMaterial());
}

export function create() {
    for (let j = 0; j < numColumns; j++) {
        tileMap[j] = 1;
        tileMap[(numRows - 1) * numColumns + j] = 1;
    }
    for (let i = 0; i < numRows; i++) {
        tileMap[i * numColumns] = 1;
        tileMap[i * numColumns + numColumns - 1] = 1;
    }

    mesh = createMesh();
    SCENE.addMesh(mesh);

    let object1 = createObject(5, 5, [1, 0, 0], 0.1, "dot", "test");
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

export function isTileBlocked(x, y, dx, dy) {
    const currentTile = coordsToTile(x, y);
    
    for (let dir of directions) {
        const nextTile = { i: currentTile.i + dir.i, j: currentTile.j + dir.j };
        
        if (tileMap[nextTile.i * numColumns + nextTile.j] == 1) {
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
