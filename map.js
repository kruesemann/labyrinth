import * as STAGE from "./stage.js";
import * as SHADER from "./shader.js";
import * as PLAYER from "./player.js";
import * as NOISE from "./noise.js";
import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import * as ITEM from "./item.js";
import { createObject } from "./object.js";
import { BinaryHeap } from "./heap.js";

let map = undefined;

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
let noiseMap = [];

export function manhattan(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

export function reset(seed, numRows, numColumns, level) {
    LIGHT.reset(numRows, numColumns, level);
    ITEM.reset();

    map = {
        seed,
        tileSize: 1,
        tileMap: [],
        numRows,
        numColumns,
        mesh: undefined,
        objects: [],
        caves: [],
        tunnels: [],
        numberBiomeTypes: 0,
        biomeTypes: [],
        biomeGraph: { biomes: [], adjMatrix: [] },
        start: { i: -1, j: -1 },
    };

    // temporary inits
    map.numberBiomeTypes = 4;
    map.biomeTypes = [
        { type: CONSTANTS.WIDE_GROUND_BIOME, isAllowed: isTileWideGround },
        { type: CONSTANTS.NARROW_GROUND_BIOME, isAllowed: isTileNarrowGround },
        { type: CONSTANTS.WIDE_WATER_BIOME, isAllowed: isTileWideWater },
        { type: CONSTANTS.NARROW_WATER_BIOME, isAllowed: isTileNarrowWater }
    ];

    createRandomMap(seed, numRows, numColumns, level);
    PLAYER.reset(map.start.i, map.start.j);

    createTexture();
    createMesh();
}

export function getTileMapInfo() {
    return { numColumns: map.numColumns, numRows: map.numRows };
}

export function getTileSize() {
    return map.tileSize;
}

export function getTile(i, j) {
    return map.tileMap[i * map.numColumns + j];
}

function createRandomMap(seed, numRows, numColumns, level) {
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numColumns; j++) {
            map.tileMap.push({ type: CONSTANTS.TILE_HIGHWALL, caveID: -1, tunnelID: -1, biomeID: -1 });
        }
    }
    // one noise map for walls, one for water, one for grass & wall-coloring
    noiseMap = NOISE.doubleNoise2D(seed, numNoiseChannels, numRows, numColumns, noiseColors, noiseExponents);
    /**
     * generate caverns
     * label caves
     * connect caves (label tunnels plus width)
     * label biomes (wide/narrow water/ground)
     * for every tile look at neighbor to the right and above and find edges that way
     * place player in fitting biome
     * place exit in another biome
     * place enemies in fitting locations
     * place items in fitting locations
     */

    const caverns = generateCaverns();
    labelCaves(caverns);
    connectCaves();
    
    const typeBiomes = [];
    for (let biomeType of map.biomeTypes) {
        typeBiomes.push(labelBiomes(biomeType.isAllowed, biomeType.type));
    }
    const wideGroundBiomes = typeBiomes[0];

    buildBiomeGraph();

    // choose random fitting biome and place start
    // choose - if possible - exit point that is in a different biome
    let index = Math.floor((wideGroundBiomes.length - 1) * NOISE.random());
    for (let i = index; i != index - 1; i = (i + 1) % (wideGroundBiomes.length - 1)) {
        if (wideGroundBiomes[i].size > Math.sqrt(numRows * numColumns)) {
            index = i;
            break;
        }
    }
    const playerBiome = wideGroundBiomes[index];
    map.start = { i: playerBiome.i, j: playerBiome.j };
    getTile(playerBiome.i, playerBiome.j).type = CONSTANTS.TILE_ENTRANCE;

    let maxDist = 0;
    let maxIndex = 0;
    for (let i = 0; i < wideGroundBiomes.length; i++) {
        if (wideGroundBiomes[i].size > Math.sqrt(numRows * numColumns)) {
            const dist = Math.hypot(wideGroundBiomes[i].i - playerBiome.i, wideGroundBiomes[i].j - playerBiome.j, 2);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
    }
    const exitBiome = wideGroundBiomes[maxIndex];
    getTile(exitBiome.i, exitBiome.j).type = CONSTANTS.TILE_EXIT;
    
    const pathToExit = findBiomePath(getTile(playerBiome.i, playerBiome.j), getTile(exitBiome.i, exitBiome.j));
    
    const { locationGrid, gridRows, gridColumns } = findFreeLocations(); // entries of locationGrid may be 0

    for (let biome of pathToExit) {
        if (biome.locations.length > 0) {
            ITEM.createCoin(biome.locations[0].j, biome.locations[0].i);
        }
    }

    const biome1 = wideGroundBiomes[(index + 5) % wideGroundBiomes.length];
    const object1 = createObject(biome1.i, biome1.j, [0.1, 0, 0], 5, "snake", "lightAffine");
    map.objects.push(object1);
    const biome2 = wideGroundBiomes[(index + 10) % wideGroundBiomes.length];
    const object2 = createObject(biome2.i, biome2.j, [0.1, 0, 0], 3, "dot", "proxHunter");
    map.objects.push(object2);
}

