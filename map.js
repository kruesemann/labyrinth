import * as SCENE from "./scene.js";
import * as SHADER from "./shader.js";
import * as PLAYER from "./player.js";
import * as NOISE from "./noise.js";
import * as CONSTANTS from "./constants.js";
import { createObject } from "./object.js";
import { BinaryHeap } from "./heap.js";

const numNoiseChannels = 3;
const caveChannel = 0;
const terrainChannel = 1;
const tunnelChannel = 2;
const noiseColors = [
    [0.05, 0.1, 0.4, 0.15, 0.25, 0.05],
    [1.0, 0.75, 0.625, 0.5, 0.375, 0.25],
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    //[1.0, 0.5, 0.25, 0.13, 0.06, 0.03],
];
const noiseExponents = [
    2,
    1,
    3,
];
let noiseMap = undefined;

let initialSeed = undefined;
let tileSize = 1;
let tileMap = [];
let numRows = 0;
let numColumns = 0;
let mesh = undefined;
let objects = [];

let groundComponents = undefined;

export function getTileMapInfo() {
    return { numColumns, numRows };
}

export function getTileSize() {
    return tileSize;
}

export function manhattan(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
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
            tileMap.push({ type: CONSTANTS.TILE_HIGHWALL, caveID: -1, compIDs: [-1] });
        }
    }

    noiseMap = NOISE.doubleNoise2D(initialSeed, numNoiseChannels, numRows, numColumns, noiseColors, noiseExponents);
    create();
}

function createMesh() {
    const vertices = [];
    const colors = []; // replace with texture coordinates
    const caves = [];
    const groundComps = [];

    const caveColors = [
        [1.00, 0.00, 0.00], //red
        [0.00, 1.00, 0.00], //lime
        [0.00, 0.00, 1.00], //blue
        [1.00, 1.00, 0.00], //yellow
        [1.00, 0.00, 1.00], //fuchsia
        [0.00, 1.00, 1.00], //aqua
        [0.50, 0.00, 0.00], //maroon
        [0.00, 0.50, 0.00], //green
        [0.00, 0.00, 0.50], //navy
        [0.50, 0.50, 0.00], //olive
        [0.50, 0.00, 0.50], //purple
        [0.00, 0.50, 0.50], //teal
        [1.00, 0.65, 0.00], //orange
        [1.00, 1.00, 1.00], //white
        [0.50, 0.50, 0.50], //grey
        [0.75, 0.75, 0.75], //silver
        [0.25, 0.25, 0.25], //anthracite
    ];

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

            const tile = tileMap[i * numColumns + j];

            if (tile.caveID != -1) {
                const caveColor = caveColors[tile.caveID];
                for (let k = 0; k < 6; k++) {
                    caves.push(caveColor[0]);
                    caves.push(caveColor[1]);
                    caves.push(caveColor[2]);
                }
            } else {
                for (let k = 0; k < 6; k++) {
                    caves.push(0);
                    caves.push(0);
                    caves.push(0);
                }
            }

            if (tile.compIDs[0] != -1) {
                const compColor = caveColors[tile.compIDs[0] % 17];
                for (let k = 0; k < 6; k++) {
                    groundComps.push(compColor[0]);
                    groundComps.push(compColor[1]);
                    groundComps.push(compColor[2]);
                }
            } else {
                for (let k = 0; k < 6; k++) {
                    groundComps.push(0);
                    groundComps.push(0);
                    groundComps.push(0);
                }
            }

            if (tile.type == CONSTANTS.TILE_WALL) {
                for (let k = 0; k < 6; k++) {
                    colors.push(noiseMap[i * numColumns + j][0] / 5);//colors.push(0.05);
                    colors.push(noiseMap[i * numColumns + j][0] / 5);//colors.push(0.05);
                    colors.push(noiseMap[i * numColumns + j][0] / 5);//colors.push(0.05);
                }
            } else if (tile.type == CONSTANTS.TILE_DIRT) {
                for (let k = 0; k < 6; k++) {
                    colors.push(noiseMap[i * numColumns + j][1] / 4);//colors.push(0.24);
                    colors.push(noiseMap[i * numColumns + j][1] / 8);//colors.push(0.15);
                    colors.push(0.0);
                }
            } else if (tile.type == CONSTANTS.TILE_WATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(noiseMap[i * numColumns + j][0] / 3);//colors.push(0.0);
                    colors.push(noiseMap[i * numColumns + j][0] / 2);//colors.push(0.2);
                    colors.push(noiseMap[i * numColumns + j][1] / 2);//colors.push(0.6);
                }
            } else if (tile.type == CONSTANTS.TILE_DEEPWATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(noiseMap[i * numColumns + j][0] / 4);//colors.push(0.1);
                    colors.push(noiseMap[i * numColumns + j][0] / 1.5);//colors.push(0.3);
                }
            } else if (tile.type == CONSTANTS.TILE_GRASS) {
                for (let k = 0; k < 6; k++) {
                    colors.push(noiseMap[i * numColumns + j][0] / 3);//colors.push(0.1);
                    colors.push(noiseMap[i * numColumns + j][1] / 2);//colors.push(0.3);
                    colors.push(0.0);
                }
            } else if (tile.type == CONSTANTS.TILE_HIGHWALL) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(0.0);
                    colors.push(0.0);
                }
            } else if (tile.type == CONSTANTS.TILE_PAVED) {
                for (let k = 0; k < 6; k++) {
                    colors.push(1.0);
                    colors.push(0.2);
                    colors.push(0.5);
                }
            }
            /*for (let k = 0; k < 6; k++) {
                colors.push(0.0);
                colors.push(noiseMap[i * numColumns + j][0]);
                colors.push(0.0);
            }*/
        }
    }

    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.addAttribute('a_caveID', new THREE.BufferAttribute(new Float32Array(caves), 3));
    geometry.addAttribute('a_groundCompID', new THREE.BufferAttribute(new Float32Array(groundComps), 3));

    return new THREE.Mesh(geometry, SHADER.getMapMaterial());
}