function createTexture() {
    const { numRows, numColumns, tileSize } = map;
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

            const tile = getTile(i, j);

            if (tile.type == CONSTANTS.TILE_WALL) {
                for (let k = 0; k < 6; k++) {
                    colors.push(Math.min(0.03, noiseMap[i * numColumns + j][0] / 10));//colors.push(0.05);
                    colors.push(Math.min(0.03, noiseMap[i * numColumns + j][0] / 10));//colors.push(0.05);
                    colors.push(Math.min(0.03, noiseMap[i * numColumns + j][0] / 10));//colors.push(0.05);
                }
            } else if (tile.type == CONSTANTS.TILE_DIRT) {
                for (let k = 0; k < 6; k++) {
                    colors.push(noiseMap[i * numColumns + j][1] / 4);//colors.push(0.24);
                    colors.push(noiseMap[i * numColumns + j][1] / 8);//colors.push(0.15);
                    colors.push(0.0);
                }
            } else if (tile.type == CONSTANTS.TILE_WATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(noiseMap[i * numColumns + j][0] / 3);//noiseMap[i * numColumns + j][0] / 10 //colors.push(0.0);
                    colors.push(noiseMap[i * numColumns + j][0] / 2);//noiseMap[i * numColumns + j][1] / 8 //colors.push(0.2);
                    colors.push(noiseMap[i * numColumns + j][1] / 2);//noiseMap[i * numColumns + j][1] / 5 //colors.push(0.6);
                }
            } else if (tile.type == CONSTANTS.TILE_DEEPWATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(noiseMap[i * numColumns + j][0] / 4);//noiseMap[i * numColumns + j][0] / 4 //colors.push(0.1);
                    colors.push(noiseMap[i * numColumns + j][0] / 1.5);//noiseMap[i * numColumns + j][0] / 3 //colors.push(0.3);
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
            } else if (tile.type == CONSTANTS.TILE_EXIT) {
                for (let k = 0; k < 6; k++) {
                    colors.push(1.0);
                    colors.push(0.0);
                    colors.push(1.0);
                }
            } else if (tile.type == CONSTANTS.TILE_ENTRANCE) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.1);
                    colors.push(0.1);
                    colors.push(0.0);
                }
            }
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
                     0,           0, -0.1,
        map.numColumns,           0, -0.1,
                     0, map.numRows, -0.1,
        map.numColumns,           0, -0.1,
        map.numColumns, map.numRows, -0.1,
                     0, map.numRows, -0.1,
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