function labelCaves(caverns) {
    const caves = [];
    let ID = 0;

    for (let i = 0; i < caverns.length; i++) {
        const centerTile = coordsToTile(caverns[i].x, caverns[i].y);
        if (tileMap[centerTile.i * numColumns + centerTile.j].caveID == -1) {
            caves.push({ i: centerTile.i, j: centerTile.j, ID, systemID: -1, size: 0 });
            const queue = [centerTile];

            while (queue.length > 0) {
                const current = queue.pop();
                tileMap[current.i * numColumns + current.j].caveID = ID;
                caves[caves.length - 1].size++;

                for (let j = 0; j < 4; j++) {
                    const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };

                    if (tileMap[neighbor.i * numColumns + neighbor.j].caveID == -1
                        && !isTileWall(neighbor.i, neighbor.j)) {
                        queue.push(neighbor);
                    }
                }
            }
            ID++;
        }
    }

    return caves;
}

function buildTunnel(caves, cave, caveSystems, targetCave) {
    const weightFunction = function(i, j) {
        if (isTileWall(i, j)) return noiseMap[i * numColumns + j][tunnelChannel];
        return 10 + noiseMap[i * numColumns + j][tunnelChannel];
    };

    const dig = function(i, j, thickness) {
        let tile = tileMap[i * numColumns + j];
        if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
            tile.type = CONSTANTS.TILE_DIRT;
            tile.caveID = caves.length;
        }
        if (thickness > 1) {
            if (i > 1) {
                tile = tileMap[(i - 1) * numColumns + j];
                if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                    tile.type = CONSTANTS.TILE_DIRT;
                    tile.caveID = caves.length;
                }
            }
            if (i < numRows - 2) {
                tile = tileMap[(i + 1) * numColumns + j];
                if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                    tile.type = CONSTANTS.TILE_DIRT;
                    tile.caveID = caves.length;
                }
            }
            if (j > 1) {
                tile = tileMap[i * numColumns + (j - 1)];
                if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                    tile.type = CONSTANTS.TILE_DIRT;
                    tile.caveID = caves.length;
                }
            }
            if (j < numColumns - 2) {
                tile = tileMap[i * numColumns + (j + 1)];
                if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                    tile.type = CONSTANTS.TILE_DIRT;
                    tile.caveID = caves.length;
                }
            }

            if (thickness > 2) {
                if (i > 2) {
                    tile = tileMap[(i - 2) * numColumns + j];
                    if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                        tile.type = CONSTANTS.TILE_DIRT;
                        tile.caveID = caves.length;
                    }
                }
                if (i < numRows - 3) {
                    tile = tileMap[(i + 2) * numColumns + j];
                    if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                        tile.type = CONSTANTS.TILE_DIRT;
                        tile.caveID = caves.length;
                    }
                }
                if (j > 2) {
                    tile = tileMap[i * numColumns + (j - 2)];
                    if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                        tile.type = CONSTANTS.TILE_DIRT;
                        tile.caveID = caves.length;
                    }
                }
                if (j < numColumns - 3) {
                    tile = tileMap[i * numColumns + (j + 2)];
                    if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                        tile.type = CONSTANTS.TILE_DIRT;
                        tile.caveID = caves.length;
                    }
                }
            }
        }
    }

    const compMap = [];
    for (let i = 0; i < numColumns; i++) {
        for (let j = 0; j < numRows; j++) {
            compMap.push({
                i: i,
                j: j,
                visited: false,
                closed: false,
                pred: null,
                f: undefined,
                g: undefined
            });
        }
    }
  
    let heap = new BinaryHeap(node => node.f);
  
    const start = compMap[cave.i * numColumns + cave.j];
    start.g = 0;
    start.f = targetCave ? manhattan(cave.i, cave.j, targetCave.i, targetCave.j) : 0;
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        const currentCaveID = tileMap[current.i * numColumns + current.j].caveID;
        if (currentCaveID > -1 && currentCaveID < caves.length) {
            const currentCave = caves[currentCaveID];
            const currentCaveSystemID = currentCave.systemID;

            if ((!targetCave && cave.ID != currentCaveID)
                || (targetCave && targetCave.systemID == currentCaveSystemID)) {
                let path = [];
                while (current) {
                    path.push({ i: current.i, j: current.j });
                    current = current.pred;
                }

                const thickness = NOISE.random() > 0.3 ? 2 : 1;
                let thick = false;
                let varianceLength = 3 + Math.floor(10 * NOISE.random());
                for (let tileNr of path) {
                    if (varianceLength == 0) {
                        varianceLength = 3 + Math.floor(10 * NOISE.random());
                        thick = !thick;
                    }
                    dig(tileNr.i, tileNr.j, thick ? thickness + 1 : thickness);
                    varianceLength--;
                }

                if (currentCaveSystemID == -1) {
                    cave.systemID = caveSystems.length;
                    currentCave.systemID = caveSystems.length;
                    caveSystems.push([cave, currentCave]);
                    return caveSystems;
                }

                if (cave.systemID == -1) {
                    cave.systemID = currentCaveSystemID;
                    caveSystems[currentCaveSystemID].push(cave);
                    return caveSystems;
                }

                caveSystems[currentCaveSystemID] = caveSystems[currentCaveSystemID].concat(caveSystems[cave.systemID]);
                for (let systemCave of caveSystems[currentCaveSystemID]) {
                    systemCave.systemID = currentCaveSystemID;
                }
                caveSystems.pop();

                return caveSystems;
            }
        }

        current.closed = true;

        for (let j = 0; j < 4; j++) {
            const neighbor = compMap[(current.i + CONSTANTS.DIRECTIONS[j].i) * numColumns + current.j + CONSTANTS.DIRECTIONS[j].j];

            if (neighbor.closed) continue;
            if (neighbor.i == 0 || neighbor.i == numRows - 1 || neighbor.j == 0 || neighbor.j == numColumns - 1) continue;

            const nCost = weightFunction(neighbor.i, neighbor.j);
            const g =
                neighbor.i != current.i && neighbor.i != current.j
                ? current.g + nCost * 1.5
                : current.g + nCost;

            if (neighbor.visited && g >= neighbor.g) continue;
            neighbor.pred = current;
            neighbor.g = g;
            neighbor.f = g + (targetCave ? manhattan(neighbor.i, neighbor.j, targetCave.i, targetCave.j) : 0);

            if (!neighbor.visited) {
                neighbor.visited = true;
                heap.push(neighbor);
            } else {
                heap.rescoreElement(neighbor);
            }
        }
    }

    return caveSystems;
}

function labelConnectedComponents(isAllowed, componentIndex) {
    const components = [];

    for (let i = 1; i < numRows - 1; i++) {
        for (let j = 1; j < numColumns - 1; j++) {
            if (isAllowed(i, j)) {
                if (tileMap[i * numColumns + j].compIDs[componentIndex] == -1) {
                    const compID = components.length;
                    components.push({ i, j, ID: compID, size: 1 });
                    const queue = [{ i, j }];
    
                    while (queue.length > 0) {
                        const current = queue.pop();
                        tileMap[current.i * numColumns + current.j].compIDs[componentIndex] = compID;
                        components[compID].size++;
    
                        for (let j = 0; j < 4; j++) {
                            const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };
    
                            if (tileMap[neighbor.i * numColumns + neighbor.j].compIDs[componentIndex] == -1
                                && isAllowed(neighbor.i, neighbor.j)) {
                                queue.push(neighbor);
                            }
                        }
                    }
                }
            }
        }
    }

    return components;
}

function norm(x, y) {
    return Math.sqrt(x * x + y * y);
}

function dist(x1, y1, x2, y2) {
    return norm(x1 - x2, y1 - y2);
}

function ellipseDist(x, y, mx, my, rx, ry, angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const projX = cos * (x - mx) - sin * (y - my);
    const projY = sin * (x - mx) + cos * (y - my);
    return Math.sqrt(ry * ry * projX * projX + rx * rx * projY * projY);
}