function generateCaverns() {
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
                const lowerOffset = (i == 0 ? cavernSizeMaxMax : cavernDistMin)                 + i * map.numRows / numZones.i;
                const upperOffset = (i == numZones.i - 1 ? cavernSizeMaxMax : cavernDistMin)    + (numZones.i - i - 1) * map.numRows / numZones.i;
                const leftOffset  = (j == 0 ? cavernSizeMaxMax : cavernDistMin)                 + j * map.numColumns / numZones.j + 5;
                const rightOffset = (j == numZones.j ? cavernSizeMaxMax : cavernDistMin)        + (numZones.j - j - 1) * map.numColumns / numZones.j + 5;

                caverns.push({
                    x: leftOffset + (map.numColumns - leftOffset - rightOffset) * NOISE.random(),
                    y: lowerOffset + (map.numRows - lowerOffset - upperOffset) * NOISE.random(),
                    angle: Math.PI * NOISE.random(),
                    cavernSizeX: cavernSizeMaxMin + (cavernSizeMaxMax - cavernSizeMaxMin) * NOISE.random(),
                    cavernSizeY: cavernSizeMaxMin + (cavernSizeMaxMax - cavernSizeMaxMin) * NOISE.random(),
                });
            }
        }
    }

    for (let i = 1; i < map.numRows - 1; i++) {
        for (let j = 1; j < map.numColumns - 1; j++) {
            let tileCenter = tileToCenter(i, j);
            for (let k = 0; k < caverns.length; k++) {
                const distToCenter = dist(tileCenter.x, tileCenter.y, caverns[k].x, caverns[k].y);

                if (distToCenter < cavernSizeMin) {
                    getTile(i, j).type = CONSTANTS.TILE_DIRT;
                } else {
                    const ellipseRadius = caverns[k].cavernSizeX * caverns[k].cavernSizeY;
                    const distToMax = ellipseRadius - ellipseDist(tileCenter.x, tileCenter.y, caverns[k].x, caverns[k].y, caverns[k].cavernSizeX, caverns[k].cavernSizeY, caverns[k].angle);

                    if (noiseMap[i * map.numColumns + j][caveChannel] < (distToMax + 2 * cavernSizeMaxMax) / (1.5 * ellipseRadius)) {
                        if (noiseMap[i * map.numColumns + j][caveChannel] < distToMax / (1.5 * ellipseRadius)) {
                            getTile(i, j).type = CONSTANTS.TILE_DIRT;
                        } else if (getTile(i, j).type == CONSTANTS.TILE_HIGHWALL) {
                            getTile(i, j).type = CONSTANTS.TILE_WALL;
                        }
                    }
                }
            }
        }
    }

    return caverns;
}

function labelCaves(caverns) {
    map.caves = [];
    let ID = 0;

    for (let i = 0; i < caverns.length; i++) {
        const centerTile = coordsToTile(caverns[i].x, caverns[i].y);
        if (getTile(centerTile.i, centerTile.j).caveID === -1) {
            map.caves.push({ i: centerTile.i, j: centerTile.j, ID, systemID: -1, size: 0 });
            const queue = [centerTile];

            while (queue.length > 0) {
                const current = queue.pop();
                getTile(current.i, current.j).caveID = ID;
                map.caves[map.caves.length - 1].size++;

                for (let j = 0; j < 4; j++) {
                    const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };

                    if (getTile(neighbor.i, neighbor.j).caveID == -1
                    && !isTileWall(neighbor.i, neighbor.j)) {
                        queue.push(neighbor);
                    }
                }
            }
            ID++;
        }
    }
}

function connectCaves() {
    let caveSystems = [];
    for (let i = 0; i < map.caves.length; i++) {
        if (map.caves[i].systemID == -1) {
            caveSystems = buildTunnel(map.caves[i], caveSystems);
        }
    }

    while (caveSystems.length > 1) {
        caveSystems = buildTunnel(caveSystems[caveSystems.length - 1][0], caveSystems, caveSystems[caveSystems.length - 2][0]);
    }

    for (let i = 1; i < map.numRows - 1; i++) {
        for (let j = 1; j < map.numColumns - 1; j++) {
            if (getTile(i, j).type == CONSTANTS.TILE_DIRT) {
                if (noiseMap[i * map.numColumns + j][terrainChannel] > 0.3) {
                    if (noiseMap[i * map.numColumns + j][terrainChannel] > 0.5) {
                        if (noiseMap[i * map.numColumns + j][terrainChannel] > 0.6) {
                            getTile(i, j).type = CONSTANTS.TILE_DEEPWATER;
                        } else {
                            getTile(i, j).type = CONSTANTS.TILE_WATER;
                        }
                    }
                } else {
                    getTile(i, j).type = CONSTANTS.TILE_GRASS;
                }
            }
        }
    }
}

function buildTunnel(cave, caveSystems, targetCave) {
    const weightFunction = function weightFunction(i, j) {
        const noiseWeight = noiseMap[i * map.numColumns + j][tunnelChannel];
        return isTileWall(i, j) ? noiseWeight : 10 + noiseWeight;
    };

    const dig = function (i, j, width) {
        const digTile = function(i, j) {
            if (i < 1 || i > map.numRows - 2 || j < 1 || j > map.numColumns - 2) return;

            const tile = getTile(i, j);
            if (tile.type == CONSTANTS.TILE_HIGHWALL || tile.type == CONSTANTS.TILE_WALL || tile.type == CONSTANTS.TILE_BRICKWALL) {
                tile.type = CONSTANTS.TILE_DIRT;
                tile.tunnelID = map.tunnels.length - 1;
            }
        }

        const makeWall = function(i, j) {
            if (i < 1 || i > map.numRows - 2 || j < 1 || j > map.numColumns - 2) return;
            
            const tile = getTile(i - 1, j);
            if (tile.type == CONSTANTS.TILE_HIGHWALL) {
                tile.type = CONSTANTS.TILE_WALL;
            }
        }

        digTile(i, j); // first layer
        
        if (width > 1) {
            digTile(i - 1, j);// second layer
            digTile(i + 1, j);
            digTile(i, j - 1);
            digTile(i, j + 1);

            if (width > 2) {
                digTile(i - 2, j); // third layer
                digTile(i + 2, j);
                digTile(i, j - 2);
                digTile(i, j + 2);
            } else {
                makeWall(i - 2, j); // third layer
                makeWall(i + 2, j);
                makeWall(i, j - 2);
                makeWall(i, j + 2);
            }
        } else {
            makeWall(i - 1, j);// second layer
            makeWall(i + 1, j);
            makeWall(i, j - 1);
            makeWall(i, j + 1);

            makeWall(i - 2, j); // third layer
            makeWall(i + 2, j);
            makeWall(i, j - 2);
            makeWall(i, j + 2);
        }
        
        makeWall(i - 3, j);  // last layer
        makeWall(i + 3, j);
        makeWall(i, j - 3);
        makeWall(i, j + 3);
    }

    const searchMap = [];
    for (let i = 0; i < map.numColumns; i++) {
        for (let j = 0; j < map.numRows; j++) {
            searchMap.push({
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
  
    const heap = new BinaryHeap(node => node.f);
  
    const start = searchMap[cave.i * map.numColumns + cave.j];
    start.g = 0;
    start.f = targetCave ? manhattan(cave.i, cave.j, targetCave.i, targetCave.j) : 0;
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        const currentCaveID = getTile(current.i, current.j).caveID;
        if (currentCaveID > -1 && currentCaveID < map.caves.length) {
            const currentCave = map.caves[currentCaveID];
            const currentCaveSystemID = currentCave.systemID;

            if ((!targetCave && cave.ID != currentCaveID)
            || (targetCave && targetCave.systemID == currentCaveSystemID)) {
                // target found, build tunnel
                map.tunnels.push({ i: current.i, j: current.j, id: map.tunnels.length });
                const path = [];
                while (current) {
                    path.push({ i: current.i, j: current.j });
                    current = current.pred;
                }

                const width = NOISE.random() > 0.3 ? 2 : 1;
                let wide = false;
                let varianceLength = 3 + Math.floor(10 * NOISE.random());
                for (let tileNr of path) {
                    if (varianceLength == 0) {
                        varianceLength = 3 + Math.floor(10 * NOISE.random());
                        wide = !wide;
                    }
                    dig(tileNr.i, tileNr.j, wide ? width + 1 : width);
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
            const neighbor = searchMap[(current.i + CONSTANTS.DIRECTIONS[j].i) * map.numColumns + current.j + CONSTANTS.DIRECTIONS[j].j];

            if (neighbor.closed) continue;
            if (neighbor.i == 0 || neighbor.i == map.numRows - 1 || neighbor.j == 0 || neighbor.j == map.numColumns - 1) continue;

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

function labelBiomes(isAllowed, biomeType) {
    const biomes = [];

    for (let i = 1; i < map.numRows - 1; i++) {
        for (let j = 1; j < map.numColumns - 1; j++) {
            if (isAllowed(i, j)
            && getTile(i, j).biomeID === -1
            && (getTile(i, j).caveID !== -1 || getTile(i, j).tunnelID !== -1)) {
                const biomeID = map.biomeGraph.biomes.length;
                biomes.push({ i, j, ID: biomeID });
                map.biomeGraph.biomes.push({ i, j, ID: biomeID, type: biomeType, locations: [] });
                const queue = [{ i, j }];
                let size = 0;

                while (queue.length > 0) {
                    const current = queue.pop();
                    getTile(current.i, current.j).biomeID = biomeID;
                    size++;

                    for (let j = 0; j < 4; j++) {
                        const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };

                        if (getTile(neighbor.i, neighbor.j).biomeID === -1
                        && isAllowed(neighbor.i, neighbor.j)) {
                            queue.push(neighbor);
                        }
                    }
                }

                biomes[biomes.length - 1].size = size;
                map.biomeGraph.biomes[map.biomeGraph.biomes.length - 1].size = size;
            }
        }
    }

    return biomes;
}

function buildBiomeGraph() {
    const numberBiomes = map.biomeGraph.biomes.length;
    for (let i = 0; i < numberBiomes * numberBiomes; i++) {
        map.biomeGraph.adjMatrix.push(0);
    }
    
    for (let i = 1; i < map.numRows - 2; i++) {
        for (let j = 1; j < map.numColumns - 2; j++) {
            const currentBiome = getTile(i, j).biomeID;
            const upperNeighborBiome = getTile(i + 1, j).biomeID;
            if (currentBiome !== -1
            && upperNeighborBiome !== -1
            && upperNeighborBiome !== currentBiome) {
                map.biomeGraph.adjMatrix[currentBiome * numberBiomes + upperNeighborBiome] = 1;
                map.biomeGraph.adjMatrix[upperNeighborBiome * numberBiomes + currentBiome] = 1;
            }
            const rightNeighborBiome = getTile(i, j + 1).biomeID;
            if (currentBiome !== -1
            && rightNeighborBiome !== -1
            && rightNeighborBiome !== currentBiome) {
                map.biomeGraph.adjMatrix[currentBiome * numberBiomes + rightNeighborBiome] = 1;
                map.biomeGraph.adjMatrix[rightNeighborBiome * numberBiomes + currentBiome] = 1;
            }
        }
    }
}

function findBiomePath(startTile, targetTile) {
    const numberBiomes = map.biomeGraph.biomes.length;
    const searchMap = [];
    for (let i = 0; i < numberBiomes; i++) {
        searchMap.push({
            ID: i,
            visited: false,
            closed: false,
            pred: null,
            weight: undefined
        });
    }
  
    const heap = new BinaryHeap(node => node.weight);
  
    const start = searchMap[startTile.biomeID];
    start.weight = 0;
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        if (current.ID === targetTile.biomeID) {
            const path = [];
            while (current) {
                const biome = map.biomeGraph.biomes[current.ID];
                path.push(biome);
                current = current.pred;
            }
            return path;
        }

        current.closed = true;

        for (let i = 0; i < numberBiomes; i++) {
            if (map.biomeGraph.adjMatrix[i * numberBiomes + current.ID] === 0) continue;

            const neighbor = searchMap[i];
            const weight = current.weight + map.biomeGraph.biomes[neighbor.ID].type;

            if (neighbor.closed) continue;
            if (neighbor.visited && weight >= neighbor.weight) continue;

            neighbor.pred = current;
            neighbor.weight = weight;

            if (!neighbor.visited) {
                neighbor.visited = true;
                heap.push(neighbor);
            } else {
                heap.rescoreElement(neighbor);
            }
        }
    }

    return [];
}

function findFreeLocations() {
    const fineRows = Math.floor(map.numRows / CONSTANTS.LOCATION_RADIUS);
    const fineColumns = Math.floor(map.numColumns / CONSTANTS.LOCATION_RADIUS);
    const coarseRows = Math.floor(map.numRows / CONSTANTS.LOCATION_DIST);
    const coarseColumns = Math.floor(map.numColumns / CONSTANTS.LOCATION_DIST);
    const fineGrid = [];
    const coarseGrid = [];

    for (let i = 0; i < fineRows * fineColumns; i++) {
        fineGrid.push(0);
        if (i < coarseRows * coarseColumns) {
            coarseGrid.push(0);
        }
    }

    function round(x) {
        const result = Math.round(x);
        return { result, dir: result == Math.floor(x) ? 1 : -1 };
    }

    for (let i = CONSTANTS.LOCATION_RADIUS + 1; i < map.numRows - CONSTANTS.LOCATION_RADIUS - 1; i++) {
        for (let j = CONSTANTS.LOCATION_RADIUS + 1; j < map.numColumns - CONSTANTS.LOCATION_RADIUS - 1; j++) {
            const row = round(i / CONSTANTS.LOCATION_RADIUS);
            const column = round(j / CONSTANTS.LOCATION_RADIUS);

            let validIndex = 0;
            let index = (row.result + row.dir) * fineColumns + column.result + column.dir;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }
            index = (row.result + row.dir) * fineColumns + column.result;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }
            index = row.result * fineColumns + column.result + column.dir;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }
            index = row.result * fineColumns + column.result;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }

            if (isTileGround(i, j)) {
                if (isTileGround(i + CONSTANTS.LOCATION_RADIUS, j)
                && isTileGround(i - CONSTANTS.LOCATION_RADIUS, j)
                && isTileGround(i, j + CONSTANTS.LOCATION_RADIUS)
                && isTileGround(i, j - CONSTANTS.LOCATION_RADIUS)) {
                    fineGrid[validIndex] = { i, j, isAllowed: isTileGround };
                }
            } else if (isTileWater(i, j)) {
                if (isTileWater(i + CONSTANTS.LOCATION_RADIUS, j)
                && isTileWater(i - CONSTANTS.LOCATION_RADIUS, j)
                && isTileWater(i, j + CONSTANTS.LOCATION_RADIUS)
                && isTileWater(i, j - CONSTANTS.LOCATION_RADIUS)) {
                    fineGrid[validIndex] = { i, j, isAllowed: isTileWater };
                }
            }
        }
    }

    function areNeighborsFree(i, j, isAllowed) {
        for (let k = 0; k < CONSTANTS.LOCATION_RADIUS; k++) {
            for (let l = 0; l < CONSTANTS.LOCATION_RADIUS - k; l++) {
                if (!isAllowed(i + k, j + l)
                || !isAllowed(i + k, j - l)
                || !isAllowed(i - k, j + l)
                || !isAllowed(i - k, j - l)) {
                    return false;
                }
            }
        }
        return true;
    }

    for (let k = 0; k < fineRows; k++) {
        for (let l = 0; l < fineColumns; l++) {
            const tile = fineGrid[k * fineColumns + l];
            if (tile !== 0) {
                const row = round(tile.i / CONSTANTS.LOCATION_DIST);
                const column = round(tile.j / CONSTANTS.LOCATION_DIST);

                let validIndex = 0;
                let index = (row.result + row.dir) * coarseColumns + column.result + column.dir;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = (row.result + row.dir) * coarseColumns + column.result;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = row.result * coarseColumns + column.result + column.dir;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = row.result * coarseColumns + column.result;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }

                if (areNeighborsFree(tile.i, tile.j, tile.isAllowed)) {
                    coarseGrid[validIndex] = { i: tile.i, j: tile.j };
                    map.biomeGraph.biomes[getTile(tile.i, tile.j).biomeID].locations.push({ i: tile.i, j: tile.j });
                }
            }
        }
    }

    return { locationGrid: coarseGrid, gridRows: coarseRows, gridColumns: coarseColumns };
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

export function coordsToTile(x, y) {
    return { i: Math.floor(y), j: Math.floor(x) };
}

export function tileToCoords(i, j) {
    return { x: j, y: i };
}

export function tileToCenter(i, j) {
    return { x: j + 0.5, y: i + 0.5 };
}

function isTileOfType(i, j, tileTypes) {
    const tileType = getTile(i, j).type;
    for (let i = 0; i < tileTypes.length; i++) {
        if (tileType == tileTypes[i]) {
            return true;
        }
    }
    return false;
}

export function isNextTileOfType(x, y, dx, dy, tileTypes) {
    const currentTile = coordsToTile(x, y);
    
    for (let dir of CONSTANTS.DIRECTIONS) {
        const nextTile = { i: currentTile.i + dir.i, j: currentTile.j + dir.j };
        
        if (isTileOfType(nextTile.i, nextTile.j, tileTypes)) {
            const nextTileCoords = tileToCenter(nextTile.i, nextTile.j);
            if (x + dx >= nextTileCoords.x && x + dx < nextTileCoords.x + map.tileSize) {
                if (y + dy >= nextTileCoords.y && y + dy < nextTileCoords.y + map.tileSize) {
                    return true;
                } else if (nextTileCoords.y >= y + dy && nextTileCoords.y < y + dy + map.tileSize) {
                    return true;
                }
            } else if (nextTileCoords.x >= x + dx && nextTileCoords.x < x + dx + map.tileSize) {
                if (y + dy >= nextTileCoords.y && y + dy < nextTileCoords.y + map.tileSize) {
                    return true;
                } else if (nextTileCoords.y >= y + dy && nextTileCoords.y < y + dy + map.tileSize) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

export function isTileGround(i, j) {
    return isTileOfType(i, j, CONSTANTS.GROUND_TILES);
}

export function isTileWall(i, j) {
    return isTileOfType(i, j, CONSTANTS.WALL_TILES);
}

export function isTileWater(i, j) {
    return isTileOfType(i, j, CONSTANTS.WATER_TILES);
}

export function isTileWideGround(i, j) {
    if (!isTileGround(i, j)) return false;

    if (isTileGround(i, j - 1)
    && isTileGround(i - 1, j)
    && isTileGround(i - 1, j - 1)
    || isTileGround(i, j + 1)
    && isTileGround(i - 1, j)
    && isTileGround(i - 1, j + 1)
    || isTileGround(i, j - 1)
    && isTileGround(i + 1, j)
    && isTileGround(i + 1, j - 1)
    || isTileGround(i, j + 1)
    && isTileGround(i + 1, j)
    && isTileGround(i + 1, j + 1)) {
        return true;
    }
    return false;
}

export function isTileNarrowGround(i, j) {
    return isTileGround(i, j) && !isTileWideGround(i, j);
}

export function isTileWideWater(i, j) {
    if (!isTileWater(i, j)) return false;

    if (isTileWater(i, j - 1)
    && isTileWater(i - 1, j)
    && isTileWater(i - 1, j - 1)
    || isTileWater(i, j + 1)
    && isTileWater(i - 1, j)
    && isTileWater(i - 1, j + 1)
    || isTileWater(i, j - 1)
    && isTileWater(i + 1, j)
    && isTileWater(i + 1, j - 1)
    || isTileWater(i, j + 1)
    && isTileWater(i + 1, j)
    && isTileWater(i + 1, j + 1)) {
        return true;
    }
    return false;
}

export function isTileNarrowWater(i, j) {
    return isTileWater(i, j) && !isTileWideWater(i, j);
}

export function isOnExit(x, y) {
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

    for (let offset of vertexOffsets) {
        const { i, j } = coordsToTile(x + offset.x, y + offset.y);
        if (getTile(i, j).type == CONSTANTS.TILE_EXIT)
        {
            return true;
        }
    }

    return false;
}

export function planObjects(counter) {
    for (let object of map.objects) {
        object.plan(counter);
    }
}

export function moveObjects(counter) {
    for (let object of map.objects) {
        object.move(counter);
    }
}

export function collisionWithPlayer() {
    const pNodes = PLAYER.get().form.nodes;

    for (let object of map.objects) {
        const oNodes = object.form.nodes;

        for (let pNode of pNodes) {
            for (let oNode of oNodes) {
                if (pNode.x >= oNode.x && pNode.x < oNode.x + map.tileSize) {
                    if (pNode.y >= oNode.y && pNode.y < oNode.y + map.tileSize) {
                        return true;
                    } else if (pNode.y <= oNode.y && pNode.y + map.tileSize > oNode.y) {
                        return true;
                    }
                } else if (pNode.x <= oNode.x && pNode.x + map.tileSize > oNode.x) {
                    if (pNode.y >= oNode.y && pNode.y < oNode.y + map.tileSize) {
                        return true;
                    } else if (pNode.y <= oNode.y && pNode.y + map.tileSize > oNode.y) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

export function rayCast(start, target) {
    const startTile = coordsToTile(start.x, start.y);
    const targetTile = coordsToTile(target.x, target.y);

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