function create() {
    const numZones = { i: 4, j: 4 };
    const numCavernsPerZone = 1;
    const caverns = [];
    const cavernDistMin = 5;
    const cavernSizeMin = 5;
    const cavernSizeMaxMin = 10;
    const cavernSizeMaxMax = 40;

    for (let i = 0; i < numZones.i; i++) {
        for (let j = 0; j < numZones.j; j++) {
            for (let k = 0; k < numCavernsPerZone; k++) {
                const lowerOffset = (i == 0 ? cavernSizeMaxMax : cavernDistMin)                 + i * numRows / numZones.i;
                const upperOffset = (i == numZones.i - 1 ? cavernSizeMaxMax : cavernDistMin)    + (numZones.i - i - 1) * numRows / numZones.i;
                const leftOffset  = (j == 0 ? cavernSizeMaxMax : cavernDistMin)                 + j * numColumns / numZones.j + 5;
                const rightOffset = (j == numZones.j ? cavernSizeMaxMax : cavernDistMin)        + (numZones.j - j - 1) * numColumns / numZones.j + 5;

                caverns.push({
                    x: leftOffset + (numColumns - leftOffset - rightOffset) * NOISE.random(),
                    y: lowerOffset + (numRows - lowerOffset - upperOffset) * NOISE.random(),
                    angle: Math.PI * NOISE.random(),
                    cavernSizeX: cavernSizeMaxMin + (cavernSizeMaxMax - cavernSizeMaxMin) * NOISE.random(),
                    cavernSizeY: cavernSizeMaxMin + (cavernSizeMaxMax - cavernSizeMaxMin) * NOISE.random(),
                });
            }
        }
    }

    for (let i = 1; i < numRows - 1; i++) {
        for (let j = 1; j < numColumns - 1; j++) {
            let tileCenter = tileToCenter(i, j);
            for (let k = 0; k < caverns.length; k++) {
                let distToCenter = dist(tileCenter.x, tileCenter.y, caverns[k].x, caverns[k].y);

                if (distToCenter < cavernSizeMin) {
                    tileMap[i * numColumns + j].type = CONSTANTS.TILE_DIRT;
                } else {
                    let ellipseRadius = caverns[k].cavernSizeX * caverns[k].cavernSizeY;
                    let distToMax = ellipseRadius - ellipseDist(tileCenter.x, tileCenter.y, caverns[k].x, caverns[k].y, caverns[k].cavernSizeX, caverns[k].cavernSizeY, caverns[k].angle);

                    if (noiseMap[i * numColumns + j][caveChannel] < (distToMax + 2 * cavernSizeMaxMax) / (1.5 * ellipseRadius)) {
                        if (noiseMap[i * numColumns + j][caveChannel] < distToMax / (1.5 * ellipseRadius)) {
                            tileMap[i * numColumns + j].type = CONSTANTS.TILE_DIRT;
                        } else if (tileMap[i * numColumns + j].type == CONSTANTS.TILE_HIGHWALL) {
                            tileMap[i * numColumns + j].type = CONSTANTS.TILE_WALL;
                        }
                    }
                }
            }
        }
    }

    const caves = labelCaves(caverns);

    let caveSystems = [];
    for (let i = 0; i < caves.length; i++) {
        tileMap[caves[i].i * numColumns + caves[i].j].type = CONSTANTS.TILE_PAVED;
        if (caves[i].systemID == -1) {
            caveSystems = buildTunnel(caves, caves[i], caveSystems);
        }
    }

    while (caveSystems.length > 1) {
        caveSystems = buildTunnel(caves, caveSystems[caveSystems.length - 1][0], caveSystems, caveSystems[caveSystems.length - 2][0]);
    }

    for (let i = 1; i < numRows - 1; i++) {
        for (let j = 1; j < numColumns - 1; j++) {
            if (tileMap[i * numColumns + j].type == CONSTANTS.TILE_DIRT) {
                if (noiseMap[i * numColumns + j][terrainChannel] > 0.3) {
                    if (noiseMap[i * numColumns + j][terrainChannel] > 0.5) {
                        if (noiseMap[i * numColumns + j][terrainChannel] > 0.6) {
                            tileMap[i * numColumns + j].type = CONSTANTS.TILE_DEEPWATER;
                        } else {
                            tileMap[i * numColumns + j].type = CONSTANTS.TILE_WATER;
                        }
                    }
                } else {
                    tileMap[i * numColumns + j].type = CONSTANTS.TILE_GRASS;
                }
            }
        }
    }

    groundComponents = labelConnectedComponents(isTileGround, 0);

    mesh = createMesh();
    SCENE.addMesh(mesh);

    let object1 = createObject(10, 10, [1, 0, 0], 0.1, "dot", "test");
    objects.push(object1);
    let object2 = createObject(50, 80, [1, 0, 1], 0.5, "snake", "test");
    objects.push(object2);

    PLAYER.initialize();
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
    const tileType = tileMap[i * numColumns + j].type;
    for (let i = 0; i < forbiddenTileTypes.length; i++) {
        if (tileType == forbiddenTileTypes[i]) {
            return true;
        }
    }
    return false;
}

function isNextTileBlocked(x, y, dx, dy, forbiddenTileTypes) {
    const currentTile = coordsToTile(x, y);
    
    for (let dir of CONSTANTS.DIRECTIONS) {
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
    return !isNextTileBlocked(x, y, dx, dy, [CONSTANTS.TILE_HIGHWALL, CONSTANTS.TILE_WALL, CONSTANTS.TILE_WATER, CONSTANTS.TILE_DEEPWATER]);
}

export function isTileGround(i, j) {
    return !isTileBlocked(i, j, [CONSTANTS.TILE_HIGHWALL, CONSTANTS.TILE_WALL, CONSTANTS.TILE_WATER, CONSTANTS.TILE_DEEPWATER]);
}

export function isNextTileExtreme(x, y, dx, dy) {
    return isNextTileBlocked(x, y, dx, dy, [CONSTANTS.TILE_HIGHWALL, CONSTANTS.TILE_WALL, CONSTANTS.TILE_BRICKWALL, CONSTANTS.TILE_DEEPWATER]);
}

export function isTileExtreme(i, j) {
    return isTileBlocked(i, j, [CONSTANTS.TILE_HIGHWALL, CONSTANTS.TILE_WALL, CONSTANTS.TILE_BRICKWALL, CONSTANTS.TILE_DEEPWATER]);
}

export function isNextTileWall(x, y, dx, dy) {
    return isNextTileBlocked(x, y, dx, dy, [CONSTANTS.TILE_HIGHWALL, CONSTANTS.TILE_WALL, CONSTANTS.TILE_BRICKWALL]);
}

export function isTileWall(i, j) {
    return isTileBlocked(i, j, [CONSTANTS.TILE_HIGHWALL, CONSTANTS.TILE_WALL, CONSTANTS.TILE_BRICKWALL]);
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
